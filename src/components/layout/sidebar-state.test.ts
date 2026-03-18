import { describe, expect, it } from "vitest";
import { resolveSidebarNavigationState } from "./sidebar-state";

describe("sidebar-state", () => {
  it("marks the plain inbox route as the default active view", () => {
    expect(
      resolveSidebarNavigationState({
        pathname: "/",
        hasSendAccounts: true,
      })
    ).toMatchObject({
      isInboxView: true,
      isStarredView: false,
      isSentView: false,
      isAccountsView: false,
      composeHref: "/compose",
      sentHref: "/sent",
    });
  });

  it("preserves account context for compose and sent links", () => {
    expect(
      resolveSidebarNavigationState({
        pathname: "/",
        accountId: "acc_2",
        hasSendAccounts: true,
      })
    ).toMatchObject({
      activeAccountId: "acc_2",
      isInboxView: false,
      composeHref: "/compose?account=acc_2",
      sentHref: "/sent?account=acc_2",
    });
  });

  it("treats starred and sent detail routes as their own active views", () => {
    expect(
      resolveSidebarNavigationState({
        pathname: "/",
        starred: true,
        hasSendAccounts: true,
      })
    ).toMatchObject({
      isStarredView: true,
      isInboxView: false,
      starredHref: "/?starred=1",
    });

    expect(
      resolveSidebarNavigationState({
        pathname: "/sent/msg_1",
        accountId: "acc_2",
        hasSendAccounts: true,
      })
    ).toMatchObject({
      isSentView: true,
      sentHref: "/sent?account=acc_2",
    });
  });

  it("hides the sent destination when no send-capable accounts exist", () => {
    expect(
      resolveSidebarNavigationState({
        pathname: "/",
        accountId: "acc_2",
        hasSendAccounts: false,
      })
    ).toMatchObject({
      composeHref: "/compose?account=acc_2",
      sentHref: null,
    });
  });
});
