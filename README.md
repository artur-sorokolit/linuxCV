# linuxCV

An interactive portfolio/.resume that simulates a Linux-like desktop environment right in your browser — complete with draggable windows, a taskbar, glassmorphism effects, and AI-powered chat.

Live demo: <https://cllown.github.io/linuxCV/>

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
├── server/          # Express 5 + TypeScript + SQLite
│   └── src/
│       ├── routes/  # /api/contact, /api/chat, /api/admin
│       ├── controllers/
│       └── services/
└── data/            # SQLite database
```

## Tech Stack

**Client:** React 19 · TypeScript · Vite · Framer Motion · Lucide React · Vanilla CSS

**Server:** Express 5 · TypeScript · SQLite · Gemini API · OpenRouter

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
DATABASE_URL=data/database.sqlite
GEMINI_API_KEY=your_gemini_key
OPENROUTER_API_KEY=your_openrouter_key
ADMIN_TOKEN=your_secure_admin_token

# Email notifications (Gmail SMTP Setup)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
```

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

The application is deployed using a modern, cost-effective hybrid infrastructure:

- **Frontend (Client)**: Built locally and deployed to **Cloudflare Pages** or **GitHub Pages** for ultra-fast CDN delivery.
- **Backend (Server) & Database (SQLite)**: Self-hosted on a private server (home laptop) exposed securely to the internet via **Cloudflare Zero Trust Tunnels**.
- **Remote Administration**: Access control is secured using **Cloudflare Access (MFA/OTP)** protecting the SSH gateway, allowing secure administration globally.
- **Continuous Deployment (Sync)**: Code changes are deployed from the developer's workstation to the remote server instantly using `make sync` (`rsync` over SSH tunnel).

## License

ISC
