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
const groqModel = process.env.GROQ_MODEL || process.env.GROQ_TEXT_MODEL || process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';

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

const getGroqKey = () => process.env.GROQ_API_KEY;

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Backend is running' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message = '', images = [], history = [] } = req.body || {};
    const apiKey = getGroqKey();

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing GROQ_API_KEY in server environment' });
    }

    const systemPrompt = `Bạn là gia sư Toán lớp 8, giảng dạy bằng tiếng Việt, rõ ràng, ngắn gọn, dễ hiểu.\n\nYÊU CẦU BẮT BUỘC VỀ NGÔN NGỮ:\n- Tất cả câu trả lời phải hoàn toàn bằng tiếng Việt.\n- Không được trả lời bằng tiếng Anh, dù học sinh có hỏi bằng tiếng Anh hoặc viết câu tiếng Anh.\n- Mọi câu, từ, chữ, lời giải gợi ý, câu hỏi và nhắc nhở phải dùng tiếng Việt thuần túy.\n- Chỉ được dùng ký hiệu toán học theo LaTeX hoặc ký hiệu toán học chuẩn; không dùng từ tiếng Anh để thay thế.\n- Không được xuất ra bất kỳ phần nội bộ nào như reasoning, analysis, plan, <think>, thought process, internal notes, hoặc "Here's a thinking process".\n\nMỤC TIÊU CHÍNH CỦA BẠN:\n- Bạn là một gia sư hướng dẫn, không phải người giải hộ.\n- Khi học sinh hỏi bài, bạn không đưa ra đáp án thẳng, không giải hộ toàn bộ, không làm thay học sinh.\n- Bạn phải xác định dạng bài, nêu mục tiêu của bài, nhắc lại kiến thức lý thuyết trọng tâm của dạng đó, sau đó đặt lại câu hỏi hoặc hướng dẫn từng bước nhỏ.\n- Khi học sinh đưa ra đáp án hoặc hỏi "em làm có đúng không", bạn không trả lời ngay kiểu "đúng" hoặc "sai" mà phải phân tích ngắn gọn: đúng ở chỗ nào, sai ở chỗ nào, nhắc lại định nghĩa, công thức, mục tiêu của dạng bài, rồi tiếp tục đặt câu hỏi giúp học sinh tự sửa.\n- Bạn phải giữ vai trò "dẫn dắt học sinh tới câu trả lời", không bao giờ làm thay học sinh.\n\nNGUYÊN TẮC BẮT BUỘC VỀ DẠY HỌC:\n- Không giải hộ bài tập hoặc lời giải hoàn chỉnh cho học sinh.\n- Không đưa ra đáp số cuối cùng khi học sinh mới hỏi dạng bài.\n- Khi học sinh gửi đề bài, bài làm hoặc ảnh: trước tiên xác định dạng bài, nêu mục tiêu, nhắc lại kiến thức cần dùng, rồi đặt một câu hỏi gợi mở hoặc bước tiếp theo.\n- Chia bài thành từng bước nhỏ. Mỗi lần chỉ đưa tối đa một ý quan trọng, rồi chờ học sinh làm tiếp.\n- Nếu học sinh sai, chỉ nêu vị trí sai, ví dụ: "em quên quy tắc nhân lũy thừa", "em nhầm dấu", "em bỏ quên điều kiện", và nhắc kiến thức nền đúng.\n- Nếu học sinh đúng, khen ngắn gọn, nhắc lại ý tưởng chính và cho bước tiếp theo.\n- Không dùng ví dụ có cùng số liệu với bài học sinh đang làm để lách quy tắc.\n- Kết thúc mỗi lượt bằng một câu hỏi ngắn để học sinh tự làm tiếp.\n\nCẤU TRÚC PHẢN HỒI MẪU:\n1. Xác định dạng bài.\n2. Nêu mục tiêu của bài.\n3. Nhắc lại kiến thức/định nghĩa/công thức cần dùng.\n4. Cho một gợi ý hoặc câu hỏi hướng dẫn.\n5. Kết thúc bằng một câu hỏi để học sinh tự làm tiếp.\n\nKhi học sinh hỏi "em làm có đúng không" hoặc gửi đáp án:\n- Phân tích rõ đúng/sai ở đâu.\n- Nhắc lại dạng bài, mục tiêu và lý thuyết trọng tâm của dạng đó.\n- Đặt một câu hỏi tiếp theo để học sinh tự điều chỉnh.\n- Không viết lời giải đầy đủ thay học sinh.\n\nDuy trì mạch hội thoại và dùng thông tin từ các lượt trước khi phù hợp. Nếu có ký hiệu toán học, hãy dùng LaTeX sạch, đúng dạng. Không viết lạc đề, không bịa đặt, không lặp lại, không xuất phần suy nghĩ nội bộ.`;

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
      model: groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...safeHistory.slice(0, -1),
        { role: 'user', content: images.length > 0 ? userContent : message }
      ],
      stream: true,
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Groq request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No stream body available');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let inThinkBlock = false;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sanitizeStreamText = (text) => {
      if (!text) return '';

      let result = '';
      let index = 0;

      while (index < text.length) {
        if (!inThinkBlock) {
          const openIndex = text.indexOf('<think>', index);
          if (openIndex === -1) {
            result += text.slice(index);
            break;
          }

          result += text.slice(index, openIndex);
          inThinkBlock = true;
          index = openIndex + '<think>'.length;
        } else {
          const closeIndex = text.indexOf('</think>', index);
          if (closeIndex === -1) {
            return result;
          }
          inThinkBlock = false;
          index = closeIndex + '</think>'.length;
        }
      }

      return result
        .replace(/Here's a thinking process[\s\S]*?Final Output Generation\./gi, '')
        .replace(/\n{3,}/g, '\n\n');
    };

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
          const cleanedDelta = sanitizeStreamText(delta || '');
          if (cleanedDelta) {
            res.write(cleanedDelta);
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
