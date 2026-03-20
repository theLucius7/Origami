import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Origami",
  description: "一个面向个人与小团队单席位的统一收件箱。",
  base: "/Origami/",
  cleanUrls: true,
  lastUpdated: true,
  locales: {
    root: {
      label: "简体中文",
      lang: "zh-CN",
      themeConfig: {
        siteTitle: "Origami 文档",
        logo: "✉️",
        nav: [
          { text: "首页", link: "/" },
          { text: "快速开始", link: "/quick-start" },
          { text: "部署", link: "/deployment" },
          { text: "平台配置", link: "/neon" },
          { text: "开发", link: "/development" },
          { text: "架构", link: "/architecture" },
          { text: "FAQ", link: "/faq" },
          { text: "GitHub", link: "https://github.com/theLucius7/Origami" }
        ],
        sidebar: [
          {
            text: "生产部署",
            items: [
              { text: "概览", link: "/" },
              { text: "快速开始", link: "/quick-start" },
              { text: "部署指南", link: "/deployment" },
              { text: "FAQ", link: "/faq" }
            ]
          },
          {
            text: "第三方平台配置",
            items: [
              { text: "Neon PostgreSQL", link: "/neon" },
              { text: "Cloudflare R2 / Bucket", link: "/r2-storage" },
              { text: "GitHub Auth", link: "/github-auth" },
              { text: "Gmail OAuth", link: "/gmail-oauth" },
              { text: "Outlook OAuth", link: "/outlook-oauth" }
            ]
          },
          {
            text: "开发与参考",
            items: [
              { text: "开发与调试", link: "/development" },
              { text: "架构", link: "/architecture" },
              { text: "项目结构", link: "/project-structure" }
            ]
          }
        ],
        outline: {
          level: [2, 3],
          label: "本页目录"
        },
        docFooter: {
          prev: "上一页",
          next: "下一页"
        },
        lastUpdated: {
          text: "最后更新于"
        },
        search: {
          provider: "local"
        },
        socialLinks: [
          { icon: "github", link: "https://github.com/theLucius7/Origami" }
        ],
        footer: {
          message: "基于 MIT License 发布。",
          copyright: "Copyright © 2026 Lucius7"
        }
      }
    },
    "zh-tw": {
      label: "繁體中文",
      lang: "zh-TW",
      link: "/zh-tw/",
      themeConfig: {
        siteTitle: "Origami 文件",
        logo: "✉️",
        nav: [
          { text: "首頁", link: "/zh-tw/" },
          { text: "快速開始", link: "/zh-tw/quick-start" },
          { text: "部署", link: "/zh-tw/deployment" },
          { text: "平台設定", link: "/zh-tw/neon" },
          { text: "開發", link: "/zh-tw/development" },
          { text: "架構", link: "/zh-tw/architecture" },
          { text: "FAQ", link: "/zh-tw/faq" },
          { text: "GitHub", link: "https://github.com/theLucius7/Origami" }
        ],
        sidebar: [
          {
            text: "正式部署",
            items: [
              { text: "概覽", link: "/zh-tw/" },
              { text: "快速開始", link: "/zh-tw/quick-start" },
              { text: "部署指南", link: "/zh-tw/deployment" },
              { text: "FAQ", link: "/zh-tw/faq" }
            ]
          },
          {
            text: "第三方平台設定",
            items: [
              { text: "Neon PostgreSQL", link: "/zh-tw/neon" },
              { text: "Cloudflare R2 / Bucket", link: "/zh-tw/r2-storage" },
              { text: "GitHub Auth", link: "/zh-tw/github-auth" },
              { text: "Gmail OAuth", link: "/zh-tw/gmail-oauth" },
              { text: "Outlook OAuth", link: "/zh-tw/outlook-oauth" }
            ]
          },
          {
            text: "開發與參考",
            items: [
              { text: "開發與除錯", link: "/zh-tw/development" },
              { text: "架構", link: "/zh-tw/architecture" },
              { text: "專案結構", link: "/zh-tw/project-structure" }
            ]
          }
        ],
        outline: {
          level: [2, 3],
          label: "本頁目錄"
        },
        docFooter: {
          prev: "上一頁",
          next: "下一頁"
        },
        lastUpdated: {
          text: "最後更新"
        },
        search: {
          provider: "local"
        },
        socialLinks: [
          { icon: "github", link: "https://github.com/theLucius7/Origami" }
        ],
        footer: {
          message: "以 MIT License 發布。",
          copyright: "Copyright © 2026 Lucius7"
        }
      }
    },
    en: {
      label: "English",
      lang: "en-US",
      link: "/en/",
      themeConfig: {
        siteTitle: "Origami Docs",
        logo: "✉️",
        nav: [
          { text: "Home", link: "/en/" },
          { text: "Quick Start", link: "/en/quick-start" },
          { text: "Deployment", link: "/en/deployment" },
          { text: "Platform Setup", link: "/en/neon" },
          { text: "Development", link: "/en/development" },
          { text: "Architecture", link: "/en/architecture" },
          { text: "FAQ", link: "/en/faq" },
          { text: "GitHub", link: "https://github.com/theLucius7/Origami" }
        ],
        sidebar: [
          {
            text: "Production",
            items: [
              { text: "Overview", link: "/en/" },
              { text: "Quick Start", link: "/en/quick-start" },
              { text: "Deployment", link: "/en/deployment" },
              { text: "FAQ", link: "/en/faq" }
            ]
          },
          {
            text: "Third-Party Setup",
            items: [
              { text: "Neon PostgreSQL", link: "/en/neon" },
              { text: "Cloudflare R2 / Bucket", link: "/en/r2-storage" },
              { text: "GitHub Auth", link: "/en/github-auth" },
              { text: "Gmail OAuth", link: "/en/gmail-oauth" },
              { text: "Outlook OAuth", link: "/en/outlook-oauth" }
            ]
          },
          {
            text: "Development & Reference",
            items: [
              { text: "Development", link: "/en/development" },
              { text: "Architecture", link: "/en/architecture" },
              { text: "Project Structure", link: "/en/project-structure" }
            ]
          }
        ],
        outline: {
          level: [2, 3],
          label: "On this page"
        },
        docFooter: {
          prev: "Previous page",
          next: "Next page"
        },
        lastUpdated: {
          text: "Last updated"
        },
        search: {
          provider: "local"
        },
        socialLinks: [
          { icon: "github", link: "https://github.com/theLucius7/Origami" }
        ],
        footer: {
          message: "Released under the MIT License.",
          copyright: "Copyright © 2026 Lucius7"
        }
      }
    },
    ja: {
      label: "日本語",
      lang: "ja-JP",
      link: "/ja/",
      themeConfig: {
        siteTitle: "Origami ドキュメント",
        logo: "✉️",
        nav: [
          { text: "ホーム", link: "/ja/" },
          { text: "クイックスタート", link: "/ja/quick-start" },
          { text: "デプロイ", link: "/ja/deployment" },
          { text: "外部サービス設定", link: "/ja/neon" },
          { text: "開発", link: "/ja/development" },
          { text: "アーキテクチャ", link: "/ja/architecture" },
          { text: "FAQ", link: "/ja/faq" },
          { text: "GitHub", link: "https://github.com/theLucius7/Origami" }
        ],
        sidebar: [
          {
            text: "本番導入",
            items: [
              { text: "概要", link: "/ja/" },
              { text: "クイックスタート", link: "/ja/quick-start" },
              { text: "デプロイ", link: "/ja/deployment" },
              { text: "FAQ", link: "/ja/faq" }
            ]
          },
          {
            text: "外部サービス設定",
            items: [
              { text: "Neon PostgreSQL", link: "/ja/neon" },
              { text: "Cloudflare R2 / Bucket", link: "/ja/r2-storage" },
              { text: "GitHub Auth", link: "/ja/github-auth" },
              { text: "Gmail OAuth", link: "/ja/gmail-oauth" },
              { text: "Outlook OAuth", link: "/ja/outlook-oauth" }
            ]
          },
          {
            text: "開発とリファレンス",
            items: [
              { text: "開発とデバッグ", link: "/ja/development" },
              { text: "アーキテクチャ", link: "/ja/architecture" },
              { text: "プロジェクト構成", link: "/ja/project-structure" }
            ]
          }
        ],
        outline: {
          level: [2, 3],
          label: "このページ"
        },
        docFooter: {
          prev: "前のページ",
          next: "次のページ"
        },
        lastUpdated: {
          text: "最終更新"
        },
        search: {
          provider: "local"
        },
        socialLinks: [
          { icon: "github", link: "https://github.com/theLucius7/Origami" }
        ],
        footer: {
          message: "MIT License で公開。",
          copyright: "Copyright © 2026 Lucius7"
        }
      }
    }
  }
});
