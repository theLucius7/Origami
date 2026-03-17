# Cloudflare R2 / Bucket 详细配置

这页只讲一件事：**怎么把 Origami 的附件存储配起来**。

Origami 会把附件放在 Cloudflare R2，而不是直接塞进数据库。这样做更适合邮件附件这种二进制大文件。

## 你最终要填的环境变量

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

另外：

```txt
R2_ACCOUNT_ID=...
```

当前运行时代码**不强依赖**它，但保留这个值通常对排障有帮助。

## 官方参考链接

- Cloudflare R2：创建 bucket  
  <https://developers.cloudflare.com/r2/buckets/create-buckets/>
- Cloudflare R2：创建 API token / S3 认证  
  <https://developers.cloudflare.com/r2/api/tokens/>
- Cloudflare：查找 Account ID  
  <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

## 先理解一下：Origami 到底需要 R2 里的什么？

你可以把 Origami 对 R2 的需求理解成 4 个值：

1. **一个 bucket 名**
2. **一个 Access Key ID**
3. **一个 Secret Access Key**
4. **一个 S3 endpoint**

只要这 4 个值是对的，Origami 就能上传和下载附件。

## 宝宝式步骤：从零开始配 R2

### 第 1 步：登录 Cloudflare Dashboard

打开：

- <https://dash.cloudflare.com/>

登录到你的 Cloudflare 账号。

### 第 2 步：找到 Account ID

如果你还不知道自己的 Account ID：

1. 进入 Cloudflare Dashboard
2. 打开你的 **Account home** 或 **Workers & Pages**
3. 找到 **Account ID**
4. 复制下来

官方说明：

- <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

你后面会用到它来拼 `R2_ENDPOINT`：

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### 第 3 步：创建 bucket

进入：

- **R2 Object Storage**

然后创建一个 bucket。

建议名称：

- `origami-attachments-dev`
- `origami-attachments-prod`

这样一眼能看出环境，不容易误操作。

> 推荐本地测试和生产环境分两个 bucket，不要混用。

如果你想看官方文档：

- <https://developers.cloudflare.com/r2/buckets/create-buckets/>

### 第 4 步：创建 R2 API token

还是在 Cloudflare Dashboard 里，进入：

- **R2 Object Storage**
- **Manage R2 API tokens**

然后选择：

- **Create Account API token**
  或
- **Create User API token**

如果你只是自己个人使用，通常两种都能工作。  
更稳妥的最小权限思路是：

- 只给 **Object Read & Write**
- 只 scope 到你刚刚创建的那个 bucket

这样 Origami 只拿到“读写这个 bucket 里对象”的权限，不会多拿别的权限。

官方文档：

- <https://developers.cloudflare.com/r2/api/tokens/>

### 第 5 步：保存 Access Key 和 Secret

token 创建完成后，Cloudflare 会给你：

- **Access Key ID**
- **Secret Access Key**

分别填到：

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

> Secret Access Key 一定先保存好。很多平台都不会再完整展示第二次。

### 第 6 步：填写 bucket 名

你刚刚创建 bucket 时起的名字，填到：

```txt
R2_BUCKET_NAME=origami-attachments-prod
```

### 第 7 步：填写 endpoint

endpoint 的格式是：

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

举例：

```txt
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

如果你还保留 `R2_ACCOUNT_ID`，可以一起填：

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
```

## 最小可用 `.env` 示例

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

## 配完之后怎么验证？

最简单的验证方法：

1. 启动 Origami
2. 登录后台
3. 打开写信 / compose
4. 上传一个小附件
5. 发送或保存流程跑通
6. 再检查邮件详情里的附件下载是否正常

如果上传和下载都正常，说明 R2 这套配置基本是通的。

## 常见错误

### 1. endpoint 写错

最常见。`R2_ENDPOINT` 必须是完整的：

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

不要漏：

- `https://`
- `.r2.cloudflarestorage.com`

### 2. Access Key / Secret 填反了

也非常常见。注意：

- `R2_ACCESS_KEY_ID` ≠ `R2_SECRET_ACCESS_KEY`

### 3. token 没有对象读写权限

如果你创建 token 时权限太小，Origami 可能能启动，但上传附件会失败。

最少建议：

- **Object Read & Write**
- scope 到目标 bucket

### 4. bucket 名写错环境

比如：

- 你把生产环境写到了 dev bucket
- 或者 bucket 根本没建出来

这种情况下，错误看起来像“上传失败”，但本质是 bucket 不存在或没权限。

### 5. 用了错误账号下的 Account ID

如果你在 Cloudflare 里有多个 account，很容易复制错。

结果通常是：

- endpoint 正常看起来像真的
- 但 token 和 bucket 对不上

## 推荐的最终做法

如果你问我“最稳的配法是什么”，我会推荐：

1. `origami-attachments-dev` 和 `origami-attachments-prod` 分开
2. token 只给 **Object Read & Write**
3. token 只 scope 到单一 bucket
4. `.env` 里保留 `R2_ACCOUNT_ID`，虽然当前代码不强依赖，但排障方便

## 下一步看什么

R2 配好后，通常继续：

- [Gmail OAuth 详细配置](/gmail-oauth)
- [Outlook OAuth 详细配置](/outlook-oauth)
