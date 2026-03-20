# Scripts

This folder contains small project helpers that are not part of the app runtime.

## Layout

- `db/` — database setup / schema utility scripts
- `bench/` — local benchmark and seeding helpers

## Current scripts

- `db/push.mjs` — Neon/PostgreSQL schema bootstrap / push path used by `npm run db:setup` and `npm run db:push`
- `bench/seed-search-benchmark.mjs` — seed a local database for inbox search benchmarks

These scripts are intentionally kept outside `src/` because they are operational helpers, not runtime application code.
