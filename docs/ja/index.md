---
layout: home

hero:
  name: Origami
  text: 個人と単独オペレーター向けの統合受信箱
  tagline: Gmail、Outlook、IMAP/SMTP メールを一つの画面に集約し、自前運用向けの整理・送信・同期フローを提供します。
  actions:
    - theme: brand
      text: クイックスタート
      link: /ja/quick-start
    - theme: alt
      text: デプロイ
      link: /ja/deployment
    - theme: alt
      text: GitHub
      link: https://github.com/theLucius7/Origami

features:
  - title: 統合受信箱
    details: 複数メールボックスを一つのタイムラインで管理できます。
  - title: ローカル優先の整理
    details: Done、Archive、Snooze はローカルに保持し、Read / Star は必要に応じて同期します。
  - title: 送信と送信履歴
    details: Gmail、Outlook、IMAP/SMTP 経由で送信でき、ローカル送信履歴も保持します。
  - title: metadata-first 同期
    details: 初回同期は軽量に行い、本文と添付は必要時に取得します。
  - title: OAuth app 管理
    details: Gmail と Outlook は env 既定 app と DB 管理 app の両方をサポートします。
  - title: 自前運用向け
    details: 本番導入の導線は Vercel、Neon PostgreSQL、Cloudflare R2 を前提に整理されています。
---

## プロダクトの位置付け

Origami は **単一ユーザー向けの統合受信箱** です。

ヘルプデスク製品ではなく、各 provider の全機能を再現することも目的としていません。解決したい問題はもっと明確です。

> 一人のオペレーターが複数メールアカウントを一箇所で読み、整理し、検索し、送信し、同期できるようにすること。

向いている利用シーン：

- 個人の複数メール管理
- インディー開発者、クリエイター、フリーランス
- 単独オペレーターの小規模チーム
- デプロイ権限とデータ管理権限を自分で持ちたい self-hosting ユーザー

## 主な機能

### メール接続

- Gmail（OAuth）
- Outlook（OAuth）
- QQ / 163 / 126 / Yeah / カスタム IMAP/SMTP

### ローカル生産性レイヤー

Origami では次の状態をローカル状態として扱います。

- Done
- Archive
- Snooze
- Local sent history

この設計により、provider をまたいでも操作感を揃えやすくなります。

### 選択的 write-back

次のような、メールボックス本来の状態に近い項目については：

- Read
- Star

アカウント単位で write-back を有効化できます。provider が未対応でも、ローカル操作自体は継続できます。

## Provider 対応表

| Provider | 受信 | 送信 | 認証 | write-back |
|---|---|---|---|---|
| Gmail | ✅ | ✅ | Google OAuth | Read / Star |
| Outlook | ✅ | ✅ | Microsoft OAuth | Read / Star |
| QQ | ✅ | ✅ | IMAP/SMTP 認証コード | Read / Star |
| 汎用 IMAP/SMTP | ✅ | ✅ | ユーザー名 + パスワード / 認証コード | IMAP フラグに依存 |

## まずどのページを読むべき？

最初から全部読む必要はありません。目的に合う入口から入るのが一番早いです。

- **できるだけ早く本番インスタンスを立ち上げたい** → [クイックスタート](/ja/quick-start)
- **本番導入を漏れなく確認しながら進めたい** → [デプロイ](/ja/deployment)
- **外部サービスの管理画面で詰まっている** → [Neon PostgreSQL](/ja/neon)、[R2](/ja/r2-storage)、[GitHub Auth](/ja/github-auth)、[Gmail OAuth](/ja/gmail-oauth)、[Outlook OAuth](/ja/outlook-oauth)
- **ローカル実行、コード変更、OAuth デバッグをしたい** → [開発とデバッグ](/ja/development)
- **構造を先に理解したい** → [アーキテクチャ](/ja/architecture) と [プロジェクト構成](/ja/project-structure)

## 推奨読書ルート

### ルート A：まず本番で動かす

1. [クイックスタート](/ja/quick-start)
2. [デプロイ](/ja/deployment)
3. 外部サービス設定で詰まったところだけ詳細ページを読む

### ルート B：本番導入を丁寧に進める

1. [デプロイ](/ja/deployment)
2. [Neon PostgreSQL 詳細設定](/ja/neon)
3. [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
4. [GitHub Auth 詳細設定](/ja/github-auth)
5. [Gmail OAuth 詳細設定](/ja/gmail-oauth)
6. [Outlook OAuth 詳細設定](/ja/outlook-oauth)
7. 最後に [クイックスタート](/ja/quick-start) へ戻って本番チェックを行う

### ルート C：ローカル開発とコード変更

1. [開発とデバッグ](/ja/development)
2. [プロジェクト構成](/ja/project-structure)
3. [アーキテクチャ](/ja/architecture)

## 開発ドキュメント

ローカル開発、デバッグ、コントリビュート向けの流れは別ページにまとめています。

- [開発とデバッグ](/ja/development)

## さらに読む

- [FAQ](/ja/faq)
- [アーキテクチャ](/ja/architecture)
- [プロジェクト構成](/ja/project-structure)
