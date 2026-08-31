# linuxCV

An interactive portfolio/.resume that simulates a Linux-like desktop environment right in your browser — complete with draggable windows, a taskbar, glassmorphism effects, and AI-powered chat.

Live demo: [https://cllown.github.io/linuxCV/](https://cllown.github.io/linuxCV/)

## Features

- **Desktop Experience** — Window manager with drag-and-drop, z-index stacking, minimize/focus/restore, and a "liquid glass" UI (CSS `backdrop-filter`)
- **AI Assistant** — Built-in chat powered by Gemini / OpenRouter with session history
- **Contact Form** — Visitors can reach out; submissions are stored and emailed to you
- **Responsive** — Transitions to fullscreen modals on mobile

## Apps

| App          | Description                               |
| ------------ | ----------------------------------------- |
| AI Assistant | Conversational AI chat about your profile |
| About Me     | Bio and personal info                     |
| Experience   | Work history                              |
| Education    | Academic background                       |
| Tech Stack   | Technologies and tools                    |
| Contact      | Message form                              |

## Architecture

```
linuxCV/
├── client/          # React 19 + TypeScript + Vite
│   └── src/
│       ├── core/    # OS context (window registry, z-index state)
│       ├── ui/      # Window, DesktopIcon, Taskbar, TopBar
│       ├── features/# AboutMe, Experience, Chat, Contact
│       └── config/  # App registry
└── server/          # Express 5 + TypeScript + Postgres
    └── src/
        ├── routes/  # /api/contact, /api/chat
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
OPENROUTER_API_KEY=your_openrouter_key
IP_HASH_SALT=any_long_random_string   # required in production, set once and never rotated
CHAT_RETENTION_DAYS=0        # 0 keeps conversations forever; any positive value prunes daily

# Email notifications (Gmail SMTP Setup)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
```

The server validates these on boot and refuses to start if something required is missing.

`CORS_ORIGINS` is a comma-separated allowlist of browser origins. Leave it empty to allow any origin — permitted in development only, since production requires a non-empty list.

**Client** (`client/.env`):

```env
VITE_API_URL=http://localhost:5000   # for local development
# VITE_API_URL=https://api.yourdomain.com  # for production self-hosted backend
```

**Root** (`.env` - used for deployment sync):

```env
REMOTE_SSH_TARGET=user@ssh.yourdomain.com:~/work/project-dir/
```

## Chat Data Model

Three tables, migrated from `server/src/migrations/`.

- `visitors`: one row per browser, keyed by the token the client keeps in `localStorage`. Holds a salted hash of the IP (never the address itself), the browser and OS family parsed out of the User-Agent, a bot flag, and the Cloudflare country code. `label` is free text for annotating a visitor by hand.
- `chat_sessions`: one conversation. Carries the visitor it belongs to, the IP hash as it was at the time, `message_count` and `last_message_at`.
- `chat_messages`: one row per message, ordered by `seq` within its session. `status` records how the turn went, where `ok` means answered normally, `refused` means redirected by the scope gate or the code-dump filter, and `error` means the upstream call failed. Only `ok` turns are ever replayed to a model, so a refusal stays visible in the history without priming later answers.

Four views make the data readable without writing joins. Two for scanning who came:

```sql
SELECT * FROM v_conversations ORDER BY last_message_at DESC;  -- one row per conversation
SELECT * FROM v_visits ORDER BY started_at DESC;              -- one row per sitting
```

`v_visits` groups a visitor's sessions that start less than 30 minutes apart, which is how one person reads as one person rather than as several rows. Both list the questions only, since that is what a scan is for.

Two for reading what was actually said:

```sql
SELECT * FROM v_messages ORDER BY created_at DESC, seq;   -- one row per message
SELECT dialogue FROM v_transcript WHERE session_id = '…';  -- the exchange in one cell
```

`v_transcript` renders a whole session as `Q:` and `A:` lines, marking any turn the gate refused or the model failed.

## Deployment Architecture

The application runs entirely on free tiers:

- **Frontend (Client)**: Built and served via **Cloudflare** at [https://artur-sorokolit.uk](https://artur-sorokolit.uk) (also mirrored to GitHub Pages).
- **Backend (Server)**: **Render** free web service, built from `render.yaml` at the repo root. Free instances spin down after 15 minutes of inactivity and take roughly a minute to wake up.
- **Database**: **Neon** free Postgres. Migrations live in `server/src/migrations/` as numbered `.sql` files and are applied on boot, or on demand with `npm run migrate`.
- **API domain**: `api.artur-sorokolit.uk` is a CNAME to the Render service, so the client's `VITE_API_URL` never changes.

### Deploying the backend

1. Create a Neon project and copy its pooled connection string.
2. On Render, create a Blueprint from this repo — `render.yaml` defines the service.
3. Set the secrets marked `sync: false` in the Render dashboard: `DATABASE_URL`, `CORS_ORIGINS`, `OPENROUTER_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`.
4. Point `api.artur-sorokolit.uk` at the Render service and add it as a custom domain there.

## License

ISC
