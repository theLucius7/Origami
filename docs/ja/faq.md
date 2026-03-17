# FAQ

## なぜ `db:migrate` ではなく `db:setup` を推奨するのですか？

新規環境では `db:setup` の方が素直だからです。
歴史 migration を意識せず、現在必要な schema と補助構造を整えられます。

## なぜ Done / Archive / Snooze はローカルだけなのですか？

provider ごとに意味や実装が大きく異なるためです。
ローカル状態として扱うことで、UI と同期モデルを安定させています。

## なぜ Read / Star は同期できるのですか？

それらはメールボックスのネイティブ状態に近く、他クライアントとの整合性価値が高いからです。

## なぜ「グローバル write-back トグル」は全アカウントを一括で有効化しないのですか？

Origami における “global” は**一括設定**であって、無条件の強制有効化ではありません。  
メール同期自体はできても、write-back に必要な provider capability や permission scope が不足しているアカウントがあります。

現在の挙動は次の通りです。

- グローバル Read / Star write-back を **ON** にすると、対応可能なアカウントだけが対象になる
- **OFF** にすると、全アカウントに適用できる
- スキップされたアカウントは Accounts ページで理由（再認可が必要など）を引き続き確認できる

これにより、「UI 上は ON なのに remote には絶対反映されない」という誤解を避けています。

## なぜ同期後に Inbox からメールが消えることがあるのですか？

多くの場合、これはローカルで消えたのではなく、remote の状態とようやく一致したという意味です。  
remote 側で削除されたメールや Inbox 外へ移動したメールは、次回同期で既定の Inbox 一覧から除外されます。

これは stale な Inbox 項目を残し続けるより、実際のメールボックス状態に近い挙動です。  
同じメールが後で Inbox に戻れば、通常同期で再表示されます。

## QQ 送信は対応していますか？

はい。現在は IMAP 受信 + SMTP 送信に対応しています。

## なぜ Origami は単一ユーザーなのですか？

一人のオペレーターが複数 inbox を管理するユースケースに集中しているためです。
そのおかげで、認証・運用・保守がかなり軽くなっています。

## GitHub サインインがうまく動かないときは何を確認すればいいですか？

まずは次の順番で確認すると早いです。

1. `NEXT_PUBLIC_APP_URL` が実際に開いている URL と一致しているか
2. GitHub OAuth App の **Homepage URL** がアプリ URL と一致しているか
3. GitHub OAuth App の **Authorization callback URL** が正確に次になっているか
   - `http://localhost:3000/api/auth/github/callback`
   - または `https://your-domain/api/auth/github/callback`
4. `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` が別環境の値になっていないか、コピーミスがないか
5. 公開運用なら `GITHUB_ALLOWED_LOGIN` が意図通り設定されているか
6. すでに owner が確定済みなら、その owner の GitHub アカウントでログインしているか

よくあるケース：

- **リダイレクト直後に callback エラー**：callback URL か secret の不一致が多いです
- **ログイン画面は見えるのに入れない**：`GITHUB_ALLOWED_LOGIN` が効いている可能性があります
- **GitHub の login 名を変えた**：通常は問題ありません。Origami は user id で owner を見ます
- **間違った owner を bind してしまった**：通常は `app_installation` をクリアして初期化し直します
