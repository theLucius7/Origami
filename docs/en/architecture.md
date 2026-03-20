# Architecture

This page describes **the architecture already implemented in Origami today**, not a future wish list.

## Runtime overview

```text
Browser
  -> Next.js Proxy
  -> App Router pages / Server Actions / Route Handlers
  -> Drizzle ORM
  -> Neon / PostgreSQL

Attachments
  -> Cloudflare R2

Providers
  -> Gmail API
  -> Microsoft Graph
  -> IMAP / SMTP

Scheduled Sync
  -> Vercel Cron
  -> /api/cron/sync
```

If you only want the simplest mental model first, think of Origami as four layers:

1. **Web app layer**: Next.js pages, Server Actions, and Route Handlers
2. **Business logic layer**: onboarding, sync, send, triage, and write-back logic
3. **Provider adapter layer**: Gmail, Outlook, and IMAP/SMTP integrations
4. **Storage layer**: Neon PostgreSQL for structured data, R2 for attachment objects

## Core design principles

### 1. Single-user first

Origami does not introduce a complex user / role / organization model.
It is optimized for one operator handling multiple mailboxes.

### 2. Local productivity layer first

Origami does not try to force every triage field into every provider model.
That is why:

- Done / Archive / Snooze are local states
- Read / Star are optional write-back states

### 3. Metadata-first sync

Initial sync prioritizes:

- subject
- sender
- snippet
- receivedAt
- folder

Bodies and attachments are fetched later when the user actually opens the message.

## Runtime layers

### App Router pages

These handle routing and first-page rendering, such as:

- `/`
- `/accounts`
- `/compose`
- `/sent`

### Server Actions

These handle application-side mutations and reads, such as:

- loading email lists
- updating triage state
- sending mail
- managing accounts and OAuth apps

### Route Handlers

These are only used where Origami needs explicit HTTP endpoints, such as:

- OAuth callbacks
- attachment download
- scheduled sync entrypoints

## Account and provider model

Current provider types include:

- `gmail`
- `outlook`
- `qq`
- `imap_smtp`

Notes:

- `qq` is no longer just a read-only exception; it is effectively an IMAP/SMTP-backed provider with compatibility behavior
- `imap_smtp` is the general path for domestic and custom mailbox providers

## OAuth app resolution

For Gmail and Outlook, Origami currently supports:

- env-backed default apps
- DB-backed apps

Resolution order:

1. if an account has `oauth_app_id`, resolve the DB-managed app first
2. otherwise fall back to `default`
3. `default` then resolves from environment variables

This gives you:

- backward compatibility for older accounts
- isolation for newer accounts
- a path from env-only setup to DB-managed OAuth apps over time

## Sync flow

```text
Sync trigger
  -> syncSingleAccount / syncAllAccounts
  -> provider.syncEmails(cursor, { metadataOnly: true })
  -> persist emails into database
  -> upload discovered attachments to R2 (if needed)
  -> update cursor + lastSyncedAt
```

Different providers use different cursor semantics:

- Gmail: `historyId`
- Outlook: Graph delta / nextLink
- IMAP: UID or mailbox state progression

Important intentional behaviors in the sync model:

- Origami preserves remote `isRead` / `isStarred` whenever possible, so repeated sync does not reset mailbox state to defaults
- Outlook delta `@removed` tombstones are converted into a local `REMOTE_REMOVED` state, so messages deleted remotely or moved out of Inbox stop appearing in the default Inbox list
- if the same remote message later returns to Inbox, normal sync can make it visible again

## Email detail hydration

When the user opens a message detail page:

1. Origami reads local data first
2. if the body is missing, it calls `provider.fetchEmail(remoteId)`
3. it writes body / HTML / attachment metadata back into the database
4. if needed, it writes attachment objects to R2

This makes Origami behave more like “fast list first, lazy expansion later” instead of “download the world before showing anything”.

Origami also explicitly tracks runtime state such as:

- body hydration state (`pending` / `hydrated` / `failed`)
- the latest hydration error
- read-back / star-back state (`pending` / `success` / `failed`)

Those signals are aggregated on the Accounts page so you can tell whether an account is failing because of hydration, missing permissions, or write-back execution.

## Sending flow

```text
Compose form
  -> upload compose attachments
  -> send action
  -> provider.sendMail()
  -> persist local sent record
  -> persist sent attachment records
```

Current behavior:

- Gmail sends RFC 2822 / MIME raw
- Outlook sends Graph `sendMail` JSON payloads
- IMAP/SMTP accounts send through SMTP

## Storage split

### Neon / PostgreSQL

Stores:

- accounts
- oauth_apps
- emails
- attachment metadata
- compose uploads
- sent_messages
- sent_message_attachments

### Cloudflare R2

Stores:

- inbound attachment objects
- temporary compose uploads
- sent history attachment objects

## Security boundaries

- credentials are encrypted with **AES-256-GCM** before being stored
- OAuth client secrets stay server-side only
- attachment downloads go through the server, so raw object keys are not exposed to the browser
- `CRON_SECRET` protects the sync endpoint
- GitHub owner sessions protect app access
- mailbox OAuth callback state is signed and bound to the active session

## If you are reading code, what should you start with?

### To understand sign-in

Start with:

- GitHub OAuth routes and session logic
- `src/lib/session*`
- `src/lib/secrets*`

### To understand email sync

Start with:

- sync actions and routes
- `src/lib/services/sync-service.ts`
- `src/lib/providers/*`

### To understand sending and attachments

Start with:

- compose page and send action
- provider `sendMail` implementations
- R2 storage logic

## Deliberate non-goals for now

These are intentionally out of scope for the current product shape:

- multi-user collaboration roles
- provider write-back for every triage field
- full thread-aware reply / forward
- remote draft sync
- complete mailbox mirroring

Those are valuable features, but they also raise complexity a lot. Origami is currently optimized for one thing first:

> in a single-user setup, the core path should stay fast, stable, and maintainable.
