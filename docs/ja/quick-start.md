# クイックスタート

このページは **本番環境の最短導入手順** だけを説明します。

ローカル開発、デバッグ、コード変更、OAuth callback の確認をしたい場合は、この手順を使わずに次を読んでください。

- [開発とデバッグ](/ja/development)

## このページを終えると何ができる？

この手順を最後まで進めると、次の状態を目指せます。

- インターネットからアクセスできる Origami 実例
- GitHub owner アカウントでのログイン
- 利用可能な Turso データベース
- 利用可能な Cloudflare R2 添付ストレージ
- 少なくとも 1 つ、同期と送信ができるメールアカウント

## 推奨構成

Origami が現在もっとも安定している本番構成は次です。

- **Runtime:** Vercel
- **Database:** Turso / libSQL
- **Attachment storage:** Cloudflare R2
- **Sign-in:** GitHub OAuth App
- **Mailbox providers:** Gmail OAuth, Outlook OAuth, IMAP/SMTP

## 始める前の 1 分確認

各種ダッシュボードを開く前に、次の 4 点だけ先に確認してください。

- **最終的な本番ドメイン** をすでに決めている（例: `mail.example.com`）
- Vercel preview ドメインや一時テスト URL を本番 OAuth 設定に使うつもりがない
- `NEXT_PUBLIC_APP_URL`、GitHub callback、Gmail callback、Outlook callback を同じ本番ドメインに揃えるつもりでいる
- 今やりたいのはローカル開発ではなく、本当に使える本番インスタンスの構築である

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

次で秘密値を生成します。

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

まず生成した 64 文字の 16 進文字列を `ENCRYPTION_KEY` に入れてください。`AUTH_SECRET` や `CRON_SECRET` を分けたい場合は、それぞれ別のランダム値を生成するのがおすすめです。

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

すべての OAuth callback URL は、**最終的な本番ドメイン** を使い、`NEXT_PUBLIC_APP_URL` と一致している必要があります。

### GitHub

- **Homepage URL:** `https://mail.example.com`
- **Authorization callback URL:** `https://mail.example.com/api/better-auth/callback/github`

> 最初に `https://xxx.vercel.app` のような一時 URL を入れて、後で自動的に追随してくれるだろうと期待しないでください。
> 本番ドメインが変わったら、OAuth 側も一緒に更新が必要です。

その後、次の値を `.env` に入れます。

```txt
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

### Gmail（任意）

```txt
https://mail.example.com/api/oauth/gmail
```

### Outlook（任意）

```txt
https://mail.example.com/api/oauth/outlook
```

まだこの設定が終わっていない場合は、先に詳細ページを読んでください。

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

デプロイ後は、次も確認してください。

- `NEXT_PUBLIC_APP_URL` が本番ドメインと一致している
- GitHub / Gmail / Outlook callback が同じドメインを使っている
- Turso、R2、アプリが同じ本番設定一式に属している

初回の明らかなミスを早く見つけるなら、次の 3 つをすぐ確認すると楽です。

1. `https://mail.example.com` を開いて 404 や古いキャッシュではないことを確認する
2. GitHub ログインを 1 回試して戻りが成功することを確認する
3. ログイン後に `/setup` かホームが blank / 500 ではないことを確認する

## 5. リリース前チェックを実行する

```bash
npm run verify
```

このコマンドでは次が実行されます。

- ESLint
- TypeScript 型チェック
- Vitest テスト
- Next.js build
- docs build

## 6. 初回ログインとセットアップを完了する

本番 URL を開き、次の流れを完了します。

- `https://mail.example.com`

1. GitHub でログイン
2. `/setup` を完了
3. `/accounts` を開く
4. Gmail、Outlook、IMAP/SMTP アカウントを追加
5. ホームへ戻って同期結果を確認

## 7. 最終上線チェック

本格運用前に、最低でも次を確認してください。

- GitHub ログインが Origami に戻る
- `/setup` を正常完了できる
- `/accounts` が開く
- Gmail / Outlook OAuth が認可して戻る
- IMAP/SMTP アカウントを追加できる
- 添付の upload / download が動く
- sync が動く
- compose / send が動く

## 5 分で確認するトラブルシュート

うまくいかない場合は、まず次の順で見てください。

### GitHub ログインが失敗する

1. `NEXT_PUBLIC_APP_URL` は今見ている本番ドメインか
2. GitHub OAuth App の **Homepage URL** と **Authorization callback URL** は完全一致しているか
3. `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` は別環境の値ではないか、空白混入や古い app の値ではないか
4. `GITHUB_ALLOWED_LOGIN` は正しい GitHub login か

### Gmail / Outlook の認可後に戻れない

1. provider 側 redirect URI は本番ドメインになっているか
2. デプロイ環境の `NEXT_PUBLIC_APP_URL` は本番ドメインに切り替わっているか
3. ドメイン変更後に provider 側 callback を直し忘れていないか

### 添付 upload / download が壊れている

1. `R2_BUCKET_NAME` は本当に作った bucket か
2. `R2_ENDPOINT` は正しい account endpoint か
3. `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` は同じ R2 account に属しているか
4. 実行中デプロイが古い環境変数を使っていないか

### 新規環境の初期化が失敗する

1. まっさらな DB で `npm run db:setup` を最初に実行したか
2. `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` は同じ DB のものか
3. 本番から誤って開発 DB を参照していないか

## 次に読むページ

本番導入をさらに詰めるなら、次の順で読むのがおすすめです。

1. [デプロイ](/ja/deployment)
2. [Turso データベース詳細設定](/ja/turso)
3. [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
4. [GitHub Auth 詳細設定](/ja/github-auth)
5. [Gmail OAuth 詳細設定](/ja/gmail-oauth)
6. [Outlook OAuth 詳細設定](/ja/outlook-oauth)

ローカル開発や独自改造が必要なら、次を読んでください。

- [開発とデバッグ](/ja/development)
