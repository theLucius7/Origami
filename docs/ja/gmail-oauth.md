# Gmail OAuth 詳細設定

このページは **Gmail アカウントを Origami に接続する方法** を説明します。

GitHub ログインとは別です。  
GitHub ログインは Origami に入るため、Gmail OAuth は Gmail メールボックスへのアクセス権を Origami に渡すためのものです。

## Origami が現在要求する Gmail scopes

現在のコードでは主に次を要求します。

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

関連コード：

- `src/lib/providers/gmail.ts`

公式 scope 参考：

- <https://developers.google.com/workspace/gmail/api/auth/scopes>

## Gmail OAuth の 2 つの設定方法

### 方法 A: 環境変数の既定 Gmail app（まずはこちら推奨）

`.env` に：

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

を入れる方法です。

### 方法 B: DB 管理の Gmail app

環境変数に Gmail OAuth 情報を入れたくない場合は、先に GitHub で Origami にログインしてから `/accounts` で DB 管理の OAuth app を作れます。

**最初の導入は方法 A 推奨です。**  
理由は一番分かりやすくて、一番切り分けやすいからです。

## 公式リンク

- Google Workspace API を有効化  
  <https://developers.google.com/workspace/guides/enable-apis>
- OAuth consent の設定  
  <https://developers.google.com/workspace/guides/configure-oauth-consent>
- access credentials の作成  
  <https://developers.google.com/workspace/guides/create-credentials>
- Gmail API Node.js quickstart  
  <https://developers.google.com/workspace/gmail/api/quickstart/nodejs>
- Gmail API scopes  
  <https://developers.google.com/workspace/gmail/api/auth/scopes>

## ベビーステップ: Gmail OAuth App をゼロから作る

### Step 1: Google Cloud Console を開く

開く：

- <https://console.cloud.google.com/>

### Step 2: Google Cloud Project を作る / 選ぶ

まだ project がなければ：

1. 上部の project selector をクリック
2. **New Project**
3. 例えば：
   - `Origami Gmail Local`
   - `Origami Gmail Production`
4. 作成してその project に切り替える

> おすすめ: local と production で project を分ける。

### Step 3: Gmail API を有効化する

コンソールで：

- **APIs & Services** → **Library**

検索：

- `Gmail API`

そして：

- **Enable**

を押します。

公式説明：

- <https://developers.google.com/workspace/guides/enable-apis>

### Step 4: OAuth consent screen を設定する

ここは重要です。これがないと Google OAuth が正しく動きません。

最近の UI では一般に：

- **Google Auth platform** → **Branding**
- **Audience**
- **Data Access**

の順で設定します。

公式説明：

- <https://developers.google.com/workspace/guides/configure-oauth-consent>

#### Audience は何を選ぶ？

##### ケース 1: 個人利用 / テスト

一番よくあるのは：

- **External**
- 自分の Google アカウントを **Test users** に追加

です。

##### ケース 2: 自分の Google Workspace 組織の中だけで使う

その場合は：

- **Internal**

も検討できます。

ただし本当にその組織内限定の時だけです。

#### consent screen に何を入れる？

おすすめ：

- **App name**: `Origami Gmail Local` / `Origami Gmail Production`
- **User support email**: 自分のメール
- **Developer contact email**: 自分のメール
- **Scopes / Data Access**: Origami が必要な Gmail scopes を追加

### Step 5: OAuth Client ID を作成する

公式説明：

- <https://developers.google.com/workspace/guides/create-credentials>

作るのは：

- **OAuth client ID**
- アプリ種別は **Web application**

> **Desktop app** ではありません。Origami はサーバー側 Web アプリです。

#### Redirect URI は何を入れる？

Origami に正確に合わせます。

- ローカル: `http://localhost:3000/api/oauth/gmail`
- 本番: `https://your-domain/api/oauth/gmail`

ここはとても間違えやすいです。

作成後に保存する値：

- Client ID → `GMAIL_CLIENT_ID`
- Client Secret → `GMAIL_CLIENT_SECRET`

## `.env` 例

ローカル：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

本番：

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

## Step 6: Origami 側で Gmail を接続する

1. Origami を起動
2. まず GitHub ログインを完了
3. `/accounts` を開く
4. Gmail アカウント追加を選ぶ
5. env 既定 app が設定済みならそれが使われる
6. Google の認可画面を完了
7. Origami に戻る

## Google verification で最低限知っておくこと

ここで不安になる人は多いですが、個人自用なら思ったより単純です。

### 自分で使う / テストだけなら

よくある形は：

- app を testing のままにする
- Audience は External
- 自分の Google アカウントを Test users に入れる

これで十分なことが多いです。

### 多数の外部ユーザーに公開したい場合

その場合は Google の sensitive / restricted scopes の要件をしっかり確認してください。  
Origami は `gmail.modify` を要求するため、審査負荷は上がります。

自托管の単一ユーザー用途なら、通常は：

- 自分の project
- 自分の Google アカウント
- 自分を Test user

という形が自然です。

## よくある問題

### 1. `redirect_uri_mismatch`

まず最優先で確認：

- Google OAuth Client の redirect URI
- `NEXT_PUBLIC_APP_URL`
- 実際の callback `/api/oauth/gmail`

この 3 つが一致しているか。

### 2. 認可画面は開くが、認可後に戻れない

多くは redirect URI の問題か、local と production の Client ID の取り違えです。

### 3. “app not verified” や testing 制限が出る

確認すること：

- app が External か
- 今使っている Google アカウントが Test users に入っているか

### 4. 認可は成功したのに送信時に権限不足と言われる

次の scope を確認してください。

- `gmail.send`
- `gmail.modify`

Origami の送信や一部 write-back はこれらに依存します。

## 実運用でのおすすめ

一番安全なのは：

1. local と production で Google Cloud Project を分ける
2. 各環境で Web OAuth client を分ける
3. redirect URI を環境ごとに明確に分ける
4. 個人利用なら External + Test users
5. まず env 既定 app で通してから DB 管理 app を考える

## 次に読むページ

- [Outlook OAuth 詳細設定](/ja/outlook-oauth)
- [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
