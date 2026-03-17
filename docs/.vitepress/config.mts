import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Origami",
  description: "Unified inbox for Gmail, Outlook, and QQ.",
  base: "/Origami/",
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    siteTitle: "Origami",
    logo: "✉️",
    nav: [
      { text: "Home", link: "/" },
      { text: "Architecture", link: "/architecture" },
      { text: "Deployment", link: "/deployment" },
      { text: "Project Structure", link: "/project-structure" },
      { text: "GitHub", link: "https://github.com/theLucius7/Origami" }
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Overview", link: "/" },
          { text: "Architecture", link: "/architecture" },
          { text: "Deployment", link: "/deployment" },
          { text: "Project Structure", link: "/project-structure" }
        ]
      }
    ],
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
});
