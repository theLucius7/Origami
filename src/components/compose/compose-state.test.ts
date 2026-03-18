import { describe, expect, it } from "vitest";
import { buildComposeSuccessHref, resolveComposeAccountId } from "./compose-state";

const accounts = [{ id: "acc_1" }, { id: "acc_2" }];

describe("compose-state", () => {
  it("prefers the account from URL when it exists", () => {
    expect(resolveComposeAccountId(accounts, "acc_2")).toBe("acc_2");
  });

  it("falls back to the first send-capable account", () => {
    expect(resolveComposeAccountId(accounts, "missing")).toBe("acc_1");
    expect(resolveComposeAccountId([], "missing")).toBe("");
  });

  it("builds success destinations with mailbox context", () => {
    expect(buildComposeSuccessHref("msg_1", "acc_2")).toBe("/sent/msg_1?account=acc_2");
    expect(buildComposeSuccessHref(undefined, "acc_2")).toBe("/sent?account=acc_2");
  });
});
