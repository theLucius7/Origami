"use server";

import { getGmailAuthUrl } from "@/lib/providers/gmail";
import { getOutlookAuthUrl } from "@/lib/providers/outlook";

export async function getGmailOAuthUrl(): Promise<string> {
  return getGmailAuthUrl();
}

export async function getOutlookOAuthUrl(): Promise<string> {
  return getOutlookAuthUrl();
}
