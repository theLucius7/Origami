# Deployment

This page describes the **standard production deployment flow** for Origami.

Default scope:

- single instance
- single owner
- public internet access
- Vercel + Turso + Cloudflare R2

For the shortest path, start with:

- [Quick Start](/en/quick-start)

For local development and debugging, read:

- [Development](/en/development)

## Production baseline

Recommended stack:

- **Runtime:** Vercel
- **Database:** Turso / libSQL
- **Object storage:** Cloudflare R2
- **Sign-in:** GitHub OAuth App
- **Mailbox providers:** Gmail OAuth, Outlook OAuth, IMAP/SMTP

## Production domain

Pick the final production URL first, for example:

```txt
https://mail.example.com
```

Use the same domain in:

- `NEXT_PUBLIC_APP_URL`
- GitHub OAuth callback
- Gmail OAuth callback
- Outlook OAuth callback

These must stay aligned.

## Environment variables

Required production example:

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com

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
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Optional default OAuth apps:

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

## OAuth requirements

### GitHub

Configure:

- **Homepage URL:** `https://mail.example.com`
- **Authorization callback URL:** `https://mail.example.com/api/auth/github/callback`

Set `GITHUB_ALLOWED_LOGIN` for public deployments.

### Gmail

Redirect URI:

```txt
https://mail.example.com/api/oauth/gmail
```

### Outlook

Redirect URI:

```txt
https://mail.example.com/api/oauth/outlook
```

Detailed guides:

- [GitHub Auth detailed setup](/en/github-auth)
- [Gmail OAuth detailed setup](/en/gmail-oauth)
- [Outlook OAuth detailed setup](/en/outlook-oauth)

## Database initialization

```bash
npm install
npm run db:setup
```

Use `db:setup` for a fresh production database.

## Vercel deployment flow

1. import the repository into Vercel
2. configure production environment variables
3. bind the production domain
4. deploy the app
5. sign in and complete first setup

## Scheduled sync

`vercel.json` already defines `/api/cron/sync`.

Production requests should send:

```http
Authorization: Bearer <CRON_SECRET>
```

Set `CRON_SECRET` explicitly in production.

## Production checklist

Verify the following after deployment:

- the production domain opens successfully
- GitHub sign-in returns to Origami
- `/accounts` loads
- Gmail OAuth works
- Outlook OAuth works
- IMAP/SMTP accounts can be added
- sync works
- attachments upload and download correctly
- compose works
- scheduled sync can call `/api/cron/sync`

## Release validation

```bash
npm run verify
```

## Related pages

- [Quick Start](/en/quick-start)
- [Development](/en/development)
