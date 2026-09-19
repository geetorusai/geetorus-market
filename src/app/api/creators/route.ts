import { db } from "@/db";
import { creators } from "@/db/schema";
import { getSessionUserId } from "@/lib/api-auth";
import { slugify } from "@/lib/slug";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function toPublicCreator(record: typeof creators.$inferSelect) {
  return {
    ...record,
    slug: slugify(record.displayName),
  };
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  });

  if (existing) {
    return NextResponse.json(
      { error: "Creator profile already exists", creator: toPublicCreator(existing) },
      { status: 409 },
    );
  }

  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const displayName = sanitizeString(payload.displayName, 100);
  const bio = sanitizeString(payload.bio, 1600);
  const website = sanitizeString(payload.website, 500);
  const avatarUrl = sanitizeString(payload.avatarUrl, 1000);

  if (!displayName) {
    return NextResponse.json(
      { error: "displayName is required" },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(creators)
    .values({
      userId,
      displayName,
      bio: bio || null,
      website: website || null,
      avatarUrl: avatarUrl || null,
    })
    .returning();

  return NextResponse.json({ creator: toPublicCreator(created) }, { status: 201 });
}
