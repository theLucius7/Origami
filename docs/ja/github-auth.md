# GitHub Auth 詳細設定

このページは **Origami 本体へのログイン設定** だけを説明します。

メール接続用 OAuth とは別です。

- **GitHub Auth**：Origami 自体にログインするための認証
- **Gmail / Outlook OAuth**：メールアカウントを Origami に接続するための認証

今の目標が：

> 「Origami を開いて、GitHub でちゃんとログインできるようにしたい」

なら、このページを進めてください。

---

## このステップが終わると、何が手元にあるべき？

最終的には、次の値を `.env` に入れます。

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=...
```

意味は次の通りです。

- `NEXT_PUBLIC_APP_URL`：Origami を開く URL
- `GITHUB_CLIENT_ID`：GitHub OAuth App の Client ID
- `GITHUB_CLIENT_SECRET`：GitHub OAuth App の Client Secret
- `GITHUB_ALLOWED_LOGIN`：許可する GitHub login を制限する設定。**公開運用では強く推奨**
- `AUTH_SECRET`：ログイン session の署名鍵。未設定時は `ENCRYPTION_KEY` にフォールバック

このステップは、ざっくり言うと：

> GitHub で OAuth App を作り、そのとき GitHub が返してくれる値を `.env` に写す

という作業です。

---

## このステップでは、どの 2 つの場所を行き来する？

このステップでは、主に **2 つの場所** を行き来します。

### 場所 A：GitHub の設定画面

ここでは：

- OAuth App を作る
- Homepage URL を入れる
- Authorization callback URL を入れる
- Client ID を確認する
- Client Secret を生成する

### 場所 B：Origami プロジェクトの `.env`

ここには、次の値を入れます。

```txt
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_ALLOWED_LOGIN=
AUTH_SECRET=
NEXT_PUBLIC_APP_URL=
```

一番簡単な覚え方は：

> **GitHub 側で値を作る。`.env` 側で受け取る。**

---

## 公式リンク

- GitHub 公式: OAuth App の作成  
  <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app>

---

## 始める前に、先にメモしておく値

先にメモしておくと、画面を行き来しても写し間違えにくいです。

### ローカル開発

```txt
Origami の URL
http://localhost:3000

GitHub Homepage URL
http://localhost:3000

GitHub Authorization callback URL
http://localhost:3000/api/auth/github/callback

許可する GitHub login
your-github-login
```

### 本番環境

```txt
Origami の URL
https://mail.example.com

GitHub Homepage URL
https://mail.example.com

GitHub Authorization callback URL
https://mail.example.com/api/auth/github/callback

許可する GitHub login
your-github-login
```

> 強くおすすめ: **ローカル用 1 つ、本番用 1 つ** の GitHub OAuth App を分ける。

---

## もし画面がこのページと少し違って見えても

GitHub は UI や文言をときどき変えますが、次のキーワードが見つかれば大丈夫です。

- `Settings`
- `Developer settings`
- `OAuth Apps`
- `New OAuth App`
- `Register a new application`

ボタン名が少し違っても、左側ナビゲーションとページ見出しを優先して見てください。

---

## どの構成を選べばいい？

### パターン A: ローカル開発だけ

ローカルで GitHub ログインを試したいだけなら、次の構成で十分です。

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_ALLOWED_LOGIN=your-github-login
```

### パターン B: ローカル用と本番用で分ける（推奨）

おすすめの名前：

1. `Origami Local`
2. `Origami Production`

こうしておくと：

- callback URL が混ざらない
- secret が混ざらない
- 後からどちらの app か分かりやすい

### パターン C: 公開単一ユーザー運用

公開 URL で動かすなら、次も設定してください。

```txt
GITHUB_ALLOWED_LOGIN=your-github-login
```

これで他人が先に owner を claim するのを防ぎやすくなります。

---

## ユーザークリック手順: GitHub OAuth App をゼロから作る

ここから先は、**そのままクリックしていけばよい** 形で書きます。

### Step 1: GitHub の OAuth App 画面を開く

GitHub の中で、次の順にクリックします。

1. 右上の自分のアバター
2. **Settings**
3. 左側の **Developer settings**
4. **OAuth Apps**
5. **New OAuth App**

初回は：

- **Register a new application**

と表示されることもありますが、同じ入口です。

### この時点で何が見えるはず？

次のような入力欄があるフォーム画面に入っているはずです。

- Application name
- Homepage URL
- Application description
- Authorization callback URL

これらが見えていなければ、まだ正しいページではありません。

---

### Step 2: フォームを埋める

ここでは「この欄に何を入れるか」をそのまま書きます。

#### 1) Application name

次のどちらかがおすすめです。

- ローカル: `Origami Local`
- 本番: `Origami Production`

#### 2) Homepage URL

Origami を実際に開く URL を入れます。

- ローカル: `http://localhost:3000`
- 本番: `https://mail.example.com`

#### 3) Application description

任意です。例えば：

```txt
Single-user inbox app login for Origami
```

#### 4) Authorization callback URL

ここが最重要です。

- ローカル: `http://localhost:3000/api/auth/github/callback`
- 本番: `https://mail.example.com/api/auth/github/callback`

### ここで一番起きやすいミス

callback URL にトップページ URL を入れてしまうことです。これは誤りです。

正しい形は必ず：

```txt
<APP_URL>/api/auth/github/callback
```

つまり **`/api/auth/github/callback` を必ず含める** 必要があります。

---

### Step 3: 登録ボタンを押す

入力が終わったら、次を押します。

- **Register application**

押すと、この OAuth App の詳細画面に移動します。

### この時点で何が見えるはず？

通常は：

- アプリ名
- Client ID
- secret を生成するためのボタン

が見えます。

この時点では **Client Secret はまだ表示されていません**。まだ生成していないからです。

---

### Step 4: Client Secret を生成する

詳細画面で、次をクリックします。

- **Generate a new client secret**

GitHub が新しい secret を表示します。

ここで次の 2 つを必ず保存してください。

1. **Client ID**
2. **Client Secret**

これらは `.env` に戻して、こう入れます。

```txt
GITHUB_CLIENT_ID=<Client ID>
GITHUB_CLIENT_SECRET=<Client Secret>
```

> Important: Client Secret はフル表示が一回だけのことが多いです。必ずその場でコピーしてください。

---

## `.env` に戻ったら、どの行を埋める？

Origami プロジェクトの `.env` に戻って、次のように埋めます。

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_ALLOWED_LOGIN=your-github-login
AUTH_SECRET=replace-with-a-random-secret
```

### この 5 行を一番シンプルに言い直すと

- `NEXT_PUBLIC_APP_URL`：Origami を開く場所
- `GITHUB_CLIENT_ID`：GitHub がくれたアプリ ID
- `GITHUB_CLIENT_SECRET`：GitHub がくれたアプリ secret
- `GITHUB_ALLOWED_LOGIN`：自分の GitHub login だけ許可する設定
- `AUTH_SECRET`：ログイン cookie を署名するランダム値

`AUTH_SECRET` がまだない場合は、次で作れます。

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## `.env` を埋めたら、すぐこの確認をする

1 項目ずつ確認してください。

- `NEXT_PUBLIC_APP_URL` は実際に開く URL と一致しているか
- GitHub の **Homepage URL** はそれと一致しているか
- GitHub の **Authorization callback URL** は `<APP_URL>/api/auth/github/callback` と完全一致しているか
- `GITHUB_ALLOWED_LOGIN` は GitHub login で、メールアドレスではないか
- `AUTH_SECRET` は空ではなくランダム値か

ここが合っていれば、GitHub 側はかなり安定します。

---

## 次: Origami に戻ってログインを確認する

プロジェクトディレクトリで次を実行します。

```bash
npm run dev
```

そのあと、次を開きます。

- `http://localhost:3000`

### この時点で何が見えるはず？

- Origami のログインページ
- GitHub ログインボタン

GitHub ログインを押した後は、次の流れになるはずです。

1. ブラウザが GitHub の認可画面へ移動
2. あなたが認可する
3. GitHub が Origami に戻す
4. 初回なら `/setup` に入る
5. setup 完了後、ホームまたは `/accounts` に入れる

---

## 初回 owner バインドとは？

最初のログイン時に Origami は：

1. すでに owner がいるか確認
2. まだいなければ現在の GitHub ユーザーを `app_installation` に保存
3. `/setup` に移動
4. 以後はその owner アカウントでログイン確認

### ここで一番大事な点

後続の照合は：

- **GitHub user id**

に基づきます。login 文字列だけではありません。

つまり：

- GitHub login 名を変更しても通常は問題ありません
- 別アカウントに変えると入れません

---

## よくある問題を早く見抜くには

### 1. GitHub ログイン後すぐ callback error になる

まず次の 4 つを見ます。

- `NEXT_PUBLIC_APP_URL` は正しいか
- GitHub の **Homepage URL** は正しいか
- **Authorization callback URL** は `/api/auth/github/callback` まで正確か
- ローカルと本番の資格情報を混ぜていないか

### 2. ログイン画面は出るが入れない

次を確認します。

```txt
GITHUB_ALLOWED_LOGIN=
```

これを設定している場合、その GitHub login 以外は通りません。バグではなく、意図した制限です。

### 3. owner のはずなのに入れない

初回に owner を claim した **同じ GitHub アカウント** でログインしているか確認してください。

### 4. 初回に間違った owner を bind してしまった

通常は `app_installation` レコードをクリアして初期化し直す必要があります。

不安なら先に DB をバックアップしてください。

### 5. だいたい合っているのに失敗する

次の 3 行を並べて、文字単位で比較してみてください。

```txt
NEXT_PUBLIC_APP_URL=...
Homepage URL=...
Authorization callback URL=...
```

正しい callback は必ず：

```txt
<APP_URL>/api/auth/github/callback
```

です。多くの場合、ロジックより path の不足が原因です。

---

## 実運用でのおすすめ

一番安全なのは：

1. **ローカル用 GitHub OAuth App を 1 つ**
2. **本番用 GitHub OAuth App を 1 つ**
3. **公開運用なら `GITHUB_ALLOWED_LOGIN` を必ず設定**
4. **`AUTH_SECRET` を明示設定し、`ENCRYPTION_KEY` の再利用を避ける**

これが一番混乱しにくい構成です。

---

## 次に読むページ

GitHub ログインが通ったら、次は：

1. [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
2. [Gmail OAuth 詳細設定](/ja/gmail-oauth)
3. [Outlook OAuth 詳細設定](/ja/outlook-oauth)
