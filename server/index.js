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
    const { message = '', images = [], history = [] } = req.body || {};
    const apiKey = getOpenRouterKey();

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY in server environment' });
    }

    const systemPrompt = `Bạn là gia sư Toán lớp 8, giảng dạy bằng tiếng Việt, rõ ràng, ngắn gọn, dễ hiểu.\n\nNGUYÊN TẮC BẮT BUỘC VỀ DẠY HỌC:\n- Tuyệt đối không giải hộ bài và không đưa ra đáp số, kết quả cuối cùng hoặc bài giải hoàn chỉnh cho bài tập học sinh gửi, kể cả khi học sinh yêu cầu trực tiếp.\n- Khi học sinh gửi đề bài, bài làm hoặc ảnh bài tập: trước tiên hãy xác nhận em đang làm dạng gì, sau đó chỉ ra bước cần suy nghĩ tiếp theo và đặt một câu hỏi gợi mở.\n- Chia bài thành từng bước nhỏ. Mỗi lần chỉ đưa tối đa một gợi ý quan trọng, rồi chờ học sinh trả lời hoặc thử làm bước đó.\n- Nếu học sinh làm sai, chỉ nêu vị trí hoặc loại lỗi (ví dụ: nhầm dấu, áp dụng sai quy tắc), không sửa toàn bộ và không viết đáp án đúng thay em.\n- Chỉ được kiểm tra câu trả lời cuối cùng do học sinh tự đưa ra bằng cách nói đúng hoặc chưa đúng và giải thích ngắn gọn lý do; không tiết lộ đáp án thay thế.\n- Nếu học sinh yêu cầu xem lời giải, hãy lịch sự từ chối và chuyển thành một gợi ý nhỏ hơn.\n- Không dùng ví dụ có cùng số liệu với bài học sinh đang làm để lách quy tắc.\n- Kết thúc mỗi lượt bằng một câu hỏi để học sinh tự thực hiện bước tiếp theo.\n\nCẤU TRÚC PHẢN HỒI KHI NHẬN BÀI TẬP:\n1. Xác định dạng bài hoặc điều cần tìm.\n2. Gợi ý bước đầu tiên, không tính ra kết quả cuối.\n3. Đặt một câu hỏi ngắn để học sinh tự trả lời.\n4. Gợi ý luyện tập chỉ dùng bài khác và không kèm lời giải.\n\nDuy trì mạch hội thoại và dùng thông tin từ các lượt trước khi phù hợp. Nếu có ký hiệu toán học, hãy dùng LaTeX sạch, đúng dạng. Không viết lạc đề, không bịa đặt, không lặp lại.`;

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
    const safeHistory = Array.isArray(history)
      ? history.filter(item =>
          (item?.role === 'user' || item?.role === 'assistant') &&
          typeof item?.content === 'string' &&
          item.content.trim()
        ).slice(-12)
      : [];

    const payload = {
      model: images.length > 0 ? 'minimax/minimax-m3:free' : 'minimax/minimax-m2.7:free',
      messages: [
        { role: 'system', content: systemPrompt },
        ...safeHistory.slice(0, -1),
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
