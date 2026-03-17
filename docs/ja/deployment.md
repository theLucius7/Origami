# デプロイ

このページでは **Origami の本番デプロイ標準手順** を説明します。

想定構成:

- 単一インスタンス
- 単一 owner
- 公開アクセス
- Vercel + Turso + Cloudflare R2

最短手順は次から確認できます。

- [クイックスタート](/ja/quick-start)

ローカル開発やデバッグは別ページです。

- [開発とデバッグ](/ja/development)

## 本番構成

- **Runtime:** Vercel
- **Database:** Turso / libSQL
- **Object storage:** Cloudflare R2
- **Sign-in:** GitHub OAuth App
- **Mailbox providers:** Gmail OAuth, Outlook OAuth, IMAP/SMTP

## 本番ドメイン

まず最終的な本番 URL を決めてください。例:

```txt
https://mail.example.com
```

同じドメインを次に使います。

- `NEXT_PUBLIC_APP_URL`
- GitHub OAuth callback
- Gmail OAuth callback
- Outlook OAuth callback

これらは必ず一致させてください。

## 環境変数

本番用の必須例:

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

必要に応じて追加:

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

## OAuth 要件

### GitHub

- **Homepage URL:** `https://mail.example.com`
- **Authorization callback URL:** `https://mail.example.com/api/auth/github/callback`

公開運用では `GITHUB_ALLOWED_LOGIN` の設定を推奨します。

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

## DB 初期化

```bash
npm install
npm run db:setup
```

新規本番 DB では `db:setup` を使用してください。

## Vercel デプロイ手順

1. リポジトリを Vercel に取り込む
2. 本番環境変数を設定する
3. 本番ドメインを設定する
4. デプロイする
5. 初回ログインとセットアップを完了する

## 定期同期

`vercel.json` では `/api/cron/sync` が定義されています。

本番環境では次のヘッダーを使います。

```http
Authorization: Bearer <CRON_SECRET>
```

`CRON_SECRET` は明示設定を推奨します。

## 本番チェックリスト

- 本番ドメインでアクセスできる
- GitHub ログイン後に Origami へ戻る
- `/accounts` が開く
- Gmail OAuth が動作する
- Outlook OAuth が動作する
- IMAP/SMTP アカウントを追加できる
- 同期が動作する
- 添付の upload / download が正常
- compose が動作する
- `/api/cron/sync` を呼び出せる

## リリース前検証

```bash
npm run verify
```

## 関連ページ

- [クイックスタート](/ja/quick-start)
- [開発とデバッグ](/ja/development)
