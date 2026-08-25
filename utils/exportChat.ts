import { Message, Sender } from '../types';

export const exportChatToHTML = (messages: Message[], topicTitle?: string) => {
  const dateStr = new Date().toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const title = topicTitle ? `Lịch sử học tập - ${topicTitle}` : 'Lịch sử học tập - Gia Sư Toán 8';

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 24px;
      line-height: 1.6;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    }
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #4338ca;
    }
    .header .meta {
      font-size: 14px;
      color: #64748b;
    }
    .message-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .message {
      padding: 16px;
      border-radius: 12px;
      font-size: 15px;
    }
    .message.user {
      background-color: #eef2ff;
      border-left: 4px solid #4f46e5;
      margin-left: 32px;
    }
    .message.model {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #10b981;
      margin-right: 32px;
    }
    .sender-name {
      font-weight: 700;
      margin-bottom: 6px;
      font-size: 14px;
      display: flex;
      justify-content: space-between;
    }
    .sender-name.user {
      color: #4f46e5;
    }
    .sender-name.model {
      color: #059669;
    }
    .time {
      font-size: 12px;
      font-weight: normal;
      color: #94a3b8;
    }
    .content {
      white-space: pre-wrap;
      word-break: break-word;
    }
    .images-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .images-grid img {
      max-width: 280px;
      max-height: 200px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      object-fit: cover;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 13px;
      color: #94a3b8;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 0;
      }
      .message.user {
        margin-left: 0;
      }
      .message.model {
        margin-right: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📐 Gia Sư Toán 8 - Kết Nối Tri Thức</h1>
      <div class="meta">
        <div><strong>Nội dung:</strong> ${topicTitle || 'Bài học & Hướng dẫn'}</div>
        <div><strong>Thời gian xuất:</strong> ${dateStr}</div>
      </div>
    </div>

    <div class="message-list">
      ${messages.map(msg => {
        const isUser = msg.sender === Sender.USER;
        const senderLabel = isUser ? 'Học sinh 🙋‍♂️' : 'Thầy giáo AI 👨‍🏫';
        const msgTime = new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        let imagesHtml = '';
        if (msg.images && msg.images.length > 0) {
          imagesHtml = `<div class="images-grid">
            ${msg.images.map(img => `<img src="${img}" alt="Ảnh bài làm" />`).join('')}
          </div>`;
        }

        const safeText = msg.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        return `
          <div class="message ${msg.sender}">
            <div class="sender-name ${msg.sender}">
              <span>${senderLabel}</span>
              <span class="time">${msgTime}</span>
            </div>
            ${imagesHtml}
            <div class="content">${safeText}</div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="footer">
      Tài liệu được xuất từ ứng dụng <strong>Gia Sư Toán 8 - Kết nối tri thức</strong>. Dễ dàng lưu trữ và tải lên Google Drive.
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedDate = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `BaiHoc_Toan8_${sanitizedDate}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportChatToText = (messages: Message[]) => {
  const dateStr = new Date().toLocaleString('vi-VN');
  let content = `=== GIA SƯ TOÁN 8 - LỊCH SỬ HỌC TẬP ===\nThời gian: ${dateStr}\n\n`;

  messages.forEach(msg => {
    const sender = msg.sender === Sender.USER ? '[Học sinh]' : '[Thầy giáo AI]';
    const time = new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    content += `${sender} (${time}):\n${msg.text}\n`;
    if (msg.images && msg.images.length > 0) {
      content += `[Đã đính kèm ${msg.images.length} ảnh bài làm]\n`;
    }
    content += `\n----------------------------------------\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedDate = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `LichSu_HocToan8_${sanitizedDate}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
