# Cloudflare R2 / Bucket 详细配置

这页只讲一件事：**怎么为生产环境的 Origami 配置附件存储**。

Origami 会把附件放在 Cloudflare R2，而不是直接塞进数据库。这样更适合邮件附件这种二进制文件。

## 最终你要填回 `.env` 的值

```txt
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

## 官方参考

- Cloudflare R2：创建 bucket  
  <https://developers.cloudflare.com/r2/buckets/create-buckets/>
- Cloudflare R2：API token / S3 认证  
  <https://developers.cloudflare.com/r2/api/tokens/>
- Cloudflare：查找 Account ID  
  <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

## 开始前先抄表

```txt
Cloudflare Account ID = ...
Bucket name = origami-attachments-prod
R2 endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

## 你会在两个地方来回操作

### 地方 A：Cloudflare Dashboard

你会在这里：

- 找到 Account ID
- 创建 bucket
- 创建 R2 API token
- 看到 Access Key ID / Secret Access Key

### 地方 B：Origami 项目的 `.env`

你会把值填回：

```txt
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=
```

## 用户点击脚本

### 第 1 步：打开 Cloudflare Dashboard

打开：

- <https://dash.cloudflare.com/>

登录后，确认当前切换到的是你准备放 R2 的那个 Cloudflare account。

### 第 2 步：先找 Account ID

在 Cloudflare Dashboard 中找到：

- **Account ID**

复制下来后，先记成：

```txt
R2_ACCOUNT_ID=<你的 Account ID>
```

同时把 endpoint 也拼出来：

```txt
R2_ENDPOINT=https://<你的 Account ID>.r2.cloudflarestorage.com
```

### 第 3 步：打开 R2 页面并创建 bucket

进入：

- **R2 Object Storage**

然后创建 bucket。

#### Bucket name 怎么填

建议直接填写：

```txt
origami-attachments-prod
```

这一步最重要的是：

1. bucket 确实创建成功
2. 你记住了准确的 bucket 名

### 第 4 步：创建 R2 API token

继续找到：

- **Manage R2 API tokens**

创建一组可访问该 bucket 的 key。对 Origami 来说，最小推荐权限是：

- **Object Read & Write**

scope 建议只给你刚才创建的那个 bucket。

### 第 5 步：保存 Access Key 和 Secret Access Key

创建 token 后，Cloudflare 会展示：

- **Access Key ID**
- **Secret Access Key**

立刻复制并保存。这两项要回填到 `.env`。

## 现在回到 `.env`

把这些行填好：

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

## 填完后先核对

逐项确认：

- `R2_ACCOUNT_ID` 是刚才复制的 Account ID
- `R2_ENDPOINT` 严格等于 `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `R2_BUCKET_NAME` 是你刚创建的 bucket 原名
- `R2_ACCESS_KEY_ID` 和 `R2_SECRET_ACCESS_KEY` 没有填反
- token 权限至少包含 **Object Read & Write**
- token 的 scope 包含目标 bucket

## 怎么验证配置真的好了

部署完成后，你可以在 Origami 中走这条验证链路：

1. 打开写信 / compose
2. 上传一个小附件
3. 完成发送或保存流程
4. 再回到邮件详情页试下载附件

理想结果是：

- 上传没有报错
- 发送 / 保存过程正常
- 详情页里的附件可以下载

## 最常见错误

### 1. `R2_ENDPOINT` 写错

正确格式只能是：

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### 2. Access Key / Secret 填反了

请确认：

- `R2_ACCESS_KEY_ID` 不是 `R2_SECRET_ACCESS_KEY`

### 3. token 没有对象读写权限

如果权限过小，附件上传通常会失败。

### 4. bucket 名写错

请确认 `.env` 里的 `R2_BUCKET_NAME` 和 Cloudflare 后台里创建出来的名字逐字一致。

### 5. Account ID 复制错账号

如果你有多个 Cloudflare account，最容易发生这种错：

- endpoint 看起来像真的
- key 也像真的
- 但它们其实不属于同一个账号

## 下一步看什么

R2 配好之后，通常继续：

1. [GitHub Auth 详细配置](/github-auth)
2. [Gmail OAuth 详细配置](/gmail-oauth)
3. [Outlook OAuth 详细配置](/outlook-oauth)
