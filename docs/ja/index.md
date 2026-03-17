---
layout: home

hero:
  name: Origami
  text: 個人と単独オペレーター向けの統合受信箱
  tagline: Gmail、Outlook、IMAP/SMTP メールを一つの画面に集約し、自前運用向けの整理・検索・送信・同期フローを提供します。
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
    details: 初期同期は軽量に行い、本文と添付は必要時に取得します。
  - title: OAuth app 管理
    details: Gmail と Outlook は env 既定 app と DB 管理 app の両方をサポートします。
  - title: 自前運用向け
    details: ドキュメントは Vercel、Turso、R2 を前提とした本番導入経路で整理されています。
---

## プロダクトの位置付け

Origami は **単一ユーザー向けの統合受信箱** です。

ヘルプデスク製品ではなく、各 provider の全機能を再現することも目的としていません。目的はより明確です。

> 一人のオペレーターが複数メールアカウントを一箇所で読み、整理し、検索し、送信し、同期できるようにすること。

## Provider 対応表

| Provider | 受信 | 送信 | 認証 | 同期 |
|---|---|---|---|---|
| Gmail | ✅ | ✅ | Google OAuth | Read / Star |
| Outlook | ✅ | ✅ | Microsoft OAuth | Read / Star |
| QQ | ✅ | ✅ | IMAP/SMTP 認証コード | Read / Star |
| 汎用 IMAP/SMTP | ✅ | ✅ | ユーザー名 + パスワード / 認証コード | IMAP フラグに依存 |

## 推奨読書順

本番インスタンスを導入する場合は、次の順で読むことを推奨します。

1. [クイックスタート](/ja/quick-start)
2. [デプロイ](/ja/deployment)
3. [Turso データベース詳細設定](/ja/turso)
4. [Cloudflare R2 / bucket 詳細設定](/ja/r2-storage)
5. [GitHub Auth 詳細設定](/ja/github-auth)
6. [Gmail OAuth 詳細設定](/ja/gmail-oauth)
7. [Outlook OAuth 詳細設定](/ja/outlook-oauth)

## 開発ドキュメント

ローカル開発とデバッグは主導線から分離しています。

- [開発とデバッグ](/ja/development)

## さらに読む

- [FAQ](/ja/faq)
- [アーキテクチャ](/ja/architecture)
- [プロジェクト構成](/ja/project-structure)
