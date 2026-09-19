import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings, creators } from "@/db/schema";
import { eq, and, ilike, gte, lte, sql, desc, asc, or, SQL } from "drizzle-orm";
import { getSession } from "@/lib/api-auth";

// GET /api/listings - Browse with filters
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const type = params.get("type");
  const category = params.get("category");
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const search = params.get("search");
  const sort = params.get("sort") || "newest";
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(params.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(listings.status, "published")];

  if (type) {
    conditions.push(eq(listings.type, type));
  }

  if (category) {
    conditions.push(
      sql`${listings.categories} @> ${JSON.stringify([category])}::jsonb`
    );
  }

  if (minPrice) {
    conditions.push(gte(listings.price, parseInt(minPrice, 10)));
  }

  if (maxPrice) {
    conditions.push(lte(listings.price, parseInt(maxPrice, 10)));
  }

  if (search) {
    conditions.push(
      or(
        ilike(listings.title, `%${search}%`),
        ilike(listings.description, `%${search}%`),
        ilike(listings.tagline, `%${search}%`)
      )!
    );
  }

  const where = and(...conditions);

  let orderBy;
  switch (sort) {
    case "popular":
      orderBy = desc(listings.installCount);
      break;
    case "rating":
      orderBy = desc(listings.rating);
      break;
    case "price_asc":
      orderBy = asc(listings.price);
      break;
    case "price_desc":
      orderBy = desc(listings.price);
      break;
    case "oldest":
      orderBy = asc(listings.createdAt);
      break;
    case "newest":
    default:
      orderBy = desc(listings.createdAt);
      break;
  }

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: listings.id,
        slug: listings.slug,
        type: listings.type,
        title: listings.title,
        tagline: listings.tagline,
        price: listings.price,
        creatorId: listings.creatorId,
        categories: listings.categories,
        tags: listings.tags,
        agentCount: listings.agentCount,
        previewImages: listings.previewImages,
        installCount: listings.installCount,
        rating: listings.rating,
        reviewCount: listings.reviewCount,
        status: listings.status,
        createdAt: listings.createdAt,
        creatorName: creators.displayName,
        creatorAvatar: creators.avatarUrl,
      })
      .from(listings)
      .leftJoin(creators, eq(listings.creatorId, creators.id))
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(where),
  ]);

  const total = Number(countResult[0].count);

  return NextResponse.json({
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/listings - Create listing (authenticated creator)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, session.user.id))
    .limit(1);

  if (creator.length === 0) {
    return NextResponse.json(
      { error: "You must register as a creator first" },
      { status: 403 }
    );
  }

  const body = await request.json();

  const { type, title, tagline, description, slug, price, categories, tags, agentCount, previewImages, readmeMarkdown, includedFiles, compatibleAdapters, requiredModels, version } = body;

  if (!type || !title || !slug) {
    return NextResponse.json(
      { error: "type, title, and slug are required" },
      { status: 400 }
    );
  }

  const validTypes = ["team_blueprint", "agent_blueprint", "skill", "governance_template"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  // Check slug uniqueness
  const existing = await db
    .select({ id: listings.id })
    .from(listings)
    .where(eq(listings.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "A listing with this slug already exists" },
      { status: 409 }
    );
  }

  const [listing] = await db
    .insert(listings)
    .values({
      type,
      title,
      tagline: tagline || null,
      description: description || null,
      slug,
      price: price ?? 0,
      creatorId: creator[0].id,
      categories: categories || [],
      tags: tags || [],
      agentCount: agentCount || null,
      previewImages: previewImages || [],
      readmeMarkdown: readmeMarkdown || null,
      includedFiles: includedFiles || [],
      compatibleAdapters: compatibleAdapters || [],
      requiredModels: requiredModels || [],
      version: version || "1.0.0",
      status: "draft",
    })
    .returning();

  return NextResponse.json({ data: listing }, { status: 201 });
}
