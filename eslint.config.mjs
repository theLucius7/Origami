import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: ["coverage/**", "docs/.vitepress/dist/**"],
  },
  ...nextVitals,
];

export default config;
