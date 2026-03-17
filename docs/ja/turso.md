# Turso データベース詳細設定

このページでは **本番環境の Origami 用 Turso データベースを準備する方法** だけを扱います。

## 最終的に `.env` に入れる値

```txt
TURSO_DATABASE_URL=libsql://origami-prod-xxxxx.turso.io
TURSO_AUTH_TOKEN=...
```

Origami にとってここで本当に重要なのは 2 つだけです。

- URL: どのデータベースに接続するか
- Token: その接続権限があるか

## 公式リファレンス

- Turso Quickstart  
  <https://docs.turso.tech/quickstart>
- Turso CLI インストール  
  <https://docs.turso.tech/cli/installation>
- Turso DB token 作成  
  <https://docs.turso.tech/cli/db/tokens/create>
- Turso Pricing  
  <https://turso.tech/pricing>

## 先にメモしておく値

```txt
データベース名
origami-prod

本番 URL
https://mail.example.com

記入する値
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
```

## なぜ「ダッシュボードで作成 + CLI で取得」なのか

ダッシュボード UI は変わることがあります。データベース URL と token を取る CLI の流れは比較的安定していて、再現しやすいからです。

推奨フロー：

1. ダッシュボードでデータベース作成
2. CLI で URL 取得
3. CLI で token 作成
4. `.env` に反映

## クリック手順

### 1. Turso にアクセスしてログインする

- <https://turso.tech/>

ログインしてダッシュボードに入ります。

### 2. プランを確認する

個人用の自前運用なら、まずはその時点で利用可能な無料枠から始めるので十分なことが多いです。内容は変わる可能性があるので、必ず Pricing を確認してください。

- <https://turso.tech/pricing>

### 3. ダッシュボードでデータベースを作成する

- **Create database**

推奨データベース名：

```txt
origami-prod
```

Location は、Origami を動かすリージョンに比較的近い場所を選べば十分です。

### 4. Turso CLI をインストールする

#### macOS

```bash
brew install tursodatabase/tap/turso
```

#### Linux

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

インストール後、次を実行します。

```bash
turso
```

### 5. CLI でログインする

```bash
turso auth login
```

### 6. データベース URL を取得する

```bash
turso db show origami-prod --url
```

表示例：

```txt
libsql://origami-prod-xxxxx.turso.io
```

これを `.env` に入れます。

```txt
TURSO_DATABASE_URL=libsql://origami-prod-xxxxx.turso.io
```

### 7. データベース token を作成する

```bash
turso db tokens create origami-prod
```

結果を `.env` に入れます。

```txt
TURSO_AUTH_TOKEN=...
```

## 最小構成の `.env` 例

```txt
TURSO_DATABASE_URL=libsql://origami-prod-xxxxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOi...
```

## テスト前の確認

- Turso ダッシュボード上で DB が作成済みか
- `TURSO_DATABASE_URL` は `turso db show origami-prod --url` の結果か
- `TURSO_AUTH_TOKEN` は `turso db tokens create origami-prod` の結果か
- `.env` に余計な空白や引用符が入っていないか

## 動作確認方法

`.env` に 2 つの値を入れたあと、次を実行します。

```bash
npm run db:setup
```

接続が正しければ正常終了するはずです。

## よくあるエラー

### 1. データベース URL が間違っている

次を確認します。

- `libsql://` で始まっているか
- `turso db show origami-prod --url` の結果をそのまま使っているか
- 手打ちで推測した URL ではないか

### 2. token がこの DB 用に作られていない

最も安全なのは次のコマンドです。

```bash
turso db tokens create origami-prod
```

### 3. CLI が実際にはログインできていない

認証エラーが出る場合は、次をやり直します。

```bash
turso auth login
```

### 4. DB はあるが token を作っていない

Origami には次の両方が必要です。

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
