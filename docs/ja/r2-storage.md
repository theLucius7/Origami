# Cloudflare R2 / Bucket 詳細設定

このページは **Origami の添付ファイル保存先をどう設定するか** だけを説明します。

Origami は添付を Cloudflare R2 に保存します。バイナリを DB に直接入れない方が、メール添付の運用にはずっと向いています。

---

## まず結論：最終的に何が必要？

最終的には、次の値を `.env` に入れます。

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

あわせて残しておくと便利なのが：

```txt
R2_ACCOUNT_ID=...
```

現在の runtime では必須ではありませんが、トラブルシュートにはかなり役立ちます。

---

## 公式リンク

- Cloudflare R2: bucket 作成  
  <https://developers.cloudflare.com/r2/buckets/create-buckets/>
- Cloudflare R2: API token / 認証  
  <https://developers.cloudflare.com/r2/api/tokens/>
- Cloudflare: Account ID の確認  
  <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

---

## まず一番シンプルな理解

Origami が R2 に本当に必要としているのは、実は 4 つだけです。

1. **bucket 名**
2. **Access Key ID**
3. **Secret Access Key**
4. **S3 互換 endpoint**

この 4 つが正しければ、Origami は添付を upload / download できます。

Cloudflare の画面には色々出てきますが、持ち帰る値は意外と少ないです。

---

## 始める前に、先にメモしておくと楽な値

例えば次のように先に書いておくと、あとで混乱しにくいです。

```txt
Cloudflare Account ID = ...
Bucket name = origami-attachments-prod
R2 endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

環境を分けるなら、名前は次のようにすると分かりやすいです。

- 開発: `origami-attachments-dev`
- 本番: `origami-attachments-prod`

> 強くおすすめ: development と production は bucket を分ける。

---

## もし画面がこのページと少し違って見えても

Cloudflare も UI を変えることがありますが、次のキーワードが見つかれば大丈夫です。

- `R2 Object Storage`
- `Buckets`
- `Manage R2 API tokens`
- `Account ID`

メニューの位置が少し違っても、検索とページ見出しを優先して探してください。

---

## ベビーステップ: R2 をゼロから設定する

### Step 1: Cloudflare Dashboard にログイン

開く：

- <https://dash.cloudflare.com/>

Cloudflare のアカウントに入ります。

---

### Step 2: Account ID を確認する

まだ Account ID が分からない場合：

1. Cloudflare Dashboard を開く
2. **Account home** または **Workers & Pages** に移動
3. **Account ID** を探す
4. コピーする

公式説明：

- <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

後で `R2_ENDPOINT` を作るときに使います。

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### この時点で、次の 2 行をメモしておくと便利です

```txt
R2_ACCOUNT_ID=<自分の Account ID>
R2_ENDPOINT=https://<自分の Account ID>.r2.cloudflarestorage.com
```

---

### Step 3: bucket を作る

進む先：

- **R2 Object Storage**

そこで bucket を作成します。

おすすめ名：

- `origami-attachments-dev`
- `origami-attachments-prod`

こうしておくと環境がすぐ分かります。

### このステップで一番大事なのは高度な設定ではなく、次の 2 点です

1. **環境が分かる名前にすること**
2. **最後に作った exact bucket name を覚えておくこと**

あとで `.env` にこのまま入れます。

```txt
R2_BUCKET_NAME=origami-attachments-prod
```

公式説明：

- <https://developers.cloudflare.com/r2/buckets/create-buckets/>

---

### Step 4: R2 API token を作る

Cloudflare Dashboard で次へ進みます。

- **R2 Object Storage**
- **Manage R2 API tokens**

通常、次のような入口があります。

- **Create Account API token**
- **Create User API token**

個人用途ならどちらでも動くことが多いですが、最小権限の考え方としては：

- **Object Read & Write**
- 作成した bucket のみに scope

が安全です。

つまり、Origami には「その bucket の中身を読む・書く」だけを許可します。

公式説明：

- <https://developers.cloudflare.com/r2/api/tokens/>

---

### Step 5: Access Key / Secret Access Key を保存する

token 作成後に表示される：

- **Access Key ID**
- **Secret Access Key**

を保存して、次に入れます。

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

> Secret は後から再表示されないことが多いので、その場で保存してください。

---

### Step 6: bucket 名を `.env` に入れる

本番 bucket を作ったなら：

```txt
R2_BUCKET_NAME=origami-attachments-prod
```

開発環境なら dev bucket 名を入れます。

ここで起きやすいミスは：

- token は prod bucket 向け
- `.env` は dev bucket 名

という食い違いです。見た目は少しの差ですが、結果は upload failure になります。

---

### Step 7: endpoint を `.env` に入れる

`R2_ENDPOINT` の形式は固定です。

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

例：

```txt
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

必要なら `R2_ACCOUNT_ID` も残します。

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
```

---

## 最小 `.env` 例

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

---

## 設定後は、この順番で確認すると早い

1 項目ずつ確認してください。

- `R2_ACCOUNT_ID` は正しい Cloudflare account のものか
- `R2_ENDPOINT` は `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` と完全一致しているか
- `R2_BUCKET_NAME` は実際に作った bucket 名そのものか
- `R2_ACCESS_KEY_ID` と `R2_SECRET_ACCESS_KEY` を入れ替えていないか
- token 権限は **Object Read & Write** 以上あるか
- token の scope にその bucket が含まれているか

この 6 項目が合っていれば、R2 設定はかなり高確率で通っています。

---

## 本当に設定できたか、どう確認する？

一番分かりやすい実地確認は次です。

1. Origami を起動
2. ログイン
3. compose を開く
4. 小さい添付をアップロード
5. 送信または保存まで流れを通す
6. 後でその添付をダウンロードしてみる

upload と download の両方が通れば、R2 設定はほぼ正しいです。

---

## よくある問題を早く見抜くには

### 1. endpoint が間違っている

最も多いです。`R2_ENDPOINT` は完全な形で入れてください。

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

漏れやすいのは：

- `https://`
- `.r2.cloudflarestorage.com`

### 2. Access Key と Secret を逆に入れた

とてもよくあります。

- `R2_ACCESS_KEY_ID` と `R2_SECRET_ACCESS_KEY` は別物です

### 3. token に object read/write 権限がない

権限が小さすぎると、Origami は起動しても添付 upload が失敗します。

最小推奨：

- **Object Read & Write**
- 対象 bucket に scope

### 4. bucket 名や環境が食い違っている

例えば：

- production が dev bucket を向いている
- bucket 自体が作られていない
- token は prod 用なのに `.env` は別の bucket 名

見た目は「upload failure」でも、本質は bucket / permission mismatch です。

### 5. 別アカウントの Account ID を使っている

Cloudflare account を複数持っていると起きやすいです。

すると：

- endpoint は正しそうに見える
- token も本物に見える
- でも endpoint / token / bucket が同じ account に属していない

という嫌な状態になります。

### 6. bucket を公開しないとダメだと思っている

通常は**不要**です。

Origami はサーバー側で添付の upload / download を制御するため、bucket を公開公開する必要はありません。

---

## 実運用でのおすすめ

一番安全なのは：

1. `origami-attachments-dev` と `origami-attachments-prod` を分ける
2. token 権限は **Object Read & Write** のみにする
3. token は単一 bucket に scope する
4. `R2_ACCOUNT_ID` も `.env` に残しておく

地味ですが、これが一番事故りにくいです。

---

## 次に読むページ

- [Gmail OAuth 詳細設定](/ja/gmail-oauth)
- [Outlook OAuth 詳細設定](/ja/outlook-oauth)
