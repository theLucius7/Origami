# Project Structure

Origami uses a **hybrid Next.js App Router structure**:

- route files live in `src/app`
- shared UI lives in `src/components`
- business logic lives in `src/lib`
- runtime/config helpers live in `src/config`
- shared client hooks live in `src/hooks`

## Top-level source layout

```text
src/
├── app/
├── components/
├── config/
├── hooks/
├── lib/
└── proxy.ts
```

## `src/app/`

`src/app` contains route segments, layouts, API routes, and Server Actions.

```text
src/app/
├── (app)/
├── (auth)/
├── actions/
├── api/
├── globals.css
└── layout.tsx
```

### Important points

- `(app)` contains authenticated application pages
- `(auth)` currently contains the login route group
- `actions/` contains server actions such as account management, sync, email mutations, and send flow
- `api/` only exists for cases that need external callbacks or streaming

## `src/components/`

Components are grouped by function instead of being kept in one flat folder.

```text
src/components/
├── accounts/
├── compose/
├── inbox/
├── layout/
├── providers/
├── sent/
├── sync/
└── ui/
```

### Group responsibilities

- `accounts/` — account cards and account-adding dialog
- `compose/` — compose entry link and compose form
- `inbox/` — inbox shell, mail list, mail detail, snooze dialog
- `layout/` — main sidebar shell
- `providers/` — app-level providers such as `ToastProvider`
- `sent/` — sent-message list and detail views
- `sync/` — sync buttons
- `ui/` — shadcn/ui primitives

## `src/config/`

Centralized runtime and provider configuration.

```text
src/config/
├── db.ts
├── env.ts
├── providers.server.ts
├── providers.ts
└── r2.ts
```

### What lives here

- `env.ts` — required env lookup helper
- `db.ts` — Turso/libSQL connection config
- `r2.ts` — R2 client config
- `providers.ts` — provider labels/colors for UI
- `providers.server.ts` — OAuth/provider-specific server config

## `src/hooks/`

Currently used for app-level reusable client hooks.

```text
src/hooks/
└── use-toast.ts
```

## `src/lib/`

This is the main business-logic layer.

```text
src/lib/
├── db/
├── providers/
├── queries/
├── services/
├── account-providers.ts
├── actions.ts
├── auth.ts
├── crypto.ts
├── format.ts
├── r2.ts
└── ...
```

### Key subdirectories

#### `src/lib/db/`

- Drizzle schema
- Drizzle db client
- migration runner

#### `src/lib/providers/`

Provider implementations and provider-shared types:

- Gmail
- Outlook
- IMAP/SMTP provider + QQ compatibility wrapper
- MIME helpers
- provider interface definitions

#### `src/lib/queries/`

Read-oriented data access:

- accounts
- emails
- sent messages

#### `src/lib/services/`

Write / orchestration logic that is broader than a single query:

- sync orchestration
- lazy email hydration

## `src/proxy.ts`

Global request guard for the application.

It lets public auth and cron routes through, while protecting the main app with `ACCESS_TOKEN`.

## File-finding guide

### If you want to change inbox behavior

Look at:

- `src/app/(app)/page.tsx`
- `src/components/inbox/*`
- `src/app/actions/email.ts`
- `src/lib/queries/emails.ts`
- `src/lib/services/email-service.ts`

### If you want to change sync behavior

Look at:

- `src/app/actions/sync.ts`
- `src/lib/services/sync-service.ts`
- `src/lib/providers/*`

### If you want to change compose / sent flow

Look at:

- `src/app/(app)/compose/page.tsx`
- `src/components/compose/*`
- `src/app/actions/send.ts`
- `src/lib/providers/gmail.ts`
- `src/lib/providers/outlook.ts`

### If you want to change deployment/runtime config

Look at:

- `src/config/*`
- `.env.example`
- `vercel.json`
- `drizzle.config.ts`

## Why this structure exists

This layout is intentionally optimized for the current size of the project:

- shared UI is easier to find
- server actions stay close to the App Router layer
- data access and orchestration stay in `lib`
- provider/runtime config is centralized instead of being scattered across files

It is not a full feature-first monolith yet, but it is a strong middle ground for a growing Next.js app.
