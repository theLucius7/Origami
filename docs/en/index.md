---
layout: home

hero:
  name: Origami
  text: A unified inbox for individuals and single-operator teams
  tagline: Aggregate Gmail, Outlook, and IMAP/SMTP mailboxes into one self-hosted workflow for reading, triage, sending, and sync.
  actions:
    - theme: brand
      text: Quick Start
      link: /en/quick-start
    - theme: alt
      text: Deployment
      link: /en/deployment
    - theme: alt
      text: GitHub
      link: https://github.com/theLucius7/Origami

features:
  - title: Unified inbox
    details: View multiple mailboxes in one timeline instead of bouncing between tabs and accounts.
  - title: Local-first triage
    details: Done, Archive, and Snooze stay local, while Read / Star can sync back per account.
  - title: Compose and sent history
    details: Send through Gmail, Outlook, and IMAP/SMTP accounts with local sent history.
  - title: Metadata-first sync
    details: Initial sync stays lightweight; bodies and attachments are fetched on demand.
  - title: OAuth app management
    details: Gmail and Outlook support both env-backed default apps and DB-managed apps.
  - title: Self-hosting friendly
    details: The production path is documented around Vercel, Neon PostgreSQL, and Cloudflare R2.
---

## Product scope

Origami is a **single-user unified inbox**.

It is not a helpdesk suite, and it does not try to clone every provider-specific mailbox feature. Its goal is narrower:

> give one operator a clear place to read, triage, search, send, and sync across multiple mailboxes.

Typical use cases include:

- personal multi-mailbox management
- indie developers, creators, and freelancers
- very small teams with a single operator
- self-hosters who want deployment and data control

## Core capabilities

### Mailbox integration

- Gmail (OAuth)
- Outlook (OAuth)
- QQ / 163 / 126 / Yeah / custom IMAP/SMTP

### Local productivity layer

Origami treats the following as local states:

- Done
- Archive
- Snooze
- Local sent history

This keeps cross-provider behavior more consistent.

### Selective write-back

For fields that are closer to native mailbox behavior:

- Read
- Star

Origami can sync them back per account. If a provider does not support it or the scope is missing, local actions still continue to work.

## Provider support

| Provider | Read | Send | Auth model | Write-back |
|---|---|---|---|---|
| Gmail | ✅ | ✅ | Google OAuth | Read / Star |
| Outlook | ✅ | ✅ | Microsoft OAuth | Read / Star |
| QQ | ✅ | ✅ | IMAP/SMTP auth code | Read / Star |
| Generic IMAP/SMTP | ✅ | ✅ | username + password / auth code | depends on IMAP flags |

## Where should I start?

If this is your first time opening the docs, do not read everything from top to bottom. Pick the path that matches your goal:

- **I want a working production instance as quickly as possible** → [Quick Start](/en/quick-start)
- **I want the full production path and do not want to miss details** → [Deployment](/en/deployment)
- **I am stuck in a third-party console and need click-by-click guidance** → [Neon PostgreSQL](/en/neon), [R2](/en/r2-storage), [GitHub Auth](/en/github-auth), [Gmail OAuth](/en/gmail-oauth), [Outlook OAuth](/en/outlook-oauth)
- **I want to run locally, change code, or debug OAuth** → [Development](/en/development)
- **I want to understand the app structure first** → [Architecture](/en/architecture) and [Project Structure](/en/project-structure)

## Recommended reading paths

### Path A: get to production quickly

1. [Quick Start](/en/quick-start)
2. [Deployment](/en/deployment)
3. Open the detailed platform guides only when you get stuck on a specific console

### Path B: full production deployment

1. [Deployment](/en/deployment)
2. [Neon PostgreSQL detailed setup](/en/neon)
3. [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
4. [GitHub Auth detailed setup](/en/github-auth)
5. [Gmail OAuth detailed setup](/en/gmail-oauth)
6. [Outlook OAuth detailed setup](/en/outlook-oauth)
7. Return to [Quick Start](/en/quick-start) for final go-live checks

### Path C: local development and code changes

1. [Development](/en/development)
2. [Project Structure](/en/project-structure)
3. [Architecture](/en/architecture)

## Development docs

Local development, debugging, and contributor workflows are documented separately:

- [Development](/en/development)

## Further reading

- [FAQ](/en/faq)
- [Architecture](/en/architecture)
- [Project Structure](/en/project-structure)
