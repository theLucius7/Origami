# Outlook OAuth 詳細設定

このページは **Outlook / Microsoft 365 アカウントを Origami に接続する方法** を説明します。

GitHub ログインとは別です。

- **GitHub ログイン**：Origami に入るための認証
- **Outlook OAuth**：Origami が Outlook メールボックスへアクセスするための認証

今の目標が：

> 「Origami には入れる。次は Outlook / Microsoft 365 をつなぎたい」

なら、このページです。

---

## まず結論：最終的に何が必要？

一番シンプルな環境変数方式から始めるなら、最終的に `.env` に入れるのは次です。

```txt
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

通常はこれに加えて：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

も関係します。Microsoft OAuth の redirect URI が Origami の URL と一致している必要があるためです。

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

---

## 最初に大事なポイント: env 既定 Outlook app は `tenant=common`

環境変数ベースの既定 Outlook app は現在：

- `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`

を使います。

このため向いているのは：

- 個人 Outlook / Hotmail / Live アカウント
- tenant をまだ一つに固定したくない場面

もし一つの組織 tenant にきっちり寄せたいなら、通常は：

- 先に GitHub ログインを済ませる
- `/accounts` で **DB 管理の Outlook OAuth app** を作る
- そこで tenant を明示する

の方がきれいです。

---

## 2 つの設定方法

### 方法 A: 環境変数の既定 Outlook app（最初はこれ推奨）

`.env` に：

```txt
OUTLOOK_CLIENT_ID=...
OUTLOOK_CLIENT_SECRET=...
```

### 方法 B: DB 管理の Outlook app

後で必要なら：

- tenant を分けたい
- 環境ごとに複数 app を持ちたい
- app 管理を明示的にしたい

場合にこちらを使います。

### 最初の導入ではどちらがいい？

**まずは方法 A です。**

理由は：

- 流れが短い
- 変数が少ない
- 一番切り分けやすい

---

## 公式リンク

- Microsoft Entra でアプリ登録  
  <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>
- Redirect URI を追加  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>
- credentials を追加 / 管理  
  <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>
- Microsoft Graph permissions reference  
  <https://learn.microsoft.com/en-us/graph/permissions-reference>

---

## 始める前に、先にメモしておくと楽な値

### ローカル開発

```txt
アプリURL
http://localhost:3000

Microsoft Redirect URI
http://localhost:3000/api/oauth/outlook

App registration name
Origami Outlook Local
```

### 本番運用

```txt
アプリURL
https://mail.example.com

Microsoft Redirect URI
https://mail.example.com/api/oauth/outlook

App registration name
Origami Outlook Production
```

> 実運用では、local と production で app registration を分けるのがおすすめです。

---

## もし画面がこのページと少し違って見えても

Microsoft Entra も名前やナビゲーション位置を変えることがあります。次のキーワードを優先して探してください。

- `Microsoft Entra admin center`
- `App registrations`
- `New registration`
- `Authentication`
- `Certificates & secrets`
- `API permissions`
- `Delegated permissions`
- `Grant admin consent`

`Entra ID` の表記が少し違っても、アプリ登録の画面体系にいれば方向はほぼ合っています。

---

## ベビーステップ: Outlook OAuth App をゼロから作る

### Step 1: Microsoft Entra admin center を開く

開く：

- <https://entra.microsoft.com>

---

### Step 2: アプリを登録する

進む先：

- **Entra ID** → **App registrations** → **New registration**

公式説明：

- <https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app>

#### Name は何にする？

環境が分かる名前がおすすめです。

- `Origami Outlook Local`
- `Origami Outlook Production`

#### Supported account types は何を選ぶ？

ここは迷いやすいポイントです。

##### env 既定 Outlook app を使うなら

より広いタイプ、例えば：

- **Accounts in any organizational directory and personal Microsoft accounts**

が比較的合わせやすいです。

これは既定 env app が `tenant=common` を使うためです。

##### 特定の会社 / 組織 tenant だけで使うなら

より狭くしても構いません。  
ただしその場合は、Origami 側では DB 管理 Outlook app の方が長期的には扱いやすいです。

---

### Step 3: Web Redirect URI を追加する

登録後：

- **Manage** → **Authentication**
- **Add a platform**
- **Web** を選ぶ

公式説明：

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-redirect-uri>

### Redirect URI は何を入れる？

Origami に正確に合わせます。

- ローカル: `http://localhost:3000/api/oauth/outlook`
- 本番: `https://your-domain/api/oauth/outlook`

`/api/oauth/outlook` まで正確に必要です。

---

### Step 4: Client Secret を作る

次へ：

- **Certificates & secrets**
- **New client secret**

公式説明：

- <https://learn.microsoft.com/en-us/entra/identity-platform/how-to-add-credentials>

保存する値：

- Application (client) ID → `OUTLOOK_CLIENT_ID`
- Client secret Value → `OUTLOOK_CLIENT_SECRET`

> Client secret は通常一回しかフル表示されません。

---

### Step 5: Microsoft Graph permissions を追加する

次へ：

- **API permissions**
- **Add a permission**
- **Microsoft Graph**
- **Delegated permissions**

そして Origami が必要な権限を追加します。

- `openid`
- `email`
- `User.Read`
- `Mail.Read`
- `Mail.ReadWrite`
- `Mail.Send`
- `offline_access`

公式参考：

- <https://learn.microsoft.com/en-us/graph/permissions-reference>

### ここでの目的はシンプルです

Microsoft Graph のすべてを理解することではなく：

> Origami が必要な Delegated permissions を、この app に入れること

です。

---

### Step 6: Grant admin consent は必要？

tenant のポリシー次第です。

よくあるケース：

- **個人 Microsoft アカウント / 自分だけのテスト**：ユーザー同意で足りることが多い
- **会社 / 学校 tenant**：管理者が **Grant admin consent** を押す必要があることがあります

ユーザー同意が tenant policy で止まるなら、まずここを疑ってください。

---

## Step 7: `.env` に入れる

### ローカル

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 本番

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OUTLOOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 設定後は、この順番で確認すると早い

1 項目ずつ確認してください。

- 今見ている app registration は正しいか
- **Supported account types** は用途に合っているか
- **Authentication** の Web redirect URI は `<APP_URL>/api/oauth/outlook` と完全一致しているか
- `OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` はその app のものか
- `API permissions` に `Mail.Read`、`Mail.ReadWrite`、`Mail.Send` があるか
- 組織 tenant なら admin consent も必要ではないか

このあたりが合っていれば、Outlook OAuth はかなり通りやすいです。

---

## Step 8: Origami 側で Outlook を接続する

1. Origami を起動
2. まず GitHub ログインを完了
3. `/accounts` を開く
4. Outlook アカウントを追加
5. Microsoft の認可フローを完了
6. Origami に戻る

---

## 本当に設定できたか、どう確認する？

次の流れを一度通します。

1. Origami で「Outlook アカウント追加」を押す
2. ブラウザが Microsoft のログイン / 認可画面へ飛ぶ
3. アカウントを選んで認可する
4. Origami に戻る
5. `/accounts` に Outlook アカウントが出る
6. sync / 読み込み / 送信 / write-back が正常に動く

この一連が通れば、Outlook OAuth はほぼ正しく設定できています。

---

## よくある問題を早く見抜くには

### 1. `AADSTS50011` / redirect URI mismatch

定番エラーです。まず確認：

- Entra の Web redirect URI
- `NEXT_PUBLIC_APP_URL`
- Origami の callback `/api/oauth/outlook`

が全部一致しているか。

### 2. Microsoft 側ではログインできるが、Origami に戻って失敗する

確認ポイント：

- local と production の client id を取り違えていないか
- client secret をコピーし間違えていないか
- redirect URI から `/api/oauth/outlook` が抜けていないか

### 3. 後で送信時に権限不足になる

次の権限があるか確認してください。

- `Mail.Send`
- `Mail.ReadWrite`

Origami の送信・write-back はこれらに依存します。

### 4. 個人 Microsoft アカウントで認可できない

まず **Supported account types** を確認してください。  
Outlook.com / Hotmail を使いたいのに単一組織 tenant 専用にしていると、変な問題が起きやすいです。

### 5. 会社 tenant のユーザーが同意できない

多くの場合、Origami のバグではなく tenant policy / admin consent の問題です。

### 6. 特定 tenant だけで使いたいのに、既定 env app がしっくりこない

それは自然です。既定 env app は `tenant=common` を使います。

本当に一つの組織 tenant に固定したいなら、通常は：

- DB 管理 Outlook app を使う
- Origami 側で tenant を明示する

方がきれいです。

---

## 実運用でのおすすめ

一番安全なのは：

1. local と production で app registration を分ける
2. 最初は env 既定 app で通す
3. tenant を厳密に扱いたいなら DB 管理 Outlook app に切り替える
4. Redirect URI を環境ごとに明確に分ける
5. 先に必要権限を全部入れてから Origami 側でテストする

これが一番混乱しにくいです。

---

## 次に読むページ

- [Gmail OAuth 詳細設定](/ja/gmail-oauth)
- [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
