# Quick Start

This page is for first-time users who want the shortest path to a working Origami instance.

## Prerequisites

You will usually need:

- Node.js 22+
- a Turso / libSQL database
- a Cloudflare R2 bucket
- a GitHub OAuth App for signing in to Origami
- Gmail / Outlook OAuth apps if you want those providers

## 1. Install and create `.env`

```bash
cp .env.example .env
npm install
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the generated value into `ENCRYPTION_KEY`, then fill the rest of `.env`.

## 2. Minimum environment groups

- **App:** `NEXT_PUBLIC_APP_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ENCRYPTION_KEY`
- **Recommended hardening:** `GITHUB_ALLOWED_LOGIN`, `AUTH_SECRET`, `CRON_SECRET`
- **Database:** `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- **Storage:** `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`
- **Optional OAuth defaults:** `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`

## 3. Initialize the database

```bash
npm run db:setup
```

For a brand-new database, this is the recommended path.
Use `db:migrate` only when you intentionally want to replay the historical migration chain.

## 4. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`, sign in with GitHub, finish `/setup`, then add accounts in `/accounts`.

## 5. Verify before shipping

```bash
npm run verify
```

This runs lint, typecheck, tests, app build, and docs build in one path.

## Where to go next

- Need production setup? Read [Deployment](/en/deployment)
- Need architectural context? Read [Architecture](/en/architecture)
- Need product reasoning? Read [FAQ](/en/faq)
