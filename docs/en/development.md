# Development

This page covers **local development, debugging, and contributor workflows**.

This is not the production deployment path.

For deployment, read:

- [Quick Start](/en/quick-start)
- [Deployment](/en/deployment)

## Local requirements

- Node.js 22+
- npm
- a development Turso / libSQL database
- a development Cloudflare R2 bucket
- a dedicated local GitHub OAuth App
- Gmail / Outlook development OAuth apps if needed

## Local environment example

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login

ENCRYPTION_KEY=64-char-hex-key
AUTH_SECRET=64-char-hex-key
CRON_SECRET=64-char-hex-key

TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...

R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-dev
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

## Local OAuth callbacks

- GitHub: `http://localhost:3000/api/auth/github/callback`
- Gmail: `http://localhost:3000/api/oauth/gmail`
- Outlook: `http://localhost:3000/api/oauth/outlook`

## Install and run

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Default URL:

- `http://localhost:3000`

## Common commands

```bash
npm run dev
npm run test
npm run lint
npm run build
npm run docs:build
npm run verify
```

## Database commands

```bash
npm run db:setup
npm run db:migrate
npm run db:push
```

Use `db:setup` for fresh development databases.

## Debugging checklist

Check these first when things fail:

- `NEXT_PUBLIC_APP_URL`
- OAuth callback URLs
- Turso credentials
- R2 credentials
- whether the current `.env` belongs to development, not production

## Before you commit

Run at least:

```bash
npm run verify
```

If you only changed docs, run:

```bash
npm run docs:build
```
