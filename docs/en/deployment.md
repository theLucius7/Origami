# Deployment

Shortest path: fill `.env`, run `npm run db:setup`, deploy to Vercel, then connect accounts in `/accounts`.

## Recommended stack

- **Runtime:** Vercel
- **Database:** Turso / libSQL
- **Object storage:** Cloudflare R2
- **Providers:** Gmail API, Microsoft Graph, domestic IMAP/SMTP

## Environment variables

### App

| Variable | Required | Notes |
|---|---:|---|
| `NEXT_PUBLIC_APP_URL` | Yes | public app URL used in OAuth callbacks |
| `ACCESS_TOKEN` | Yes | single-user login token |
| `CRON_SECRET` | Yes | bearer token for `/api/cron/sync` |
| `ENCRYPTION_KEY` | Yes | 64-char hex AES-256-GCM key |

### Database

| Variable | Required | Notes |
|---|---:|---|
| `TURSO_DATABASE_URL` | Yes | Turso / libSQL URL |
| `TURSO_AUTH_TOKEN` | Yes | Turso token |

### Storage

| Variable | Required | Notes |
|---|---:|---|
| `R2_ACCESS_KEY_ID` | Yes | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 secret key |
| `R2_BUCKET_NAME` | Yes | attachment bucket |
| `R2_ENDPOINT` | Yes | S3-compatible endpoint |

### Optional default OAuth apps

| Variable | Required | Notes |
|---|---:|---|
| `GMAIL_CLIENT_ID` | No | default Gmail app |
| `GMAIL_CLIENT_SECRET` | No | default Gmail app |
| `OUTLOOK_CLIENT_ID` | No | default Outlook app |
| `OUTLOOK_CLIENT_SECRET` | No | default Outlook app |

## Database bootstrap

For a fresh database:

```bash
npm run db:setup
```

Alternative commands:

- `npm run db:migrate`
- `npm run db:push`

## OAuth setup

### Gmail scopes

- `gmail.modify`
- `gmail.send`
- `userinfo.email`

### Outlook scopes

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

## Production checklist

- login works with `ACCESS_TOKEN`
- `/accounts` loads
- OAuth callbacks work
- IMAP/SMTP accounts can be added
- sync works
- attachments upload/download correctly
- compose works
- `npm run verify` passes before deployment
