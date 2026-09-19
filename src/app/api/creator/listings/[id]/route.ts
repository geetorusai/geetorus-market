import { db } from "@/db";
import { creators, listings } from "@/db/schema";
import { getSessionUserId } from "@/lib/api-auth";
import { parseTagInput } from "@/lib/slug";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const VALID_TYPES = new Set([
  "team_blueprint",
  "agent_blueprint",
  "skill",
  "governance_template",
]);

const VALID_STATUSES = new Set(["draft", "published", "archived"]);

function cleanText(input: unknown, maxLength: number): string {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim().slice(0, maxLength);
}

function parseNumber(input: unknown, fallback = 0): number {
  const parsed = Number(input);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

async function loadCreatorForUser(userId: string) {
  return db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  });
}

async function loadOwnedListing(id: string, creatorId: string) {
  return db.query.listings.findFirst({
    where: and(eq(listings.id, id), eq(listings.creatorId, creatorId)),
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await loadCreatorForUser(userId);

  if (!creator) {
    return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
  }

  const { id } = await context.params;
  const listing = await loadOwnedListing(id, creator.id);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json({ listing });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await loadCreatorForUser(userId);

  if (!creator) {
    return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
  }

  const { id } = await context.params;
  const listing = await loadOwnedListing(id, creator.id);

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const title = cleanText(payload.title, 255);
  const type = cleanText(payload.type, 50);
  const statusValue = cleanText(payload.status, 20);

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: "invalid listing type" }, { status: 400 });
  }

  const updateValues = {
    title,
    type,
    tagline: cleanText(payload.tagline, 120) || null,
    description: cleanText(payload.description, 16000) || null,
    price: Math.max(0, Math.min(49900, Math.round(parseNumber(payload.price, 0) * 100))),
    categories: parseTagInput(payload.categories),
    tags: parseTagInput(payload.tags),
    agentCount: Math.max(0, Math.round(parseNumber(payload.agentCount, 0))) || null,
    readmeMarkdown: cleanText(payload.readmeMarkdown, 60000) || null,
    includedFiles: parseTagInput(payload.includedFiles),
    status: VALID_STATUSES.has(statusValue) ? statusValue : listing.status,
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(listings)
    .set(updateValues)
    .where(and(eq(listings.id, id), eq(listings.creatorId, creator.id)))
    .returning();

  return NextResponse.json({ listing: updated });
}
