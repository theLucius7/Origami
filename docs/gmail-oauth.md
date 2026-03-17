# Gmail OAuth 详细配置

这页讲的是：**怎么把 Gmail 账号接入 Origami**。

它不是 GitHub 登录：

- **GitHub 登录**：让你进入 Origami 后台
- **Gmail OAuth**：让 Origami 拿到 Gmail 邮箱的访问权限

如果你现在的目标是：

> “我已经能登录 Origami 了，现在我想把 Gmail 真正接进去。”

那就做这页。

---

## 先说结论：你最终要得到什么？

如果你打算先走最简单的环境变量方案，你最终要把这些值放进 `.env`：

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

通常还会和下面这个一起出现：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

因为 Google OAuth redirect URI 要和 Origami 的地址对应起来。

---

## Origami 目前会请求哪些 Gmail scopes？

按当前代码，Origami 主要会请求：

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

相关代码位置：

- `src/lib/providers/gmail.ts`

官方 scopes 说明：

- <https://developers.google.com/workspace/gmail/api/auth/scopes>

---

## 两种配置方式：先搞清楚你要哪一种

### 方式 A：环境变量默认 Gmail App（第一次最推荐）

在 `.env` 里填：

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

然后 Origami 里所有 Gmail 授权默认都走这套 app。

### 方式 B：数据库版 Gmail App

如果你不想把 Gmail OAuth 凭据写在环境变量里，也可以先用 GitHub 登录进去，再到 `/accounts` 里创建数据库版 OAuth app。

### 我建议第一次怎么做？

**先用方式 A。**

原因很简单：

- 变量最少
- 流程最直
- 出错时最好排查

等你先把 Gmail 跑通了，再考虑数据库版 app 也不迟。

---

## 官方参考链接

- 启用 Google Workspace API  
  <https://developers.google.com/workspace/guides/enable-apis>
- 配置 OAuth consent screen  
  <https://developers.google.com/workspace/guides/configure-oauth-consent>
- 创建 access credentials  
  <https://developers.google.com/workspace/guides/create-credentials>
- Gmail API Node.js quickstart  
  <https://developers.google.com/workspace/gmail/api/quickstart/nodejs>
- Gmail scopes 说明  
  <https://developers.google.com/workspace/gmail/api/auth/scopes>

---

## 开始之前，先抄一张表

建议你先把这些值在便签里写好：

### 本地开发

```txt
应用地址（APP URL）
http://localhost:3000

Google OAuth Redirect URI
http://localhost:3000/api/oauth/gmail

Project name
Origami Gmail Local

App name on consent screen
Origami Gmail Local
```

### 生产环境

```txt
应用地址（APP URL）
https://mail.example.com

Google OAuth Redirect URI
https://mail.example.com/api/oauth/gmail

Project name
Origami Gmail Production

App name on consent screen
Origami Gmail Production
```

> 经验建议：**本地和生产分两个 Google Cloud Project**，最清楚，也最不容易把 redirect URI 搞混。

---

## 宝宝式步骤：从零开始创建 Gmail OAuth App

### 第 1 步：打开 Google Cloud Console

打开：

- <https://console.cloud.google.com/>

---

### 第 2 步：创建或选择一个 Google Cloud Project

如果你还没有项目：

1. 点击顶部的项目选择器
2. 点击 **New Project**
3. 起一个容易认出来的名字，例如：
   - `Origami Gmail Local`
   - `Origami Gmail Production`
4. 创建完成后切换进去

> 推荐：本地和生产分开两个 project，管理最清楚。

---

### 第 3 步：启用 Gmail API

控制台路径：

- **APIs & Services** → **Library**

然后搜索：

- `Gmail API`

点进去后点：

- **Enable**

官方文档：

- <https://developers.google.com/workspace/guides/enable-apis>

### 你现在只需要确认一件事

这个 project 里，**Gmail API 已经是 Enabled**。

---

### 第 4 步：配置 OAuth consent screen

这一步很关键。没有 consent screen，Google OAuth 就很难正确走通。

Google 新界面常见入口大致是：

- **Google Auth platform** → **Branding**
- **Audience**
- **Data Access**

官方文档：

- <https://developers.google.com/workspace/guides/configure-oauth-consent>

### 4.1 Branding 里怎么填？

建议：

- **App name**：`Origami Gmail Local` / `Origami Gmail Production`
- **User support email**：你的邮箱
- **Developer contact email**：你的邮箱

这些值主要是让你后面在授权页认得出这是哪套 app。

### 4.2 Audience 该怎么选？

#### 情况 1：你只是个人自用 / 测试

这是最常见的情况：

- 选择 **External**
- 然后把自己的 Google 账号加到 **Test users**

这通常就是最适合自托管个人项目的配置。

#### 情况 2：你明确只在自己的 Google Workspace 组织里用

这种情况下可以考虑：

- **Internal**

但前提是你真的有那个组织环境。

### 4.3 Data Access / Scopes 要怎么理解？

这一步的目标不是把所有 Google API 都打开，而是让你的 OAuth app 有能力申请 Origami 真正需要的 Gmail scopes。

你至少要知道 Origami 关心的是：

- `gmail.modify`
- `gmail.send`
- `userinfo.email`

---

### 第 5 步：创建 OAuth Client ID

官方文档：

- <https://developers.google.com/workspace/guides/create-credentials>

你要创建的是：

- **OAuth client ID**
- 应用类型选 **Web application**

> 不要选 Desktop app。Origami 是服务端 Web 应用。

### Redirect URI 怎么填？

必须和 Origami 完全一致：

- 本地：`http://localhost:3000/api/oauth/gmail`
- 生产：`https://你的域名/api/oauth/gmail`

这是最容易出错的一步。

如果你现在是本地开发，就别填生产域名；如果你现在是生产部署，就别再留着 localhost。

创建完成后会得到：

- Client ID → `GMAIL_CLIENT_ID`
- Client Secret → `GMAIL_CLIENT_SECRET`

---

## `.env` 示例

### 本地开发

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

### 生产环境

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

---

## 配完之后，请按这个顺序核对

建议你真的逐项对：

- 当前选中的 Google Cloud Project 对吗？
- `Gmail API` 已经是 **Enabled** 吗？
- consent screen 已经设置了吗？
- 如果你是个人自用，是不是选了 **External**？
- 你的 Google 账号是不是加进了 **Test users**？
- OAuth client 类型是不是 **Web application**？
- Redirect URI 是不是精确等于 `<APP_URL>/api/oauth/gmail`？
- `.env` 里的 `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` 是刚刚那套 client 的值吗？

如果这 8 项都对，Gmail OAuth 一般就没什么大问题了。

---

## 第 6 步：回到 Origami 里连接 Gmail

1. 启动 Origami
2. 先完成 GitHub 登录
3. 打开 `/accounts`
4. 选择添加 Gmail 账号
5. 如果你配置了默认 env app，它会直接走这套 Gmail OAuth app
6. 跳到 Google 授权页
7. 同意授权后回到 Origami

---

## 关于 Google 验证，你最需要知道什么？

很多人会被 Google 的界面和文案吓到，但对自托管单用户场景来说，通常没有想象中复杂。

### 如果你只是自己用 / 测试

通常这样就够了：

- app 保持测试状态
- Audience 选 **External**
- 把自己的 Google 账号加进 **Test users**

这通常已经可以让你自己正常授权。

### 如果你想给很多外部用户公开使用

那就要认真研究 Google 对敏感 / restricted scopes 的要求了。Origami 当前请求的 `gmail.modify` 权限比较高，审核成本会明显上升。

所以对 Origami 这种自托管项目，我的建议很明确：

> 先按“自己项目、自己账号、自己 test user”这条路跑通。

---

## 你现在应该如何验证“真的配好了”？

按下面这条链路跑一遍：

1. 在 Origami 里点“添加 Gmail 账号”
2. 浏览器跳到 Google 授权页
3. 你能看到自己配置的应用名
4. 选择账号并授权
5. 自动跳回 Origami
6. `/accounts` 里出现新 Gmail 账号
7. 能正常同步、查看、发送或执行写回能力

只要这条链路通了，Gmail OAuth 基本就是好的。

---

## 最常见的错误，怎么一眼判断？

### 1. `redirect_uri_mismatch`

几乎永远先查这个：

- Google OAuth Client 里的 redirect URI
- `NEXT_PUBLIC_APP_URL`
- 代码实际使用的 `/api/oauth/gmail`

这三者必须匹配。

### 2. 授权页能打开，但授权后回不来

大概率还是 redirect URI 写错，或者本地 / 生产用错了 Client ID。

### 3. 看到了 “app not verified” 或测试限制

先别慌，先看：

- 你是不是 **External app**
- 你当前授权的 Google 账号是不是已经加进 **Test users**

### 4. 明明授权过了，但发信时报没权限

检查 scopes：

- `gmail.send`
- `gmail.modify`

Origami 的发送和部分写回能力依赖这些权限。

### 5. 我把 API 开了，但还是不行

再检查这三个常被忽略的地方：

- 你当前看的 project 是不是对的
- consent screen 是不是已经完成
- OAuth client 类型是不是 **Web application**

很多时候不是“Gmail API 没开”，而是 OAuth app 这一层没配完整。

---

## 我推荐的最终做法

如果你问我“最稳的 Gmail 配法是什么”，我的建议是：

1. 本地和生产分两个 Google Cloud Project
2. 每个环境各自一个 Web OAuth client
3. Redirect URI 精确分开
4. 个人自用就用 **External + Test users**
5. 第一次先用 `.env` 默认 app，跑通后再考虑数据库版 app

这是心智负担最低，也最容易排错的组合。

---

## 下一步看什么？

- [Outlook OAuth 详细配置](/outlook-oauth)
- [Cloudflare R2 / Bucket 详细配置](/r2-storage)
