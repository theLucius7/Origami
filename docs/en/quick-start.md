# Quick Start

This page covers the **shortest production path** only.

If your goal is local development, debugging, changing code, or validating OAuth callbacks, do not follow this page. Read instead:

- [Development](/en/development)

## What you will end up with

If you follow this page successfully, you should end up with:

- a publicly reachable Origami instance
- a working GitHub owner sign-in
- a usable Neon Postgres database
- a working Cloudflare R2 attachment store
- at least one mailbox account that can sync and send mail

## Recommended production stack

Origami is currently most stable in this production combination:

- **Runtime:** Vercel
- **Database:** Neon / PostgreSQL
- **Attachment storage:** Cloudflare R2
- **Sign-in:** GitHub OAuth App
- **Mailbox providers:** Gmail OAuth, Outlook OAuth, IMAP/SMTP

## 1-minute check before you start

Before you open all those third-party dashboards, confirm these four things first:

- you already know your **final production domain**, for example `mail.example.com`
- you are not going to treat a Vercel preview domain or temporary testing domain as the final production domain
- you intend to keep `NEXT_PUBLIC_APP_URL`, the GitHub callback, the Gmail callback, and the Outlook callback on the same final domain
- you are trying to deploy a real production instance, not a local development setup

## What you need before deployment

Prepare these first:

- a production domain such as `mail.example.com`
- a Neon Postgres database
- a Cloudflare R2 bucket
- a GitHub OAuth App for signing in to Origami
- Gmail / Outlook OAuth apps if you need those providers

`mail.example.com` is only an example. Replace it with your real production domain everywhere.

Recommended setup order:

1. [Create the Neon Postgres database](/en/neon)
2. [Configure Cloudflare R2](/en/r2-storage)
3. [Configure GitHub Auth](/en/github-auth)
4. [Configure Gmail OAuth if needed](/en/gmail-oauth)
5. [Configure Outlook OAuth if needed](/en/outlook-oauth)

## 1. Prepare production environment variables

Create `.env` from the template:

```bash
cp .env.example .env
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the generated 64-character hex string into `ENCRYPTION_KEY` first. If you also want dedicated values for `AUTH_SECRET` and `CRON_SECRET`, generate separate random values for them too.

A minimum production example looks like this:

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login

ENCRYPTION_KEY=64-char-hex-key
AUTH_SECRET=64-char-hex-key
CRON_SECRET=64-char-hex-key

DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami?sslmode=require

R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

If you want Gmail / Outlook OAuth to work out of the box, also add:

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

## 2. Configure OAuth for the production domain

All OAuth callback URLs must use the **final production domain** and must stay aligned with `NEXT_PUBLIC_APP_URL`.

### GitHub sign-in

Configure the GitHub OAuth App with:

- **Homepage URL:** `https://mail.example.com`
- **Authorization callback URL:** `https://mail.example.com/api/better-auth/callback/github`

> Do not start with a temporary `https://xxx.vercel.app` URL and expect everything to “just follow along” later.
> If the production domain changes, the OAuth platform settings need to change too.

Then put the returned values into `.env`:

```txt
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

### Gmail (optional)

Use this redirect URI:

```txt
https://mail.example.com/api/oauth/gmail
```

### Outlook (optional)

Use this redirect URI:

```txt
https://mail.example.com/api/oauth/outlook
```

If you have not finished these yet, follow the detailed guides first:

- [GitHub Auth detailed setup](/en/github-auth)
- [Gmail OAuth detailed setup](/en/gmail-oauth)
- [Outlook OAuth detailed setup](/en/outlook-oauth)

## 3. Install dependencies and initialize the database

After filling your production environment variables, run:

```bash
npm install
npm run db:setup
```

For a fresh database, `db:setup` is the recommended entrypoint.

## 4. Deploy to Vercel

Recommended flow:

1. import the repository into Vercel
2. fill in the same production environment variables in the Vercel project
3. bind the production domain, for example `mail.example.com`
4. deploy

After deployment, confirm again that:

- `NEXT_PUBLIC_APP_URL` in Vercel is `https://mail.example.com`
- GitHub / Gmail / Outlook callbacks all use the same domain
- Neon, R2, and the application all belong to the same production configuration

If you want to catch obvious mistakes quickly, do these three checks immediately:

1. open `https://mail.example.com` and confirm it is not a 404 and not stale cached content
2. trigger one GitHub sign-in and confirm the return flow works
3. after sign-in, confirm `/setup` or the home page is not a blank page or a 500

## 5. Run the release validation

Before going live, at minimum run:

```bash
npm run verify
```

It runs:

- ESLint
- TypeScript type checking
- Vitest tests
- Next.js build
- docs build

## 6. Complete first sign-in and initialization

After deployment, open your production URL:

- `https://mail.example.com`

Then complete this flow:

1. sign in with GitHub
2. finish `/setup`
3. open `/accounts`
4. add Gmail, Outlook, or IMAP/SMTP accounts
5. return to the inbox and confirm mail has synced

## 7. Final go-live check

Before real usage, make sure at least these work:

- GitHub sign-in returns successfully to Origami
- `/setup` completes normally
- `/accounts` opens normally
- Gmail / Outlook OAuth can authorize and return
- IMAP/SMTP accounts can be added
- attachments can upload and download
- sync tasks run normally
- compose / sending works

## 5-minute troubleshooting

If you followed the steps above but still got stuck, check in this order:

### GitHub sign-in fails

Look at these four things first:

1. whether `NEXT_PUBLIC_APP_URL` matches the production domain in your browser
2. whether the GitHub OAuth App **Homepage URL** and **Authorization callback URL** match exactly
3. whether `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` come from the wrong environment, contain whitespace, or belong to an older app
4. whether `GITHUB_ALLOWED_LOGIN` was set to the wrong GitHub login

### Gmail / Outlook cannot return after authorization

Check these three things first:

1. whether the platform redirect URI uses the final production domain
2. whether `NEXT_PUBLIC_APP_URL` in the deployed environment already uses the production domain
3. whether you changed the domain but forgot to update the callback values in the provider console

### Attachment upload / download is broken

Check these four things first:

1. whether `R2_BUCKET_NAME` is really the bucket you created
2. whether `R2_ENDPOINT` uses the correct account endpoint
3. whether `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` belong to the same R2 account
4. whether the running deployment is still using an older environment variable set

### Fresh environment initialization fails

Check these three things first:

1. whether a brand-new database used `npm run db:setup` first
2. whether `DATABASE_URL` points to the correct production Neon database
3. whether you accidentally pointed production at a development database

## Next

If you want to keep improving the production deployment, continue in this order:

1. [Deployment](/en/deployment)
2. [Neon PostgreSQL detailed setup](/en/neon)
3. [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
4. [GitHub Auth detailed setup](/en/github-auth)
5. [Gmail OAuth detailed setup](/en/gmail-oauth)
6. [Outlook OAuth detailed setup](/en/outlook-oauth)

If you need local debugging or custom development, read:

- [Development](/en/development)
