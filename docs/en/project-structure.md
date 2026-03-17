# Project Structure

This page helps you answer one question quickly:

> if I want to change a feature, where should I start looking?

## Repository root

```text
.
├── docs/
├── drizzle/
├── scripts/
├── src/
├── .env.example
├── drizzle.config.ts
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── vercel.json
└── ...
```

## Why the root is not actually “messy”

Most files at the root are standard config files for a modern Next.js + Vercel + TypeScript project.
The real business code is still concentrated in:

- `src/`
- `docs/`
- `drizzle/`
- `scripts/`

## `scripts/`

```text
scripts/
├── README.md
├── bench/
└── db/
```

These are operational helpers, not runtime app code.

## `src/`

```text
src/
├── app/
├── components/
├── config/
├── hooks/
├── lib/
└── proxy.ts
```

## Where to look by feature

### Inbox behavior

- `src/app/(app)/page.tsx`
- `src/components/inbox/*`
- `src/app/actions/email.ts`
- `src/lib/queries/emails.ts`
- `src/lib/services/email-service.ts`

### Account onboarding / OAuth apps

- `src/app/(app)/accounts/page.tsx`
- `src/app/actions/account.ts`
- `src/app/actions/oauth-apps.ts`
- `src/components/accounts/*`
- `src/lib/oauth-apps.ts`

### Sync

- `src/app/actions/sync.ts`
- `src/lib/services/sync-service.ts`
- `src/lib/providers/*`

### Compose / sent history

- `src/app/(app)/compose/page.tsx`
- `src/components/compose/*`
- `src/app/actions/send.ts`
- `src/lib/queries/sent-messages.ts`

## Why `drizzle/` still has many migrations

Because that directory preserves the project’s upgrade history.
For new setups you can mostly ignore that history and use `npm run db:setup`.
