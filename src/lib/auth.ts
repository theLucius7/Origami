import { cookies } from "next/headers";
import { readSessionFromCookies } from "@/lib/session";

export async function verifyAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(await readSessionFromCookies(cookieStore));
}
