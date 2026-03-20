# FAQ

## Why recommend `db:setup` instead of `db:migrate`?

Because `db:setup` is a better default for a **fresh environment**. It means “build the current schema and make the required structures usable now”, not “make a new user replay the project’s entire historical evolution first”.

For most people deploying Origami for the first time, the goal is not to relive migration history. The goal is to get the current version working now.

## Why is `db:push` not the default recommendation for a fresh environment?

Because `db:push` is closer to a developer tool for cases where you already understand how the schema is changing.
It is useful during local development, but it is not the safest default entrypoint for a brand-new production setup.

If you are deploying a brand-new instance, start with:

```bash
npm run db:setup
```

Only consider `db:migrate` or `db:push` when you really understand the current database state, migration path, and trade-offs.

## Why are Done / Archive / Snooze local-only?

Because those states have very different semantics and implementations across providers.
Origami keeps them as **local productivity states** in exchange for:

- a more consistent user experience
- lower complexity
- more stable sync behavior

## Why can Read / Star sync back?

Because those fields are closer to native mailbox state and are more valuable to keep consistent across clients.
So Origami treats them as **optional capabilities**: sync back when possible, but do not block local actions when it is not.

## Why doesn't the global write-back toggle enable every account at once?

Because in Origami, “global” means **bulk setting**, not blind force-enable.
Some accounts can sync mail normally but still lack the provider capability or OAuth scope needed for write-back.

Current behavior:

- turning **on** global read-back / star-back only affects accounts that currently support it
- turning **off** can still apply to all accounts
- accounts that were skipped keep showing a reason on the Accounts page, such as requiring re-authorization

This avoids the misleading state where the UI says write-back is enabled even though the provider can never execute it.

## Why do some messages disappear from Inbox after sync?

Usually that does not mean the local app lost data. It means the remote mailbox state finally caught up locally.
If a message was deleted remotely or moved out of Inbox, Origami now removes it from the default Inbox list on the next sync cycle.

That is closer to real mailbox behavior than keeping stale Inbox entries forever.
If the same message later returns to Inbox, it can appear again in a later sync.

## Why is Origami single-user?

Because single-user is not “missing a feature”; it is one of the project’s core boundaries.
It keeps:

- the sign-in model lighter
- deployment simpler
- troubleshooting more direct
- documentation easier to follow

## What should I check first if GitHub sign-in is not working?

This order is usually fastest:

1. whether `NEXT_PUBLIC_APP_URL` is really the address you are visiting
2. whether the GitHub OAuth App **Homepage URL** matches the app URL
3. whether the GitHub OAuth App **Authorization callback URL** is exactly:
   - `http://localhost:3000/api/better-auth/callback/github`
   - or `https://your-domain/api/better-auth/callback/github`
4. whether `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` are wrong, copied with spaces, or from another environment
5. whether `GITHUB_ALLOWED_LOGIN` is set as intended for public deployment
6. if the instance was already claimed, whether you are signing in with the GitHub account that originally claimed the owner binding

Common cases:

- **callback error right after redirect**: usually a callback URL or client secret mismatch
- **someone can see the login page but cannot enter**: often `GITHUB_ALLOWED_LOGIN` is doing exactly what it should
- **you changed your GitHub username and worry that sign-in will break**: usually fine, because Origami binds the GitHub user id, not only the username string
- **the wrong owner claimed the instance**: usually you need to clear the `app_installation` record and initialize again

## Why must `NEXT_PUBLIC_APP_URL` and the OAuth callbacks use the same production domain?

Because both sign-in and mailbox authorization flows are fundamentally “leave your site, go to a third party, then come back to your site”.
If the address Origami thinks it is running on, the address in your browser, and the callback registered in the provider console are not the same domain, you will quickly run into things like:

- cannot return after sign-in
- callback URL mismatch
- authorization succeeds but the session does not line up
- preview environments work while production suddenly breaks

In short: **for production, keep the app URL and all callbacks on the same final domain whenever possible.**

## Can I start with a temporary Vercel preview domain and switch to a real domain later?

You *can* use preview deployments for testing, but it is **not a great production path**.
Once you change the real domain later, you usually also have to update:

- `NEXT_PUBLIC_APP_URL`
- the GitHub OAuth callback
- the Gmail OAuth redirect URI
- the Outlook OAuth redirect URI

If you only want to confirm that the UI boots, preview deployments are fine.
If you are about to connect real accounts, run OAuth flows, and store production data, it is much better to decide the final domain first.

## Is using multiple accounts and multiple OAuth apps going to be painful?

No.
Origami already supports:

- multiple mailbox accounts
- multiple Gmail / Outlook OAuth apps
- mixing env-backed default apps with DB-managed apps

## Do Gmail / Outlook OAuth apps have to live in environment variables?

Not necessarily.
The environment variables `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` and `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` are more like “default apps”.

If you do not set them, you can still manage DB-backed OAuth apps inside `/accounts`.
The practical difference is usually:

- **environment default app**: better when you already have one stable production config and want it to work immediately
- **DB-managed app**: better when you want to manage multiple apps inside the product or isolate configs per account

## Is QQ sending supported now?

Yes.
The current QQ path is IMAP receive + SMTP send, not the old read-only compatibility layer.

## Why store attachments in R2 instead of the database?

Because attachments are large binary objects.
Keeping them outside the relational database:

- reduces database pressure
- lowers backup and query overhead
- keeps body and metadata queries lighter

## If I only want the smallest possible deployment path, which pages should I read?

In this order:

1. [Home](/en/)
2. [Quick Start](/en/quick-start)
3. [Deployment](/en/deployment)

## If I want to understand the code entrypoints, where should I start?

Go straight to:

- [Project Structure](/en/project-structure)
- [Architecture](/en/architecture)
