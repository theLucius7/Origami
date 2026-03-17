# Origami ✉️

> A privacy-friendly unified inbox for individuals or a single operator inside a small team, aggregating Gmail / Outlook / QQ in one place and designed for self-hosting. （一个面向个人或小团队单一操作席位的统一收件箱，可聚合 Gmail / Outlook / QQ，强调隐私与自托管。）

[![CI](https://github.com/theLucius7/Origami/actions/workflows/ci.yml/badge.svg)](https://github.com/theLucius7/Origami/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/theLucius7/Origami)](./LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Turso](https://img.shields.io/badge/Database-Turso-4FF8D2?logo=turso&logoColor=111)](https://turso.tech/)
[![Cloudflare R2](https://img.shields.io/badge/Object%20Storage-Cloudflare%20R2-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/r2/)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://theLucius7.github.io/Origami/)

***

## ✨ Features

- Unified inbox across multiple accounts, sorted by time
- Gmail / Outlook OAuth + QQ IMAP account connection
- Local triage states: **Done / Archive / Snooze** (not written back to providers)
- Structured search syntax: `account:` / `from:` / `subject:` / `is:read` / `is:done` / `is:snoozed`
- Gmail / Outlook sending support for new emails (minimal viable compose flow)
- Attachments stored in Cloudflare R2, metadata stored in Turso
- Manual sync + scheduled sync via `GET /api/cron/sync`
- Single-user `ACCESS_TOKEN` protection with cookie or Bearer auth
- Lazy body hydration: initial sync stores metadata first, then fetches full body/attachments on demand
- Local sent-message history with attachment records

## 🚫 Known Limitations

- Local triage state is **Origami-only** and is not written back to Gmail / Outlook / QQ
- QQ Mail is **read-only** for now; sending is not implemented
- Single attachment must stay **under 3 MB** (Outlook compatibility limit in current implementation)
- No thread-aware reply / forward flow yet
- No remote draft sync yet
- Inbox sync is focused on recent inbox mail, not full mailbox mirroring

## 🚀 Quick Start

### Environment setup

```bash
cp .env.example .env
npm install
```

Generate a 32-byte hex encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Fill in `.env`, then initialize the database:

```bash
npm run db:migrate
# or: npm run db:push
```

Start local development:

```bash
npm run dev
```

Open `http://localhost:3000`, sign in with `ACCESS_TOKEN`, then add accounts from `/accounts`.

### One-click deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/theLucius7/Origami)

Recommended production stack:

- **Frontend + server runtime:** Vercel
- **Database:** Turso / libSQL
- **Attachment storage:** Cloudflare R2
- **OAuth / provider APIs:** Google Gmail API, Microsoft Graph, QQ IMAP

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---:|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL used for OAuth callback URLs |
| `ACCESS_TOKEN` | Yes | Single-user login token |
| `CRON_SECRET` | Yes | Bearer secret for `/api/cron/sync` |
| `ENCRYPTION_KEY` | Yes | 64-char hex key for AES-256-GCM credential encryption |
| `TURSO_DATABASE_URL` | Yes | Turso / libSQL database URL |
| `TURSO_AUTH_TOKEN` | Yes | Turso auth token |
| `R2_ACCESS_KEY_ID` | Yes | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | Yes | Bucket used for inbound and compose attachments |
| `R2_ENDPOINT` | Yes | R2 S3-compatible endpoint |
| `R2_ACCOUNT_ID` | No | Currently unused by runtime code; kept for ops reference |
| `GMAIL_CLIENT_ID` | When Gmail is enabled | Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | When Gmail is enabled | Google OAuth client secret |
| `OUTLOOK_CLIENT_ID` | When Outlook is enabled | Microsoft OAuth client ID |
| `OUTLOOK_CLIENT_SECRET` | When Outlook is enabled | Microsoft OAuth client secret |

See also: [`docs/deployment.md`](./docs/deployment.md)

## 🏗 Architecture

Core runtime flow:

```text
Browser
  -> Next.js Proxy (ACCESS_TOKEN protection)
  -> App Router pages / Server Actions
  -> Drizzle ORM
  -> Turso (accounts, emails, triage state, sent history)
  -> Cloudflare R2 (attachment binaries)
  -> Providers
       - Gmail API
       - Microsoft Graph
       - QQ IMAP

Vercel Cron
  -> /api/cron/sync
  -> syncAllAccounts()
```

See the full architecture write-up: [`docs/architecture.md`](./docs/architecture.md)

## 🧪 Development

| Command | What it does |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start built app |
| `npm run test` | Run Vitest test suite |
| `npm run lint` | Run ESLint |
| `npm run audit:prod` | Audit production dependencies only |
| `npm run db:migrate` | Apply migration chain |
| `npm run db:push` | Push current schema with SQLite FTS-safe wrapper |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run docs:dev` | Start VitePress docs locally |
| `npm run docs:build` | Build GitHub Pages docs site |

Current validation baseline used in CI:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run docs:build
```

## 📦 Deployment

### Vercel + Turso + R2

1. Create a Turso database and auth token
2. Create a Cloudflare R2 bucket and S3-compatible credentials
3. Configure Gmail / Outlook OAuth apps if you want those providers
4. Add environment variables in Vercel
5. Run `npm run db:migrate` (or `npm run db:push`) against the target database
6. Deploy the app to Vercel
7. Let `vercel.json` trigger scheduled sync every 15 minutes

Detailed deployment guide: [`docs/deployment.md`](./docs/deployment.md)

## 🔒 Security

- Provider credentials are encrypted with **AES-256-GCM** before being stored in Turso
- Attachment binaries are stored outside the database in **Cloudflare R2**
- Downloads are proxied through the server, so clients never see raw R2 object keys
- The app is protected by a single-user **ACCESS_TOKEN** enforced by Next.js Proxy
- Cron sync is protected with `CRON_SECRET`
- `npm run audit:prod` currently reports **0 production vulnerabilities**

## 📄 License

MIT — see [LICENSE](./LICENSE)
