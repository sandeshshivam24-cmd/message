# 💬 Messenger — Full-Stack Realtime Web Messenger

A state-of-the-art, feature-complete 1-to-1 messenger web application built with **React**, **Node.js**, **Express**, and **Socket.IO**. Designed with a clean **Repository Pattern** for database independence, WebRTC audio/video calling, and production-grade security.

---

## 🚀 Quick Start Guide

### 1. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
*(Backend runs on `http://localhost:5000`)*

### 2. Start Frontend App
```bash
cd frontend
npm install
npm run dev
```
*(Frontend runs on `http://localhost:5173`)*

---

## 🌟 Key Features

### Phase 1: Foundation & Text Messaging
- **Authentication**: JWT token authentication & bcrypt password hashing.
- **Presence**: Realtime Online/Offline indicator & `Last seen` timestamp.
- **1-to-1 Messaging**: Single tick (`✓`), double tick (`✓✓` gray), blue tick (`✓✓` seen).
- **Interactive Messaging**: Typing indicators, reply quotes, copy to clipboard, delete for me, in-chat message search.
- **Responsive Design**: Glassmorphism UI adapting seamlessly to desktop and mobile screen sizes.

### Phase 2: Media & WebRTC Audio/Video Calling
- **Image & Document Messaging**: Gallery image picker, document attachments, upload progress bar, and lightbox image viewer.
- **WebRTC 1-to-1 Audio Calling**: Audio-only stream (`getUserMedia({ audio: true, video: false })`).
- **WebRTC 1-to-1 Video Calling**: Video stream, local camera preview, mute mic, and camera off toggles.
- **Minimized Floating Video Window**: Picture-in-picture window allowing active chat scrolling and messaging during calls without WebRTC interruption.
- **ICE Reconnection & TURN Support**: Auto ICE restart on network drop and configurable TURN fallback.

### Phase 3: Production Security, Privacy & Performance
- **Server-Side Authorization**: Authenticated identity enforced via JWT; conversation membership verified before operations.
- **Rate Limiting & Security Headers**: Helmet HTTP headers & `express-rate-limit` protecting REST API & Socket events.
- **Upload Security**: MIME type & extension whitelist filtering + filename path traversal sanitization.
- **Privacy Controls**: Server-enforced User Blocking (`BlockRepository`) and User Reporting (`ReportRepository`).
- **Notifications**: Web Notifications API integration + synthesized Web Audio API sound alerts.
- **Performance**: `React.memo` message bubble optimization & React `ErrorBoundary` fault tolerance.

---

## 📁 Repository Architecture & Database Migration

The backend uses the **Repository Pattern** to decouple application logic from data storage:
- `UserRepository` -> `InMemoryUserRepository`
- `MessageRepository` -> `InMemoryMessageRepository`
- `ConversationRepository` -> `InMemoryConversationRepository`
- `MediaRepository` -> `InMemoryMediaRepository`
- `BlockRepository` -> `InMemoryBlockRepository`
- `ReportRepository` -> `InMemoryReportRepository`

### Swapping to a Database (e.g. MongoDB, PostgreSQL, SQLite)
To plug in a real database:
1. Create new repository classes (e.g., `MongoUserRepository.js`) implementing the base interfaces in `repositories/`.
2. Update `repositories/index.js` dependency injection exports.
3. Zero code changes required in controllers, services, or socket handlers!

---

## 📋 Production Readiness Checklist

Before deploying to a public production server:

- [ ] **HTTPS / WSS Transport**: Deploy behind an SSL reverse proxy (e.g., Nginx, Cloudflare) so WebSocket connections use `wss://` and REST API uses `https://`.
- [ ] **Environment Variables**:
  - Set strong `JWT_SECRET` in `backend/.env`.
  - Set `NODE_ENV=production` to enable sanitized error messages.
  - Configure `CORS_ORIGIN` to explicitly match your production frontend domain.
- [ ] **TURN Server Configuration**: Configure dedicated TURN relay servers in `frontend/.env` (`VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`) for symmetric NAT/firewall traversal.
- [ ] **Database Connection**: Replace in-memory repository singletons in `repositories/index.js` with persistent database implementations (MongoDB / PostgreSQL / Prisma).
- [ ] **Object Storage**: Swap local disk storage in `MediaRepository` for Amazon S3, Google Cloud Storage, or Cloudinary.
- [ ] **Push Notification Service**: Integrate Web Push / FCM keys for mobile background push notifications.
- [ ] **Logging & Monitoring**: Connect server logs to a centralized monitoring service (e.g., Datadog, Sentry, PM2 logs).
