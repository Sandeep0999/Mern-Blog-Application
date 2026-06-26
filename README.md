# ✒️ DailyPen — Full-Stack Blog Platform

A production-grade blogging platform built with the **MERN stack** (MongoDB, Express, React, Node.js). DailyPen features AI-powered content generation, two-factor authentication, Google OAuth, a comprehensive admin moderation system, and a polished dark/light UI.

---

## ✨ Features

### 🔐 Authentication & Security
- **Email + Password** registration with server-side validation
- **OTP-based two-factor login** — one-time codes sent via email (Nodemailer / Gmail)
- **Google OAuth** sign-in (One Tap & popup flows via `google-auth-library`)
- JWT-based session management with configurable expiry
- Automatic account linking (local ↔ Google)
- Banned-user request blocking at the middleware level

### 📝 Content Management
- Rich text editor powered by **React Quill**
- Create, edit, and delete blog posts with cover images
- Tag system for categorisation
- **AI Content Generation** — generate full blog drafts from a title using **Google Gemini** (2.5-flash with 1.5-flash fallback)
- Cloudinary integration for image uploads
- XSS-safe rendering with **DOMPurify**

### 💬 Social & Engagement
- Like and bookmark (save) posts
- Threaded comment system with counts
- Follow / unfollow authors
- User profiles with bio, avatar, and post history
- Full-text search, tag filtering, and pagination

### 🛡️ Admin & Moderation
- **5-tier role system** — `user`, `content_reviewer`, `moderator`, `support_admin`, `admin`
- Admin dashboard with stats and analytics
- User management — view, warn, issue strikes, suspend, shadow-ban, ban, delete
- Post management — publish, unpublish, flag, feature, remove
- **Report system** with 12 report reasons, risk scoring, and auto-flagging (threshold-based)
- Report review workflow — pending → under review → resolved / dismissed
- **Immutable audit log** tracking every moderation action with admin identity, IP, and timestamps

### 🎨 UI & UX
- Light / Dark theme toggle (persisted in localStorage)
- Responsive design with **Tailwind CSS**
- Modern typography — Inter, Playfair Display, Merriweather (Google Fonts)
- Toast notifications via **React Toastify**
- **Lucide React** icon set
- Protected, admin, and public route guards

### 🔒 Security Hardening
- **Helmet** HTTP headers
- **express-mongo-sanitize** for NoSQL injection prevention
- **express-rate-limit** — general, auth, and report-specific rate limiters
- Input validation with **express-validator**
- CORS with configurable allowed origins
- Multi-stage **Docker** build with non-root user

---

## 🏗️ Tech Stack

### Frontend
| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| Vite 5 | Build tool & dev server |
| React Router DOM 6 | Client-side routing |
| Tailwind CSS 3 | Utility-first styling |
| React Quill | Rich text editor |
| Axios | HTTP client |
| Lucide React | Icons |
| React Toastify | Notifications |
| DOMPurify | XSS sanitisation |
| date-fns | Date formatting |
| @react-oauth/google | Google sign-in |

### Backend
| Tool | Purpose |
|------|---------|
| Node.js + Express 4 | REST API server |
| MongoDB + Mongoose 8 | Database & ODM |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| @google/genai | Gemini AI content generation |
| google-auth-library | Google OAuth verification |
| Cloudinary | Image hosting |
| Nodemailer | OTP emails via Gmail |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| express-mongo-sanitize | NoSQL injection protection |
| express-validator | Request validation |
| Docker | Containerised deployment |

---

## 📁 Project Structure

```
DailyPen/
├── backend/
│   ├── config/          # DB connection, Cloudinary config
│   ├── controllers/     # Auth, Post, User, Admin, AI, Report
│   ├── middleware/       # JWT auth (protect, admin, moderator, etc.), error handler
│   ├── models/          # User, Post, Comment, Report, AuditLog
│   ├── routes/          # auth, post, user, admin, ai, report
│   ├── utils/           # sendEmail, validators
│   ├── server.js        # Express entry point
│   └── Dockerfile       # Multi-stage production build
│
├── frontend/
│   ├── src/
│   │   ├── api/         # Axios instance & interceptors
│   │   ├── assets/      # Static assets
│   │   ├── components/  # Navbar, Footer, PostCard, ReportModal, route guards...
│   │   ├── context/     # AuthContext, ThemeContext
│   │   ├── pages/       # Home, Login, Signup, Dashboard, CreatePost, EditPost,
│   │   │                #   PostDetail, Profile, AdminPanel
│   │   ├── App.jsx      # Route definitions
│   │   └── main.jsx     # App entry point
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** (Atlas or local)
- **Cloudinary** account
- **Gmail App Password** (for OTP emails)
- **Google Cloud OAuth 2.0** Client ID & Secret
- **Google Gemini API Key**

### 1. Clone the repository

```bash
git clone https://github.com/Sandeep0999/Mern-Blog-Application.git
cd Mern-Blog-Application
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
NODE_ENV=development
PORT=5000

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GEMINI_API_KEY=your_gemini_api_key

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Start the dev server:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the dev server:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and the API on `http://localhost:5000`.

---

## 🐳 Docker (Backend)

Build and run the backend in a container:

```bash
cd backend
docker build -t dailypen-backend .
docker run -p 5000:5000 --env-file .env dailypen-backend
```

---

## 🔌 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login → sends OTP to email |
| POST | `/verify-otp` | Verify OTP → returns JWT |
| POST | `/google` | Google OAuth sign-in |
| GET | `/me` | Get current user profile |

### Posts (`/api/posts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List posts (search, filter, paginate) |
| GET | `/:id` | Get single post |
| POST | `/` | Create post |
| PUT | `/:id` | Update post |
| DELETE | `/:id` | Delete post |
| POST | `/:id/like` | Toggle like |
| POST | `/:id/comment` | Add comment |

### Users (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:id` | Get user profile |
| PUT | `/profile` | Update own profile |
| POST | `/:id/follow` | Follow / unfollow |
| POST | `/save/:id` | Save / unsave post |

### AI (`/api/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate` | Generate blog content from title |

### Reports (`/api/reports`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Submit a report |
| GET | `/` | List reports (admin) |
| GET | `/:id` | Report detail (admin) |
| PATCH | `/:id/review` | Mark under review |
| POST | `/:id/resolve` | Resolve / dismiss report |
| GET | `/check/:postId` | Check if user reported a post |

### Admin (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Dashboard statistics |
| GET | `/analytics` | Platform analytics |
| GET | `/users` | List all users |
| GET | `/users/:id` | User detail |
| PATCH | `/users/:id/status` | Update user status |
| POST | `/users/:id/warn` | Issue warning |
| PATCH | `/users/:id/role` | Change user role |
| PATCH | `/users/:id/reset-strikes` | Reset strikes |
| DELETE | `/users/:id` | Delete user |
| GET | `/posts` | List all posts |
| PATCH | `/posts/:id/status` | Update post status |
| PATCH | `/posts/:id/feature` | Toggle featured |
| DELETE | `/posts/:id` | Delete post |
| GET | `/audit-logs` | View audit log |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server & DB status |

---

## 📄 License

ISC
