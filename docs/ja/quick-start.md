# クイックスタート

このページは、Origami を最短で動かしたい人向けです。

## 前提条件

通常は以下が必要です。

- Node.js 22+
- Turso / libSQL データベース
- Cloudflare R2 バケット
- Origami にログインするための GitHub OAuth App
- Gmail / Outlook を使うなら対応する OAuth app

## 1. インストールと `.env` 作成

```bash
cp .env.example .env
npm install
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

生成した値を `ENCRYPTION_KEY` に入れ、残りの `.env` も埋めます。

## 2. 最低限必要な環境変数

- **App:** `NEXT_PUBLIC_APP_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ENCRYPTION_KEY`
- **Recommended hardening:** `GITHUB_ALLOWED_LOGIN`, `AUTH_SECRET`, `CRON_SECRET`
- **Database:** `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
- **Storage:** `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`
- **Optional OAuth defaults:** `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `OUTLOOK_CLIENT_ID`, `OUTLOOK_CLIENT_SECRET`

## GitHub OAuth App の最小セットアップ

まだ GitHub OAuth App を作っていない場合は、次の設定が最短です。

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. 次を入力
   - **Application name**: `Origami Local` または `Origami Production`
   - **Homepage URL**: アプリの URL
   - **Authorization callback URL**: `<APP_URL>/api/auth/github/callback`
3. client secret を生成
4. `GITHUB_CLIENT_ID` と `GITHUB_CLIENT_SECRET` に設定
5. 個人用インスタンスなら `GITHUB_ALLOWED_LOGIN` に自分の GitHub login を入れる

ローカル開発の例：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
```

> 推奨: ローカル用と本番用で GitHub OAuth App を分けると、callback URL の管理がかなり楽になります。

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

`http://localhost:3000` を開き、GitHub でログインして `/setup` を完了し、その後 `/accounts` でアカウントを追加します。

## 5. リリース前の確認

```bash
npm run verify
```

lint、typecheck、test、app build、docs build をまとめて実行します。

## 次に読むページ

- 本番デプロイなら [デプロイ](/ja/deployment)
- ログインを堅く設定したいなら [GitHub Auth 詳細設定](/ja/github-auth)
- 添付保存をしっかり設定したいなら [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
- Gmail をもっと丁寧に設定したいなら [Gmail OAuth 詳細設定](/ja/gmail-oauth)
- Outlook をもっと丁寧に設定したいなら [Outlook OAuth 詳細設定](/ja/outlook-oauth)
