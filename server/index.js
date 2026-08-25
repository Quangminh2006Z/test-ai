import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
const port = process.env.PORT || 3003;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const parseDataUri = (dataUri) => {
  const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image data');
  }

  return {
    mimeType: matches[1],
    data: matches[2],
  };
};

const getOpenRouterKey = () => process.env.OPENROUTER_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message = '', images = [] } = req.body || {};
    const apiKey = getOpenRouterKey();

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY in server environment' });
    }

    const systemPrompt = `Bạn là giáo viên Toán lớp 8, giảng dạy bằng tiếng Việt, rõ ràng, ngắn gọn, dễ hiểu.\n\nYêu cầu bắt buộc:\n- Chỉ hướng dẫn, không làm hộ bài cho học sinh.\n- Trả lời theo đúng cấu trúc: Khái niệm, ví dụ, cách làm, đáp án, gợi ý luyện tập.\n- Không viết lạc đề, không bừa bãi, không lặp lại.\n- Nếu có ký hiệu toán học, hãy dùng LaTeX sạch, đúng dạng.\n- Không dùng dạng văn bản rời rạc.\n\nCâu hỏi của học sinh: ${message}`;

    const imageContents = images.map((image) => {
      parseDataUri(image);
      return {
        type: 'image_url',
        image_url: { url: image },
      };
    });
    const userContent = [
      { type: 'text', text: message || 'Hãy đọc và hướng dẫn bài tập trong ảnh.' },
      ...imageContents,
    ];

    const payload = {
      model: images.length > 0 ? 'minimax/minimax-m3:free' : 'minimax/minimax-m2.7:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: images.length > 0 ? userContent : message }
      ],
      stream: true,
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Gia Su Toan 8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'OpenRouter request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No stream body available');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          res.end();
          return;
        }

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            res.write(delta);
          }
        } catch {
          // ignore non-json stream frames
        }
      }
    }

    res.end();
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'Failed to process AI request' });
  }
});

app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
