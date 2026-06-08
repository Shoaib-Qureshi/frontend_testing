# Frontend Atlas

An agentic AI tool for automated frontend website auditing. Enter a URL, queue a job, and get a full report covering performance, SEO, security, and crawl analysis — powered by Playwright and Lighthouse.

---

## Features

- **Performance audit** — Lighthouse scores, Core Web Vitals, failing audits
- **SEO analysis** — page-by-page metadata, title/description coverage, sitemap and robots.txt
- **Security scan** — HTTP headers, HTTPS transport, TLS checks
- **Crawl map** — broken links, redirects, duplicate pages, crawl depth
- **Content review** — AI-powered page content analysis (requires OpenRouter API key)
- **Live log stream** — real-time execution log while the worker runs
- **Export** — download full report as JSON or HTML

---

## Requirements

- Node.js >= 20
- npm

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd frontend-atlas
npm install
```

### 2. Install Playwright browser

```bash
npx playwright install chromium
```

### 3. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `3000`) |
| `OPENROUTER_API_KEY` | Optional | Enables AI content review tab |
| `OPENROUTER_MODEL` | No | Model to use (default: `openai/gpt-4o-mini`) |
| `ADMIN_EMAIL` | No | Bootstrap admin email |
| `ADMIN_PASSWORD` | No | Bootstrap admin password |
| `ADMIN_NAME` | No | Bootstrap admin display name |
| `APP_URL` | No | Public URL of the app (default: `http://127.0.0.1:3000`) |

### 4. Build and run

```bash
npm run web
```

This builds the React frontend and starts the server. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Development

Run the frontend dev server and backend separately:

```bash
# Terminal 1 — backend
npm run server

# Terminal 2 — frontend (hot reload)
npm run client:dev
```

---

## How It Works

1. Enter a website URL in the audit panel
2. Choose crawl depth (10 / 30 / 50 pages) and content review scope
3. Click **Queue Audit** — the job is picked up by the background worker
4. Track progress in the live log, then view the full six-tab report workspace when done
5. Export the report as JSON or HTML

---

## Audit Tiers

| Setting | Options |
|---|---|
| Crawl pages | 10, 30, 50 |
| Content review pages | 0 (off), 5, 10, 20 |

Content review pages cannot exceed the crawl tier. Content review requires `OPENROUTER_API_KEY` to be set.

---

## Project Structure

```
├── agent/          # Playwright crawler + Lighthouse runner
├── client/src/     # React frontend (Vite)
├── lib/            # Server, store, audit queue
├── public/         # Built frontend (generated)
├── reports/        # Generated audit reports (gitignored)
├── storage/        # SQLite database (gitignored)
├── config.js       # App configuration
└── server.js       # Entry point
```

---

## Tech Stack

- **Backend** — Node.js (no framework), SQLite via `node:sqlite`
- **Frontend** — React 19, Vite 8, Framer Motion
- **Auditing** — Playwright, Lighthouse
- **AI content review** — OpenRouter API
