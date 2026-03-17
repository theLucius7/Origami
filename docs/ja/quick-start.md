# クイックスタート

このページは、Origami を最短で動かしたい人向けです。

## 前提条件

通常は以下が必要です。

- Node.js 22+
- Turso / libSQL データベース
- Cloudflare R2 バケット
- `ACCESS_TOKEN`
- Gmail / Outlook を使うなら対応する OAuth app

## 1. インストールと `.env` 作成

```bash
cp .env.example .env
npm install
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

生成した値を `ENCRYPTION_KEY` に入れ、残りの `.env` も埋めます。

## 2. 最低限必要な環境変数

- **App:** `NEXT_PUBLIC_APP_URL`, `ACCESS_TOKEN`, `CRON_SECRET`, `ENCRYPTION_KEY`
- **Database:** `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- **Storage:** `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`
- **Optional OAuth defaults:** `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`

## 3. データベース初期化

```bash
npm run db:setup
```

新規データベースではこれが推奨です。
履歴 migration を意図的に再生したい場合だけ `db:migrate` を使ってください。

## 4. ローカル起動

```bash
npm run dev
```

`http://localhost:3000` を開き、`ACCESS_TOKEN` でログインし、`/accounts` でアカウントを追加します。

## 5. リリース前の確認

```bash
npm run verify
```

lint、typecheck、test、app build、docs build をまとめて実行します。
