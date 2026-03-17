import { revalidatePath } from "next/cache";

export function revalidateAccountPages() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/accounts");
  revalidatePath("/compose");
}

export function revalidateMailboxPages() {
  revalidateAccountPages();
  revalidatePath("/mail/[id]", "page");
  revalidatePath("/sent");
  revalidatePath("/sent/[id]", "page");
}
