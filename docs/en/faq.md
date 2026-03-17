# FAQ

## Why recommend `db:setup` instead of `db:migrate`?

Because `db:setup` is the best path for a fresh environment.
It focuses on getting the current schema and required structures ready, instead of making new users care about the historical migration story.

## Why are Done / Archive / Snooze local-only?

Because they are productivity states, not portable mailbox semantics.
Keeping them local makes the model more stable and the UI more predictable.

## Why can Read / Star sync back?

Because those states are closer to native mailbox behavior and provide more obvious cross-client value.

## Is QQ send supported now?

Yes.
QQ is no longer a read-only edge case; it supports IMAP receive + SMTP send.

## Why is Origami single-user?

Because the project is intentionally optimized for one operator handling multiple inboxes.
That keeps deployment, auth, and maintenance lightweight.

## Why store attachments in R2?

Because attachment binaries are large objects.
Keeping them outside the relational database reduces database pressure and keeps normal queries lighter.
