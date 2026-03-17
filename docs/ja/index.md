---
layout: home

hero:
  name: Origami
  text: 個人と単独オペレーター向けの統合受信箱
  tagline: Gmail、Outlook、国内 IMAP/SMTP メールを一つの画面に集約し、自前運用しやすく設計されています。
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
    details: 複数のメールボックスを一つのタイムラインで確認できます。
  - title: ローカル優先の整理
    details: Done / Archive / Snooze はローカルに保持し、Read / Star は必要に応じて同期します。
  - title: 送信と送信履歴
    details: Gmail、Outlook、IMAP/SMTP から新規送信でき、ローカル送信履歴も確認できます。
  - title: metadata-first 同期
    details: 最初は軽量メタデータを優先し、本文や添付は必要時に取得します。
  - title: OAuth app 管理
    details: 環境変数の既定 app と DB 管理 app の両方に対応します。
  - title: 自前運用しやすい
    details: Vercel + Turso + R2 を前提に、運用経路を分かりやすく保っています。
---

## Origami とは

Origami は **単一ユーザー向けの統合受信箱** です。  
ヘルプデスク製品でも、すべての provider の機能を完全再現するプロジェクトでもありません。

狙いはもっと実用的です。

> 一人のオペレーターが複数メールアカウントを一箇所で整理し、検索し、送信し、同期できること。

## 主な機能

- Gmail / Outlook / QQ / 汎用 IMAP/SMTP の対応
- env 既定 app + DB 管理 app の OAuth app 構成
- ローカル Done / Archive / Snooze
- Read / Star の任意同期
- 添付付き送信とローカル送信履歴
- metadata-first 同期

## Provider 対応表

| Provider | 受信 | 送信 | 認証 | 同期 |
|---|---|---|---|---|
| Gmail | ✅ | ✅ | Google OAuth | Read / Star |
| Outlook | ✅ | ✅ | Microsoft OAuth | Read / Star |
| QQ | ✅ | ✅ | IMAP/SMTP 認証コード | Read / Star |
| 汎用 IMAP/SMTP | ✅ | ✅ | ユーザー名 + パスワード / 認証コード | IMAP フラグに依存 |

## おすすめの読み順

1. [クイックスタート](/ja/quick-start)
2. [デプロイ](/ja/deployment)
3. [FAQ](/ja/faq)
4. [アーキテクチャ](/ja/architecture)
5. [プロジェクト構成](/ja/project-structure)
