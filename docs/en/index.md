---
layout: home

hero:
  name: Origami
  text: A unified inbox for individuals and single-operator teams
  tagline: Aggregate Gmail, Outlook, and IMAP/SMTP mailboxes in one self-hosted workflow for triage, search, sync, and sending.
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
    details: View multiple mailboxes in one timeline instead of switching tabs and accounts.
  - title: Local-first triage
    details: Done, Archive, and Snooze stay local, while Read / Star can sync back per account.
  - title: Compose and sent history
    details: Send through Gmail, Outlook, and IMAP/SMTP accounts with local sent history.
  - title: Metadata-first sync
    details: Initial sync stays lightweight; bodies and attachments are fetched on demand.
  - title: OAuth app management
    details: Gmail and Outlook support both env-backed default apps and DB-managed apps.
  - title: Self-hosting friendly
    details: The documentation is organized around a production path using Vercel, Turso, and R2.
---

## Product scope

Origami is a **single-user unified inbox**.

It is not a helpdesk suite and it does not aim to reproduce every provider-specific mailbox feature. Its goal is narrower:

> give one operator a clear place to read, triage, search, send, and sync across multiple mailboxes.

## Provider support

| Provider | Read | Send | Auth model | Write-back |
|---|---|---|---|---|
| Gmail | ✅ | ✅ | Google OAuth | Read / Star |
| Outlook | ✅ | ✅ | Microsoft OAuth | Read / Star |
| QQ | ✅ | ✅ | IMAP/SMTP auth code | Read / Star |
| Generic IMAP/SMTP | ✅ | ✅ | username + password / auth code | depends on IMAP flags |

## Recommended reading order

For a production deployment, read in this order:

1. [Quick Start](/en/quick-start)
2. [Deployment](/en/deployment)
3. [Turso database detailed setup](/en/turso)
4. [Cloudflare R2 / bucket detailed setup](/en/r2-storage)
5. [GitHub Auth detailed setup](/en/github-auth)
6. [Gmail OAuth detailed setup](/en/gmail-oauth)
7. [Outlook OAuth detailed setup](/en/outlook-oauth)

## Development docs

Local development and debugging are documented separately:

- [Development](/en/development)

## Further reading

- [FAQ](/en/faq)
- [Architecture](/en/architecture)
- [Project Structure](/en/project-structure)
