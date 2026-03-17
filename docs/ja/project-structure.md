# プロジェクト構成

このページの目的は、機能を変えたいときに**どこから読めばよいか**を素早く判断できるようにすることです。

## ルート構成

```text
.
├── docs/
├── drizzle/
├── scripts/
├── src/
├── .env.example
├── drizzle.config.ts
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── vercel.json
└── ...
```

## なぜルートが「散らかっている」わけではないのか

多くは Next.js / Vercel / TypeScript の標準設定ファイルです。
実際の業務ロジックは主に次へ集中しています。

- `src/`
- `docs/`
- `drizzle/`
- `scripts/`

## `scripts/`

```text
scripts/
├── README.md
├── bench/
└── db/
```

運用補助スクリプトを root に散らさず、目的別に分けています。

## `src/`

```text
src/
├── app/
├── components/
├── config/
├── hooks/
├── lib/
└── proxy.ts
```

## 機能ごとの入口

### Inbox

- `src/app/(app)/page.tsx`
- `src/components/inbox/*`
- `src/app/actions/email.ts`
- `src/lib/queries/emails.ts`

### Accounts / OAuth apps

- `src/app/(app)/accounts/page.tsx`
- `src/app/actions/account.ts`
- `src/app/actions/oauth-apps.ts`
- `src/components/accounts/*`
- `src/lib/oauth-apps.ts`

### Sync

- `src/app/actions/sync.ts`
- `src/lib/services/sync-service.ts`
- `src/lib/providers/*`

### Compose / sent history

- `src/app/(app)/compose/page.tsx`
- `src/components/compose/*`
- `src/app/actions/send.ts`
- `src/lib/queries/sent-messages.ts`
