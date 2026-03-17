# Gmail OAuth 详细配置

这页讲的是：**怎么把 Gmail 账号接入 Origami**。

它不是 GitHub 登录。  
GitHub 登录是登录 Origami 后台；Gmail OAuth 是让 Origami 拿到你 Gmail 邮箱的访问权限。

## Origami 目前会用到哪些 Gmail scopes？

按当前代码，Origami 主要会请求：

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

相关代码位置：

- `src/lib/providers/gmail.ts`

官方 scopes 参考：

- <https://developers.google.com/workspace/gmail/api/auth/scopes>

## 两种配置方式：先搞清楚你要哪一种

### 方式 A：环境变量默认 Gmail App（推荐先这样）

你在 `.env` 里填：

```txt
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

然后 Origami 里所有 Gmail 授权默认都走这套 app。

### 方式 B：数据库版 Gmail App

如果你不想把 Gmail OAuth 凭据写在环境变量里，也可以先用 GitHub 登录进入 Origami，然后在 `/accounts` 里创建数据库版 OAuth app。

**建议第一次部署先用方式 A。**  
原因很简单：最少变量、最好排错。

## 官方参考链接

- 启用 Google Workspace API  
  <https://developers.google.com/workspace/guides/enable-apis>
- 配置 OAuth consent screen  
  <https://developers.google.com/workspace/guides/configure-oauth-consent>
- 创建 access credentials  
  <https://developers.google.com/workspace/guides/create-credentials>
- Gmail API Node.js quickstart（官方样例）  
  <https://developers.google.com/workspace/gmail/api/quickstart/nodejs>
- Gmail scopes 说明  
  <https://developers.google.com/workspace/gmail/api/auth/scopes>

## 宝宝式步骤：从零开始创建 Gmail OAuth App

### 第 1 步：打开 Google Cloud Console

打开：

- <https://console.cloud.google.com/>

### 第 2 步：创建或选择一个 Google Cloud Project

如果你还没有项目：

1. 点击顶部项目选择器
2. 点 **New Project**
3. 起一个名字，例如：
   - `Origami Gmail Local`
   - `Origami Gmail Production`
4. 创建完成后切进去

> 推荐：本地和生产分两个 project，管理更清楚。

### 第 3 步：启用 Gmail API

控制台路径：

- **APIs & Services** → **Library**

然后搜索：

- `Gmail API`

点进去后点：

- **Enable**

官方文档：

- <https://developers.google.com/workspace/guides/enable-apis>

### 第 4 步：配置 OAuth consent screen

这一步很关键，因为没有 consent screen，Google 不会正常给你走 OAuth。

控制台路径（Google 现在的新界面里一般在 Google Auth platform 下）：

- **Google Auth platform** → **Branding**
- **Audience**
- **Data Access**

官方文档：

- <https://developers.google.com/workspace/guides/configure-oauth-consent>

#### 你通常怎么选 Audience？

##### 情况 1：你是个人自用 / 测试

最常见的是：

- 选择 **External**
- 然后把自己的 Google 账号加为 **Test users**

这是最适合自托管个人项目的方式。

##### 情况 2：你在自己的 Google Workspace 组织内使用

如果你明确只给组织内账号用，可以考虑：

- **Internal**

但这只适合你真的有 Google Workspace 组织环境的时候。

#### consent screen 里建议怎么填？

- **App name**：`Origami Gmail Local` / `Origami Gmail Production`
- **User support email**：你的邮箱
- **Developer contact email / Contact information**：你的邮箱
- **Scopes / Data Access**：后面把 Origami 需要的 Gmail scopes 加进去

### 第 5 步：创建 OAuth Client ID

官方文档：

- <https://developers.google.com/workspace/guides/create-credentials>

你需要创建的是：

- **OAuth client ID**
- 应用类型选 **Web application**

> 不要选 Desktop app。Origami 是服务端 Web 应用，不是本地桌面 OAuth 客户端。

#### Redirect URI 要怎么填？

这个要和 Origami 完全对应：

- 本地：`http://localhost:3000/api/oauth/gmail`
- 生产：`https://你的域名/api/oauth/gmail`

这是最容易写错的一步。

创建完成后，你会拿到：

- Client ID → `GMAIL_CLIENT_ID`
- Client Secret → `GMAIL_CLIENT_SECRET`

## `.env` 示例

本地开发：

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

生产环境：

```txt
NEXT_PUBLIC_APP_URL=https://mail.example.com
GMAIL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

## 第 6 步：回到 Origami 里连接 Gmail

1. 启动 Origami
2. 先完成 GitHub 登录
3. 打开 `/accounts`
4. 选择添加 Gmail 账号
5. 如果你配置了默认 env app，它会直接走这套 Gmail OAuth app
6. 跳到 Google 授权页
7. 同意授权后回到 Origami

## 关于 Google 验证，你最需要知道什么？

很多人会在这里被 Google 的文案吓到，其实自托管自用场景通常没那么复杂。

### 如果你只是自己用 / 测试

通常做法是：

- App 保持在测试状态
- Audience 用 External
- 把自己的 Google 账号加进 Test users

这通常已经足够让你自己授权使用。

### 如果你想公开给很多外部用户用

那就要认真看 Google 对敏感 / restricted scopes 的要求了。  
而 Origami 当前请求的 `gmail.modify` 是权限更高的一类，审核成本会明显上升。

所以对 Origami 这种自托管单用户工具，**最自然的路径就是：自己项目、自己账号、自己加 test user**。

## 常见错误

### 1. redirect_uri_mismatch

几乎永远先检查这个：

- Google OAuth Client 里的 redirect URI
- `NEXT_PUBLIC_APP_URL`
- 代码实际走的 `/api/oauth/gmail`

三者必须匹配。

### 2. 授权页能打开，但授权后回不来

大概率还是 redirect URI 写错，或者本地 / 生产用错了 Client ID。

### 3. 看到了“app not verified”或测试限制

先别慌，先看：

- 你是不是 External app
- 你当前授权的 Google 账号是不是被加进了 Test users

### 4. 明明授权过了，但发信时报没权限

检查 scopes：

- `gmail.send`
- `gmail.modify`

Origami 发送和部分写回能力依赖这些 scope。

## 推荐的最终做法

如果你问我“最稳的 Gmail 配法是什么”，我会推荐：

1. 本地和生产分两个 Google Cloud Project
2. 每个环境各自一个 Web OAuth client
3. redirect URI 精确分开
4. 个人自用就用 External + Test users
5. 第一次先用 `.env` 默认 app，跑通后再考虑数据库版 app

## 下一步看什么

- [Outlook OAuth 详细配置](/outlook-oauth)
- [Cloudflare R2 / Bucket 详细配置](/r2-storage)
