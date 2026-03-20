---
layout: home

hero:
  name: Origami
  text: 面向个人与单席位团队的统一收件箱
  tagline: 聚合 Gmail、Outlook 与国内 IMAP/SMTP 邮箱，提供适合自托管场景的统一收件、分拣、发信与同步能力。
  actions:
    - theme: brand
      text: 快速开始
      link: /quick-start
    - theme: alt
      text: 部署指南
      link: /deployment
    - theme: alt
      text: GitHub
      link: https://github.com/theLucius7/Origami

features:
  - title: 统一收件箱
    details: 将多个邮箱汇总到同一时间线，减少来回切换账号的成本。
  - title: 本地优先的整理模型
    details: Done、Archive、Snooze 保持在 Origami 本地，Read / Star 可按账号选择回写。
  - title: 发信与已发送记录
    details: 可通过 Gmail、Outlook 与 IMAP/SMTP 邮箱发信，并保留本地 sent history。
  - title: metadata-first 同步
    details: 首次同步优先抓取标题、发件人和摘要，正文与附件在需要时再补齐。
  - title: OAuth app 管理
    details: Gmail 与 Outlook 同时支持环境变量默认 app 和数据库托管 app。
  - title: 自托管友好
    details: 默认围绕 Vercel、Neon PostgreSQL 与 R2 组织部署路径，数据路径明确，运维成本可控。
---

## 产品定位

Origami 是一个**单用户统一收件箱**。

它不追求复刻各个邮箱服务的全部原生能力，也不试图变成复杂的客服平台。它解决的是更具体的问题：

> 用一个界面管理多个邮箱账号，并在自托管前提下完成收件、整理、搜索、发信与同步。

适用场景包括：

- 个人多邮箱管理
- 独立开发者、自媒体与自由职业者
- 只有单一操作员的小团队
- 希望保留部署控制权与数据控制权的自托管用户

## 核心能力

### 邮箱接入

- Gmail（OAuth）
- Outlook（OAuth）
- QQ / 163 / 126 / Yeah / 自定义 IMAP/SMTP

### 本地生产力层

Origami 将以下状态定义为本地状态：

- Done
- Archive
- Snooze
- Local sent history

这种设计的目标是让跨 provider 行为保持一致。

### 选择性回写

对于更接近邮箱原生状态的字段：

- Read
- Star

Origami 支持按账号开启回写。即使 provider 不支持或 scope 不足，本地操作仍可继续完成。

## Provider 支持矩阵

| Provider | 收件 | 发信 | 认证方式 | 回写 |
|---|---|---|---|---|
| Gmail | ✅ | ✅ | Google OAuth | Read / Star |
| Outlook | ✅ | ✅ | Microsoft OAuth | Read / Star |
| QQ | ✅ | ✅ | IMAP/SMTP 授权码 | Read / Star |
| 通用 IMAP/SMTP | ✅ | ✅ | 用户名 + 密码 / 授权码 | 视 IMAP 标记能力而定 |

## 先看哪一页？

如果你是第一次打开文档站，建议别从头乱翻，按你的目标直接选入口：

- **我只想尽快上线一套能用的实例**：看 [快速开始](/quick-start)
- **我想按完整生产流程一步一步配，不想漏项**：看 [部署指南](/deployment)
- **我卡在某个第三方平台后台，不确定下一步点哪里**：直接看 [Neon PostgreSQL](/neon)、[R2](/r2-storage)、[GitHub Auth](/github-auth)、[Gmail OAuth](/gmail-oauth)、[Outlook OAuth](/outlook-oauth)
- **我要本地开发 / 改代码 / 调试 OAuth**：看 [开发与调试](/development)
- **我想先理解这个项目到底怎么分层**：看 [架构说明](/architecture) 和 [项目结构](/project-structure)

## 推荐阅读顺序

### 路线 A：尽快上线

1. [快速开始](/quick-start)
2. [部署指南](/deployment)
3. 遇到具体平台配置卡点时，再分别看详细教程

### 路线 B：完整生产部署

1. [部署指南](/deployment)
2. [Neon PostgreSQL 详细配置](/neon)
3. [Cloudflare R2 / Bucket 详细配置](/r2-storage)
4. [GitHub Auth 详细配置](/github-auth)
5. [Gmail OAuth 详细配置](/gmail-oauth)
6. [Outlook OAuth 详细配置](/outlook-oauth)
7. 最后回到 [快速开始](/quick-start) 做上线检查

### 路线 C：本地开发与二次修改

1. [开发与调试](/development)
2. [项目结构](/project-structure)
3. [架构说明](/architecture)

## 开发文档

本地开发、调试与贡献流程已单独拆分，不再放在主部署路径中：

- [开发与调试](/development)

## 进一步阅读

- [FAQ](/faq)
- [架构说明](/architecture)
- [项目结构](/project-structure)
