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
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth app client id |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth app client secret |
| `ENCRYPTION_KEY` | Yes | 64-char hex AES-256-GCM key |
| `GITHUB_ALLOWED_LOGIN` | No | optional allowed GitHub login |
| `AUTH_SECRET` | No | session signing secret; falls back to `ENCRYPTION_KEY` |
| `CRON_SECRET` | No | bearer token for `/api/cron/sync`; explicit value recommended |

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

## GitHub auth setup

Create a GitHub OAuth App for signing in to Origami itself.

### What to put into the GitHub OAuth App

In GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**:

- **Application name**: `Origami Local` / `Origami Production`
- **Homepage URL**: your app URL
- **Authorization callback URL**: `<APP_URL>/api/auth/github/callback`

Examples:

- Local
  - Homepage URL: `http://localhost:3000`
  - Callback URL: `http://localhost:3000/api/auth/github/callback`
- Production
  - Homepage URL: `https://mail.example.com`
  - Callback URL: `https://mail.example.com/api/auth/github/callback`

Then copy the generated values into:

```txt
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### Recommended GitHub auth patterns

#### Pattern A: one OAuth App for local development

Good for quick local testing:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

#### Pattern B: separate local and production apps (recommended)

Use different GitHub OAuth Apps for:

- local: `http://localhost:3000/api/auth/github/callback`
- production: `https://your-domain/api/auth/github/callback`

This keeps callback URLs and secret rotation cleaner.

#### Pattern C: public single-user deployment with `GITHUB_ALLOWED_LOGIN`

If the app is reachable from the public internet, set:

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

This prevents an unexpected user from claiming the installation first.

### First-owner binding notes

- The first successful allowed login becomes the installation owner
- Later logins are checked against the stored GitHub user id
- Renaming your GitHub login does not break access if it is still the same account

### Common pitfalls

- `NEXT_PUBLIC_APP_URL` must match the URL you configured in GitHub
- the callback URL must end with `/api/auth/github/callback`
- if you change domains, update both GitHub and your environment variables
- if you want auth signing independent from credential encryption, set `AUTH_SECRET`

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

## More detailed guides

If you want button-by-button instructions instead of the summary on this page, continue with:

- [GitHub Auth detailed setup](/en/github-auth)
- [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
- [Gmail OAuth detailed setup](/en/gmail-oauth)
- [Outlook OAuth detailed setup](/en/outlook-oauth)

## Production checklist

- GitHub sign-in reaches `/setup` or the app home successfully
- `/accounts` loads
- OAuth callbacks work
- IMAP/SMTP accounts can be added
- sync works
- attachments upload/download correctly
- compose works
- `npm run verify` passes before deployment
