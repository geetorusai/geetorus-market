import { db } from "@/db";
import { creators, listings } from "@/db/schema";
import { getSessionUserId } from "@/lib/api-auth";
import { slugify } from "@/lib/slug";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

function toPublicCreator(record: typeof creators.$inferSelect) {
  return {
    ...record,
    slug: slugify(record.displayName),
  };
}

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  });

  if (!creator) {
    return NextResponse.json({ creator: null, listings: [] });
  }

  const ownListings = await db
    .select()
    .from(listings)
    .where(and(eq(listings.creatorId, creator.id)))
    .orderBy(desc(listings.updatedAt));

  return NextResponse.json({
    creator: toPublicCreator(creator),
    listings: ownListings,
  });
}
