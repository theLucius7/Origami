import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: ["coverage/**", "docs/.vitepress/cache/**", "docs/.vitepress/dist/**"],
  },
  ...nextVitals,
];

export default config;
