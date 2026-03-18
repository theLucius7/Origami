import { describe, expect, it } from "vitest";
import { resolveComposeLinkHref } from "./compose-link-state";

describe("compose-link-state", () => {
  it("returns null when compose is unavailable", () => {
    expect(resolveComposeLinkHref(false, "acc_1")).toBeNull();
  });

  it("preserves account context when compose is available", () => {
    expect(resolveComposeLinkHref(true, "acc_1")).toBe("/compose?account=acc_1");
    expect(resolveComposeLinkHref(true)).toBe("/compose");
  });
});
