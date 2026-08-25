<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Giáo viên Toán 8 AI Tutor

Ứng dụng học toán lớp 8 với trợ lý AI. Dự án được thiết kế theo mô hình public-safe:
- Frontend chạy trên GitHub Pages
- AI request được proxy qua backend riêng
- API key Groq được giữ ở server, không lộ trên browser

## Chạy local

Yêu cầu: Node.js

1. Cài đặt dependency:
   `npm install`
2. Cập nhật file [.env.local](.env.local) với key Groq:
   ```env
   GROQ_API_KEY=your_key_here
   GROQ_MODEL=qwen/qwen3.6-27b
   PORT=3003
   VITE_API_URL=http://localhost:3003
   ```
3. Chạy backend:
   `npm run server`
4. Chạy frontend:
   `npm run dev`

## Deploy frontend lên GitHub Pages

Workflow `.github/workflows/deploy-pages.yml` sẽ tự build và publish khi push lên branch `main`.

Trước lần push đầu tiên, thêm GitHub repository secret `VITE_API_URL` với URL backend Render, ví dụ:
`https://gia-su-toan-8-api.onrender.com`

Trong GitHub repo → Settings → Pages, chọn source `GitHub Actions`.

## Deploy backend cho public

Vì GitHub Pages là frontend tĩnh, backend cần chạy trên dịch vụ có server như:
- Render (khuyến nghị, có cấu hình sẵn trong `render.yaml`)
- Railway
- Fly.io
- Vercel
- Azure App Service

Khi tạo Web Service trên Render, đặt biến môi trường `GROQ_API_KEY` bằng key Groq và `GROQ_MODEL=qwen/qwen3.6-27b`.
Sau khi backend public chạy, dùng URL đó làm giá trị GitHub secret `VITE_API_URL`.

Lưu ý: `GROQ_API_KEY` chỉ được đặt ở server, không được để trong frontend.
