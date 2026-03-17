# Gmail OAuth 詳細設定

このページは **Gmail アカウントを Origami に接続する方法** を説明します。

GitHub ログインとは別です。

- **GitHub ログイン**：Origami に入るための認証
- **Gmail OAuth**：Origami が Gmail メールボックスへアクセスするための認証

今の目標が：

> 「Origami には入れる。次は Gmail をちゃんとつなぎたい」

なら、このページです。

---

## まず結論：最終的に何が必要？

一番シンプルな環境変数方式から始めるなら、最終的に `.env` に入れるのは次です。

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

通常はこれに加えて：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

も関係します。Google OAuth の redirect URI が Origami の URL と一致している必要があるためです。

---

## Origami が現在要求する Gmail scopes

現在のコードでは主に次を要求します。

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

関連コード：

- `src/lib/providers/gmail.ts`

公式 scope 参考：

- <https://developers.google.com/workspace/gmail/api/auth/scopes>

---

## 2 つの設定方法：まずどちらか決める

### 方法 A: 環境変数の既定 Gmail app（最初はこれ推奨）

`.env` に：

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

を入れる方法です。

### 方法 B: DB 管理の Gmail app

環境変数に Gmail OAuth 情報を入れたくない場合は、先に GitHub で Origami にログインしてから `/accounts` で DB 管理の OAuth app を作れます。

### 最初の導入ではどちらがいい？

**まずは方法 A です。**

理由は：

- 変数が少ない
- 流れが短い
- 一番切り分けやすい

Gmail が通ってから DB 管理 app を考えれば十分です。

---

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

---

## 始める前に、先にメモしておくと楽な値

### ローカル開発

```txt
アプリURL
http://localhost:3000

Google OAuth Redirect URI
http://localhost:3000/api/oauth/gmail

Project name
Origami Gmail Local

同意画面の App name
Origami Gmail Local
```

### 本番運用

```txt
アプリURL
https://mail.example.com

Google OAuth Redirect URI
https://mail.example.com/api/oauth/gmail

Project name
Origami Gmail Production

同意画面の App name
Origami Gmail Production
```

> 実運用では、**ローカル用 Google Cloud Project** と **本番用 Google Cloud Project** を分けるのがおすすめです。

---

## もし画面がこのページと少し違って見えても

Google Cloud Console はかなり頻繁に UI を変えます。次のキーワードを優先して探してください。

- `Google Cloud Console`
- `APIs & Services`
- `Gmail API`
- `Google Auth platform`
- `Branding`
- `Audience`
- `Data Access`
- `OAuth client ID`
- `Web application`

本文と見た目が少し違っても、それだけで間違いとは限りません。単に Google 側の UI 変更であることも多いです。

---

## ベビーステップ: Gmail OAuth App をゼロから作る

### Step 1: Google Cloud Console を開く

開く：

- <https://console.cloud.google.com/>

---

### Step 2: Google Cloud Project を作る / 選ぶ

まだ project がなければ：

1. 上部の project selector をクリック
2. **New Project**
3. 例えば：
   - `Origami Gmail Local`
   - `Origami Gmail Production`
4. 作成してその project に切り替える

> おすすめ: local と production で project を分ける。

---

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

### この時点で重要なのは 1 つだけ

この project で、**Gmail API が Enabled になっていること**です。

---

### Step 4: OAuth consent screen を設定する

ここは重要です。これがないと Google OAuth が正しく動きません。

最近の UI では一般に：

- **Google Auth platform** → **Branding**
- **Audience**
- **Data Access**

の流れで設定します。

公式説明：

- <https://developers.google.com/workspace/guides/configure-oauth-consent>

### 4.1 Branding には何を入れる？

おすすめ：

- **App name**: `Origami Gmail Local` / `Origami Gmail Production`
- **User support email**: 自分のメール
- **Developer contact email**: 自分のメール

これは後で認可画面を見たときに、どの app か分かりやすくする意味もあります。

### 4.2 Audience は何を選ぶ？

#### ケース 1: 個人利用 / テスト

一番よくあるのは：

- **External**
- 自分の Google アカウントを **Test users** に追加

です。

#### ケース 2: 自分の Google Workspace 組織の中だけで使う

その場合は：

- **Internal**

も検討できます。

ただし本当にその組織内限定の時だけです。

### 4.3 Data Access / Scopes はどう考える？

やることは「Google の全部の API を分かること」ではありません。

大事なのは、Origami が必要な scope をこの app で要求できることです。

- `gmail.modify`
- `gmail.send`
- `userinfo.email`

---

### Step 5: OAuth Client ID を作成する

公式説明：

- <https://developers.google.com/workspace/guides/create-credentials>

作るのは：

- **OAuth client ID**
- アプリ種別は **Web application**

> **Desktop app** ではありません。Origami はサーバー側 Web アプリです。

### Redirect URI は何を入れる？

Origami に正確に合わせます。

- ローカル: `http://localhost:3000/api/oauth/gmail`
- 本番: `https://your-domain/api/oauth/gmail`

ここはとても間違えやすいです。

今がローカル開発なら production の URL を残さず、今が本番なら `localhost` を残さないでください。

作成後に保存する値：

- Client ID → `GMAIL_CLIENT_ID`
- Client Secret → `GMAIL_CLIENT_SECRET`

---

## `.env` 例

### ローカル

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

### 本番

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

---

## 設定後は、この順番で確認すると早い

1 項目ずつ見てください。

- 今開いている Google Cloud Project は正しいか
- **Gmail API** は **Enabled** か
- consent screen は完成しているか
- 個人利用なら **External** を選んだか
- 自分の Google アカウントは **Test users** に入っているか
- OAuth client の種類は **Web application** か
- Redirect URI は `<APP_URL>/api/oauth/gmail` と完全一致しているか
- `.env` の `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` はその client の値か

この 8 項目が合っていれば、Gmail OAuth はかなり通りやすいです。

---

## Step 6: Origami 側で Gmail を接続する

1. Origami を起動
2. まず GitHub ログインを完了
3. `/accounts` を開く
4. Gmail アカウント追加を選ぶ
5. env 既定 app が設定済みならそれが使われる
6. Google の認可画面を完了
7. Origami に戻る

---

## Google verification で最低限知っておくこと

ここで不安になる人は多いですが、単一ユーザーの自托管用途なら思ったより単純です。

### 自分で使う / テストだけなら

よくある形は：

- app を testing のままにする
- Audience は **External**
- 自分の Google アカウントを **Test users** に入れる

これで十分なことが多いです。

### 多数の外部ユーザーに公開したい場合

その場合は Google の sensitive / restricted scopes の要件をしっかり確認してください。Origami は `gmail.modify` を要求するため、審査負荷は上がります。

自托管の単一ユーザー用途なら、基本的には：

> 自分の project、自分のアカウント、自分を Test user

で始めるのが自然です。

---

## 本当に設定できたか、どう確認する？

次の流れを一度通します。

1. Origami で「Gmail アカウント追加」を押す
2. ブラウザが Google の認可画面へ飛ぶ
3. 設定した app 名が見える
4. アカウントを選んで認可する
5. Origami に戻る
6. `/accounts` に Gmail アカウントが出る
7. sync / 読み込み / 送信 / write-back が正常に動く

この一連が通れば、Gmail OAuth はほぼ正しく設定できています。

---

## よくある問題を早く見抜くには

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

- app が **External** か
- 今使っている Google アカウントが **Test users** に入っているか

### 4. 認可は成功したのに送信時に権限不足と言われる

次の scope を確認してください。

- `gmail.send`
- `gmail.modify`

Origami の送信や一部 write-back はこれらに依存します。

### 5. API を有効化したのにまだダメ

次の見落としを再確認してください。

- 今見ている project は本当に正しいか
- consent screen は完成しているか
- OAuth client の種類が **Web application** になっているか

問題は API 自体ではなく、OAuth app 側の未設定であることがよくあります。

---

## 実運用でのおすすめ

一番安全なのは：

1. local と production で Google Cloud Project を分ける
2. 各環境で Web OAuth client を分ける
3. Redirect URI を環境ごとに明確に分ける
4. 個人利用なら **External + Test users**
5. まず env 既定 app で通してから DB 管理 app を考える

これが一番分かりやすく、切り分けもしやすいです。

---

## 次に読むページ

- [Outlook OAuth 詳細設定](/ja/outlook-oauth)
- [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
