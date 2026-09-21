import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, and, not } from "drizzle-orm";
import { db } from "@/db";
import {
  creators,
  listings,
  reviews,
  teamBlueprints,
  user,
} from "@/db/schema";
import {
  ListingBlueprintSections,
  type ListingAgent,
  type ReportingLink,
} from "@/components/listings/listing-blueprint-sections";
import { slugify } from "@/lib/slug";

interface BlueprintGovernance {
  approvalRules?: unknown[];
  budgetDefaults?: Array<{ role: string; monthlyCents: number }>;
  escalationChain?: string[];
}

interface BlueprintProject {
  name: string;
  description?: string;
  workspace?: {
    cwd?: string | null;
    repoUrl?: string | null;
  } | null;
}

interface ListingBlueprintData {
  agents: ListingAgent[];
  reportingChain: ReportingLink[];
  governance: BlueprintGovernance | null;
  projects: BlueprintProject[];
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function listingTypeLabel(type: string): string {
  return type.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function stars(rating: number): string {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
}

function asAgents(value: unknown): ListingAgent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const mapped: ListingAgent[] = [];
  for (const entry of value) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const item = entry as Record<string, unknown>;
      const slug = typeof item.slug === "string" ? item.slug : null;
      const name = typeof item.name === "string" ? item.name : null;
      const role = typeof item.role === "string" ? item.role : "agent";

      if (!slug || !name) {
        continue;
      }

      const parsed: ListingAgent = {
        slug,
        name,
        role,
        title: typeof item.title === "string" ? item.title : role,
        icon: typeof item.icon === "string" ? item.icon : undefined,
        capabilities:
          typeof item.capabilities === "string" ? item.capabilities : undefined,
        adapterType:
          typeof item.adapterType === "string" ? item.adapterType : undefined,
        skills: asStringArray(item.skills),
        budgetMonthlyCents:
          typeof item.budgetMonthlyCents === "number"
            ? item.budgetMonthlyCents
            : undefined,
        instructionsPath:
          typeof item.instructionsPath === "string" ? item.instructionsPath : null,
        permissions:
          item.permissions && typeof item.permissions === "object"
            ? {
                canCreateAgents: Boolean(
                  (item.permissions as Record<string, unknown>).canCreateAgents
                ),
                canApproveHires: Boolean(
                  (item.permissions as Record<string, unknown>).canApproveHires
                ),
              }
            : undefined,
      };
      mapped.push(parsed);
  }

  return mapped;
}

function asReportingChain(value: unknown): ReportingLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const mapped: ReportingLink[] = [];
  for (const entry of value) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const item = entry as Record<string, unknown>;
      const agentSlug = typeof item.agentSlug === "string" ? item.agentSlug : null;
      if (!agentSlug) {
        continue;
      }
      const reportsTo =
        typeof item.reportsTo === "string" ? item.reportsTo : item.reportsTo === null ? null : null;
      mapped.push({ agentSlug, reportsTo });
  }

  return mapped;
}

function asGovernance(value: unknown): BlueprintGovernance | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const item = value as Record<string, unknown>;

  const budgetDefaults = Array.isArray(item.budgetDefaults)
    ? item.budgetDefaults
        .map((entry) => {
          if (!entry || typeof entry !== "object") {
            return null;
          }
          const budget = entry as Record<string, unknown>;
          if (typeof budget.role !== "string") {
            return null;
          }
          return {
            role: budget.role,
            monthlyCents: toNumber(budget.monthlyCents),
          };
        })
        .filter(
          (entry): entry is { role: string; monthlyCents: number } => entry !== null
        )
    : [];

  return {
    approvalRules: Array.isArray(item.approvalRules) ? item.approvalRules : [],
    budgetDefaults,
    escalationChain: asStringArray(item.escalationChain),
  };
}

function asProjects(value: unknown): BlueprintProject[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const mapped: BlueprintProject[] = [];
  for (const entry of value) {
      if (!entry || typeof entry !== "object") {
        continue;
      }
      const item = entry as Record<string, unknown>;
      const name = typeof item.name === "string" ? item.name : null;
      if (!name) {
        continue;
      }
      const workspace =
        item.workspace && typeof item.workspace === "object"
          ? {
              cwd:
                typeof (item.workspace as Record<string, unknown>).cwd === "string"
                  ? ((item.workspace as Record<string, unknown>).cwd as string)
                  : null,
              repoUrl:
                typeof (item.workspace as Record<string, unknown>).repoUrl === "string"
                  ? ((item.workspace as Record<string, unknown>).repoUrl as string)
                  : null,
            }
          : null;

      mapped.push({
        name,
        description:
          typeof item.description === "string" ? item.description : undefined,
        workspace,
      });
  }

  return mapped;
}

function parseBlueprint(rawBlueprint: unknown, agentFallbackCount: number): ListingBlueprintData {
  if (!rawBlueprint || typeof rawBlueprint !== "object") {
    const fallbackAgents = Array.from({ length: Math.max(agentFallbackCount, 2) }).map(
      (_, index) => ({
        slug: index === 0 ? "lead" : `agent-${index + 1}`,
        name: index === 0 ? "Team Lead" : `Agent ${index + 1}`,
        role: index === 0 ? "lead" : "specialist",
        title: index === 0 ? "Lead Operator" : "Specialist",
      })
    );

    return {
      agents: fallbackAgents,
      reportingChain: fallbackAgents.map((agent, index) => ({
        agentSlug: agent.slug,
        reportsTo: index === 0 ? null : fallbackAgents[0].slug,
      })),
      governance: null,
      projects: [],
    };
  }

  const blueprint = rawBlueprint as Record<string, unknown>;
  const agents = asAgents(blueprint.agents);
  const reportingChain = asReportingChain(blueprint.reportingChain);

  return {
    agents,
    reportingChain,
    governance: asGovernance(blueprint.governance),
    projects: asProjects(blueprint.projects),
  };
}

function formatTimestamp(value: Date | null): string {
  if (!value) {
    return "Unknown date";
  }

  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
  const nodes: React.ReactNode[] = [];

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!part) {
      continue;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push(
        <code key={`${part}-${index}`} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-muted)", borderRadius: "3px", padding: "1px 6px", fontSize: "0.8em", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          {part.slice(1, -1)}
        </code>
      );
      continue;
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(
        <strong key={`${part}-${index}`} style={{ fontWeight: 600, color: "var(--text-primary)" }}>
          {part.slice(2, -2)}
        </strong>
      );
      continue;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      nodes.push(
        <em key={`${part}-${index}`} className="italic">
          {part.slice(1, -1)}
        </em>
      );
      continue;
    }

    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const labelEnd = part.indexOf("](");
      const label = part.slice(1, labelEnd);
      const href = part.slice(labelEnd + 2, -1);
      nodes.push(
        <a
          key={`${part}-${index}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-stone-900 underline decoration-stone-400 underline-offset-2 hover:decoration-stone-900"
        >
          {label}
        </a>
      );
      continue;
    }

    nodes.push(<span key={`${part}-${index}`}>{part}</span>);
  }

  return nodes;
}

function renderMarkdown(markdown: string): React.ReactNode[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const nodes: React.ReactNode[] = [];
  let index = 0;
  let key = 0;

  const isBullet = (line: string) => /^[-*]\s+/.test(line.trim());
  const isOrdered = (line: string) => /^\d+\.\s+/.test(line.trim());

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      nodes.push(
        <pre
          key={`node-${key++}`}
          className="overflow-x-auto rounded-2xl border border-stone-300 bg-stone-900 p-4 text-sm text-stone-100"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const className =
        level === 1
          ? "font-serif text-3xl text-stone-900"
          : level === 2
            ? "font-serif text-2xl text-stone-900"
            : "font-serif text-xl text-stone-900";
      nodes.push(
        <h3 key={`node-${key++}`} className={className}>
          {renderInline(content)}
        </h3>
      );
      index += 1;
      continue;
    }

    if (isBullet(trimmed)) {
      const entries: string[] = [];
      while (index < lines.length && isBullet(lines[index])) {
        entries.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      nodes.push(
        <ul key={`node-${key++}`} className="list-disc space-y-1 pl-6 text-stone-700">
          {entries.map((entry, itemIndex) => (
            <li key={`${entry}-${itemIndex}`}>{renderInline(entry)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (isOrdered(trimmed)) {
      const entries: string[] = [];
      while (index < lines.length && isOrdered(lines[index])) {
        entries.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      nodes.push(
        <ol key={`node-${key++}`} style={{ listStyleType: "decimal", paddingLeft: "1.5rem", display: "flex", flexDirection: "column" as const, gap: "4px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          {entries.map((entry, itemIndex) => (
            <li key={`${entry}-${itemIndex}`}>{renderInline(entry)}</li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("```") &&
      !isBullet(lines[index]) &&
      !isOrdered(lines[index]) &&
      !/^(#{1,3})\s+/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }

    nodes.push(
      <p key={`node-${key++}`} style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.7 }}>
        {renderInline(paragraph.join(" "))}
      </p>
    );
  }

  return nodes;
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const listingResult = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      type: listings.type,
      title: listings.title,
      tagline: listings.tagline,
      description: listings.description,
      price: listings.price,
      categories: listings.categories,
      tags: listings.tags,
      agentCount: listings.agentCount,
      readmeMarkdown: listings.readmeMarkdown,
      installCount: listings.installCount,
      rating: listings.rating,
      reviewCount: listings.reviewCount,
      version: listings.version,
      creatorId: creators.id,
      creatorName: creators.displayName,
      creatorBio: creators.bio,
      creatorWebsite: creators.website,
      creatorVerified: creators.verified,
      creatorAvatar: creators.avatarUrl,
    })
    .from(listings)
    .leftJoin(creators, eq(listings.creatorId, creators.id))
    .where(and(eq(listings.slug, slug), eq(listings.status, "published")))
    .limit(1);

  const listing = listingResult[0];
  if (!listing) {
    notFound();
  }

  const [blueprintRow, reviewRows, relatedRows] = await Promise.all([
    db.select().from(teamBlueprints).where(eq(teamBlueprints.listingId, listing.id)).limit(1),
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        verifiedPurchase: reviews.verifiedPurchase,
        createdAt: reviews.createdAt,
        authorName: user.name,
      })
      .from(reviews)
      .leftJoin(user, eq(reviews.authorUserId, user.id))
      .where(eq(reviews.listingId, listing.id))
      .orderBy(desc(reviews.createdAt))
      .limit(8),
    db
      .select({
        id: listings.id,
        slug: listings.slug,
        title: listings.title,
        tagline: listings.tagline,
        price: listings.price,
        rating: listings.rating,
        installCount: listings.installCount,
      })
      .from(listings)
      .where(
        and(
          eq(listings.status, "published"),
          eq(listings.type, listing.type),
          not(eq(listings.id, listing.id))
        )
      )
      .orderBy(desc(listings.installCount), desc(listings.createdAt))
      .limit(3),
  ]);

  const blueprint = parseBlueprint(
    blueprintRow[0] as unknown,
    Math.max(listing.agentCount ?? 0, 3)
  );
  const ratingValue = toNumber(listing.rating);
  const readme = listing.readmeMarkdown?.trim() || listing.description?.trim() || "";

  const sectionStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-xl)",
    padding: "2rem",
    marginBottom: 0,
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "0.65rem",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "var(--text-muted)",
    marginBottom: "0.75rem",
  };

  const h2Style: React.CSSProperties = {
    fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    color: "var(--text-primary)",
  };

  return (
    <div style={{ padding: "3rem 0 6rem" }}>
    <div className="gt-container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── Hero ── */}
      <section style={{ ...sectionStyle, position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", top: "-30%", right: "-5%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.06), transparent 70%)", pointerEvents: "none" }} />
        <p style={sectionLabelStyle}>01 — {listingTypeLabel(listing.type)}</p>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "1.5rem", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "600px", flex: "1 1 300px" }}>
            <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "0.75rem" }}>
              {listing.title}
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1rem" }}>
              {listing.tagline ?? listing.description ?? "Team blueprint listing"}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {asStringArray(listing.categories).map((category, index) => (
                <span key={`${category}-${index}`} className="gt-tag">{category}</span>
              ))}
              {asStringArray(listing.tags as unknown[]).map((tag, index) => (
                <span key={`tag-${tag}-${index}`} className="gt-tag gt-tag-accent">{tag}</span>
              ))}
            </div>
          </div>
          {/* Purchase card */}
          <div style={{ width: "100%", maxWidth: "280px", flex: "0 0 auto", background: "var(--bg-elevated)", border: "1px solid var(--border-muted)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Price</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.04em", color: listing.price === 0 ? "var(--accent-green)" : "var(--text-primary)", marginBottom: "1rem" }}>
              {listing.price > 0 ? moneyFormatter.format(listing.price / 100) : "FREE"}
            </p>
            <Link href="#install" className="gt-btn-primary" style={{ width: "100%", marginBottom: "1rem", fontSize: "0.8rem" }}>
              Install Blueprint
            </Link>
            <div style={{ background: "var(--bg-base)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "0.75rem" }}>
              <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.875rem", marginBottom: "4px" }}>{listing.creatorName ?? "Unknown"}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
                {listing.creatorVerified ? "✓ VERIFIED" : "COMMUNITY"}
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                {stars(ratingValue)} {ratingValue.toFixed(1)} · {listing.reviewCount} reviews
              </p>
            </div>
          </div>
        </div>
      </section>

      <ListingBlueprintSections
        agents={blueprint.agents}
        reportingChain={blueprint.reportingChain}
      />

      {/* ── Governance ── */}
      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>04 — GOVERNANCE</p>
        <h2 style={{ ...h2Style, marginBottom: "1.25rem" }}>Approvals, budgets, escalation</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {[
            {
              title: "Approval Rules",
              content: blueprint.governance?.approvalRules?.length ? (
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column" as const, gap: "6px", marginTop: "0.75rem" }}>
                  {blueprint.governance.approvalRules.map((rule, index) => (
                    <li key={`rule-${index}`} style={{ background: "var(--bg-base)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "6px 10px" }}>
                      <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)" }}>{JSON.stringify(rule)}</code>
                    </li>
                  ))}
                </ul>
              ) : <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>No explicit approval rules were provided.</p>,
            },
            {
              title: "Budget Defaults",
              content: blueprint.governance?.budgetDefaults?.length ? (
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column" as const, gap: "6px", marginTop: "0.75rem" }}>
                  {blueprint.governance.budgetDefaults.map((budget) => (
                    <li key={budget.role} style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      <span>{budget.role}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>{moneyFormatter.format(budget.monthlyCents / 100)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>No budget defaults were defined.</p>,
            },
            {
              title: "Escalation Chain",
              content: blueprint.governance?.escalationChain?.length ? (
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px", marginTop: "0.75rem" }}>
                  {blueprint.governance.escalationChain.map((item, index) => (
                    <span key={`${item}-${index}`} className="gt-tag">{item}</span>
                  ))}
                </div>
              ) : <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>No escalation chain was included.</p>,
            },
          ].map(({ title, content }) => (
            <div key={title} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "-0.01em" }}>{title}</h3>
              {content}
            </div>
          ))}
        </div>
      </section>

      {/* ── Included Projects ── */}
      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>05 — INCLUDED PROJECTS</p>
        <h2 style={{ ...h2Style, marginBottom: "1.25rem" }}>Template workspace bundles</h2>
        {blueprint.projects.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {blueprint.projects.map((project) => (
              <article key={project.name} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.5rem" }}>{project.name}</h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "0.75rem", lineHeight: 1.6 }}>
                  {project.description ?? "No project description included."}
                </p>
                <dl style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { label: "Workspace path", value: project.workspace?.cwd ?? "Not configured" },
                    { label: "Repository", value: project.workspace?.repoUrl ?? "None" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "0.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "6px" }}>
                      <dt style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>{label}</dt>
                      <dd style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontWeight: 500 }}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem", fontSize: "0.8125rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            // This listing does not include project templates.
          </p>
        )}
      </section>

      {/* ── README ── */}
      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>06 — README</p>
        <h2 style={{ ...h2Style, marginBottom: "1.25rem" }}>Rendered documentation</h2>
        {readme ? (
          <article style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem", lineHeight: 1.75, color: "var(--text-secondary)" }}>
            {renderMarkdown(readme)}
          </article>
        ) : (
          <p style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem", fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            // No README markdown has been published for this listing yet.
          </p>
        )}
      </section>

      {/* ── Reviews ── */}
      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>07 — REVIEWS</p>
        <h2 style={{ ...h2Style, marginBottom: "1.25rem" }}>Ratings from operators</h2>
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-muted)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: "var(--text-primary)" }}>{ratingValue.toFixed(1)}</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase" }}>AVERAGE</p>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {stars(ratingValue)} · {listing.reviewCount} reviews · {listing.installCount} installs
          </p>
        </div>
        {reviewRows.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {reviewRows.map((review) => (
              <article key={review.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
                <p style={{ fontSize: "0.9rem", color: "var(--accent-green)", marginBottom: "4px" }}>
                  {stars(review.rating)} <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>{review.rating.toFixed(1)}</span>
                </p>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.5rem" }}>
                  {review.title ?? "Review"}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "0.75rem" }}>{review.body ?? "No written details."}</p>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                  {review.authorName ?? "ANONYMOUS"} · {formatTimestamp(review.createdAt)}{review.verifiedPurchase ? " · ✓ VERIFIED" : ""}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem", fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            // No reviews yet. {listing.installCount} early installs — be the first to leave feedback.
          </p>
        )}
      </section>

      {/* ── Related ── */}
      <section style={sectionStyle}>
        <p style={sectionLabelStyle}>08 — RELATED BLUEPRINTS</p>
        <h2 style={{ ...h2Style, marginBottom: "1.25rem" }}>More from this category</h2>
        {relatedRows.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {relatedRows.map((related) => (
              <Link
                key={related.id}
                href={`/listings/${related.slug}`}
                className="gt-card"
                style={{ padding: "1.25rem", textDecoration: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}
              >
                <span className="gt-label">RELATED</span>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
                  {related.title}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{related.tagline ?? "No tagline provided."}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.9rem", color: related.price === 0 ? "var(--accent-green)" : "var(--text-primary)", marginTop: "auto" }}>
                  {related.price > 0 ? moneyFormatter.format(related.price / 100) : "FREE"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem", fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            // No related listings published yet in this category.
          </p>
        )}
      </section>

      {/* ── Creator Profile ── */}
      <section id="install" style={sectionStyle}>
        <p style={sectionLabelStyle}>09 — CREATOR PROFILE</p>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 0.4fr) 1fr", gap: "1rem" }}>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: 8, background: "var(--text-primary)", color: "var(--bg-base)", fontSize: "1.25rem", fontWeight: 700, fontFamily: "var(--font-mono)", marginBottom: "0.75rem" }}>
              {(listing.creatorName ?? "C").slice(0, 1).toUpperCase()}
            </div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "2px" }}>{listing.creatorName}</h2>
            <p style={{ fontSize: "0.75rem", color: listing.creatorVerified ? "var(--accent-green)" : "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
              {listing.creatorVerified ? "✓ VERIFIED" : "COMMUNITY"}
            </p>
            <Link href={`/creators/${slugify(listing.creatorName ?? "creator")}`} className="gt-btn-ghost" style={{ fontSize: "0.75rem", padding: "6px 12px" }}>
              View profile →
            </Link>
          </div>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>About the creator</h3>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1rem" }}>
              {listing.creatorBio ?? "No biography has been provided for this creator yet."}
            </p>
            <dl style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { label: "Version", value: listing.version ?? "1.0.0" },
                { label: "Website", value: listing.creatorWebsite ?? "Not linked" },
                { label: "Installs", value: `${listing.installCount} installs` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "0.75rem", borderTop: "1px solid var(--border-subtle)", padding: "8px 0" }}>
                  <dt style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</dt>
                  <dd style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontWeight: 500 }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </div>
    </div>
  );
}
