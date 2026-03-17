---
layout: home

hero:
  name: Origami
  text: 面向个人与单席位团队的统一收件箱
  tagline: 聚合 Gmail、Outlook 与国内 IMAP/SMTP 邮箱，强调自托管、隐私与低心智负担。
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
    details: 多个邮箱聚合到同一时间线，减少来回切换账号的成本。
  - title: 本地优先 triage
    details: Done、Archive、Snooze 保持在 Origami 本地；Read / Star 可按账号选择回写。
  - title: 发信与已发送记录
    details: 可通过 Gmail、Outlook 与 IMAP/SMTP 邮箱发新邮件，并保存本地 sent history。
  - title: metadata-first 同步
    details: 先抓标题、发件人、摘要，正文与附件在打开详情时再补齐。
  - title: OAuth app 管理
    details: Gmail / Outlook 既支持环境变量默认 app，也支持数据库中托管的 app 配置。
  - title: 自托管友好
    details: 面向 Vercel + Turso + R2 组合，同时保留足够透明的部署与数据路径。
---

## Origami 是什么

Origami 是一个**单用户统一收件箱**。  
它不是企业工单系统，也不打算模拟所有 provider 的原生行为，而是专注解决一个更具体的问题：

> 当你同时管理多个邮箱时，如何在一个界面里完成收件、分拣、搜索、发信与同步，而不失去对数据与部署方式的掌控？

它尤其适合：

- 个人多邮箱场景
- 自媒体 / 独立开发者 / 自由职业者
- 小团队里只有一个人处理收件箱
- 想自己部署、而不想上重型客服系统的人

## 核心能力一览

### 邮箱接入

- Gmail（OAuth）
- Outlook（OAuth）
- QQ / 163 / 126 / Yeah / 自定义 IMAP/SMTP 邮箱

### 本地生产力层

Origami 会把以下状态定义为**本地状态**：

- Done
- Archive
- Snooze
- Local sent history

这样做的意义是：统一、稳定、可预测。

### 选择性回写

对于更接近邮箱原生状态的字段：

- Read
- Star

Origami 支持在账号级开启回写。  
如果 provider 不支持、scope 缺失或暂时失败，本地操作依然能继续完成。

## Provider 支持矩阵

| Provider | 收件 | 发信 | 认证方式 | 回写 |
|---|---|---|---|---|
| Gmail | ✅ | ✅ | Google OAuth | Read / Star |
| Outlook | ✅ | ✅ | Microsoft OAuth | Read / Star |
| QQ | ✅ | ✅ | IMAP/SMTP 授权码 | Read / Star |
| 通用 IMAP/SMTP | ✅ | ✅ | 用户名 + 密码 / 授权码 | 视 IMAP 标记能力而定 |

## 为什么要做成“单用户”

因为这个项目的目标不是做复杂协作，而是让一个人把多个邮箱管理清楚。

单用户带来的直接好处：

- 鉴权模型更简单
- 配置成本更低
- 数据路径更透明
- UI 和数据模型都可以围绕“一个操作员”优化

如果后续要发展多用户能力，也应该建立在这个核心模型已经稳定的前提下，而不是一开始就把项目做成一个臃肿平台。

## 推荐阅读顺序

如果你第一次接触 Origami，推荐按下面顺序看：

1. [快速开始](/quick-start)
2. [部署指南](/deployment)
3. [FAQ](/faq)
4. [架构说明](/architecture)
5. [项目结构](/project-structure)
