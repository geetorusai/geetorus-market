import { db } from "@/db";
import { creators, listings } from "@/db/schema";
import { getSessionUserId } from "@/lib/api-auth";
import { parseTagInput, slugify } from "@/lib/slug";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const VALID_TYPES = new Set([
  "team_blueprint",
  "agent_blueprint",
  "skill",
  "governance_template",
]);

const VALID_STATUSES = new Set(["draft", "published", "archived"]);

function parseNumber(input: unknown, fallback = 0): number {
  const parsed = Number(input);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function cleanText(input: unknown, maxLength: number): string {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim().slice(0, maxLength);
}

async function loadCreatorForUser(userId: string) {
  return db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  });
}

async function makeUniqueListingSlug(title: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;

  while (
    await db.query.listings.findFirst({
      where: eq(listings.slug, candidate),
      columns: { id: true },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function toListingInsert(
  payload: Record<string, unknown>,
  creatorId: string,
  slug: string,
) {
  const title = cleanText(payload.title, 255);
  const type = cleanText(payload.type, 50);

  if (!title) {
    throw new Error("title is required");
  }

  if (!VALID_TYPES.has(type)) {
    throw new Error("invalid listing type");
  }

  const statusInput = cleanText(payload.status, 20) || "draft";
  const status = VALID_STATUSES.has(statusInput) ? statusInput : "draft";

  return {
    creatorId,
    slug,
    type,
    title,
    tagline: cleanText(payload.tagline, 120) || null,
    description: cleanText(payload.description, 16000) || null,
    price: Math.max(0, Math.min(49900, Math.round(parseNumber(payload.price, 0) * 100))),
    categories: parseTagInput(payload.categories),
    tags: parseTagInput(payload.tags),
    agentCount: Math.max(0, Math.round(parseNumber(payload.agentCount, 0))) || null,
    readmeMarkdown: cleanText(payload.readmeMarkdown, 60000) || null,
    includedFiles: parseTagInput(payload.includedFiles),
    status,
    updatedAt: new Date(),
  };
}

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await loadCreatorForUser(userId);

  if (!creator) {
    return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
  }

  const records = await db
    .select()
    .from(listings)
    .where(and(eq(listings.creatorId, creator.id)))
    .orderBy(desc(listings.updatedAt));

  return NextResponse.json({ listings: records });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await loadCreatorForUser(userId);

  if (!creator) {
    return NextResponse.json(
      { error: "Creator profile required before publishing listings" },
      { status: 403 },
    );
  }

  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  try {
    const slug = await makeUniqueListingSlug(cleanText(payload.title, 255));
    const insertValues = toListingInsert(payload, creator.id, slug);
    const [created] = await db.insert(listings).values(insertValues).returning();

    return NextResponse.json({ listing: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create listing" },
      { status: 400 },
    );
  }
}
