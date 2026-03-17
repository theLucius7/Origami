---
layout: home

hero:
  name: Origami
  text: Unified inbox for Gmail, Outlook, and QQ
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
  - title: Local triage
    details: Done, Archive, and Snooze are stored locally and never written back to providers.
  - title: Minimal sending flow
    details: Compose and send new emails through Gmail and Outlook, with local sent history.
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
- **QQ Mail** — read only via IMAP

## What is intentionally local

Origami keeps several states inside its own database instead of pushing them back to the source mailbox:

- Done
- Archive
- Snooze
- Local sent-message history

This makes triage fast and provider-agnostic, but it also means those states only exist inside Origami.

## Read the docs

- [Architecture](./architecture.md)
- [Deployment](./deployment.md)
- [Project Structure](./project-structure.md)
