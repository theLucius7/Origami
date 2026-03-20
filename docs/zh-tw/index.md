---
layout: home

hero:
  name: Origami
  text: 面向個人與單席位團隊的統一收件匣
  tagline: 聚合 Gmail、Outlook 與 IMAP/SMTP 信箱，在自託管場景中提供統一收件、整理、發信與同步能力。
  actions:
    - theme: brand
      text: 快速開始
      link: /zh-tw/quick-start
    - theme: alt
      text: 部署指南
      link: /zh-tw/deployment
    - theme: alt
      text: GitHub
      link: https://github.com/theLucius7/Origami

features:
  - title: 統一收件匣
    details: 將多個信箱整合到同一時間線，減少來回切換帳號的成本。
  - title: 本地優先整理模型
    details: Done、Archive、Snooze 保留在 Origami 本地，Read / Star 可依帳號選擇是否回寫。
  - title: 發信與送件歷史
    details: 可透過 Gmail、Outlook 與 IMAP/SMTP 發信，並保留本地 sent history。
  - title: metadata-first 同步
    details: 初次同步先抓元資料，正文與附件在需要時再補抓。
  - title: OAuth app 管理
    details: Gmail 與 Outlook 同時支援環境變數預設 app 與資料庫託管 app。
  - title: 自託管友善
    details: 正式部署路徑預設圍繞 Vercel、Neon PostgreSQL 與 Cloudflare R2 組織。
---

## 產品定位

Origami 是一個 **單使用者統一收件匣**。

它不追求完整複製每個 provider 的所有原生功能，也不打算變成複雜的客服平台。它想解決的是更明確的問題：

> 用一個介面管理多個信箱帳號，並在自託管前提下完成收件、整理、搜尋、發信與同步。

適合的場景包括：

- 個人多信箱管理
- 獨立開發者、自媒體與自由工作者
- 只有單一操作者的小團隊
- 想保留部署控制權與資料控制權的自託管使用者

## 核心能力

### 信箱接入

- Gmail（OAuth）
- Outlook（OAuth）
- QQ / 163 / 126 / Yeah / 自訂 IMAP/SMTP

### 本地生產力層

Origami 將以下狀態定義為本地狀態：

- Done
- Archive
- Snooze
- Local sent history

這樣做的目標是讓跨 provider 的操作體驗更一致。

### 選擇性回寫

對於更接近信箱原生狀態的欄位：

- Read
- Star

Origami 支援依帳號開啟回寫。即使 provider 不支援或 scope 不足，本地操作仍可照常完成。

## Provider 支援矩陣

| Provider | 收件 | 發信 | 認證方式 | 回寫 |
|---|---|---|---|---|
| Gmail | ✅ | ✅ | Google OAuth | Read / Star |
| Outlook | ✅ | ✅ | Microsoft OAuth | Read / Star |
| QQ | ✅ | ✅ | IMAP/SMTP 授權碼 | Read / Star |
| 通用 IMAP/SMTP | ✅ | ✅ | 使用者名稱 + 密碼 / 授權碼 | 視 IMAP 標記能力而定 |

## 先看哪一頁？

如果你是第一次打開文件站，建議不要從頭亂翻，先按你的目標選入口：

- **我只想盡快上線一套能用的實例**：看 [快速開始](/zh-tw/quick-start)
- **我想按完整正式流程一步一步配，不想漏項**：看 [部署指南](/zh-tw/deployment)
- **我卡在某個第三方平台後台，不確定下一步要點哪裡**：直接看 [Neon PostgreSQL](/zh-tw/neon)、[R2](/zh-tw/r2-storage)、[GitHub Auth](/zh-tw/github-auth)、[Gmail OAuth](/zh-tw/gmail-oauth)、[Outlook OAuth](/zh-tw/outlook-oauth)
- **我要本地開發 / 改程式碼 / 除錯 OAuth**：看 [開發與除錯](/zh-tw/development)
- **我想先理解這個專案怎麼分層**：看 [架構](/zh-tw/architecture) 和 [專案結構](/zh-tw/project-structure)

## 建議閱讀路線

### 路線 A：盡快上線

1. [快速開始](/zh-tw/quick-start)
2. [部署指南](/zh-tw/deployment)
3. 遇到具體平台卡點時，再回頭看對應詳細教學

### 路線 B：完整正式部署

1. [部署指南](/zh-tw/deployment)
2. [Neon PostgreSQL 詳細配置](/zh-tw/neon)
3. [Cloudflare R2 / Bucket 詳細配置](/zh-tw/r2-storage)
4. [GitHub Auth 詳細配置](/zh-tw/github-auth)
5. [Gmail OAuth 詳細配置](/zh-tw/gmail-oauth)
6. [Outlook OAuth 詳細配置](/zh-tw/outlook-oauth)
7. 最後回到 [快速開始](/zh-tw/quick-start) 做上線檢查

### 路線 C：本地開發與二次修改

1. [開發與除錯](/zh-tw/development)
2. [專案結構](/zh-tw/project-structure)
3. [架構](/zh-tw/architecture)

## 開發文件

本地開發、除錯與貢獻流程已獨立整理：

- [開發與除錯](/zh-tw/development)

## 進一步閱讀

- [FAQ](/zh-tw/faq)
- [架構](/zh-tw/architecture)
- [專案結構](/zh-tw/project-structure)
