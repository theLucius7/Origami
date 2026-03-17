# Quick Start

This page covers the **production golden path only**.

If you need local development, debugging, or contributor workflows, read:

- [Development](/en/development)

## Recommended production stack

- **Runtime:** Vercel
- **Database:** Turso / libSQL
- **Attachment storage:** Cloudflare R2
- **App sign-in:** GitHub OAuth App
- **Mailbox providers:** Gmail OAuth, Outlook OAuth, IMAP/SMTP

## What you need before deployment

Prepare the following first:

- a production domain such as `mail.example.com`
- a Turso database
- a Cloudflare R2 bucket
- a GitHub OAuth App for signing in to Origami
- Gmail / Outlook OAuth apps if you need those providers

Replace `mail.example.com` with your real production domain everywhere.

Recommended setup order:

1. [Create the Turso database](/en/turso)
2. [Configure Cloudflare R2](/en/r2-storage)
3. [Configure GitHub Auth](/en/github-auth)
4. [Configure Gmail OAuth if needed](/en/gmail-oauth)
5. [Configure Outlook OAuth if needed](/en/outlook-oauth)

## 1. Prepare production environment variables

Create `.env` from the template:

```bash
cp .env.example .env
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use them for:

- `ENCRYPTION_KEY`
- `AUTH_SECRET`
- `CRON_SECRET`

Minimum production example:

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

## 2. Configure OAuth for the production domain

All OAuth callback URLs must use the final production domain and match `NEXT_PUBLIC_APP_URL`.

### GitHub

Configure the GitHub OAuth App with:

- **Homepage URL:** `https://mail.example.com`
- **Authorization callback URL:** `https://mail.example.com/api/auth/github/callback`

### Gmail

Use this redirect URI:

```txt
https://mail.example.com/api/oauth/gmail
```

### Outlook

Use this redirect URI:

```txt
https://mail.example.com/api/oauth/outlook
```

Detailed setup pages:

- [GitHub Auth detailed setup](/en/github-auth)
- [Gmail OAuth detailed setup](/en/gmail-oauth)
- [Outlook OAuth detailed setup](/en/outlook-oauth)

## 3. Install dependencies and initialize the database

```bash
npm install
npm run db:setup
```

For a fresh database, `db:setup` is the recommended path.

## 4. Deploy to Vercel

Recommended flow:

1. import the repository into Vercel
2. add the production environment variables
3. bind the production domain
4. deploy

After deployment, verify that:

- `NEXT_PUBLIC_APP_URL` matches the production domain
- GitHub / Gmail / Outlook callbacks all use the same domain
- Turso, R2, and the app belong to the same production configuration

## 5. Run the release check

```bash
npm run verify
```

## 6. Complete first sign-in and setup

Open your production URL and finish this flow:

1. sign in with GitHub
2. complete `/setup`
3. open `/accounts`
4. add Gmail, Outlook, or IMAP/SMTP accounts
5. return to the inbox and confirm sync works

## Next

- [Deployment](/en/deployment)
- [Development](/en/development)
