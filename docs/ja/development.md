# 開発とデバッグ

このページは **Origami のローカル開発、デバッグ、コントリビュート作業** を対象にしています。

本番導入手順ではありません。

本番導入は次を参照してください。

- [クイックスタート](/ja/quick-start)
- [デプロイ](/ja/deployment)

## ローカル要件

- Node.js 22+
- npm
- 開発用 Turso / libSQL データベース
- 開発用 Cloudflare R2 バケット
- ローカル専用 GitHub OAuth App
- 必要なら Gmail / Outlook 開発用 OAuth app

## ローカル環境変数例

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login

ENCRYPTION_KEY=64-char-hex-key
AUTH_SECRET=64-char-hex-key
CRON_SECRET=64-char-hex-key

TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...

R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-dev
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

## ローカル OAuth callback

- GitHub: `http://localhost:3000/api/auth/github/callback`
- Gmail: `http://localhost:3000/api/oauth/gmail`
- Outlook: `http://localhost:3000/api/oauth/outlook`

## インストールと起動

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

既定 URL:

- `http://localhost:3000`

## よく使うコマンド

```bash
npm run dev
npm run test
npm run lint
npm run build
npm run docs:build
npm run verify
```

## DB コマンド

```bash
npm run db:setup
npm run db:migrate
npm run db:push
```

新規開発 DB では `db:setup` を推奨します。

## デバッグ時の確認項目

- `NEXT_PUBLIC_APP_URL`
- OAuth callback URL
- Turso 資格情報
- R2 資格情報
- `.env` が本番用ではなく開発用か

## コミット前の推奨

最低でも次を実行してください。

```bash
npm run verify
```

ドキュメントのみ変更した場合は、最低でも次を実行してください。

```bash
npm run docs:build
```
