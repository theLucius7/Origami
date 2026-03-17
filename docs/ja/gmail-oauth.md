# Gmail OAuth 詳細設定

このページは **Gmail アカウントを Origami に接続する方法** を説明します。

GitHub ログインとは別です。

- **GitHub ログイン**：Origami に入るための認証
- **Gmail OAuth**：Origami が Gmail メールボックスへアクセスするための認証

今の目標が：

> 「Origami には入れる。次は Gmail を本当に接続したい」

なら、このページです。

---

## このステップが終わると、何が手元にあるべき？

一番シンプルな環境変数方式なら、最終的に `.env` に入れるのは次です。

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

同時に：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

も正しく設定されている必要があります。Google OAuth の redirect URI がこれに依存するためです。

このステップは、ざっくり言うと：

> Google Cloud Console で Web OAuth アプリを作り、その値を `.env` に写す

という作業です。

---

## このステップでは、どの 2 つの場所を行き来する？

このステップでは、主に **2 つの場所** を行き来します。

### 場所 A：Google Cloud Console

ここでは：

- project を作る / 選ぶ
- Gmail API を有効化する
- OAuth consent screen を設定する
- OAuth client ID を作る
- Client ID / Client Secret を控える

### 場所 B：Origami プロジェクトの `.env`

ここには、次の値を入れます。

```txt
NEXT_PUBLIC_APP_URL=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
```

一番簡単な覚え方は：

> **Google Cloud Console 側で値を作る。`.env` 側で受け取る。**

---

## 公式リンク

- Google Workspace API を有効化  
  <https://developers.google.com/workspace/guides/enable-apis>
- OAuth consent screen の設定  
  <https://developers.google.com/workspace/guides/configure-oauth-consent>
- access credentials の作成  
  <https://developers.google.com/workspace/guides/create-credentials>
- Gmail API Node.js quickstart  
  <https://developers.google.com/workspace/gmail/api/quickstart/nodejs>
- Gmail API scopes  
  <https://developers.google.com/workspace/gmail/api/auth/scopes>

---

## Origami が現在要求する Gmail scopes

現在のコードでは主に次を要求します。

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

関連コード：

- `src/lib/providers/gmail.ts`

全部を暗記する必要はありません。実用上の理解としては：

- `gmail.modify` = メール状態の読み書き
- `gmail.send` = 送信
- `userinfo.email` = どの Google アカウントかを識別

くらいで十分です。

---

## どの設定方式を選ぶ？

### 方法 A: 環境変数の既定 Gmail app（最初はこれ推奨）

`.env` に：

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

を入れる方法です。

### 方法 B: DB 管理の Gmail app

環境変数に Gmail OAuth 情報を入れたくない場合は、先に Origami にログインしてから `/accounts` で DB 管理の OAuth app を作れます。

### 最初の導入ではどちらがいい？

**まずは方法 A です。**

理由は：

- 変数が少ない
- ルートが短い
- 一番切り分けやすい

---

## 始める前に、先にメモしておく値

### ローカル開発

```txt
アプリURL
http://localhost:3000

Google OAuth Redirect URI
http://localhost:3000/api/oauth/gmail

Project name
Origami Gmail Local

認可画面の App name
Origami Gmail Local
```

### 本番環境

```txt
アプリURL
https://mail.example.com

Google OAuth Redirect URI
https://mail.example.com/api/oauth/gmail

Project name
Origami Gmail Production

認可画面の App name
Origami Gmail Production
```

> 強くおすすめ: ローカル用と本番用で Google Cloud Project を分ける。

---

## もし画面がこのページと少し違って見えても

Google Cloud Console は UI 変更がかなり多いです。次のキーワードを優先して探してください。

- `Google Cloud Console`
- `APIs & Services`
- `Gmail API`
- `Google Auth platform`
- `Branding`
- `Audience`
- `Data Access`
- `OAuth client ID`
- `Web application`

本文と見た目が違っても、それだけで間違いとは限りません。単に UI が更新されただけのことも多いです。

---

## ユーザークリック手順: Gmail OAuth App をゼロから作る

### Step 1: Google Cloud Console を開く

開く：

- <https://console.cloud.google.com/>

### この時点で何が見えるはず？

通常は：

- 上部の project selector
- 左上のメニュー
- 検索バー

が見えます。

複数 project があるなら、まず Gmail 用に使う project を確認してください。

---

### Step 2: 専用 project を作る / 切り替える

まだ project がなければ、次の順に進みます。

1. 上部の project selector
2. **New Project**
3. プロジェクト名を入れる
4. 作成して切り替える

おすすめの project 名：

- ローカル: `Origami Gmail Local`
- 本番: `Origami Gmail Production`

### この時点で何が見えるはず？

切り替え成功後、上部に表示される project 名が新しいものに変わっているはずです。

変わっていなければ、まだ切り替えが完了していません。

---

### Step 3: Gmail API を有効化する

コンソール内で次の順に進みます。

1. **APIs & Services**
2. **Library**
3. `Gmail API` を検索
4. 開く
5. **Enable** を押す

公式説明：

- <https://developers.google.com/workspace/guides/enable-apis>

### この時点で何が見えるはず？

通常は：

- `Gmail API` のページ
- すでに Enabled になっている状態

が見えるはずです。

まだ「未有効化」に見えるなら、このステップは終わっていません。

---

### Step 4: OAuth consent screen を設定する

このステップは重要です。これがないと Google OAuth が正しく動きません。

一般的な流れは：

1. **Google Auth platform**
2. **Branding**
3. **Audience**
4. **Data Access**

公式説明：

- <https://developers.google.com/workspace/guides/configure-oauth-consent>

#### 4.1 Branding には何を入れる？

おすすめ：

- **App name**: `Origami Gmail Local` / `Origami Gmail Production`
- **User support email**: 自分のメール
- **Developer contact email**: 自分のメール

これで後で認可画面を見たときに、自分の app だとすぐ分かります。

#### 4.2 Audience は何を選ぶ？

##### 個人自用 / テストの場合

選ぶのは：

- **External**

そのあと、自分の Google アカウントを：

- **Test users**

に追加します。

##### 自分の Google Workspace 組織内だけで使う場合

その場合は：

- **Internal**

も検討できます。ただし本当にその用途のときだけです。

#### 4.3 Data Access / Scopes はどう考える？

全部の Google API を理解する必要はありません。

大事なのは、この app が Origami に必要な scope を要求できることです。

- `gmail.modify`
- `gmail.send`
- `userinfo.email`

---

### Step 5: OAuth Client ID を作成する

次の流れで作ります。

1. credential 作成入口を探す
2. **OAuth client ID** を選ぶ
3. アプリ種別は **Web application** を選ぶ

公式説明：

- <https://developers.google.com/workspace/guides/create-credentials>

> **Desktop app** ではありません。Origami はサーバー側 Web アプリです。

### Redirect URI には何を入れる？

Origami に正確に合わせます。

- ローカル: `http://localhost:3000/api/oauth/gmail`
- 本番: `https://your-domain/api/oauth/gmail`

### ここで起きやすいミス

- ローカルなのに本番 URL を入れる
- 本番なのに `localhost` を残す
- `/api/oauth/gmail` を忘れる

正しい形は必ず：

```txt
<APP_URL>/api/oauth/gmail
```

です。

### この時点で何が見えるはず？

作成後、Google は：

- Client ID
- Client Secret

を表示します。

その場でコピーしてください。

---

## `.env` に戻ったら、どの行を埋める？

Origami プロジェクトの `.env` に戻って、次のように埋めます。

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

### この 3 行を一番シンプルに言い直すと

- `NEXT_PUBLIC_APP_URL`：Origami を開く場所
- `GMAIL_CLIENT_ID`：Google がくれた app の公開 ID
- `GMAIL_CLIENT_SECRET`：Google がくれた app の秘密鍵

---

## `.env` を埋めたら、すぐこの確認をする

1 項目ずつ確認してください。

- 今見ている Google Cloud Project は正しいか
- `Gmail API` は Enabled か
- consent screen は設定済みか
- 個人用なら **External** を選んだか
- 自分の Google アカウントは **Test users** に入っているか
- OAuth client の種類は **Web application** か
- Redirect URI は `<APP_URL>/api/oauth/gmail` と完全一致しているか
- `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` はその client からコピーしたか

ここが合っていれば、Gmail 側はかなり安定します。

---

## 次: Origami に戻って Gmail 接続を確認する

次を実行します。

```bash
npm run dev
```

そのあと：

1. 先に GitHub ログインを完了
2. `/accounts` を開く
3. Gmail アカウント追加を選ぶ
4. ブラウザが Google 認可画面へ移動
5. さきほど設定した app 名が見える
6. Google アカウントを選んで認可
7. Origami に戻る

### この時点で何が見えるはず？

理想的には：

- `/accounts` に新しい Gmail アカウントが出る
- 同期ができる
- 読み込みができる
- 送信ができる
- 必要なら write-back が動く

この流れが通れば、Gmail OAuth はほぼ正しく設定できています。

---

## Google verification で最低限知っておくこと

Google の文言は少し大げさに見えることがありますが、単一ユーザーの自托管用途なら、思ったより単純です。

### 自分で使う / テストだけなら

多くの場合は次で十分です。

- app を testing のままにする
- Audience は **External**
- 自分の Google アカウントを **Test users** に入れる

### 多数の外部ユーザーに公開したい場合

その場合は Google の sensitive / restricted scopes の要件をしっかり確認してください。Origami は `gmail.modify` を要求するため、審査負荷が上がります。

つまり Origami のような自托管用途では、まず：

> 自分の project、自分のアカウント、自分を Test user

で始めるのが自然です。

---

## よくある問題を早く見抜くには

### 1. `redirect_uri_mismatch`

まず確認する 3 つ：

- Google OAuth Client の redirect URI
- `NEXT_PUBLIC_APP_URL`
- 実際の callback `/api/oauth/gmail`

この 3 つは完全一致が必要です。

### 2. 認可画面は開くが、認可後に戻れない

多くは redirect URI の間違いか、ローカル / 本番の Client ID の取り違えです。

### 3. “app not verified” や testing 制限が出る

次を見ます。

- app は **External** か
- 今使っている Google アカウントは **Test users** に入っているか

### 4. 認可成功後に送信権限不足になる

次の scope を確認します。

- `gmail.send`
- `gmail.modify`

Origami の送信と一部 write-back はこれらに依存します。

### 5. API は有効なのに動かない

次の 3 つを再確認してください。

- project は正しいか
- consent screen は本当に完成しているか
- OAuth client が **Web application** になっているか

問題は Gmail API そのものではなく、OAuth app 側の未設定であることが多いです。

---

## 実運用でのおすすめ

一番安全なのは：

1. **ローカル用と本番用で Google Cloud Project を分ける**
2. **環境ごとに Web OAuth client を分ける**
3. **Redirect URI を環境別に正確に設定する**
4. **個人用途では External + Test users を使う**
5. **最初は env 既定 app で進める**

これが一番分かりやすく、切り分けもしやすいです。

---

## 次に読むページ

Gmail ができたら、次は：

1. [Outlook OAuth 詳細設定](/ja/outlook-oauth)
2. [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
