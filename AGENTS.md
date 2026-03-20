# AGENTS.md

## Repo snapshot
- Stack: Next.js 16 App Router + React 19 + TypeScript + Vitest + VitePress docs.
- Database stack: Neon PostgreSQL via `postgres` + `drizzle-orm/postgres-js`.
- Package manager: npm (`package-lock.json` committed).
- Main source lives under `src/`; docs live under `docs/`.

## Validation commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run docs:build`
- Full gate: `npm run verify`
- CI parity for dependency install: `npx -y npm@10.9.4 ci`

## Lockfile compatibility
- GitHub Actions currently installs with Node 22 / npm 10.9.4.
- If `package-lock.json` is regenerated with npm 11, CI `npm ci` may fail with missing optional peer entries under `@docsearch/js` (React 18 / `@types/react` nested packages).
- Regenerate the lockfile with `npx -y npm@10.9.4 install --package-lock-only` before pushing dependency changes.

## Useful testing notes
- Component tests run in Vitest `node` environment and often use `renderToStaticMarkup` instead of DOM interaction.
- Some provider tests intentionally emit `console.warn`/`stderr` lines for write-back failure scenarios; those logs are expected during tests.

## Repo-specific findings
- Inbox client state lives in `src/components/inbox/`. Batch optimistic updates should use shared helpers from `inbox-view-state.ts` to avoid stale state overwriting earlier changes.
- `SnoozeDialog` expects `onConfirm` to return a boolean success flag; only return `true` when the mutation actually succeeds so the dialog does not close on errors.
- `formatRelativeTime` is used widely in account/inbox surfaces; keep locale propagation explicit from UI components.
- Locale switching currently relies on cookie changes plus navigation/refresh behavior; avoid combining `router.replace()` and `router.refresh()` unless both are truly needed.
- Database runtime now expects `DATABASE_URL`; old `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` references should not be reintroduced in app code.
- Postgres clients are configured with `prepare: false` so Neon pooled connection strings work safely with `postgres` / PgBouncer.
- Drizzle PostgreSQL migrations now live under `drizzle/pg/`; the top-level `drizzle/` SQL files remain historical SQLite/libSQL migrations.
- Inbox search no longer relies on SQLite FTS tables; it uses PostgreSQL `to_tsvector` / `to_tsquery` with a functional GIN index.
- Docs navigation and setup guides now point to `/neon`; legacy `/turso` pages are compatibility stubs that redirect readers to the new Neon guidance.
- ESLint should ignore `docs/.vitepress/cache/**` because VitePress generates cache bundles that trip React hook rules.

## Current local workflow result
- `NODE_OPTIONS=--max-old-space-size=4096` may be needed in this sandbox for `npm run build` / `npm run verify` to avoid Next.js OOM during the build step.
- `npm run verify` passes locally as of 2026-03-20 after the Neon/PostgreSQL migration and the inbox/logout test fixes.
