# Architecture

Origami is a **single-user, serverless unified inbox** built with Next.js 16 App Router.

Its runtime responsibilities are split across:

- **App Router pages** for rendering
- **Server Actions** in `src/app/actions/*` for internal mutations and reads used by the UI
- **Route Handlers** only where external callbacks or binary streams are needed
- **Queries / services / providers** in `src/lib/*` for data access and provider integration

## Runtime overview

```text
Browser
  -> Next.js Proxy
  -> App Router pages
  -> Server Actions / Route Handlers
  -> Drizzle ORM
  -> Turso

Binary attachments
  -> Cloudflare R2

Mail providers
  -> Gmail API
  -> Microsoft Graph
  -> QQ IMAP

Scheduled sync
  -> Vercel Cron
  -> /api/cron/sync
```

## Main flows

### 1. Authentication flow

Origami uses a **single `ACCESS_TOKEN`**.

1. The user visits `/login`
2. `POST /api/auth/login` verifies the token
3. The app stores `origami_token` as an `httpOnly` cookie
4. `src/proxy.ts` protects the rest of the app and most API routes

Public routes are limited to:

- `/login`
- `/api/auth/*`
- `/api/oauth/*`
- `/api/cron/*`

## 2. Inbox read flow

The inbox UI uses a mix of server-rendered page data and client-triggered Server Actions.

- `src/app/(app)/page.tsx` loads initial inbox data
- `src/lib/queries/emails.ts` builds filtered inbox queries
- `src/components/inbox/*` renders list and detail UI

Supported local filters include:

- `account:`
- `from:`
- `subject:`
- `is:read` / `is:unread`
- `is:starred` / `is:unstarred`
- `is:done` / `is:undone`
- `is:archived` / `is:active`
- `is:snoozed` / `is:unsnoozed`

Search is backed by:

- structured SQL filters
- SQLite FTS5 when full-text search is available
- `LIKE` fallback when FTS is unavailable

## 3. Sync flow

Sync is provider-driven but normalized through a shared `EmailProvider` interface in `src/lib/providers/types.ts`.

```text
Sync trigger
  -> syncAccountById / syncAllAccounts
  -> provider.syncEmails(cursor, { metadataOnly: true })
  -> persist emails into Turso
  -> upload attachments to R2
  -> update sync cursor + lastSyncedAt
```

Provider-specific cursors:

- **Gmail**: `historyId`
- **Outlook**: Graph delta / next link cursor
- **QQ**: IMAP UID

Initial sync is metadata-first. Full bodies and attachments can be hydrated later on demand.

## 4. Lazy body hydration

To reduce the first sync cost, Origami stores message metadata first and fetches the full body later when needed.

`src/lib/services/email-service.ts` handles this flow:

1. Open a message
2. If body is missing, call `provider.fetchEmail(remoteId)`
3. Persist full body + attachment metadata
4. Upload newly discovered attachments to R2

This keeps inbox sync fast while still allowing full message detail when the user opens a message.

## 5. Local triage model

Origami stores triage state in its own database:

- `local_done`
- `local_archived`
- `local_snooze_until`
- `local_labels`

Important: these local triage fields are **not written back** to Gmail, Outlook, or QQ.

Read / Star are handled separately: supported providers can opt into asynchronous write-back at the account level, while failures are treated as non-blocking best-effort sync.

That means Origami behaves like a local productivity layer on top of external inboxes, with selective mailbox-state synchronization where it is worth the complexity.

## 6. Sending flow

Origami currently supports **new outbound email** through Gmail, Outlook, and QQ.

```text
Compose form
  -> upload attachment to R2 (temporary compose object)
  -> sendMailAction()
  -> provider.sendMail()
  -> store local sent_messages record
  -> store sent_message_attachments metadata
```

Current behavior:

- Gmail: sends raw RFC 2822 MIME via Gmail API
- Outlook: sends JSON payload via Microsoft Graph `sendMail`
- QQ: sends via SMTP with the mailbox auth code

Current limitations:

- no thread-aware reply / forward flow
- no remote draft sync
- Outlook attachment path is limited to files smaller than 3 MB in the current implementation

## 7. Storage layout

### Turso / libSQL

Main tables:

- `accounts`
- `emails`
- `attachments`
- `compose_uploads`
- `sent_messages`
- `sent_message_attachments`

### Cloudflare R2

R2 stores:

- inbound attachment binaries
- temporary compose uploads
- sent attachment binaries referenced by local sent-message records

Clients never receive raw R2 object keys directly; downloads are proxied by the app.

## 8. Security boundaries

- Provider credentials are encrypted with **AES-256-GCM** before database storage
- OAuth client secrets stay server-side only
- QQ auth codes never ship to the client bundle
- `CRON_SECRET` protects scheduled sync
- Attachment access is mediated through database lookup + server streaming

## 9. Current scope

Origami currently focuses on:

- unified inbox reading
- local triage
- metadata-first sync
- minimal new-message sending
- self-hosted single-user deployment

It does **not** currently implement:

- provider write-back for Done / Archive / Snooze / labels
- QQ sending
- draft sync
- thread-aware replies / forwards
- multi-user roles or workspace features
