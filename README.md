# 🎙️ AI English Tutor: Gia sư Tiếng Anh Thế hệ mới

> Ứng dụng luyện tiếng Anh multimodal đỉnh cao, cung cấp trải nghiệm luyện nói voice-to-voice, đánh giá ngữ pháp thời gian thực và kho học liệu cá nhân hóa. Xây dựng trên nền tảng **React 19**, **FastAPI** và **Google Gemini 3.1 Flash**.

---

## 📖 Tổng quan dự án

**AI English Tutor** là một ứng dụng web full-stack được thiết kế để xóa tan khoảng cách giữa việc học thụ động và giao tiếp chủ động. Khác với các ứng dụng truyền thống, dự án này cho phép người dùng trò chuyện trực tiếp bằng giọng nói với AI, mô phỏng môi trường giao tiếp thực tế với người bản xứ, đồng thời nhận được sự hỗ trợ chuyên sâu của một gia sư chuyên nghiệp.

### ✨ Các tính năng chính

-   **🗣️ Luyện nói voice-to-voice**: Ghi âm và chuyển đổi giọng nói trực tiếp với khả năng đa phương thức của Gemini.
-   **🔍 Đánh giá thời gian thực**: Nhận phản hồi tức thì về ngữ pháp, cách dùng từ và độ tự nhiên (giải thích chi tiết bằng tiếng Việt).
-   **🎯 Workshop Phát âm**: Luyện tập các câu khó và nhận điểm số (0-100) dựa trên độ chính xác, ngữ điệu và nhịp điệu.
-   **📚 Thư viện AI tự động**:
    -   **Trắc nghiệm Ngữ pháp**: Tự động tạo 5 câu hỏi dựa trên các chủ đề bạn chọn.
    -   **Vocab Story**: AI viết truyện ngắn sử dụng đúng danh sách từ vựng bạn muốn học.
    -   **Topic Phrases**: Cung cấp 10 mẫu câu thực dụng cho bất kỳ tình huống tùy chỉnh nào bạn nhập vào.
-   **📊 Lịch sử & Phân tích thông minh**:
    -   Timeline thống nhất ghi lại mọi hội thoại và hoạt động học tập.
    -   **AI Insight hàng tuần**: Gợi ý lộ trình và nội dung cần luyện tập tiếp theo dựa trên xu hướng hiệu suất của bạn.
-   **🔐 Bảo mật & Đăng nhập**: Tích hợp Google OAuth 2.0 giúp đăng nhập nhanh chóng và an toàn.
-   **🛡️ Độ ổn định cao**: Cơ chế Fallback thông minh tự động chuyển đổi giữa các model Gemini (3.1 Flash, 2.5 Flash-lite...) để đảm bảo hệ thống luôn hoạt động 24/7.

---

## 🛠️ Công nghệ sử dụng

| Tầng | Công nghệ | Các module chính |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite 6 | TypeScript, Tailwind CSS v4, Lucide React |
| **Animations** | Motion (Motion/React) | AnimatePresence, motion.div |
| **Backend** | Python 3.11 + FastAPI | Uvicorn, Google GenAI SDK |
| **AI Models** | Google Gemini 3.1 / 2.5 | Cơ chế dự phòng Multi-model fallback |
| **Database** | MongoDB Atlas | Motor (Async Driver), Bson |
| **Auth** | Google OAuth 2.0 | `@react-oauth/google` |

---

## 📁 Cấu trúc dự án

```text
AI-English-Tutor/
├── frontend/                  # Ứng dụng React hiện đại
│   ├── src/
│   │   ├── context/           # Quản lý AuthContext (Google OAuth)
│   │   ├── pages/
│   │   │   ├── Speak/         # Giao diện luyện nói & Hội thoại AI
│   │   │   ├── Library/       # Trắc nghiệm, Truyện & Mẫu câu
│   │   │   ├── History/       # Lịch sử hoạt động & AI Insights
│   │   │   └── Settings/      # Cài đặt cá nhân & Tùy chọn
│   │   ├── components/        # Các UI component dùng chung
│   │   └── index.css          # Tailwind CSS v4 Global Styles
├── backend/                   # Server FastAPI hiệu năng cao
│   ├── main.py                # API Routes & Middleware Auth
│   ├── ai_service.py          # Tích hợp Gemini & Tiện ích xử lý JSON
│   ├── database.py            # Thao tác MongoDB & Logic Unified History
│   └── .env                   # Biến môi trường (AI keys, DB URI)
└── README.md
```

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu hệ thống

-   Node.js >= 18.x
-   Python >= 3.10
-   Tài khoản MongoDB (Local hoặc Atlas)
-   Google Cloud Console Project (để lấy Gemini API Key và Google Client ID)

### 1. Tải mã nguồn

```bash
git clone https://github.com/longdn81/AI-English-Tutor.git
```

### 2. Cấu hình Backend

```bash
cd backend
python -m venv venv
# Kích hoạt venv: .\venv\Scripts\activate (Windows) hoặc source venv/bin/activate (Mac)
pip install -r requirements.txt
```

**Tạo file `.env` trong thư mục `backend/`:**
```env
GEMINI_API_KEY=your_key_here
MONGO_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_id.apps.googleusercontent.com
```

**Chạy Backend:**
```bash
uvicorn main:app --reload --port 8000
```

### 3. Cấu hình Frontend

```bash
cd frontend
npm install
```

**Tạo file `.env` trong thư mục `frontend/`:**
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_id.apps.googleusercontent.com
```

**Chạy Frontend:**
```bash
npm run dev
```

---

## 💎 Thiết kế & Trải nghiệm (UX)

Ứng dụng được thiết kế theo phong cách **Premium Aesthetics**:
-   **Glassmorphism**: Sử dụng các lớp nền trong suốt tinh tế tạo cảm giác hiện đại.
-   **Micro-animations**: Mọi tương tác đều có hiệu ứng mượt mà nhờ `motion/react`.
-   **Responsive Design**: Tối ưu hoàn hảo cho Desktop, Tablet và Mobile.
-   **Phản hồi tương tác**: Hiệu ứng sóng âm khi ghi âm và trạng thái xử lý AI thời gian thực.

---

## ✅ Lộ trình đã hoàn thành

-   [x] 🎙️ Ghi âm và xử lý giọng nói tự nhiên
-   [x] 🤖 Cơ chế dự phòng Multi-model Gemini (Fallback)
-   [x] 🔐 Tích hợp đăng nhập Google OAuth 2.0
-   [x] 💾 Lưu trữ hội thoại và tiến trình vào MongoDB
-   [x] 📊 Dashboard Lịch sử hoạt động tập trung
-   [x] 💡 Gợi ý học tập cá nhân hóa bằng AI Insights
-   [x] 🎯 Đánh giá phát âm dựa trên điểm số thực tế
-   [x] 🧩 Thư viện học tập năng động (Quiz, Story, Phrases)

---

## 👤 Tác giả

**longdn81** — [github.com/longdn81](https://github.com/longdn81)

---

## 📄 Giấy phép

Dự án này được phát hành dưới giấy phép MIT License.
