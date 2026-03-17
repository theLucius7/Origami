---
layout: home

hero:
  name: Origami
  text: A unified inbox for individuals and single-operator teams
  tagline: Aggregate Gmail, Outlook, and domestic IMAP/SMTP mailboxes with a self-hosted, privacy-friendly workflow.
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
    details: See multiple mailboxes in one timeline instead of bouncing between tabs.
  - title: Local-first triage
    details: Done, Archive, and Snooze stay local, while Read / Star can optionally sync back.
  - title: Compose + sent history
    details: Send through Gmail, Outlook, and IMAP/SMTP accounts with a local sent history view.
  - title: Metadata-first sync
    details: Initial sync is lightweight; full bodies and attachments are fetched when needed.
  - title: OAuth app management
    details: Gmail and Outlook support both env-backed default apps and DB-managed apps.
  - title: Self-hosting friendly
    details: Designed around Vercel + Turso + R2 with explicit operational paths.
---

## What Origami is

Origami is a **single-user unified inbox**.
It is not a helpdesk platform, and it does not try to imitate every provider-specific mailbox feature.

Its goal is narrower and more practical:

> help one operator manage multiple email accounts in one place, with local productivity features and predictable deployment.

## Core capabilities

- Gmail, Outlook, QQ, and generic IMAP/SMTP mailbox support
- DB-backed and env-backed OAuth app management
- Local Done / Archive / Snooze model
- Optional Read / Star write-back
- Compose flow with attachment upload and local sent history
- Metadata-first sync with lazy detail hydration
- Scheduled sync via Vercel Cron

## Provider matrix

| Provider | Read | Send | Auth model | Write-back |
|---|---|---|---|---|
| Gmail | ✅ | ✅ | Google OAuth | Read / Star |
| Outlook | ✅ | ✅ | Microsoft OAuth | Read / Star |
| QQ | ✅ | ✅ | IMAP/SMTP auth code | Read / Star |
| Generic IMAP/SMTP | ✅ | ✅ | username + password / auth code | depends on IMAP flags |

## Recommended reading order

1. [Quick Start](/en/quick-start)
2. [Deployment](/en/deployment)
3. [FAQ](/en/faq)
4. [Architecture](/en/architecture)
5. [Project Structure](/en/project-structure)
