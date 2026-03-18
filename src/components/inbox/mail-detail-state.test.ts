import { describe, expect, it } from "vitest";
import { shouldPollMailDetailStatus } from "./mail-detail-state";

describe("mail-detail-state", () => {
  it("polls while hydrating", () => {
    expect(
      shouldPollMailDetailStatus(
        {
          hydrationStatus: "metadata",
          readWriteBackStatus: "idle",
          starWriteBackStatus: "idle",
        },
        true
      )
    ).toBe(true);

    expect(
      shouldPollMailDetailStatus({
        hydrationStatus: "hydrating",
        readWriteBackStatus: "idle",
        starWriteBackStatus: "idle",
      })
    ).toBe(true);
  });

  it("polls while write-back is pending", () => {
    expect(
      shouldPollMailDetailStatus({
        hydrationStatus: "hydrated",
        readWriteBackStatus: "pending",
        starWriteBackStatus: "idle",
      })
    ).toBe(true);

    expect(
      shouldPollMailDetailStatus({
        hydrationStatus: "hydrated",
        readWriteBackStatus: "idle",
        starWriteBackStatus: "pending",
      })
    ).toBe(true);
  });

  it("stops polling once everything is settled", () => {
    expect(
      shouldPollMailDetailStatus({
        hydrationStatus: "hydrated",
        readWriteBackStatus: "success",
        starWriteBackStatus: "failed",
      })
    ).toBe(false);
  });
});
