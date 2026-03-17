# Architecture

This page describes the architecture already implemented in code today.

## Runtime overview

```text
Browser
  -> Next.js Proxy
  -> App Router pages / Server Actions / Route Handlers
  -> Drizzle ORM
  -> Turso / libSQL

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

## Design principles

### Single-user first

Origami is optimized for one operator managing multiple inboxes.
That keeps authentication, UI, deployment, and debugging much simpler.

### Local productivity layer first

Done / Archive / Snooze are local states.
Read / Star are optional write-back states.

### Metadata-first sync

Initial sync keeps inbox loading light by fetching metadata first and hydrating full content later.

## Account / provider model

Current provider types include:

- `gmail`
- `outlook`
- `qq`
- `imap_smtp`

QQ is now effectively an IMAP/SMTP-backed provider with compatibility behavior, not a read-only special case.

## OAuth app resolution

For Gmail and Outlook, Origami supports:

- env-backed default apps
- DB-backed apps

Resolution flow:

1. use `oauth_app_id` when present
2. otherwise fall back to `default`
3. `default` resolves from env

## Sync flow

```text
sync trigger
  -> syncSingleAccount / syncAllAccounts
  -> provider.syncEmails(cursor, { metadataOnly: true })
  -> persist metadata
  -> fetch and store binary data only when needed
  -> update cursor + lastSyncedAt
```

Important sync semantics:

- provider sync preserves remote `isRead` / `isStarred` whenever possible, so repeated sync does not reset mailbox state back to defaults
- Outlook delta `@removed` tombstones are converted into a local `REMOTE_REMOVED` state, so messages deleted remotely or moved out of Inbox stop appearing in the default Inbox list
- if the same remote message later returns to Inbox, normal sync can make it visible again

## Hydration and runtime state

Origami explicitly tracks:

- body hydration state (`pending` / `hydrated` / `failed`)
- the latest hydration error
- read-back / star-back state (`pending` / `success` / `failed`)

Those signals are aggregated on the Accounts page, so you can quickly tell whether an account is failing on body hydration, permission scope, or write-back execution.

## Sending flow

```text
Compose form
  -> upload compose attachments
  -> send action
  -> provider.sendMail()
  -> persist local sent record
```

- Gmail sends MIME raw
- Outlook sends Graph JSON payloads
- IMAP/SMTP accounts send through SMTP

## Storage split

### Turso / libSQL

Stores:

- accounts
- oauth_apps
- emails
- attachment metadata
- compose uploads
- sent history metadata

### Cloudflare R2

Stores:

- inbound attachment objects
- temporary compose uploads
- sent attachment objects

## Deliberate non-goals for now

- multi-user roles / workspaces
- provider write-back for every triage field
- full thread-aware reply / forward
- remote draft sync
- complete mailbox mirroring
