# FAQ

## 為什麼預設推薦 `db:setup`，不是 `db:migrate`？

因為 `db:setup` 更適合 **新環境**。  
它代表「我要把目前 schema 直接建好並確保關鍵結構可用」，而不是「我要先體驗一遍專案的歷史演進」。

對大多數第一次部署 Origami 的使用者來說，你要的不是「完整回放專案歷史」，而是「現在這一版立刻可用」。

## 為什麼新環境不建議一上來就先跑 `db:push`？

因為 `db:push` 更像是一個「我明確知道 schema 會怎麼變」的開發者工具。  
它很適合本地開發時快速同步結構，但不太適合作為正式新環境的預設入口。

如果你只是第一次部署一套全新實例，優先使用：

```bash
npm run db:setup
```

只有在你明確知道目前資料庫狀態、migration 策略與風險時，再考慮 `db:migrate` 或 `db:push`。

## 為什麼 Origami 不把 Done / Archive / Snooze 回寫到 provider？

因為這些狀態在不同 provider 中語義與實作差異都很大。  
Origami 選擇把它們定義為 **本地生產力狀態**，從而換取：

- 一致的使用體驗
- 更低的複雜度
- 更穩定的同步邏輯

## 為什麼 Read / Star 又支援回寫？

因為它們更接近郵箱原生狀態，而且同步價值更高。  
所以 Origami 把它們做成 **可選能力**：能回寫就回寫，不能回寫也不阻塞本地操作。

## 為什麼「全域寫回開關」不是把所有帳號都一起打開？

因為「全域」在 Origami 裡表示 **批次設定**，不是無差別強制覆蓋。  
有些帳號雖然能正常收信，但目前授權 scope 不夠，或 provider 本身就不支援對應回寫。

所以目前規則是：

- **開啟**全域已讀 / 星標回寫時，只會作用於目前具備對應能力 / 權限的帳號
- **關閉**時則可以對所有帳號生效
- 沒有被開啟的帳號會在帳號頁繼續顯示原因提示，例如需要重新授權

這樣做是為了避免出現「UI 顯示已經打開，但遠端永遠寫不回去」的假象。

## 為什麼有些郵件會在同步後從 Inbox 裡消失？

這通常不是本地丟資料，而是遠端狀態終於被同步對齊了。  
如果郵件已經在 Gmail / Outlook / 其他郵箱裡被刪除，或被移出了 Inbox，Origami 會在下一輪同步裡把它從預設 Inbox 列表中移除。

這比「繼續把已不在 Inbox 的郵件掛在列表裡」更接近真實郵箱狀態。  
如果同一封郵件之後又重新回到 Inbox，它也會在後續同步中重新出現。

## 為什麼專案是單使用者？

因為單使用者不是「功能不夠」，而是這個專案目前最重要的邊界。  
它讓：

- 登入模型更輕
- 部署更簡單
- 排錯更直接
- 文件更清楚

## GitHub 登入如果配不起來，先檢查什麼？

按這個順序看，通常最快：

1. `NEXT_PUBLIC_APP_URL` 是否真的是你目前訪問的地址
2. GitHub OAuth App 裡的 **Homepage URL** 是否和應用地址一致
3. GitHub OAuth App 裡的 **Authorization callback URL** 是否精確寫成：
   - `http://localhost:3000/api/better-auth/callback/github`
   - 或 `https://你的網域/api/better-auth/callback/github`
4. `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` 是否填錯、帶了空格、用了別的環境的值
5. 如果是公網部署，是否設定了 `GITHUB_ALLOWED_LOGIN`
6. 如果已經完成首次綁定，目前登入的 GitHub 帳號是否就是當初綁定 owner 的那個帳號

常見現象對應：

- **跳轉後直接報 callback 錯誤**：多半是 callback URL 或 client secret 不匹配
- **別人能看到登入頁但進不去**：通常是 `GITHUB_ALLOWED_LOGIN` 生效了，這是正常的
- **你改了 GitHub 使用者名稱後擔心登不進去**：通常沒事，Origami 綁的是 GitHub user id，不是純文字使用者名稱
- **你綁錯了 owner**：通常需要清理 `app_installation` 記錄後重新初始化

## 為什麼 `NEXT_PUBLIC_APP_URL` 必須和 OAuth callback 用同一個正式網域？

因為 Origami 的登入與郵箱授權流程，本質上都是「從你的站點跳去第三方，再跳回你的站點」。  
如果應用裡認的地址、你瀏覽器裡訪問的地址、第三方平台裡登記的 callback 地址不是同一個網域，就很容易出現：

- 登入後回不來
- callback URL mismatch
- 授權成功但 session 對不上
- 預覽環境能用，正式環境突然失效

簡單說：**只要是正式環境，就盡量讓站點訪問地址和所有 callback 始終保持同一正式網域。**

## 我可以先用 Vercel 的臨時網域或 Preview 部署，後面再慢慢改成正式網域嗎？

可以拿來測試，但 **不建議把它當正式部署路徑**。  
因為一旦你後面把訪問網域改掉，通常還要同步修改：

- `NEXT_PUBLIC_APP_URL`
- GitHub OAuth callback
- Gmail OAuth redirect URI
- Outlook OAuth redirect URI

如果你只是驗證介面能不能跑起來，用 Preview 沒問題。  
如果你準備開始認真接帳號、走授權、保存正式資料，最好先把正式網域定下來。

## 如果我想多帳號、多 OAuth app，會不會很麻煩？

不會。  
目前已經支援：

- 多郵箱帳號
- Gmail / Outlook 多個 OAuth app
- 環境變數預設 app + 資料庫版 app 混用

## Gmail / Outlook 的 OAuth app 一定要放在環境變數裡嗎？

不一定。  
環境變數裡的 `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET`、`OUTLOOK_CLIENT_ID` / `OUTLOOK_CLIENT_SECRET` 更像是「預設 app」。

如果你不填這四項，仍然可以在應用內透過 `/accounts` 管理資料庫託管的 OAuth app。  
差別主要在於：

- **環境變數預設 app**：適合你已經有一套固定的正式配置，想直接開箱即用
- **資料庫託管 app**：適合你想在應用裡管理多套 app，或按帳號區分配置

## QQ 現在到底支不支援發信？

支援。  
目前 QQ 的實作已經是 IMAP 收件 + SMTP 發信，而不是過去那種只讀相容層。

## 附件為什麼要放 R2，不直接放資料庫？

因為附件是二進位大物件。  
把它們從關聯式資料庫中拆出去，可以：

- 減輕資料庫壓力
- 降低備份與查詢負擔
- 讓正文 / 元資料查詢更輕

## 如果我只想最小部署，應該看哪幾頁？

按這個順序：

1. [首頁](/zh-tw/)
2. [快速開始](/zh-tw/quick-start)
3. [部署指南](/zh-tw/deployment)

## 如果我要理解原始碼入口？

直接看：

- [專案結構](/zh-tw/project-structure)
- [架構](/zh-tw/architecture)
