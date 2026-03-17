# Cloudflare R2 / Bucket 详细配置

这页只讲一件事：**怎么把 Origami 的附件存储配起来**。

Origami 会把附件放在 Cloudflare R2，而不是直接塞进数据库。对邮件附件这种二进制大文件来说，这样更合理，也更容易维护。

---

## 先说结论：你最终要得到什么？

你最终需要把这些值放进 `.env`：

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=origami-attachments
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

另外建议保留：

```txt
R2_ACCOUNT_ID=...
```

虽然当前运行时代码**不强依赖**它，但排障时非常方便。

---

## 官方参考链接

- Cloudflare R2：创建 bucket  
  <https://developers.cloudflare.com/r2/buckets/create-buckets/>
- Cloudflare R2：API token / S3 认证  
  <https://developers.cloudflare.com/r2/api/tokens/>
- Cloudflare：查找 Account ID  
  <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

---

## 先用一句人话理解这件事

Origami 对 R2 的需求，真的就只有 4 个关键值：

1. **一个 bucket 名**
2. **一个 Access Key ID**
3. **一个 Secret Access Key**
4. **一个 S3 endpoint**

只要这四项都对，Origami 就能上传和下载附件。

所以你在 Cloudflare 面板里虽然会看到很多概念，但你真正需要带回 `.env` 的其实并不多。

---

## 开始之前，先抄一张表

建议先把你计划使用的值写出来：

```txt
Cloudflare Account ID = ...
Bucket name = origami-attachments-prod
R2 endpoint = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

如果你要区分环境，我更推荐这样起名：

- 开发：`origami-attachments-dev`
- 生产：`origami-attachments-prod`

> 很推荐开发 / 生产用两个 bucket。这样最不容易误删、误写、误混环境。

---

## 宝宝式步骤：从零开始配置 R2

### 第 1 步：登录 Cloudflare Dashboard

打开：

- <https://dash.cloudflare.com/>

进入你的 Cloudflare 账号。

---

### 第 2 步：找到 Account ID

如果你还不知道自己的 Account ID：

1. 进入 Cloudflare Dashboard
2. 打开 **Account home** 或 **Workers & Pages**
3. 找到 **Account ID**
4. 复制下来

官方说明：

- <https://developers.cloudflare.com/fundamentals/account/find-account-and-zone-ids/>

后面你会用它来拼 `R2_ENDPOINT`：

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### 你现在应该记下这两行

```txt
R2_ACCOUNT_ID=<你的 Account ID>
R2_ENDPOINT=https://<你的 Account ID>.r2.cloudflarestorage.com
```

---

### 第 3 步：创建 bucket

进入：

- **R2 Object Storage**

然后创建一个 bucket。

推荐名称：

- `origami-attachments-dev`
- `origami-attachments-prod`

这样一眼就能看出环境。

### bucket 这一步最重要的不是高级选项，而是两件事

1. **名字要清楚区分环境**
2. **你要记住自己最后创建出来的 exact bucket name**

你之后填 `.env` 时要原样写进：

```txt
R2_BUCKET_NAME=origami-attachments-prod
```

官方文档：

- <https://developers.cloudflare.com/r2/buckets/create-buckets/>

---

### 第 4 步：创建 R2 API token

在 Cloudflare Dashboard 里进入：

- **R2 Object Storage**
- **Manage R2 API tokens**

你会看到类似下面的入口：

- **Create Account API token**
- **Create User API token**

如果你是个人使用，通常都能配置成功。最稳妥的思路是：

- 只给 **Object Read & Write**
- 只 scope 到你刚刚创建的那个 bucket

这样 Origami 只拥有“读写这个 bucket 里的对象”的权限，不会拿到更多无关权限。

官方文档：

- <https://developers.cloudflare.com/r2/api/tokens/>

---

### 第 5 步：保存 Access Key 和 Secret Access Key

token 创建完成后，Cloudflare 会显示：

- **Access Key ID**
- **Secret Access Key**

现在你要把它们记下来，并填进：

```txt
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

> 注意：Secret Access Key 往往不会再次完整展示。一定要先保存。

---

### 第 6 步：把 bucket 名填进 `.env`

假设你刚刚创建的是生产 bucket：

```txt
R2_BUCKET_NAME=origami-attachments-prod
```

如果是开发环境，就用开发 bucket 名。

最容易犯的错就是：

- token 对着 prod bucket
- `.env` 里却写了 dev bucket

看起来只差一个名字，但结果就是上传失败。

---

### 第 7 步：把 endpoint 填进 `.env`

`R2_ENDPOINT` 的格式固定是：

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

例如：

```txt
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

如果你愿意，也顺手把 `R2_ACCOUNT_ID` 写进去：

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
```

---

## 一份最小可用 `.env` 示例

```txt
R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=origami-attachments-prod
R2_ENDPOINT=https://1234567890abcdef1234567890abcdef.r2.cloudflarestorage.com
```

---

## 配完之后，请按这个顺序核对

建议你真的一项一项对照：

- `R2_ACCOUNT_ID` 是不是你当前 Cloudflare 账号的 Account ID？
- `R2_ENDPOINT` 是不是严格等于 `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`？
- `R2_BUCKET_NAME` 是不是你刚创建出来的 bucket 原名？
- `R2_ACCESS_KEY_ID` 和 `R2_SECRET_ACCESS_KEY` 有没有填反？
- token 权限是不是至少有 **Object Read & Write**？
- token 的 scope 是不是包含这个 bucket？

如果这 6 项都对，R2 基本就没什么悬念了。

---

## 你现在应该如何验证“真的配好了”？

最简单的方法：

1. 启动 Origami
2. 登录后台
3. 打开写信 / compose
4. 上传一个小附件
5. 让整个发送或保存流程跑通
6. 然后再去邮件详情里试下载附件

如果：

- 上传正常
- 下载正常

那这套 R2 配置基本就是对的。

---

## 最常见的错误，怎么一眼判断？

### 1. endpoint 写错

这是最常见的错误。

`R2_ENDPOINT` 必须是完整的：

```txt
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

不要漏：

- `https://`
- `.r2.cloudflarestorage.com`

### 2. Access Key / Secret 填反了

这也非常常见。

请记住：

- `R2_ACCESS_KEY_ID` ≠ `R2_SECRET_ACCESS_KEY`

### 3. token 没有对象读写权限

如果 token 权限过小，Origami 可能能正常启动，但上传附件会失败。

最小推荐：

- **Object Read & Write**
- scope 到目标 bucket

### 4. bucket 名写错环境

例如：

- 生产环境写到了 dev bucket
- bucket 根本没建出来
- token 只给了 prod bucket，但 `.env` 填了另一个名字

这些错误看起来像“上传失败”，但本质都是 bucket 或权限对不上。

### 5. 用了错误账号下的 Account ID

如果你有多个 Cloudflare account，很容易复制错 Account ID。

这时你会看到一种很烦的情况：

- endpoint 看上去很像真的
- token 也像是对的
- 但 bucket / token / endpoint 其实不是同一个账号下的

### 6. 以为需要把 bucket 设成公开

通常**不需要**。

Origami 通过服务端控制附件上传和下载，不要求你把 R2 bucket 公开暴露给外部。

---

## 我推荐的最终做法

如果你问我“最稳的配法是什么”，我的建议是：

1. `origami-attachments-dev` 和 `origami-attachments-prod` 分开
2. token 只给 **Object Read & Write**
3. token 只 scope 到单一 bucket
4. `.env` 里保留 `R2_ACCOUNT_ID`，虽然当前代码不强依赖，但排障方便

这套做法非常朴素，但最少出问题。

---

## 下一步看什么？

R2 配好后，通常继续：

- [Gmail OAuth 详细配置](/gmail-oauth)
- [Outlook OAuth 详细配置](/outlook-oauth)
