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
          { text: "架构", link: "/architecture" },
          { text: "部署", link: "/deployment" },
          { text: "项目结构", link: "/project-structure" },
          { text: "FAQ", link: "/faq" },
          { text: "GitHub", link: "https://github.com/theLucius7/Origami" }
        ],
        sidebar: [
          {
            text: "开始使用",
            items: [
              { text: "概览", link: "/" },
              { text: "快速开始", link: "/quick-start" },
              { text: "部署", link: "/deployment" },
              { text: "FAQ", link: "/faq" }
            ]
          },
          {
            text: "深入理解",
            items: [
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
          { text: "Architecture", link: "/en/architecture" },
          { text: "Deployment", link: "/en/deployment" },
          { text: "Project Structure", link: "/en/project-structure" },
          { text: "FAQ", link: "/en/faq" },
          { text: "GitHub", link: "https://github.com/theLucius7/Origami" }
        ],
        sidebar: [
          {
            text: "Get Started",
            items: [
              { text: "Overview", link: "/en/" },
              { text: "Quick Start", link: "/en/quick-start" },
              { text: "Deployment", link: "/en/deployment" },
              { text: "FAQ", link: "/en/faq" }
            ]
          },
          {
            text: "Deep Dive",
            items: [
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
          { text: "アーキテクチャ", link: "/ja/architecture" },
          { text: "デプロイ", link: "/ja/deployment" },
          { text: "プロジェクト構成", link: "/ja/project-structure" },
          { text: "FAQ", link: "/ja/faq" },
          { text: "GitHub", link: "https://github.com/theLucius7/Origami" }
        ],
        sidebar: [
          {
            text: "はじめに",
            items: [
              { text: "概要", link: "/ja/" },
              { text: "クイックスタート", link: "/ja/quick-start" },
              { text: "デプロイ", link: "/ja/deployment" },
              { text: "FAQ", link: "/ja/faq" }
            ]
          },
          {
            text: "詳細",
            items: [
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
