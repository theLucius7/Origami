# アーキテクチャ

このページでは **Origami に現在実装済みの構成** を説明します。未来の理想図ではありません。

## 全体像

```text
Browser
  -> Next.js Proxy
  -> App Router Pages / Server Actions / Route Handlers
  -> Drizzle ORM
  -> Neon / PostgreSQL

Attachments
  -> Cloudflare R2

Providers
  -> Gmail API
  -> Microsoft Graph
  -> IMAP / SMTP

Scheduled Sync
  -> Vercel Cron
  -> /api/cron/sync
```

まず最小の心智モデルだけ掴むなら、Origami は次の 4 層だと考えるとわかりやすいです。

1. **Web アプリ層**：Next.js ページ、Server Actions、Route Handlers
2. **業務ロジック層**：アカウント管理、同期、送信、triage、write-back
3. **Provider 適配層**：Gmail / Outlook / IMAP/SMTP
4. **保存層**：Neon PostgreSQL が構造化データ、R2 が添付オブジェクト

## コア設計方針

### 1. 単一ユーザー優先

Origami は複雑なユーザー、ロール、組織モデルを持ち込みません。まずは一人のオペレーターが複数メールボックスを扱うことを最優先にしています。

### 2. ローカル生産性レイヤー優先

すべての triage 状態を provider ごとの意味に無理やり合わせないため、次のように分けています。

- Done / Archive / Snooze：ローカル状態
- Read / Star：任意 write-back 状態

### 3. metadata-first 同期

初回同期では次を優先して取得します。

- subject
- sender
- snippet
- receivedAt
- folder

本文と添付は、ユーザーが実際に開いたタイミングで取得します。

## 実行時の分層

### App Router ページ

ルーティングと初期表示を担当します。例：

- `/`
- `/accounts`
- `/compose`
- `/sent`

### Server Actions

アプリ内部の読み書きを担当します。例：

- メール一覧の取得
- triage 状態の更新
- 送信
- アカウントや OAuth app の管理

### Route Handlers

明示的な HTTP endpoint が必要なところだけに使います。例：

- OAuth callback
- 添付ダウンロード
- 定期同期エントリポイント

## アカウントと provider モデル

現在の provider タイプは主に次の 4 つです。

- `gmail`
- `outlook`
- `qq`
- `imap_smtp`

補足：

- `qq` はもう単なる読み取り専用の特例ではなく、互換処理付き IMAP/SMTP provider と考える方が近いです
- `imap_smtp` は国内メールやカスタムメールの共通入口です

## OAuth app 解決モデル

Gmail / Outlook では、Origami は次の 2 系統をサポートします。

- env 既定 app
- DB 管理 app

解決順序は次の通りです。

1. アカウントに `oauth_app_id` があれば、その DB 管理 app を優先
2. なければ `default`
3. `default` は環境変数から解決

この設計により：

- 既存アカウントを壊さずに互換性を保てる
- 新しいアカウントを app 単位で分離できる
- env-only 構成から DB 管理 app へ段階的に移行できる

## 同期フロー

```text
Sync trigger
  -> syncSingleAccount / syncAllAccounts
  -> provider.syncEmails(cursor, { metadataOnly: true })
  -> persist emails into database
  -> upload discovered attachments to R2 (if needed)
  -> update cursor + lastSyncedAt
```

provider ごとに cursor の意味は異なります。

- Gmail：`historyId`
- Outlook：Graph delta / nextLink
- IMAP：UID またはメールボックス状態の前進

同期モデルで意図的にそうしている挙動：

- 可能な限り remote の `isRead` / `isStarred` を保持し、再同期で既定値に戻さない
- Outlook delta の `@removed` tombstone はローカルの `REMOTE_REMOVED` 状態に変換されるため、remote で削除されたメールや Inbox 外へ移動したメールは既定 Inbox 一覧から消える
- 同じ remote message が後で Inbox に戻れば、通常同期で再表示できる

## メール詳細の hydration

ユーザーが詳細画面を開くと：

1. まずローカル DB を見る
2. 本文がなければ `provider.fetchEmail(remoteId)` を呼ぶ
3. 本文 / HTML / 添付メタデータを DB に書き戻す
4. 必要なら添付オブジェクトを R2 に保存する

つまり Origami は「まず軽い一覧、必要になったら詳細を後で補完する」設計です。

同時に、Origami は次のような実行時状態も明示的に記録します。

- 本文 hydration 状態（`pending` / `hydrated` / `failed`）
- 直近の hydration エラー
- Read / Star write-back 状態（`pending` / `success` / `failed`）

これらは Accounts ページに集約されるため、失敗原因が本文補完なのか、権限不足なのか、write-back 実行なのかを切り分けやすくなっています。

## 送信フロー

```text
Compose form
  -> upload compose attachments
  -> send action
  -> provider.sendMail()
  -> persist local sent record
  -> persist sent attachment records
```

現在の送信挙動：

- Gmail：RFC 2822 / MIME raw を送信
- Outlook：Graph `sendMail` JSON payload を送信
- IMAP/SMTP：SMTP で直接送信

## 保存先の分担

### Neon / PostgreSQL

保存するもの：

- accounts
- oauth_apps
- emails
- attachment metadata
- compose uploads
- sent_messages
- sent_message_attachments

### Cloudflare R2

保存するもの：

- 受信添付オブジェクト
- compose 一時アップロード
- sent history 用添付オブジェクト

## セキュリティ境界

- 認証情報は保存前に **AES-256-GCM** で暗号化
- OAuth client secret はサーバー側にのみ保持
- 添付ダウンロードはサーバープロキシ経由で行い、生の object key を公開しない
- `CRON_SECRET` が同期 endpoint を保護
- GitHub owner session がアプリのアクセスを保護
- メール OAuth callback state は署名され、現在の session に紐付く

## コードを読むなら、どこから入るべき？

### ログインを理解したいとき

先に見るもの：

- GitHub OAuth 関連 route と session ロジック
- `src/lib/session*`
- `src/lib/secrets*`

### 同期を理解したいとき

先に見るもの：

- 同期 action / route
- `src/lib/services/sync-service.ts`
- `src/lib/providers/*`

### 送信と添付を理解したいとき

先に見るもの：

- compose ページと send action
- provider の `sendMail` 実装
- R2 まわりの保存ロジック

## あえて今はやっていないこと

次の項目は、忘れているのではなく現時点では意図的にスコープ外です。

- マルチユーザー協調ロール
- すべての triage 項目の provider write-back
- 完全な thread-aware reply / forward
- remote draft sync
- メールボックス全体の完全ミラー

どれも価値はありますが、複雑さを大きく引き上げます。Origami が今まず優先しているのは：

> 単一ユーザー環境で、中心となる導線が速く、安定して、保守しやすいこと。
