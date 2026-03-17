# Outlook OAuth 詳細設定

このページは **Outlook / Microsoft 365 アカウントを Origami に接続する方法** を説明します。

GitHub ログインとは別です。

- **GitHub ログイン**：Origami に入るための認証
- **Outlook OAuth**：Origami が Outlook メールボックスへアクセスするための認証

今の目標が：

> 「Origami には入れる。次は Outlook / Microsoft 365 を本当に接続したい」

なら、このページです。

---

## このステップが終わると、何が手元にあるべき？

一番シンプルな環境変数方式なら、最終的に `.env` に入れるのは次です。

```txt
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

同時に：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

も正しく設定されている必要があります。Microsoft OAuth の redirect URI がこれに依存するためです。

このステップは、ざっくり言うと：

> Microsoft Entra で Web アプリを作り、その値を `.env` に写す

という作業です。

---

## このステップでは、どの 2 つの場所を行き来する？

このステップでは、主に **2 つの場所** を行き来します。

### 場所 A：Microsoft Entra admin center

ここでは：

- app registration を作る
- Authentication を設定する
- Client Secret を作る
- Microsoft Graph の権限を追加する
- 必要なら admin consent を行う

### 場所 B：Origami プロジェクトの `.env`

ここには、次の値を入れます。

```txt
NEXT_PUBLIC_APP_URL=
OUTLOOK_CLIENT_ID=
OUTLOOK_CLIENT_SECRET=
```

一番簡単な覚え方は：

> **Microsoft Entra 側で値を作る。`.env` 側で受け取る。**

---

## 公式リンク

- Microsoft Entra でアプリ登録  
  <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>
- Redirect URI を追加  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>
- client secret を追加 / 管理  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>
- Microsoft Graph permissions reference  
  <https://learn.microsoft.com/en-us/graph/permissions-reference>

---

## Origami が現在要求する Microsoft scopes

現在のコードでは次を要求します。

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

関連コード：

- `src/lib/providers/outlook.ts`

全部を暗記する必要はありません。実用上の理解としては：

- `Mail.Read` / `Mail.ReadWrite` = 読み込みと write-back
- `Mail.Send` = 送信
- `offline_access` = refresh token

くらいで十分です。

---

## 先に知っておくべき大事な点: env 既定 Outlook app は `tenant=common`

現在の env 既定 Outlook app は：

- `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`

を使います。

そのため向いているのは：

- 個人 Outlook / Hotmail / Live アカウント
- tenant を 1 つに固定したくない場面

もし 1 つの組織 tenant に厳密に合わせたいなら、通常は：

- 先に GitHub ログインを済ませる
- `/accounts` で **DB 管理の Outlook OAuth app** を作る
- そこで tenant を明示する

方がきれいです。

---

## どの設定方式を選ぶ？

### 方法 A: 環境変数の既定 Outlook app（最初はこれ推奨）

`.env` に：

```txt
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

を入れる方法です。

### 方法 B: DB 管理の Outlook app

後で必要なら：

- tenant を分けたい
- 環境ごとに複数 app を持ちたい
- app 管理をもっと細かくしたい

場合に使えます。

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

Microsoft Redirect URI
http://localhost:3000/api/oauth/outlook

App registration name
Origami Outlook Local
```

### 本番環境

```txt
アプリURL
https://mail.example.com

Microsoft Redirect URI
https://mail.example.com/api/oauth/outlook

App registration name
Origami Outlook Production
```

> 強くおすすめ: ローカル用と本番用で app registration を分ける。

---

## もし画面がこのページと少し違って見えても

Microsoft Entra もラベルやメニュー位置を変えることがあります。次のキーワードを優先して探してください。

- `Microsoft Entra admin center`
- `App registrations`
- `New registration`
- `Authentication`
- `Certificates & secrets`
- `API permissions`
- `Delegated permissions`
- `Grant admin consent`

`Entra ID` の表記が多少変わっても、アプリ登録の画面体系にいれば概ね正しい場所です。

---

## ユーザークリック手順: Outlook OAuth App をゼロから作る

### Step 1: Microsoft Entra admin center を開く

開く：

- <https://entra.microsoft.com>

### この時点で何が見えるはず？

通常は：

- 左側ナビゲーション
- 検索バー
- tenant / directory 情報

が見えます。

複数 tenant を扱っている場合は、今いる tenant がこの app を作りたい tenant か確認してください。

---

### Step 2: アプリを登録する

次の順に進みます。

1. **Entra ID**
2. **App registrations**
3. **New registration**

公式説明：

- <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>

#### Name は何にする？

おすすめ：

- ローカル: `Origami Outlook Local`
- 本番: `Origami Outlook Production`

#### Supported account types は何を選ぶ？

ここは迷いやすいです。

##### env 既定 Outlook app を使うなら

より広い選択肢、例えば：

- **Accounts in any organizational directory and personal Microsoft accounts**

が比較的合わせやすいです。理由は env 既定 app が `tenant=common` を使うからです。

##### 特定の組織 tenant だけで使うなら

より狭くしても構いません。  
ただしその場合は、Origami 側では DB 管理 Outlook app の方が長期的には扱いやすいです。

### この時点で何が見えるはず？

登録成功後は通常：

- Application (client) ID
- Authentication
- Certificates & secrets
- API permissions

などが見えるアプリ詳細画面に入ります。

---

### Step 3: Web Redirect URI を追加する

次の順に進みます。

1. **Manage**
2. **Authentication**
3. **Add a platform**
4. **Web** を選ぶ

公式説明：

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>

### Redirect URI には何を入れる？

Origami に正確に合わせます。

- ローカル: `http://localhost:3000/api/oauth/outlook`
- 本番: `https://your-domain/api/oauth/outlook`

### ここで起きやすいミス

- ローカルなのに本番 URL を入れる
- 本番なのに `localhost` を残す
- `/api/oauth/outlook` を忘れる

正しい形は必ず：

```txt
<APP_URL>/api/oauth/outlook
```

です。

---

### Step 4: Client Secret を作る

次の順に進みます。

1. **Certificates & secrets**
2. **New client secret**

公式説明：

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>

ここで次の 2 つを保存します。

- Application (client) ID
- Client secret Value

これらは `.env` に戻して、こう入れます。

```txt
OUTLOOK_CLIENT_ID=<Application (client) ID>
OUTLOOK_CLIENT_SECRET=<Client secret Value>
```

> Important: Client secret のフル表示は一回だけのことが多いので、その場でコピーしてください。

---

### Step 5: Microsoft Graph 権限を追加する

次の順に進みます。

1. **API permissions**
2. **Add a permission**
3. **Microsoft Graph**
4. **Delegated permissions**

そのあと Origami に必要な権限を追加します。

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

公式参考：

- <https://learn.microsoft.com/en-us/graph/permissions-reference>

### このステップで本当に確認したいこと

Microsoft Graph 全体を理解することではなく：

> この app に、Origami が必要な Delegated permissions が入っていること

です。

---

### Step 6: Grant admin consent が必要か確認する

これは tenant のポリシー次第です。

よくあるケース：

- **個人 Microsoft アカウント / 自分だけのテスト**：ユーザー同意で足りることが多い
- **会社 / 学校 tenant**：管理者が **Grant admin consent** を押す必要があることがあります

認可が tenant policy で止まるなら、まずここを見直してください。

---

## `.env` に戻ったら、どの行を埋める？

Origami プロジェクトの `.env` に戻って、次のように埋めます。

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### この 3 行を一番シンプルに言い直すと

- `NEXT_PUBLIC_APP_URL`：Origami を開く場所
- `OUTLOOK_CLIENT_ID`：Microsoft がくれた app ID
- `OUTLOOK_CLIENT_SECRET`：Microsoft がくれた app secret

---

## `.env` を埋めたら、すぐこの確認をする

1 項目ずつ確認してください。

- 今見ている app registration は正しいか
- **Supported account types** は用途に合っているか
- **Authentication** の redirect URI は `<APP_URL>/api/oauth/outlook` と完全一致しているか
- `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` はその app からコピーしたか
- `API permissions` に `Mail.Read`、`Mail.ReadWrite`、`Mail.Send` があるか
- 組織 tenant なら admin consent も必要ではないか

ここが合っていれば、Outlook 側はかなり安定します。

---

## 次: Origami に戻って Outlook 接続を確認する

次を実行します。

```bash
npm run dev
```

そのあと：

1. 先に GitHub ログインを完了
2. `/accounts` を開く
3. Outlook アカウント追加を選ぶ
4. ブラウザが Microsoft のログイン / 認可画面へ移動
5. アカウントを選んで認可
6. Origami に戻る

### この時点で何が見えるはず？

理想的には：

- `/accounts` に新しい Outlook アカウントが出る
- 同期ができる
- 読み込みができる
- 送信ができる
- 必要なら write-back が動く

この流れが通れば、Outlook OAuth はほぼ正しく設定できています。

---

## よくある問題を早く見抜くには

### 1. `AADSTS50011` / redirect URI mismatch

まず確認する 3 つ：

- Entra の Web redirect URI
- `NEXT_PUBLIC_APP_URL`
- 実際の callback `/api/oauth/outlook`

この 3 つは完全一致が必要です。

### 2. Microsoft 側でログインできるが、Origami に戻れない

次を見直します。

- ローカル / 本番の Client ID を混ぜていないか
- Client Secret を正しくコピーしたか
- `/api/oauth/outlook` を忘れていないか

### 3. 後で送信時に権限不足になる

次の権限が入っているか確認してください。

- `Mail.Send`
- `Mail.ReadWrite`

Origami の送信と write-back はこれらに依存します。

### 4. 個人 Microsoft アカウントで認可できない

まず **Supported account types** を確認してください。

Outlook.com / Hotmail を使いたいのに単一組織 tenant 専用にしていると、うまくいかないことが多いです。

### 5. 組織 tenant のユーザーが認可できない

多くの場合、Origami のバグではなく tenant policy / admin consent の問題です。

### 6. 1 つの tenant に固定したいのに env 既定 app が扱いづらい

それは自然です。env 既定 app は `tenant=common` を使います。

本当に 1 つの組織 tenant に固定したいなら、通常は：

- DB 管理 Outlook app に切り替える
- Origami 側で tenant を明示する

方がきれいです。

---

## 実運用でのおすすめ

一番安全なのは：

1. **ローカル用と本番用で app registration を分ける**
2. **env 既定 app は最小構成用と割り切る**
3. **特定 tenant を厳密に扱うなら DB 管理 app を使う**
4. **Redirect URI を環境ごとに正確に分ける**
5. **先に権限を入れ、その後 Origami 側でテストする**

これが一番混乱しにくいです。

---

## 次に読むページ

Outlook ができたら、次は：

1. [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
2. [GitHub Auth 詳細設定](/ja/github-auth)
3. [Gmail OAuth 詳細設定](/ja/gmail-oauth)
