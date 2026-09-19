import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
