import type { Email } from "@/lib/db/schema";

export function shouldPollMailDetailStatus(email: Pick<Email, "readWriteBackStatus" | "starWriteBackStatus" | "hydrationStatus">, isHydrating = false) {
  if (isHydrating || email.hydrationStatus === "hydrating") {
    return true;
  }

  return email.readWriteBackStatus === "pending" || email.starWriteBackStatus === "pending";
}
