# クイックスタート

このページは **本番環境の最短導入手順** のみを説明します。

ローカル開発、デバッグ、コード修正を行う場合は、次を参照してください。

- [開発とデバッグ](/ja/development)

## 推奨構成

- **Runtime:** Vercel
- **Database:** Turso / libSQL
- **Attachment storage:** Cloudflare R2
- **Sign-in:** GitHub OAuth App
- **Mailbox providers:** Gmail OAuth, Outlook OAuth, IMAP/SMTP

## 事前に用意するもの

- 本番ドメイン（例: `mail.example.com`）
- Turso データベース
- Cloudflare R2 バケット
- Origami ログイン用 GitHub OAuth App
- 必要に応じて Gmail / Outlook OAuth app

`mail.example.com` は例です。実際の導入時には自分の本番ドメインに置き換えてください。

推奨順序:

1. [Turso データベースを作成](/ja/turso)
2. [Cloudflare R2 を設定](/ja/r2-storage)
3. [GitHub Auth を設定](/ja/github-auth)
4. [必要なら Gmail OAuth を設定](/ja/gmail-oauth)
5. [必要なら Outlook OAuth を設定](/ja/outlook-oauth)

## 1. 本番環境変数を準備する

```bash
cp .env.example .env
```

秘密値を生成します。

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

用途:

- `ENCRYPTION_KEY`
- `AUTH_SECRET`
- `CRON_SECRET`

本番用の最小例:

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com

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
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

必要なら追加:

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

## 2. 本番ドメインで OAuth を設定する

すべての OAuth callback URL は、最終的な本番ドメインと一致している必要があります。

### GitHub

- **Homepage URL:** `https://mail.example.com`
- **Authorization callback URL:** `https://mail.example.com/api/auth/github/callback`

### Gmail

```txt
https://mail.example.com/api/oauth/gmail
```

### Outlook

```txt
https://mail.example.com/api/oauth/outlook
```

詳細:

- [GitHub Auth 詳細設定](/ja/github-auth)
- [Gmail OAuth 詳細設定](/ja/gmail-oauth)
- [Outlook OAuth 詳細設定](/ja/outlook-oauth)

## 3. 依存関係を入れて DB を初期化する

```bash
npm install
npm run db:setup
```

新規 DB では `db:setup` が推奨です。

## 4. Vercel にデプロイする

1. リポジトリを Vercel に取り込む
2. 本番環境変数を設定する
3. 本番ドメインを紐付ける
4. デプロイする

## 5. リリース前チェックを実行する

```bash
npm run verify
```

## 6. 初回ログインとセットアップを完了する

本番 URL を開き、次の流れを完了します。

1. GitHub でログイン
2. `/setup` を完了
3. `/accounts` を開く
4. Gmail、Outlook、IMAP/SMTP アカウントを追加
5. 同期結果を確認

## 次に読むページ

- [デプロイ](/ja/deployment)
- [開発とデバッグ](/ja/development)
