# Deployment

This page describes the **standard production deployment flow** for Origami.

The default scenario is:

- single instance
- single owner
- public internet access
- Vercel + Turso + Cloudflare R2

If you just want the fastest path to a working deployment, start with:

- [Quick Start](/en/quick-start)

If you want local development, debugging, or code changes, read instead:

- [Development](/en/development)

## Who this page is for

This page is better for people who:

- are already preparing a real production deployment and do not just want the shortest path
- want to understand the critical configuration points before deployment
- are worried about missing one detail in OAuth callbacks, environment variables, or object storage
- want to understand *why* things are configured this way, not just copy commands blindly

## Recommended deployment order

A practical order is:

1. decide the final production domain first
2. prepare Turso / R2 / GitHub OAuth / Gmail OAuth / Outlook OAuth
3. fill environment variables and run `npm run db:setup`
4. deploy the project to Vercel
5. complete first sign-in, initialization, mailbox onboarding, and go-live checks

## Production baseline

Recommended stack:

- **Runtime:** Vercel
- **Database:** Turso / libSQL
- **Object storage:** Cloudflare R2
- **Sign-in:** GitHub OAuth App
- **Mailbox providers:** Gmail OAuth, Outlook OAuth, IMAP/SMTP

## Production domain

Choose the final production URL first, for example:

```txt
https://mail.example.com
```

Use the same domain in:

- `NEXT_PUBLIC_APP_URL`
- GitHub OAuth callback
- Gmail OAuth callback
- Outlook OAuth callback

**These four places must stay aligned.**

## Environment variables

### Required variables

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

### Variable groups at a glance

If you want a quicker way to sanity-check your config, group them like this:

- **App basics:** `NEXT_PUBLIC_APP_URL`, `ENCRYPTION_KEY`, `AUTH_SECRET`
- **Sign-in control:** `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_ALLOWED_LOGIN`
- **Database:** `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- **Attachment storage:** `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`
- **Scheduled jobs:** `CRON_SECRET`
- **Default mailbox OAuth apps (optional):** `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`

### Optional variables

If you want to use default OAuth apps directly, also add:

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

If you do not fill these four values, you can still create DB-managed OAuth apps inside `/accounts`.

## Production OAuth requirements

### GitHub OAuth App

Configure the GitHub OAuth App like this:

- **Homepage URL:** `https://mail.example.com`
- **Authorization callback URL:** `https://mail.example.com/api/better-auth/callback/github`

It is also strongly recommended to set:

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

That prevents somebody else from claiming the instance first.

### Gmail OAuth

The Google redirect URI should be:

```txt
https://mail.example.com/api/oauth/gmail
```

### Outlook OAuth

The Microsoft redirect URI should be:

```txt
https://mail.example.com/api/oauth/outlook
```

For click-by-click platform instructions, read:

- [GitHub Auth detailed setup](/en/github-auth)
- [Gmail OAuth detailed setup](/en/gmail-oauth)
- [Outlook OAuth detailed setup](/en/outlook-oauth)

## Database initialization

For a fresh production database, run:

```bash
npm install
npm run db:setup
```

Notes:

- `db:setup` is for a new environment
- `db:migrate` is mainly for replaying the historical migration chain
- `db:push` should only be used if you already know exactly what you are doing

## Vercel deployment flow

Recommended order:

1. import the repository into Vercel
2. configure production environment variables
3. bind the production domain
4. deploy the app
5. open the production URL and complete first sign-in

Inside Vercel, at minimum confirm that:

- Production environment variables are complete
- `NEXT_PUBLIC_APP_URL` uses the real production domain
- all OAuth callbacks have been updated to match it
- the correct branch is being built

## The 6 easiest ways to trip yourself up

1. **Configuring OAuth before you have decided the final domain**  
   Then one domain change later, GitHub / Google / Microsoft all have to be reworked.
2. **`NEXT_PUBLIC_APP_URL`, the browser URL, and provider callbacks do not match**  
   This is the most common source of authorization failures.
3. **Treating preview or temporary domains as the real production domain**  
   Preview deployments are great for testing, but bad as long-term production callbacks.
4. **Skipping `db:setup` in a fresh environment**  
   Start with `npm run db:setup` for new databases instead of reaching for `db:migrate` or `db:push` first.
5. **Using an R2 bucket / endpoint / key set that does not belong together**  
   These mistakes often stay hidden until you try attachments.
6. **Not doing a full end-to-end check right after deployment**  
   At minimum test sign-in, initialization, mailbox onboarding, sync, send, and attachment upload.

## Scheduled sync

`vercel.json` already defines the scheduled sync entrypoint:

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

Requests should send:

```http
Authorization: Bearer <CRON_SECRET>
```

In production, explicitly set `CRON_SECRET`. Do not rely on derived defaults and assume both sides will match.

## First go-live flow

After deployment, open Origami on the production domain and complete this sequence:

1. sign in with GitHub
2. finish `/setup`
3. open `/accounts`
4. add Gmail, Outlook, or IMAP/SMTP accounts
5. run the first sync
6. verify sending and attachment flows

## Production checklist

Before you really start using the instance, confirm:

- the production domain opens correctly
- GitHub sign-in returns to `/setup` or the home page
- `/accounts` loads normally
- Gmail OAuth authorizes and returns correctly
- Outlook OAuth authorizes and returns correctly
- IMAP/SMTP accounts can be added
- sync runs successfully
- attachments upload and download correctly
- compose / sending works
- scheduled sync can reach `/api/cron/sync`

## What to do on day one after launch

1. complete one full owner sign-in to confirm GitHub sessions work
2. connect at least one real mailbox account in `/accounts`
3. run one manual sync and confirm mail is received
4. send one test message and confirm the send path works
5. upload and download one attachment to confirm the R2 path works
6. observe one scheduled sync hitting `/api/cron/sync`

## Release validation

Before release, run:

```bash
npm run verify
```

That covers:

- lint
- typecheck
- tests
- app build
- docs build

## Upgrade notes

If you are upgrading an existing instance:

- keep the existing migration chain
- prefer `db:setup` for new environments
- if you change OAuth apps, re-authorize affected accounts
- if the domain changes, update all callbacks and environment variables together

## Related pages

For production deployment, continue in this order:

1. [Quick Start](/en/quick-start)
2. [Turso database detailed setup](/en/turso)
3. [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
4. [GitHub Auth detailed setup](/en/github-auth)
5. [Gmail OAuth detailed setup](/en/gmail-oauth)
6. [Outlook OAuth detailed setup](/en/outlook-oauth)

For local development and debugging, read:

- [Development](/en/development)
