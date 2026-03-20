# FAQ

## 为什么默认推荐 `db:setup`，不是 `db:migrate`？

因为 `db:setup` 更适合**新环境**。  
它代表“我要把当前 schema 直接建好并确保关键结构可用”，而不是“我要先体验一遍项目历史演进”。

对大多数第一次部署 Origami 的用户来说，你要的不是“完整回放项目历史”，而是“现在这版能立刻可用”。

## 为什么新环境不建议一上来就先跑 `db:push`？

因为 `db:push` 更像是一个“我明确知道 schema 会怎么变”的开发者工具。  
它适合你在本地开发时快速同步结构，不太适合作为正式生产新环境的默认入口。

如果你只是第一次部署一套全新实例，优先使用：

```bash
npm run db:setup
```

只有在你明确知道当前库状态、迁移策略和风险时，再考虑 `db:migrate` 或 `db:push`。

## 为什么 Origami 不把 Done / Archive / Snooze 回写到 provider？

因为这些状态在不同 provider 中语义和实现差异都很大。  
Origami 选择把它们定义为**本地生产力状态**，从而换取：

- 一致的用户体验
- 更低的复杂度
- 更稳定的同步逻辑

## 为什么 Read / Star 又支持回写？

因为它们更接近邮箱原生状态，而且同步价值更高。  
所以 Origami 把它们做成了**可选能力**：能回写就回写，不能回写也不阻塞本地操作。

## 为什么“全局写回开关”不是把所有账号都一起打开？

因为“全局”在 Origami 里表示**批量设置**，不是无差别强制覆盖。  
有些账号虽然能正常收信，但当前授权 scope 不够，或者 provider 本身就不支持对应写回。

所以当前规则是：

- **开启**全局已读/星标写回时，只会作用于当前具备对应能力 / 权限的账号
- **关闭**时则可以对所有账号生效
- 没有被开启的账号会在账号页继续显示原因提示，例如需要重新授权

这样做是为了避免出现“UI 显示已经打开，但远端永远写不回去”的假象。

## 为什么有些邮件会在同步后从 Inbox 里消失？

这通常不是本地丢数据，而是远端状态终于被同步对齐了。  
如果邮件已经在 Gmail / Outlook / 其他邮箱里被删除，或者被移出了 Inbox，Origami 现在会在下一轮同步里把它从默认 Inbox 列表中移除。

这比“继续把已不在 Inbox 的邮件挂在列表里”更接近真实邮箱状态。  
如果同一封邮件后来又重新回到 Inbox，它也会在后续同步中重新出现。

## 为什么项目是单用户？

因为单用户不是“功能不够”，而是这个项目当前最重要的边界。  
它让：

- 登录模型更轻
- 部署更简单
- 排错更直接
- 文档更清楚

## GitHub 登录如果配不起来，先检查什么？

按这个顺序看，通常最快：

1. `NEXT_PUBLIC_APP_URL` 是否真的是你当前访问的地址
2. GitHub OAuth App 里的 **Homepage URL** 是否和应用地址一致
3. GitHub OAuth App 里的 **Authorization callback URL** 是否精确写成：
   - `http://localhost:3000/api/better-auth/callback/github`
   - 或 `https://你的域名/api/better-auth/callback/github`
4. `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` 是否填错、带了空格、用了别的环境的值
5. 如果是公网部署，是否设置了 `GITHUB_ALLOWED_LOGIN`
6. 如果已经完成首次绑定，当前登录的 GitHub 账号是否就是当初绑定 owner 的那个账号

常见现象对应：

- **跳转后直接报 callback 错误**：大多是 callback URL 或 client secret 不匹配
- **别人能看到登录页但进不去**：通常是 `GITHUB_ALLOWED_LOGIN` 生效了，这是正常的
- **你改了 GitHub 用户名后担心登不进去**：通常没事，Origami 绑定的是 GitHub user id，不是纯用户名文本
- **你绑定错了 owner**：通常需要清理 `app_installation` 记录后重新初始化

## 为什么 `NEXT_PUBLIC_APP_URL` 必须和 OAuth callback 用同一个正式域名？

因为 Origami 的登录与邮箱授权流程，本质上都是“从你的站点跳去第三方，再跳回你的站点”。  
如果应用里认的地址、你浏览器里访问的地址、第三方平台里登记的 callback 地址不是同一个域名，就很容易出现：

- 登录后回不来
- callback URL mismatch
- 授权成功但 session 对不上
- 预览环境能用，正式环境突然失效

简单说：**只要是生产环境，就尽量让站点访问地址和所有 callback 始终保持同一正式域名。**

## 我可以先用 Vercel 的临时域名或 Preview 部署，后面再慢慢改成正式域名吗？

可以拿来测试，但**不建议把它当正式部署路径**。  
因为一旦你后面把访问域名改掉，通常还要同步修改：

- `NEXT_PUBLIC_APP_URL`
- GitHub OAuth callback
- Gmail OAuth redirect URI
- Outlook OAuth redirect URI

如果你只是验证界面能不能跑起来，用 Preview 没问题。  
如果你准备开始认真接账号、走授权、保存生产数据，最好先把正式域名定下来。

## 如果我想多账号、多 OAuth app，会不会很麻烦？

不会。  
当前已经支持：

- 多邮箱账号
- Gmail / Outlook 多个 OAuth app
- 环境变量默认 app + 数据库版 app 混用

## Gmail / Outlook 的 OAuth app 一定要放在环境变量里吗？

不一定。  
环境变量里的 `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET`、`OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` 更像是“默认 app”。

如果你不填这四项，仍然可以在应用内通过 `/accounts` 管理数据库托管的 OAuth app。  
区别主要在于：

- **环境变量默认 app**：适合你已经有一套固定的生产配置，想直接开箱即用
- **数据库托管 app**：适合你想在应用里管理多套 app，或按账号区分配置

## QQ 现在到底支不支持发信？

支持。  
当前 QQ 的实现已经是 IMAP 收件 + SMTP 发信，而不是过去那种“只读兼容层”。

## 附件为什么要放 R2，不直接放数据库？

因为附件是二进制大对象。  
把它们从关系型数据库中拆出去，可以：

- 减轻数据库压力
- 降低备份与查询负担
- 让正文/元数据查询更轻

## 如果我只想最小部署，应该看哪几页？

按这个顺序：

1. [首页](/)
2. [快速开始](/quick-start)
3. [部署指南](/deployment)

## 如果我要理解源码入口？

直接看：

- [项目结构](/project-structure)
- [架构说明](/architecture)
