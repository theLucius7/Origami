# FAQ

## Why recommend `db:setup` instead of `db:migrate`?

Because `db:setup` is the best path for a fresh environment.
It focuses on getting the current schema and required structures ready, instead of making new users care about the historical migration story.

## Why are Done / Archive / Snooze local-only?

Because they are productivity states, not portable mailbox semantics.
Keeping them local makes the model more stable and the UI more predictable.

## Why can Read / Star sync back?

Because those states are closer to native mailbox behavior and provide more obvious cross-client value.

## Why doesn't the global write-back toggle enable every account?

Because in Origami, “global” means **bulk setting**, not blind force-enable.
Some accounts can sync mail normally but still lack the provider capability or permission scope required for write-back.

Current behavior:

- turning **on** global read-back / star-back only affects accounts that are currently eligible for that capability
- turning **off** still applies to all accounts
- skipped accounts continue to show the reason on the Accounts page, such as missing re-authorization

This avoids the misleading state where the UI says write-back is enabled even though the provider can never execute it.

## Why do some messages disappear from Inbox after sync?

Usually that means Origami finally reconciled with the remote mailbox state.
If a message was deleted remotely or moved out of Inbox, Origami now removes it from the default Inbox list on the next sync cycle.

That is more accurate than keeping a stale local Inbox entry forever.
If the same message later returns to Inbox, it can appear again through normal sync.

## Is QQ send supported now?

Yes.
QQ is no longer a read-only edge case; it supports IMAP receive + SMTP send.

## Why is Origami single-user?

Because the project is intentionally optimized for one operator handling multiple inboxes.
That keeps deployment, auth, and maintenance lightweight.

## What should I check first if GitHub sign-in is not working?

Check these in order:

1. `NEXT_PUBLIC_APP_URL` matches the actual URL you are visiting
2. the GitHub OAuth App **Homepage URL** matches your app URL
3. the GitHub OAuth App **Authorization callback URL** is exactly:
   - `http://localhost:3000/api/auth/github/callback`
   - or `https://your-domain/api/auth/github/callback`
4. `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` are from the correct environment and have no copy-paste mistakes
5. for public deployments, `GITHUB_ALLOWED_LOGIN` is set as intended
6. if the installation was already claimed, you are signing in with the same GitHub account that owns the instance

Common cases:

- **callback error right after redirect**: usually a callback URL or secret mismatch
- **someone can see the login page but cannot enter**: often `GITHUB_ALLOWED_LOGIN` is doing its job
- **you renamed your GitHub login**: usually fine, because Origami stores the GitHub user id
- **the wrong owner claimed the instance**: you usually need to clear the `app_installation` record and initialize again

## Why store attachments in R2?

Because attachment binaries are large objects.
Keeping them outside the relational database reduces database pressure and keeps normal queries lighter.
