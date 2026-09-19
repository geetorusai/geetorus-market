import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings, creators, teamBlueprints } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/api-auth";

// GET /api/listings/:slug - Listing detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: slug } = await params;

  const result = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      type: listings.type,
      title: listings.title,
      tagline: listings.tagline,
      description: listings.description,
      price: listings.price,
      creatorId: listings.creatorId,
      categories: listings.categories,
      tags: listings.tags,
      agentCount: listings.agentCount,
      previewImages: listings.previewImages,
      readmeMarkdown: listings.readmeMarkdown,
      includedFiles: listings.includedFiles,
      compatibleAdapters: listings.compatibleAdapters,
      requiredModels: listings.requiredModels,
      installCount: listings.installCount,
      rating: listings.rating,
      reviewCount: listings.reviewCount,
      version: listings.version,
      status: listings.status,
      createdAt: listings.createdAt,
      updatedAt: listings.updatedAt,
      creatorName: creators.displayName,
      creatorAvatar: creators.avatarUrl,
      creatorBio: creators.bio,
      creatorVerified: creators.verified,
    })
    .from(listings)
    .leftJoin(creators, eq(listings.creatorId, creators.id))
    .where(eq(listings.slug, slug))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const listing = result[0];

  // Fetch team blueprint if applicable
  let blueprint = null;
  if (listing.type === "team_blueprint") {
    const bpResult = await db
      .select()
      .from(teamBlueprints)
      .where(eq(teamBlueprints.listingId, listing.id))
      .limit(1);

    if (bpResult.length > 0) {
      blueprint = bpResult[0];
    }
  }

  return NextResponse.json({
    data: {
      ...listing,
      blueprint,
    },
  });
}

// PATCH /api/listings/:slug - Update listing (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: slug } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the listing and verify ownership
  const existing = await db
    .select({
      id: listings.id,
      creatorId: listings.creatorId,
      creatorUserId: creators.userId,
    })
    .from(listings)
    .leftJoin(creators, eq(listings.creatorId, creators.id))
    .where(eq(listings.slug, slug))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (existing[0].creatorUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  // Only allow updating specific fields
  const allowedFields = [
    "title", "tagline", "description", "price", "categories", "tags",
    "agentCount", "previewImages", "readmeMarkdown", "includedFiles",
    "compatibleAdapters", "requiredModels", "version", "status",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (body.status && !["draft", "published", "archived"].includes(body.status)) {
    return NextResponse.json(
      { error: "status must be draft, published, or archived" },
      { status: 400 }
    );
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  updates.updatedAt = new Date();

  const [updated] = await db
    .update(listings)
    .set(updates)
    .where(eq(listings.id, existing[0].id))
    .returning();

  return NextResponse.json({ data: updated });
}

// DELETE /api/listings/:slug - Archive listing (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: slug } = await params;
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db
    .select({
      id: listings.id,
      creatorUserId: creators.userId,
    })
    .from(listings)
    .leftJoin(creators, eq(listings.creatorId, creators.id))
    .where(eq(listings.slug, slug))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (existing[0].creatorUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [archived] = await db
    .update(listings)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(listings.id, existing[0].id))
    .returning();

  return NextResponse.json({ data: archived });
}
