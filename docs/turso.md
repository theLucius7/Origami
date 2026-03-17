# Turso 数据库详细配置

这页只讲一件事：**怎么为生产环境的 Origami 准备一个可直接使用的 Turso 数据库**。

## 最终你要填回 `.env` 的值

```txt
TURSO_DATABASE_URL=libsql://origami-prod-xxxxx.turso.io
TURSO_AUTH_TOKEN=...
```

对 Origami 来说，这里真正重要的只有两样：

- URL：我要连接哪一个数据库
- Token：我有没有权限连接进去

## 官方参考

- Turso Quickstart  
  <https://docs.turso.tech/quickstart>
- Turso CLI 安装  
  <https://docs.turso.tech/cli/installation>
- Turso 数据库 token 创建  
  <https://docs.turso.tech/cli/db/tokens/create>
- Turso Pricing  
  <https://turso.tech/pricing>

## 开始前先抄表

```txt
数据库名
origami-prod

正式访问地址
https://mail.example.com

计划填入的变量
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
```

## 为什么推荐“网页创建 + CLI 取值”

因为 Turso 后台 UI 可能调整，而 CLI 获取数据库 URL 和 token 的路径通常更稳定、更容易复现。

推荐流程是：

1. 在网页控制台创建数据库
2. 用 CLI 取数据库 URL
3. 用 CLI 生成数据库 token
4. 把值填进 `.env`

## 用户点击脚本

### 第 1 步：打开 Turso 官网并登录

打开：

- <https://turso.tech/>

注册或登录你的 Turso 账号，然后进入控制台。

### 第 2 步：确认套餐

如果你现在只是部署个人自用实例，通常可以先从当前可用的免费额度开始。套餐以后可能变化，请以官方 Pricing 页面为准：

- <https://turso.tech/pricing>

### 第 3 步：在网页控制台创建数据库

进入控制台后，找到：

- **Create database**

#### 数据库名怎么填

建议直接填写：

```txt
origami-prod
```

#### Location / Group 怎么选

通常选择离你部署区域更近的区域即可。

这一步最重要的不是“选最完美的区域”，而是：

1. 数据库真的创建成功
2. 你记住了数据库名

### 第 4 步：安装 Turso CLI

常见方式：

#### macOS

```bash
brew install tursodatabase/tap/turso
```

#### Linux

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

安装完成后，执行：

```bash
turso
```

如果能看到帮助输出，说明 CLI 装好了。

### 第 5 步：让 CLI 登录你的 Turso 账号

执行：

```bash
turso auth login
```

完成浏览器授权后，CLI 才能读取数据库信息和创建 token。

### 第 6 步：拿到数据库 URL

假设你的数据库名是：

```txt
origami-prod
```

执行：

```bash
turso db show origami-prod --url
```

你会得到类似：

```txt
libsql://origami-prod-xxxxx.turso.io
```

把它填入：

```txt
TURSO_DATABASE_URL=libsql://origami-prod-xxxxx.turso.io
```

### 第 7 步：创建数据库 token

执行：

```bash
turso db tokens create origami-prod
```

把输出结果填入：

```txt
TURSO_AUTH_TOKEN=...
```

## 最小可用 `.env` 示例

```txt
TURSO_DATABASE_URL=libsql://origami-prod-xxxxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOi...
```

## 填完后先核对

逐项确认：

- 数据库已在 Turso 控制台创建成功
- `TURSO_DATABASE_URL` 直接来自 `turso db show origami-prod --url`
- `TURSO_AUTH_TOKEN` 直接来自 `turso db tokens create origami-prod`
- `.env` 里没有额外空格、引号或换行

## 怎么验证配置真的好了

把 `TURSO_DATABASE_URL` 和 `TURSO_AUTH_TOKEN` 填进 `.env` 后，在项目目录执行：

```bash
npm run db:setup
```

如果数据库连接没问题，这一步应该能正常完成。

## 最常见错误

### 1. 数据库 URL 写错了

请确认：

- 你填的是 `libsql://...`
- 它来自 `turso db show origami-prod --url`
- 不是手工猜出来的地址

### 2. token 不是这个数据库生成的

最稳的做法就是显式执行：

```bash
turso db tokens create origami-prod
```

### 3. CLI 没有真正登录成功

如果相关命令报认证错误，先重新执行：

```bash
turso auth login
```

### 4. 只在网页里建了库，但没有生成 token

只创建数据库还不够。Origami 连接数据库还需要：

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## 下一步看什么

数据库准备好后，推荐继续：

1. [Cloudflare R2 / Bucket 详细配置](/r2-storage)
2. [GitHub Auth 详细配置](/github-auth)
3. [Gmail OAuth 详细配置](/gmail-oauth)
4. [Outlook OAuth 详细配置](/outlook-oauth)
