# AGENTS.md

## Project Goal

Build and maintain a multi-user agentic website audit SaaS that:

- audits websites for broken links, redirects, SEO issues, performance, UX, content quality, and basic security
- supports customer signup, login, email verification, password reset, and optional Google OAuth
- stores per-user audits and report artifacts with SQLite + local filesystem storage
- supports free trials, credit packs, subscriptions, and admin-only unlimited usage
- provides customer and admin dashboards plus a polished report workspace

## Tech Stack

- Node.js
- React + Vite
- Framer Motion
- SQLite via `node:sqlite`
- Playwright
- Lighthouse
- OpenRouter API
- Axios / Cheerio
- Razorpay

## Architecture

### Audit agents

1. Crawler Agent
2. SEO Agent
3. Performance Agent
4. UX Agent (LLM-based)
5. Security Agent
6. Report Generator Agent

### SaaS platform layers

1. Auth and session layer
2. Product, subscription, and credit ledger layer
3. Persisted audit queue layer
4. Per-user storage and artifact retention layer
5. Customer dashboard and admin dashboard layer

## Rules

- Write modular, clean code
- Use async/await
- Do not add unnecessary dependencies
- Keep files small and reusable when practical
- Log meaningful outputs
- Preserve multi-user isolation
- Keep DB access behind the store/repository layer
- Keep per-audit JSON and HTML report outputs working
- Preserve CLI support while extending the SaaS app
- Keep admin unlimited behavior separate from normal credit enforcement

## Commands

- `npm install`
- `npm run server`
- `npm run client:dev`
- `npm run client:build`
- `npm run web`
- `node index.js https://example.com`

## Output

### Persistent app storage

- `/storage/app.sqlite`
- `/storage/audits/<userId>/<auditId>/report.json`
- `/storage/audits/<userId>/<auditId>/report.html`

### Legacy CLI report output

- `/reports/report.json`
- `/reports/report.html`
