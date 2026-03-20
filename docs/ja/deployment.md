# デプロイ

このページでは **Origami の本番デプロイ標準手順** を説明します。

想定構成:

- 単一インスタンス
- 単一 owner
- 公開アクセス
- Vercel + Neon + Cloudflare R2

最短手順を見たい場合は、まず次を見てください。

- [クイックスタート](/ja/quick-start)

ローカル開発やデバッグ、コード変更をしたい場合は別ページです。

- [開発とデバッグ](/ja/development)

## このページが向いている人

次のような人には、このページの方が向いています。

- すでに本番投入を前提にしていて、最短手順だけでは不安
- デプロイ前に重要な設定ポイントをまとめて確認したい
- OAuth callback、環境変数、オブジェクトストレージのどれか一つを落として詰まりたくない
- ただコマンドを真似るだけではなく、なぜそうするのかも理解したい

## デプロイ順の全体像

実際には、次の順で進めると安定しやすいです。

1. 最終的な本番ドメインを決める
2. Neon / R2 / GitHub OAuth / Gmail OAuth / Outlook OAuth を準備する
3. 環境変数を埋めて `npm run db:setup` を実行する
4. Vercel にデプロイする
5. 初回ログイン、初期化、アカウント接続、上線チェックを行う

## 本番構成

- **Runtime:** Vercel
- **Database:** Neon / PostgreSQL
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

**この 4 つは必ず一致させてください。**

## 環境変数

### 必須変数

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login

ENCRYPTION_KEY=64-char-hex-key
AUTH_SECRET=64-char-hex-key
CRON_SECRET=64-char-hex-key

DATABASE_URL=postgresql://user:password@ep-example.ap-southeast-1.aws.neon.tech/origami?sslmode=require

R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### 変数グループの見取り図

設定漏れを早く見つけたいなら、次のように分けて考えると楽です。

- **アプリ基本**：`NEXT_PUBLIC_APP_URL`、`ENCRYPTION_KEY`、`AUTH_SECRET`
- **ログイン制御**：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`GITHUB_ALLOWED_LOGIN`
- **データベース**：`DATABASE_URL`
- **添付保存**：`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET_NAME`、`R2_ENDPOINT`
- **定期実行**：`CRON_SECRET`
- **既定のメール OAuth app（任意）**：`GMAIL_CLIENT_ID`、`GMAIL_CLIENT_SECRET`、`OUTLOOK_CLIENT_ID`、`OUTLOOK_CLIENT_SECRET`

### 任意変数

既定の OAuth app をそのまま使いたいなら、次も追加します。

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

この 4 つを入れなくても、`/accounts` 内で DB 管理の OAuth app を作成できます。

## 本番 OAuth 要件

### GitHub OAuth App

次のように設定します。

- **Homepage URL:** `https://mail.example.com`
- **Authorization callback URL:** `https://mail.example.com/api/better-auth/callback/github`

公開運用なら、次も強く推奨します。

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

他人に先に instance を claim されるのを避けやすくなります。

### Gmail OAuth

Google の redirect URI:

```txt
https://mail.example.com/api/oauth/gmail
```

### Outlook OAuth

Microsoft の redirect URI:

```txt
https://mail.example.com/api/oauth/outlook
```

クリック単位で追いたい場合は次を見てください。

- [GitHub Auth 詳細設定](/ja/github-auth)
- [Gmail OAuth 詳細設定](/ja/gmail-oauth)
- [Outlook OAuth 詳細設定](/ja/outlook-oauth)

## DB 初期化

新規本番 DB では次を実行します。

```bash
npm install
npm run db:setup
```

補足：

- `db:setup` は新環境向け
- `db:migrate` は履歴 migration をたどりたいとき向け
- `db:push` は影響を理解している場合だけ使うべき

## Vercel デプロイ手順

推奨順序：

1. リポジトリを Vercel に取り込む
2. 本番環境変数を設定する
3. 本番ドメインを設定する
4. デプロイする
5. 本番 URL を開いて初回ログインを行う

Vercel では最低でも次を確認してください。

- Production 環境変数が埋まっている
- `NEXT_PUBLIC_APP_URL` が本番ドメインになっている
- OAuth callback がすべて更新されている
- 正しいブランチを build している

## つまずきやすい 6 つの点

1. **最終ドメインが決まる前に OAuth を設定してしまう**  
   後でドメインが変わると GitHub / Google / Microsoft を全部やり直すことになります。
2. **`NEXT_PUBLIC_APP_URL`、ブラウザ URL、provider callback が揃っていない**  
   これは認可失敗の最頻出パターンです。
3. **preview や一時ドメインをそのまま本番 callback に使う**  
   テストには便利でも、本番 callback としては長期的に不安定です。
4. **新規 DB で `db:setup` を先に実行しない**  
   まっさらな環境なら `db:migrate` や `db:push` より先に `db:setup` です。
5. **R2 の bucket / endpoint / key が同じ構成に属していない**  
   添付を触るまで気付かないことが多いです。
6. **デプロイ直後に end-to-end 確認をしない**  
   最低でもログイン、初期化、アカウント接続、sync、send、添付 upload を通してください。

## 定期同期

`vercel.json` では `/api/cron/sync` が定義されています。

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

本番環境では次のヘッダーを使います。

```http
Authorization: Bearer <CRON_SECRET>
```

`CRON_SECRET` は明示設定を推奨します。派生値に頼って、片側だけ違う状態にしない方が安全です。

## 初回上線フロー

デプロイ後、正式ドメインで Origami を開き、次の順で進めます。

1. GitHub でログイン
2. `/setup` を完了
3. `/accounts` を開く
4. Gmail、Outlook、IMAP/SMTP アカウントを追加
5. 初回同期を実行
6. 送信と添付の流れを確認

## 本番チェックリスト

本格運用前に、次を確認してください。

- 本番ドメインでアクセスできる
- GitHub ログイン後に `/setup` またはホームへ戻る
- `/accounts` が正常に開く
- Gmail OAuth が認可して戻る
- Outlook OAuth が認可して戻る
- IMAP/SMTP アカウントを追加できる
- 同期が動作する
- 添付の upload / download が正常
- compose / send が動作する
- `/api/cron/sync` が呼べる

## 上線初日にやっておくと良いこと

1. owner アカウントで一度フルログインして GitHub session を確認する
2. `/accounts` に少なくとも 1 つ実メールアカウントを接続する
3. 手動同期を 1 回実行して受信を確認する
4. テストメールを 1 通送って送信経路を確認する
5. 添付を 1 つ upload / download して R2 経路を確認する
6. 定期同期が `/api/cron/sync` に当たるのを 1 回観察する

## リリース前検証

```bash
npm run verify
```

このコマンドで次を確認できます。

- lint
- typecheck
- tests
- app build
- docs build

## アップグレード時の注意

既存インスタンスを更新する場合は：

- 既存 migration チェーンは保持する
- 新環境には `db:setup` を優先する
- OAuth app を変えたら対象アカウントを再認可する
- ドメインを変えたら callback と環境変数をまとめて更新する

## 関連ページ

本番導入を続けるなら次の順がおすすめです。

1. [クイックスタート](/ja/quick-start)
2. [Neon PostgreSQL 詳細設定](/ja/neon)
3. [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
4. [GitHub Auth 詳細設定](/ja/github-auth)
5. [Gmail OAuth 詳細設定](/ja/gmail-oauth)
6. [Outlook OAuth 詳細設定](/ja/outlook-oauth)

ローカル開発やデバッグは次を見てください。

- [開発とデバッグ](/ja/development)
