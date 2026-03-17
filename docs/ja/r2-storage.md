# Cloudflare R2 / Bucket 詳細設定

このページは **Origami の添付ファイル保存先をどう設定するか** だけを説明します。

Origami は添付を Cloudflare R2 に保存します。メール添付のような大きいバイナリは、DB に直接入れない方が扱いやすいからです。

今の目標が：

> 「Cloudflare を開いて R2 を設定し、値を `.env` に戻したい」

なら、このページをそのまま進めてください。

---

## このステップが終わると、何が手元にあるべき？

最終的には、次の値を `.env` に入れます。

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

さらに残しておくと便利なのが：

```txt
R2_ACCOUNT_ID=...
```

現在の runtime では必須ではありませんが、トラブルシュート時にはかなり助かります。

このステップは、ざっくり言うと：

> Cloudflare で bucket を作り、その bucket にアクセスできるキーを作って、値を `.env` に写す

という作業です。

---

## このステップでは、どの 2 つの場所を行き来する？

このステップでは、主に **2 つの場所** を行き来します。

### 場所 A：Cloudflare Dashboard

ここでは：

- Account ID を確認する
- bucket を作る
- R2 API token を作る
- Access Key ID と Secret Access Key を控える

### 場所 B：Origami プロジェクトの `.env`

ここには、次の値を入れます。

```txt
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=
```

一番簡単な覚え方は：

> **Cloudflare 側で値を作る。`.env` 側で受け取る。**

---

## 公式リンク

- Cloudflare R2: bucket 作成  
  <https://developers.cloudflare.com/r2/buckets/create-buckets/>
- Cloudflare R2: API token / S3 認証  
  <https://developers.cloudflare.com/r2/api/tokens/>
- Cloudflare: Account ID の確認  
  <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

---

## 始める前に、先にメモしておく値

次のように先に書いておくと、後で混乱しにくいです。

```txt
Cloudflare Account ID = ...
Bucket name = origami-attachments-prod
R2 endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

環境を分けるなら、例えば：

- 開発: `origami-attachments-dev`
- 本番: `origami-attachments-prod`

のようにすると分かりやすいです。

> 強くおすすめ: development と production で bucket を分ける。

---

## もし画面がこのページと少し違って見えても

Cloudflare も UI を変更することがありますが、次のキーワードが見つかれば大丈夫です。

- `R2 Object Storage`
- `Buckets`
- `Manage R2 API tokens`
- `Account ID`

メニュー位置が少し違っても、ページ見出しと検索を優先して探してください。

---

## ユーザークリック手順: R2 をゼロから設定する

### Step 1: Cloudflare Dashboard を開く

開く：

- <https://dash.cloudflare.com/>

Cloudflare アカウントにログインします。

### この時点で何が見えるはず？

通常は：

- アカウントホーム
- 左側ナビゲーション
- 検索入口

が見えます。

複数の Cloudflare account を持っている場合は、今いるアカウントが R2 を置きたい方か確認してください。

---

### Step 2: 先に Account ID を確認する

Cloudflare Dashboard 内で、次のように進みます。

1. **Account home** または **Workers & Pages** を開く
2. **Account ID** を探す
3. それをコピーする

公式説明：

- <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

### 今すぐメモしておくべき行

```txt
R2_ACCOUNT_ID=<自分の Account ID>
```

そのあと、endpoint も一緒に作ってしまいます。

```txt
R2_ENDPOINT=https://<自分の Account ID>.r2.cloudflarestorage.com
```

例えば：

```txt
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

---

### Step 3: R2 を開いて bucket を作る

Cloudflare の中で次を探します。

- **R2 Object Storage**

そのあと bucket を作成します。

### bucket 名は何にする？

おすすめ：

- 開発: `origami-attachments-dev`
- 本番: `origami-attachments-prod`

### このステップで一番大事なこと

高度な設定ではなく、次の 2 つです。

1. **bucket がちゃんと作成されること**
2. **exact bucket name を覚えておくこと**

この exact name を、あとでそのまま次へ入れます。

```txt
R2_BUCKET_NAME=origami-attachments-prod
```

### この時点で何が見えるはず？

作成成功後は通常：

- bucket 一覧
- 新しく作った bucket 名
- bucket 詳細への入口

が見えます。

一覧に bucket が見えていなければ、まだ作成は完了していません。

---

### Step 4: R2 API token を作る

次に次の場所を探します。

- **Manage R2 API tokens**

通常は次のような入口があります。

- **Create Account API token**
- **Create User API token**

個人利用ならどちらでも動くことが多いですが、実務上は次の形が一番安全です。

- 権限は **Object Read & Write**
- scope は今作った bucket だけ

### なぜこの権限設定？

Origami が必要なのは：

- その bucket に添付をアップロードすること
- その bucket から添付を読み出すこと

だけだからです。

---

### Step 5: Access Key と Secret Access Key を控える

token を作成すると、Cloudflare が：

- **Access Key ID**
- **Secret Access Key**

を表示します。

これをその場でコピーしてください。

`.env` には次のように入れます。

```txt
R2_ACCESS_KEY_ID=<Access Key ID>
R2_SECRET_ACCESS_KEY=<Secret Access Key>
```

> 重要: Secret Access Key はフル表示が一回だけのことが多いです。

---

## `.env` に戻ったら、どの行を埋める？

Origami プロジェクトの `.env` に戻って、次のように埋めます。

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

### この 5 行を一番シンプルに言い直すと

- `R2_ACCOUNT_ID`：どの Cloudflare account の R2 か
- `R2_ACCESS_KEY_ID`：キーの公開側
- `R2_SECRET_ACCESS_KEY`：キーの秘密側
- `R2_BUCKET_NAME`：添付を保存する bucket 名
- `R2_ENDPOINT`：その R2 へ接続する入口

---

## `.env` を埋めたら、すぐこの確認をする

1 項目ずつ確認してください。

- `R2_ACCOUNT_ID` はコピーした Account ID そのものか
- `R2_ENDPOINT` は `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` と完全一致しているか
- `R2_BUCKET_NAME` は作成した bucket 名そのものか
- `R2_ACCESS_KEY_ID` と `R2_SECRET_ACCESS_KEY` を入れ替えていないか
- token 権限は **Object Read & Write** 以上あるか
- token の scope にその bucket が含まれているか

ここが合っていれば、R2 側はかなり安定します。

---

## 次: Origami に戻って添付アップロードを確認する

次を実行します。

```bash
npm run dev
```

そのあとログインして、次の流れを試します。

1. compose を開く
2. 小さい添付をアップロードする
3. 送信または保存まで進める
4. 詳細画面からその添付をダウンロードする

### この時点で何が見えるはず？

理想的には：

- upload でエラーが出ない
- 送信 / 保存が通る
- 添付がダウンロードできる

upload と download の両方が通れば、R2 設定はほぼ正しいです。

---

## よくある問題を早く見抜くには

### 1. `R2_ENDPOINT` が間違っている

最も多いです。

正しい形は必ず：

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

です。

漏れやすいのは：

- `https://`
- `.r2.cloudflarestorage.com`

### 2. Access Key と Secret を逆に入れた

よくあります。

- `R2_ACCESS_KEY_ID` は `R2_SECRET_ACCESS_KEY` ではありません

### 3. token に object read/write 権限がない

権限が足りないと、Origami 自体は起動しても添付 upload が失敗します。

最小推奨：

- **Object Read & Write**
- 対象 bucket のみに scope

### 4. bucket 名が別環境を指している

例えば：

- token は prod bucket 用
- `.env` は dev bucket 名

この場合、見た目は upload failure でも本質は bucket / permission mismatch です。

### 5. 別 account の Account ID を使っている

複数の Cloudflare account を使っていると起きやすいです。

その場合：

- endpoint は本物っぽい
- key も本物っぽい
- でも同じ account に属していない

という状態になります。

### 6. bucket を公開しないといけないと思っている

通常は**不要**です。

Origami はサーバー側で upload / download を処理するため、bucket を全公開する必要はありません。

---

## 実運用でのおすすめ

一番安全なのは：

1. **development / production の bucket を分ける**
2. **token 権限は Object Read & Write だけにする**
3. **scope は 1 つの bucket だけにする**
4. **`.env` に `R2_ACCOUNT_ID` も残す**

地味ですが、最も事故りにくい構成です。

---

## 次に読むページ

R2 ができたら、次は：

1. [GitHub Auth 詳細設定](/ja/github-auth)
2. [Gmail OAuth 詳細設定](/ja/gmail-oauth)
3. [Outlook OAuth 詳細設定](/ja/outlook-oauth)
