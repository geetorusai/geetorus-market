import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings, teamBlueprints, purchases } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/api-auth";
import {
  geetorusClient,
  type CreateAgentPayload,
} from "@/lib/geetorus-client";

interface InstallRequestBody {
  targetCompanyId: string;
  geetorusApiKey: string; // Caller provides their Geetorus API key
  overrides?: {
    agentModel?: string;
    budgetScale?: number;
    skipProjects?: boolean;
  };
}

interface AgentBlueprint {
  slug: string;
  name: string;
  role: string;
  title: string;
  icon?: string;
  capabilities?: string;
  adapterType: string;
  adapterConfig?: Record<string, unknown>;
  instructionsPath?: string | null;
  budgetMonthlyCents?: number;
  permissions?: { canCreateAgents?: boolean };
}

interface ReportingLink {
  agentSlug: string;
  reportsTo: string | null;
}

interface ProjectTemplate {
  name: string;
  description?: string;
  workspace?: {
    cwd?: string | null;
    repoUrl?: string | null;
  } | null;
}

interface BlueprintData {
  agents: AgentBlueprint[];
  reportingChain: ReportingLink[];
  governance?: {
    approvalRules?: unknown[];
    budgetDefaults?: { role: string; monthlyCents: number }[];
    escalationChain?: string[];
  };
  projects?: ProjectTemplate[];
  companyDefaults?: {
    name?: string;
    defaultModel?: string;
    defaultAdapter?: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: listingId } = await params;

    const body: InstallRequestBody = await request.json();
    const { targetCompanyId, geetorusApiKey, overrides } = body;

    if (!targetCompanyId || !geetorusApiKey) {
      return NextResponse.json(
        { error: "targetCompanyId and geetorusApiKey are required" },
        { status: 400 }
      );
    }

    // 1. Fetch listing and validate it exists + is published
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.status !== "published") {
      return NextResponse.json(
        { error: "Listing is not published" },
        { status: 400 }
      );
    }

    // 2. Validate purchase/free access
    if (listing.price > 0) {
      const [purchase] = await db
        .select()
        .from(purchases)
        .where(
          and(
            eq(purchases.listingId, listingId),
            eq(purchases.buyerUserId, session.user.id),
            eq(purchases.status, "completed")
          )
        )
        .limit(1);

      if (!purchase) {
        return NextResponse.json(
          { error: "You must purchase this listing before installing" },
          { status: 403 }
        );
      }
    }

    // 3. Fetch the team blueprint data
    const [blueprint] = await db
      .select()
      .from(teamBlueprints)
      .where(eq(teamBlueprints.listingId, listingId))
      .limit(1);

    if (!blueprint) {
      return NextResponse.json(
        { error: "No blueprint data found for this listing" },
        { status: 404 }
      );
    }

    const blueprintData = blueprint as unknown as {
      agents: BlueprintData["agents"];
      reportingChain: BlueprintData["reportingChain"];
      governance: BlueprintData["governance"];
      projects: BlueprintData["projects"];
      companyDefaults: BlueprintData["companyDefaults"];
    };

    // 4. Validate target company access
    try {
      await geetorusClient.getCompany(targetCompanyId, geetorusApiKey);
    } catch {
      return NextResponse.json(
        {
          error:
            "Cannot access target company. Check your API key and company ID.",
        },
        { status: 403 }
      );
    }

    // 5. Create agents from blueprint
    const agentMap = new Map<string, string>(); // slug -> created agent ID
    const createdAgents: { slug: string; id: string; name: string }[] = [];
    const errors: string[] = [];

    const agents = blueprintData.agents as AgentBlueprint[];
    const reportingChain = blueprintData.reportingChain as ReportingLink[];

    // First pass: create all agents (without reporting chains)
    for (const agentDef of agents) {
      const agentPayload: CreateAgentPayload = {
        name: agentDef.name,
        role: agentDef.role,
        title: agentDef.title,
        icon: agentDef.icon,
        capabilities: agentDef.capabilities,
        adapterType:
          overrides?.agentModel
            ? agentDef.adapterType
            : agentDef.adapterType,
        adapterConfig: {
          ...agentDef.adapterConfig,
          ...(overrides?.agentModel ? { model: overrides.agentModel } : {}),
        },
        budgetMonthlyCents: overrides?.budgetScale
          ? Math.round(
              (agentDef.budgetMonthlyCents ?? 0) * overrides.budgetScale
            )
          : agentDef.budgetMonthlyCents,
        permissions: agentDef.permissions,
      };

      try {
        const created = await geetorusClient.createAgent(
          targetCompanyId,
          agentPayload,
          geetorusApiKey
        );
        agentMap.set(agentDef.slug, created.id);
        createdAgents.push({
          slug: agentDef.slug,
          id: created.id,
          name: created.name,
        });
      } catch (err) {
        errors.push(
          `Failed to create agent "${agentDef.name}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    // Second pass: set reporting chains
    for (const link of reportingChain) {
      const agentId = agentMap.get(link.agentSlug);
      const reportsToId = link.reportsTo
        ? agentMap.get(link.reportsTo)
        : null;

      if (agentId && link.reportsTo && reportsToId) {
        try {
          // Use the Geetorus API to update the agent's reportsTo
          await fetch(
            `${process.env.GEETORUS_API_URL ?? "http://localhost:3100"}/api/agents/${agentId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${geetorusApiKey}`,
              },
              body: JSON.stringify({ reportsTo: reportsToId }),
            }
          );
        } catch (err) {
          errors.push(
            `Failed to set reporting chain for "${link.agentSlug}": ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }

    // 6. Set instructions paths for agents that have them
    for (const agentDef of agents) {
      if (agentDef.instructionsPath && agentMap.has(agentDef.slug)) {
        try {
          await geetorusClient.setInstructionsPath(
            agentMap.get(agentDef.slug)!,
            agentDef.instructionsPath,
            geetorusApiKey
          );
        } catch (err) {
          errors.push(
            `Failed to set instructions path for "${agentDef.name}": ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }

    // 7. Create projects with workspace configs
    const createdProjects: { name: string; id: string }[] = [];
    const projects = (blueprintData.projects ?? []) as ProjectTemplate[];

    if (!overrides?.skipProjects) {
      for (const projectDef of projects) {
        try {
          const created = await geetorusClient.createProject(
            targetCompanyId,
            {
              name: projectDef.name,
              description: projectDef.description,
              workspace: projectDef.workspace
                ? {
                    cwd: projectDef.workspace.cwd ?? undefined,
                    repoUrl: projectDef.workspace.repoUrl ?? undefined,
                  }
                : undefined,
            },
            geetorusApiKey
          );
          createdProjects.push({ name: created.name, id: created.id });
        } catch (err) {
          errors.push(
            `Failed to create project "${projectDef.name}": ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    }

    // 8. Increment install count on the listing
    await db
      .update(listings)
      .set({ installCount: listing.installCount + 1 })
      .where(eq(listings.id, listingId));

    // 9. Record the install as a purchase (for free listings)
    if (listing.price === 0) {
      await db.insert(purchases).values({
        listingId,
        buyerUserId: session.user.id,
        buyerCompanyId: targetCompanyId,
        pricePaidCents: 0,
        status: "completed",
      });
    }

    return NextResponse.json({
      success: true,
      listing: { id: listing.id, title: listing.title },
      targetCompanyId,
      agents: createdAgents,
      projects: createdProjects,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("Install error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
