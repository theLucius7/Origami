# 開発とデバッグ

このページでは **Origami のローカル開発、デバッグ、コントリビュート作業** を扱います。

本番導入手順ではありません。本番運用をしたい場合は先に次を読んでください。

- [クイックスタート](/ja/quick-start)
- [デプロイ](/ja/deployment)

## このページが向いているケース

次のような目的なら、このページを読むのが一番早いです。

- `localhost` で Origami を動かしたい
- UI やバックエンド挙動、schema を変更したい
- OAuth callback をデバッグしたい
- migration、テスト、build を検証したい
- コードやドキュメントに貢献したい

## ローカル環境要件

- Node.js 22+
- npm
- 開発用 Neon / PostgreSQL データベース
- 開発用 Cloudflare R2 バケット
- ローカル専用 GitHub OAuth App
- 必要に応じて Gmail / Outlook 開発用 OAuth app

## ローカル環境変数の例

本番シークレットは使い回さず、必ず開発用の設定を分けてください。

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login

ENCRYPTION_KEY=64-char-hex-key
AUTH_SECRET=64-char-hex-key
CRON_SECRET=64-char-hex-key

DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami_dev?sslmode=require

R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-dev
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

整理して覚えるなら、次の 5 グループに分けるとわかりやすいです。

- **アプリ基本設定**：`NEXT_PUBLIC_APP_URL`、`ENCRYPTION_KEY`、`AUTH_SECRET`
- **GitHub ログイン**：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`GITHUB_ALLOWED_LOGIN`
- **データベース**：`DATABASE_URL`
- **添付保存**：`R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET_NAME`、`R2_ENDPOINT`
- **定期実行**：`CRON_SECRET`

## ローカル OAuth callback

### GitHub

```txt
http://localhost:3000/api/better-auth/callback/github
```

### Gmail

```txt
http://localhost:3000/api/oauth/gmail
```

### Outlook

```txt
http://localhost:3000/api/oauth/outlook
```

できれば本番用ではなく、ローカル専用の OAuth app を用意してください。

## インストールと起動

```bash
cp .env.local.example .env
npm install
npm run db:setup
npm run dev
```

既定 URL：

- `http://localhost:3000`

初回セットアップ時は、次の順で確認すると楽です。

1. `npm install` が成功する
2. `.env` に開発用設定が入っている
3. `npm run db:setup` が成功する
4. `npm run dev` 後に `http://localhost:3000` が開く
5. GitHub ログイン、ローカル OAuth callback、主要ページが動く

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

使い分けの目安：

- 新規開発 DB なら `db:setup`
- migration チェーンを検証したいときだけ `db:migrate`
- `db:push` は影響を理解している場合のみ

## デバッグ時の確認ポイント

### OAuth callback が壊れるとき

先に確認するもの：

- `NEXT_PUBLIC_APP_URL`
- OAuth provider 側の callback URL
- 現在使っているローカルポート
- client ID / secret が開発用のものか

### データベース接続が怪しいとき

先に確認するもの：

- `DATABASE_URL`
- 現在の DB に `db:setup` を実行済みか

### 添付アップロードが壊れるとき

先に確認するもの：

- `R2_BUCKET_NAME`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

## ローカル開発でよくある落とし穴

1. **本番用 OAuth app をそのまま `localhost` で使う**  
   callback URL が崩れやすく、本番設定まで巻き込んで壊しがちです。
2. **`.env.local.example` を `.env` にコピーせず起動する**  
   ページが開いても、重要な機能はまだ使えないことがあります。
3. **開発 DB と本番 DB を混ぜる**  
   schema 変更や migration 検証中だとかなり危険です。
4. **R2 を中途半端に設定して、添付アップロード時に初めて壊れる**  
   ストレージの問題は後半まで見えないことが多いです。
5. **ローカルポートを変えたのに callback URL を更新しない**  
   認可画面は開いても、戻りだけ失敗します。

## コミット前の推奨

最低でも次を実行してください。

```bash
npm run verify
```

ドキュメントだけを変更した場合でも、少なくとも次は実行してください。

```bash
npm run docs:build
```
