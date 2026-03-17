import { describe, expect, it } from "vitest";
import { aggregateAccountRuntimeHealth } from "./accounts";

describe("aggregateAccountRuntimeHealth", () => {
  it("aggregates pending counts and keeps the latest error per account", () => {
    const result = aggregateAccountRuntimeHealth([
      {
        accountId: "acc-1",
        hydrationStatus: "failed",
        hydratedAt: 100,
        hydrationError: "old hydration error",
        readWriteBackStatus: "failed",
        readWriteBackAt: 120,
        readWriteBackError: "old read error",
        starWriteBackStatus: "pending",
        starWriteBackAt: null,
        starWriteBackError: null,
      },
      {
        accountId: "acc-1",
        hydrationStatus: "failed",
        hydratedAt: 200,
        hydrationError: "new hydration error",
        readWriteBackStatus: "pending",
        readWriteBackAt: null,
        readWriteBackError: null,
        starWriteBackStatus: "failed",
        starWriteBackAt: 180,
        starWriteBackError: "star error",
      },
      {
        accountId: "acc-1",
        hydrationStatus: "hydrating",
        hydratedAt: null,
        hydrationError: null,
        readWriteBackStatus: "failed",
        readWriteBackAt: 240,
        readWriteBackError: "new read error",
        starWriteBackStatus: "failed",
        starWriteBackAt: 160,
        starWriteBackError: "old star error",
      },
    ]);

    expect(result.get("acc-1")).toEqual({
      hydrationPendingCount: 1,
      hydrationFailedCount: 2,
      latestHydrationError: "new hydration error",
      latestHydrationAt: 200,
      readWriteBackPendingCount: 1,
      readWriteBackFailedCount: 2,
      latestReadWriteBackError: "new read error",
      latestReadWriteBackAt: 240,
      starWriteBackPendingCount: 1,
      starWriteBackFailedCount: 2,
      latestStarWriteBackError: "star error",
      latestStarWriteBackAt: 180,
    });
  });
});
