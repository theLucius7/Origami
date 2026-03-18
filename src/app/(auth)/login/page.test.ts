import { beforeEach, describe, expect, it, vi } from "vitest";

const hasGitHubOAuthConfigMock = vi.fn();
const getRequestLocaleMock = vi.fn();

vi.mock("@/lib/secrets", () => ({
  hasGitHubOAuthConfig: hasGitHubOAuthConfigMock,
}));

vi.mock("@/i18n/locale.server", () => ({
  getRequestLocale: getRequestLocaleMock,
}));

function collectText(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join(" ");
  if (typeof node !== "object") return "";

  const candidate = node as { props?: { children?: unknown } };
  return collectText(candidate.props?.children);
}

describe("LoginPage", () => {
  beforeEach(() => {
    hasGitHubOAuthConfigMock.mockReset();
    getRequestLocaleMock.mockReset();
  });

  it("renders localized GitHub sign-in copy", async () => {
    hasGitHubOAuthConfigMock.mockReturnValue(true);
    getRequestLocaleMock.mockResolvedValue("en");

    const { default: LoginPage } = await import("./page");
    const element = await LoginPage({
      searchParams: Promise.resolve({}),
    });

    const text = collectText(element);
    expect(text).toContain("For a single-user instance, GitHub sign-in is the recommended path.");
    expect(text).toContain("Continue with GitHub");
    expect(text).toContain("This is a single-owner instance.");
  });

  it("renders localized error and missing-config copy", async () => {
    hasGitHubOAuthConfigMock.mockReturnValue(false);
    getRequestLocaleMock.mockResolvedValue("ja");

    const { default: LoginPage } = await import("./page");
    const element = await LoginPage({
      searchParams: Promise.resolve({ error: "github_callback" }),
    });

    const text = collectText(element);
    expect(text).toContain("GitHub サインインに失敗しました。しばらくしてからもう一度お試しください。");
    expect(text).toContain("GitHub OAuth はまだ設定されていません。");
    expect(text).toContain("これは単一 owner インスタンスです。");
  });
});
