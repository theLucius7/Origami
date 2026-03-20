import { describe, expect, it, vi } from "vitest";

const signInSocialMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signInSocial: signInSocialMock,
    },
  },
}));

describe("GET /api/auth/github/start", () => {
  it("delegates legacy start route to Better Auth social sign-in", async () => {
    signInSocialMock.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: {
          Location: "https://github.com/login/oauth/authorize?client_id=test",
          "set-cookie": "better-auth.state=abc; Path=/; HttpOnly",
        },
      })
    );

    const { GET } = await import("./route");
    const req = new Request("https://example.test/api/auth/github/start");
    const res = await GET(req);

    expect(signInSocialMock).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      body: {
        provider: "github",
        callbackURL: "/",
        errorCallbackURL: "/login",
      },
      asResponse: true,
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("github.com/login/oauth/authorize");
  });
});
