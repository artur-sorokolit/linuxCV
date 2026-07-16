# linuxCV

An interactive portfolio/.resume that simulates a Linux-like desktop environment right in your browser — complete with draggable windows, a taskbar, glassmorphism effects, and AI-powered chat.

Live demo: [https://cllown.github.io/linuxCV/](https://cllown.github.io/linuxCV/)

## Features

- **Desktop Experience** — Window manager with drag-and-drop, z-index stacking, minimize/focus/restore, and a "liquid glass" UI (CSS `backdrop-filter`)
- **AI Assistant** — Built-in chat powered by Gemini / OpenRouter with session history
- **Contact Form** — Visitors can reach out; admin panel to review submissions
- **Responsive** — Transitions to fullscreen modals on mobile
- **Admin Mode** — Access via `Ctrl+Alt+A` shortcut

## Apps

| App          | Description                               |
| ------------ | ----------------------------------------- |
| AI Assistant | Conversational AI chat about your profile |
| About Me     | Bio and personal info                     |
| Experience   | Work history                              |
| Education    | Academic background                       |
| Tech Stack   | Technologies and tools                    |
| Contact      | Message form                              |
| Admin Panel  | View contact submissions (auth-gated)     |

## Architecture

```
linuxCV/
├── client/          # React 19 + TypeScript + Vite
│   └── src/
│       ├── core/    # OS context (window registry, z-index state)
│       ├── ui/      # Window, DesktopIcon, Taskbar, TopBar
│       ├── features/# AboutMe, Experience, Chat, Contact, Admin
│       └── config/  # App registry
└── server/          # Express 5 + TypeScript + Postgres
    └── src/
        ├── routes/  # /api/contact, /api/chat, /api/admin
        ├── controllers/
        └── services/
```

## Tech Stack

**Client:** React 19 · TypeScript · Vite · Framer Motion · Lucide React · Vanilla CSS

**Server:** Express 5 · TypeScript · Postgres (Neon) · OpenRouter

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm

### Quick Start

```bash
# Install all dependencies
make install

# Run client (localhost:5173) and server (localhost:5000) simultaneously
make dev
```

### Available Commands

```bash
make dev          # Run client + server in dev mode (localhost)
make server       # Run server only
make start        # Self-hosted: Launch server + cloudflared tunnel
make sync         # Sync local code to remote server laptop securely (via rsync over SSH)
make build        # Build client for production
make deploy       # Build and deploy client to GitHub Pages
make lint         # Run ESLint on client and server
make clean        # Remove dist/ and node_modules/
```

### Environment Variables

To run this project, you need to configure the following environment variables. Copy the `.env.example` files to `.env` in their respective directories.

**Server** (`server/.env`):

```env
PORT=5000
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
DATABASE_SSL=true            # set to false for a local Postgres without TLS
CORS_ORIGINS=https://artur-sorokolit.uk,http://localhost:5173
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key

# Email notifications (Gmail SMTP Setup)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
```

`CORS_ORIGINS` is a comma-separated allowlist of browser origins. Leave it empty to allow any origin (local development only).

**Client** (`client/.env`):

```env
VITE_API_URL=http://localhost:5000   # for local development
# VITE_API_URL=https://api.yourdomain.com  # for production self-hosted backend
```

**Root** (`.env` - used for deployment sync):

```env
REMOTE_SSH_TARGET=user@ssh.yourdomain.com:~/work/project-dir/
```

## Deployment Architecture

The application runs entirely on free tiers:

- **Frontend (Client)**: Built and served via **Cloudflare** at [https://artur-sorokolit.uk](https://artur-sorokolit.uk) (also mirrored to GitHub Pages).
- **Backend (Server)**: **Render** free web service, built from `render.yaml` at the repo root. Free instances spin down after 15 minutes of inactivity and take roughly a minute to wake up.
- **Database**: **Neon** free Postgres. Schema is created automatically on boot by the migration runner in `server/src/db.ts`.
- **API domain**: `api.artur-sorokolit.uk` is a CNAME to the Render service, so the client's `VITE_API_URL` never changes.

### Deploying the backend

1. Create a Neon project and copy its pooled connection string.
2. On Render, create a Blueprint from this repo — `render.yaml` defines the service.
3. Set the secrets marked `sync: false` in the Render dashboard: `DATABASE_URL`, `CORS_ORIGINS`, `OPENROUTER_API_KEY`, `ADMIN_TOKEN`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`.
4. Point `api.artur-sorokolit.uk` at the Render service and add it as a custom domain there.

## License

ISC
