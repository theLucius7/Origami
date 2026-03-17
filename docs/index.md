---
layout: home

hero:
  name: Origami
  text: Unified inbox for Gmail, Outlook, and domestic IMAP/SMTP mailboxes
  tagline: Privacy-friendly, self-hostable, and built for a single-user workflow.
  actions:
    - theme: brand
      text: Quick Start
      link: /deployment
    - theme: alt
      text: Architecture
      link: /architecture
    - theme: alt
      text: GitHub
      link: https://github.com/theLucius7/Origami

features:
  - title: Unified inbox
    details: Aggregate recent inbox mail from multiple accounts into one timeline.
  - title: Local-first triage
    details: Done, Archive, and Snooze stay local to Origami, while Read / Star can optionally write back to supported providers.
  - title: Minimal sending flow
    details: Compose and send new emails through Gmail, Outlook, and IMAP/SMTP mailboxes, with local sent history.
  - title: OAuth app management
    details: Gmail and Outlook can use either env-backed default apps or DB-managed OAuth apps selected per account.
  - title: R2-backed attachments
    details: Large binary attachments stay in Cloudflare R2 while metadata lives in Turso.
  - title: Search syntax
    details: Use account:, from:, subject:, is:read, is:done, is:archived, and is:snoozed filters.
  - title: Self-hosting ready
    details: Designed for Vercel + Turso + R2, protected by a single ACCESS_TOKEN.
---

## What Origami is

Origami is a **single-user unified inbox**. It is not a shared team helpdesk and it does not try to fully mirror every mailbox feature.

Current provider support:

- **Gmail** — read + send
- **Outlook** — read + send
- **Domestic IMAP/SMTP mailboxes** — QQ / 163 / 126 / Yeah / custom, read via IMAP + send via SMTP

## What is intentionally local

Origami keeps several states inside its own database instead of pushing them back to the source mailbox:

- Done
- Archive
- Snooze
- Local sent-message history

Read / Star are different: for supported providers, they can optionally be written back when the corresponding account-level toggle is enabled.

This keeps the core triage model fast and provider-agnostic, while still allowing selected mailbox state to stay in sync when you want it.

## Read the docs

- [Architecture](./architecture.md)
- [Deployment](./deployment.md)
- [Project Structure](./project-structure.md)
