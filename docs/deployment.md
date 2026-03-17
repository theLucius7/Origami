# Deployment

This guide documents the **actual deployment model implemented in code today**.

Recommended stack:

- **App runtime**: Vercel
- **Database**: Turso / libSQL
- **Object storage**: Cloudflare R2
- **Mail providers**: Gmail API, Microsoft Graph, QQ IMAP

## Environment variables

| Variable | Required | Notes |
|---|---:|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL used for OAuth callback URLs |
| `ACCESS_TOKEN` | Yes | Single-user login token |
| `CRON_SECRET` | Yes | Bearer secret for `GET /api/cron/sync` |
| `ENCRYPTION_KEY` | Yes | 64-char hex key used by AES-256-GCM |
| `TURSO_DATABASE_URL` | Yes | Turso / libSQL URL |
| `TURSO_AUTH_TOKEN` | Yes | Turso auth token |
| `R2_ACCESS_KEY_ID` | Yes | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 secret key |
| `R2_BUCKET_NAME` | Yes | Attachment bucket |
| `R2_ENDPOINT` | Yes | R2 S3-compatible endpoint |
| `R2_ACCOUNT_ID` | No | Not used by runtime today |
| `GMAIL_CLIENT_ID` | If Gmail is enabled | Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | If Gmail is enabled | Google OAuth client secret |
| `OUTLOOK_CLIENT_ID` | If Outlook is enabled | Microsoft OAuth client ID |
| `OUTLOOK_CLIENT_SECRET` | If Outlook is enabled | Microsoft OAuth client secret |

## 1. Prepare application secrets

### ACCESS_TOKEN

This is the only user-facing login credential for the app.

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### CRON_SECRET

Used to protect the scheduled sync endpoint:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

### ENCRYPTION_KEY

Must be a 32-byte key encoded as 64 hex chars:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 2. Configure Turso

Create a Turso database and get:

- database URL
- auth token

Then run one of these from a trusted environment:

```bash
npm run db:migrate
# or
npm run db:push
```

Notes:

- `db:migrate` replays the migration chain
- `db:push` uses the project wrapper that keeps SQLite FTS push behavior clean

## 3. Configure Cloudflare R2

Create a bucket, then create S3-compatible credentials.

Set:

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

## 4. Configure Gmail OAuth

Origami currently asks for these effective Gmail capabilities:

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

Callback URL:

- local: `http://localhost:3000/api/oauth/gmail`
- production: `https://your-domain/api/oauth/gmail`

## 5. Configure Outlook OAuth

Origami currently requests these Outlook scopes:

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.Send`
- `offline_access`

Callback URL:

- local: `http://localhost:3000/api/oauth/outlook`
- production: `https://your-domain/api/oauth/outlook`

## 6. Configure QQ Mail

QQ support is currently **read-only via IMAP**.

Users must provide:

- QQ mail address
- QQ IMAP authorization code

There are no app-level QQ environment variables.

## 7. Local development flow

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

Then:

1. open `http://localhost:3000`
2. sign in with `ACCESS_TOKEN`
3. open `/accounts`
4. connect Gmail / Outlook / QQ

## 8. Vercel deployment flow

### Recommended steps

1. Import the repository into Vercel
2. Add all required environment variables
3. Set `NEXT_PUBLIC_APP_URL` to the final production URL
4. Initialize the target database with `npm run db:migrate`
5. Deploy

### Scheduled sync

`vercel.json` schedules:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

The route expects:

```http
Authorization: Bearer <CRON_SECRET>
```

## 9. Production verification checklist

- `/login` is reachable
- valid `ACCESS_TOKEN` unlocks the app
- `/accounts` loads correctly
- Gmail OAuth callback works
- Outlook OAuth callback works
- QQ account can be added
- manual sync works
- `/api/cron/sync` accepts the correct bearer secret
- attachments download correctly
- compose works for Gmail / Outlook
- `audit:prod` reports zero production vulnerabilities

## 10. Known deployment caveats

- QQ sending is not implemented
- triage state stays local to Origami
- Outlook compose is currently limited to single attachments smaller than 3 MB
- provider callback URLs must exactly match the configured app URL
