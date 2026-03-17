import { NextRequest, NextResponse } from "next/server";
import { syncAllAccounts } from "@/lib/services/sync-service";
import { getCronSecret } from "@/lib/secrets";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = await getCronSecret();
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { results } = await syncAllAccounts();
  return NextResponse.json({ ok: true, results });
}
