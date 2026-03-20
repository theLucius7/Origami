# FAQ

## なぜ `db:setup` ではなく `db:migrate` を標準推奨にしないのですか？

`db:setup` は **新規環境** に向いているからです。  
これは「今必要な schema と基礎構造をすぐ使える状態にする」ための入口であって、「プロジェクトの歴史 migration を最初から全部追体験する」ための入口ではありません。

初めて Origami を導入する人の多くが欲しいのは、歴史の再生ではなく、今のバージョンがすぐ動くことです。

## 新規環境で `db:push` を最初に勧めないのはなぜですか？

`db:push` は「今の schema 変更がどう反映されるかを自分で理解している」前提の強い開発者向けコマンドだからです。  
ローカル開発では便利ですが、まっさらな本番環境の標準入口としてはあまり向いていません。

新しいインスタンスを初めて立てるなら、まずは：

```bash
npm run db:setup
```

そのうえで、DB 状態、migration 方針、リスクを把握している場合だけ `db:migrate` や `db:push` を検討してください。

## なぜ Done / Archive / Snooze はローカルだけなのですか？

これらの状態は provider ごとに意味や実装がかなり違うためです。  
Origami では **ローカル生産性状態** として扱うことで、次の利点を取っています。

- UI の一貫性
- 実装複雑度の低減
- 同期ロジックの安定化

## なぜ Read / Star は同期できるのですか？

これらはメールボックスのネイティブ状態に近く、他クライアントと揃っている価値が高いからです。  
そのため Origami では **任意機能** として扱い、可能なときだけ write-back します。できなくてもローカル操作は止めません。

## なぜ「グローバル write-back トグル」は全アカウントを一括で有効化しないのですか？

Origami における “global” は **一括設定** であって、無条件の強制有効化ではありません。  
メール同期自体はできても、write-back に必要な provider capability や permission scope が不足しているアカウントがあります。

現在の挙動は次の通りです。

- グローバル Read / Star write-back を **ON** にすると、対応可能なアカウントだけが対象になる
- **OFF** にすると、全アカウントに適用できる
- スキップされたアカウントは Accounts ページで理由（再認可が必要など）を引き続き確認できる

これにより、「UI 上は ON なのに remote には絶対反映されない」という誤解を避けています。

## なぜ同期後に Inbox からメールが消えることがあるのですか？

多くの場合、これはローカルで消えたのではなく、remote の状態とようやく一致したという意味です。  
remote 側で削除されたメールや Inbox 外へ移動したメールは、次回同期で既定の Inbox 一覧から除外されます。

stale な Inbox 項目を残し続けるより、実際のメールボックス状態に近い挙動です。  
同じメールが後で Inbox に戻れば、通常同期で再表示されます。

## なぜ Origami は単一ユーザーなのですか？

単一ユーザーは「機能不足」ではなく、現在のプロダクト境界そのものだからです。  
そのおかげで：

- ログインモデルが軽い
- デプロイが簡単
- トラブルシュートが速い
- ドキュメントが明快

## GitHub サインインがうまく動かないときは何を確認すればいいですか？

まずは次の順で確認すると早いです。

1. `NEXT_PUBLIC_APP_URL` が実際に開いている URL と一致しているか
2. GitHub OAuth App の **Homepage URL** がアプリ URL と一致しているか
3. GitHub OAuth App の **Authorization callback URL** が正確に次になっているか
   - `http://localhost:3000/api/better-auth/callback/github`
   - または `https://your-domain/api/better-auth/callback/github`
4. `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` が別環境の値になっていないか、空白混入やコピーミスがないか
5. 公開運用なら `GITHUB_ALLOWED_LOGIN` が意図通り設定されているか
6. すでに owner が確定済みなら、その owner の GitHub アカウントでログインしているか

よくあるケース：

- **リダイレクト直後に callback エラー**：callback URL か client secret の不一致が多いです
- **ログイン画面は見えるのに入れない**：`GITHUB_ALLOWED_LOGIN` が効いている可能性があります
- **GitHub の login 名を変えた**：通常は問題ありません。Origami は user id で owner を見ます
- **間違った owner を bind してしまった**：通常は `app_installation` をクリアして初期化し直します

## なぜ `NEXT_PUBLIC_APP_URL` と OAuth callback は同じ本番ドメインで揃えるべきなのですか？

Origami のログインやメール認可は、基本的に「自サイトから第三者へ飛び、また自サイトへ戻る」流れだからです。  
Origami が認識している URL、ブラウザで開いている URL、provider 側に登録した callback が別ドメインだと、次のような問題が起きやすくなります。

- ログイン後に戻れない
- callback URL mismatch
- 認可は通ったのに session が一致しない
- preview では動くのに production だけ壊れる

つまり：**本番では、アプリ URL と callback を可能な限り同じ最終ドメインに揃えるべきです。**

## Vercel の preview ドメインで始めて、あとから本番ドメインに切り替えてもいいですか？

テスト用途なら構いませんが、**本番導入の本道としてはあまりおすすめしません**。  
後で本番ドメインに切り替えると、通常は次も一緒に直す必要があります。

- `NEXT_PUBLIC_APP_URL`
- GitHub OAuth callback
- Gmail OAuth redirect URI
- Outlook OAuth redirect URI

UI が立ち上がるかだけ確認したいなら preview で十分です。  
実アカウント接続、OAuth、実データ保存まで始めるなら、先に本番ドメインを決めた方が安全です。

## 複数アカウントや複数 OAuth app を使うのは大変ですか？

いいえ。  
Origami はすでに次をサポートしています。

- 複数メールアカウント
- 複数の Gmail / Outlook OAuth app
- env 既定 app と DB 管理 app の併用

## Gmail / Outlook の OAuth app は必ず環境変数に置く必要がありますか？

必須ではありません。  
`GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET`、`OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` は「既定 app」と考えると近いです。

これらを設定しなくても、`/accounts` 内で DB 管理の OAuth app を扱えます。違いとしては：

- **環境変数の既定 app**：すでに安定した本番構成があり、すぐ使いたい場合に向く
- **DB 管理 app**：アプリ内で複数 app を管理したい、アカウントごとに分けたい場合に向く

## QQ 送信は対応していますか？

はい。  
現在は IMAP 受信 + SMTP 送信に対応しており、昔の読み取り専用互換レイヤーではありません。

## なぜ添付は R2 に置くのですか？

添付は大きなバイナリオブジェクトだからです。  
RDB から切り離すことで：

- データベース負荷を下げられる
- バックアップと検索の負担を減らせる
- 本文やメタデータ中心の問い合わせを軽くできる

## 最小構成だけ知りたいなら、どのページを見ればいいですか？

次の順がおすすめです。

1. [ホーム](/ja/)
2. [クイックスタート](/ja/quick-start)
3. [デプロイ](/ja/deployment)

## コードの入口を知りたいときは、どこから始めればいいですか？

次を見てください。

- [プロジェクト構成](/ja/project-structure)
- [アーキテクチャ](/ja/architecture)
