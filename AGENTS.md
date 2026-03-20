# AGENTS.md

## Repo snapshot
- Stack: Next.js 16 App Router + React 19 + TypeScript + Vitest + VitePress docs.
- Package manager: npm (`package-lock.json` committed).
- Main source lives under `src/`; docs live under `docs/`.

## Validation commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run docs:build`
- Full gate: `npm run verify`

## Useful testing notes
- Component tests run in Vitest `node` environment and often use `renderToStaticMarkup` instead of DOM interaction.
- Some provider tests intentionally emit `console.warn`/`stderr` lines for write-back failure scenarios; those logs are expected during tests.

## Repo-specific findings
- Inbox client state lives in `src/components/inbox/`. Batch optimistic updates should use shared helpers from `inbox-view-state.ts` to avoid stale state overwriting earlier changes.
- `SnoozeDialog` expects `onConfirm` to return a boolean success flag; only return `true` when the mutation actually succeeds so the dialog does not close on errors.
- `formatRelativeTime` is used widely in account/inbox surfaces; keep locale propagation explicit from UI components.
- Locale switching currently relies on cookie changes plus navigation/refresh behavior; avoid combining `router.replace()` and `router.refresh()` unless both are truly needed.

## Current local workflow result
- `npm run verify` passes locally as of 2026-03-20 after the inbox/session/compose fixes in the working tree.
