# 🎙️ AI English Tutor

> Ứng dụng luyện tiếng Anh thông minh theo dạng hội thoại, sử dụng AI (Gemini) để phân tích lỗi ngữ pháp, gợi ý từ vựng nâng cao và phản hồi tự nhiên như người bản xứ.

---

## 📖 Tổng quan dự án (Overview)

**AI English Tutor** là một web application full-stack cho phép người học tiếng Anh (đặc biệt là người Việt Nam) luyện tập hội thoại với AI. Người dùng nói hoặc gõ một câu tiếng Anh, AI sẽ:

1. 🔍 **Phân tích** lỗi ngữ pháp, từ vựng, cú pháp
2. ✏️ **Sửa lỗi & giải thích** bằng tiếng Việt (dễ hiểu)
3. 💡 **Gợi ý từ vựng nâng cao** (idioms, phrasal verbs, từ học thuật)
4. 💬 **Trả lời tự nhiên** bằng tiếng Anh để duy trì hội thoại

### 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4 |
| UI Components | Lucide React, Motion (Framer Motion) |
| Routing | React Router DOM v7 |
| Backend | Python, FastAPI, Uvicorn |
| AI | Google Gemini API (`gemini-1.5-pro`) |
| Database | MongoDB (Motor - async driver) |
| Config | python-dotenv, Pydantic |

### 📁 Cấu trúc thư mục

```
AI-English-Tutor/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx     # Sidebar + Mobile nav
│   │   ├── pages/
│   │   │   ├── Speak/
│   │   │   │   ├── TopicSelection.tsx   # Chọn chủ đề luyện tập
│   │   │   │   └── ChatSession.tsx      # Màn hình hội thoại chính
│   │   │   ├── History/       # Lịch sử các buổi luyện tập
│   │   │   ├── Library/       # Thư viện từ vựng đã học
│   │   │   ├── Settings/      # Cài đặt người dùng
│   │   │   └── Auth/          # Login / Sign Up
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css          # Tailwind v4 theme config
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # FastAPI server
│   ├── main.py                # Entry point + CORS + API routes
│   ├── ai_service.py          # Gemini AI integration
│   ├── database.py            # MongoDB connection (Motor)
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # API keys (không commit lên git)
│
└── .gitignore
```

---

## 🚀 Hướng dẫn cài đặt & chạy dự án

### Yêu cầu hệ thống

- **Node.js** >= 18.x
- **Python** >= 3.10
- **MongoDB** (local hoặc MongoDB Atlas)
- **Google Gemini API Key** — lấy tại [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

### 1. Clone dự án

```bash
git clone https://github.com/longdn81/AI-English-Tutor.git
cd AI-English-Tutor
```

---

### 2. Chạy Backend (FastAPI)

```bash
cd backend

# Tạo môi trường ảo
python -m venv venv

# Kích hoạt môi trường ảo
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt
```

#### Cấu hình biến môi trường

Tạo file `.env` trong thư mục `backend/`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGO_URI=your_mongodb_connection_string_here
```

#### Khởi động server

```bash
uvicorn main:app --reload --port 8000
```

Backend sẽ chạy tại: **http://localhost:8000**  
Swagger API Docs: **http://localhost:8000/docs**

---

### 3. Chạy Frontend (React + Vite)

```bash
cd frontend

# Cài đặt dependencies
npm install

# Khởi động dev server
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:3000**

---

### 4. Kiểm tra API

Sau khi cả hai server đang chạy, bạn có thể test endpoint chính:

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"text": "I go to school yesterday"}'
```

**Ví dụ response:**
```json
{
  "has_error": true,
  "original_text": "I go to school yesterday",
  "corrected_text": "I went to school yesterday",
  "error_explanation": "Câu dùng thì quá khứ đơn (past simple) vì có 'yesterday'. Động từ 'go' phải chia thành 'went'.",
  "advanced_suggestions": [
    "attended school (tham dự trường học - trang trọng hơn)",
    "headed to school (đi đến trường - tự nhiên như người bản xứ)"
  ],
  "ai_response": "No worries, it happens! So what subjects did you study yesterday? Any favorites?"
}
```

---

## 📸 Giao diện

| Trang | Mô tả |
|---|---|
| `/speak` | Chọn chủ đề luyện tập (Cafe, Airport, Business...) |
| `/speak/:topicId` | Màn hình hội thoại với AI, hiển thị lỗi và gợi ý |
| `/history` | Xem lại các buổi luyện tập đã qua |
| `/library` | Thư viện từ vựng đã học được |
| `/settings` | Cài đặt tài khoản và tùy chọn học |

---

## 🔮 Tính năng sắp tới (Roadmap)

- [ ] 🎙️ Tích hợp Web Speech API (voice input thật sự)
- [ ] 🔊 Text-to-Speech cho phản hồi của AI
- [ ] 🔐 Hệ thống đăng nhập/đăng ký thật (JWT Auth)
- [ ] 💾 Lưu lịch sử hội thoại vào MongoDB
- [ ] 📊 Dashboard thống kê tiến trình học tập
- [ ] 🌐 Deploy lên cloud (Vercel + Railway/Render)

---

## 👤 Tác giả

**longdn81** — [github.com/longdn81](https://github.com/longdn81)

---

## 📄 License

MIT License
