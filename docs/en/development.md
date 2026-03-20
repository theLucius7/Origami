# Development

This page covers **local development, debugging, and contributor workflows**.

This is not the production deployment path. If you want to put Origami online, start with:

- [Quick Start](/en/quick-start)
- [Deployment](/en/deployment)

## Who should read this page

Use this page if you want to:

- run Origami on `localhost`
- change UI, backend behavior, or schema
- debug OAuth callbacks
- validate migrations, tests, or builds
- contribute code or docs

## Local requirements

- Node.js 22+
- npm
- a development Turso / libSQL database
- a development Cloudflare R2 bucket
- a dedicated local GitHub OAuth App
- development Gmail / Outlook OAuth apps when needed

## Local environment example

Use a separate development configuration. Do not reuse production secrets.

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

R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-dev
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

A useful way to think about these variables is to group them into five sets:

- **App basics**: `NEXT_PUBLIC_APP_URL`, `ENCRYPTION_KEY`, `AUTH_SECRET`
- **GitHub sign-in**: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_ALLOWED_LOGIN`
- **Database**: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- **Attachment storage**: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`
- **Scheduled jobs**: `CRON_SECRET`

## Local OAuth callbacks

### GitHub

```txt
http://localhost:3000/api/better-auth/callback/github
```

### Gmail

```txt
http://localhost:3000/api/oauth/gmail
```

### Outlook

```txt
http://localhost:3000/api/oauth/outlook
```

Use separate local OAuth apps whenever possible instead of reusing production ones.

## Install and run

```bash
cp .env.local.example .env
npm install
npm run db:setup
npm run dev
```

Default URL:

- `http://localhost:3000`

If this is your first time getting the project running locally, check these in order:

1. `npm install` completes successfully
2. `.env` contains a real development configuration
3. `npm run db:setup` succeeds
4. `npm run dev` serves `http://localhost:3000`
5. GitHub sign-in, local OAuth callbacks, and core pages work normally

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

Recommended usage:

- use `db:setup` for a fresh development database
- use `db:migrate` when you specifically want to validate the migration chain
- use `db:push` only when you are sure you understand the impact

## Debugging tips

### OAuth callback issues

Check these first:

- `NEXT_PUBLIC_APP_URL`
- callback URLs in the OAuth provider console
- the current local port
- whether the client ID / secret belong to development, not production

### Database issues

Check these first:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- whether `db:setup` has already run against the current database

### Attachment upload issues

Check these first:

- `R2_BUCKET_NAME`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

## Common local development pitfalls

1. **Reusing production OAuth apps for `localhost`**  
   That often turns callback URLs into a mess and can also break your real deployment config.
2. **Running the app before copying `.env.local.example` to `.env`**  
   A page opening in the browser does not mean the important flows are actually configured.
3. **Mixing development and production databases**  
   This gets dangerous very quickly once you are changing schema or testing migrations.
4. **Leaving R2 half-configured and only discovering it when you upload an attachment**  
   Storage problems often stay hidden until later in the flow.
5. **Changing the local port but forgetting to update OAuth callbacks**  
   The consent page may still open, but the return flow breaks.

## Before you commit

Run at least:

```bash
npm run verify
```

If you only changed docs, at minimum run:

```bash
npm run docs:build
```
