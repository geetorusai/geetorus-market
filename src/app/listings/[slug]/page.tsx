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
        <code key={`${part}-${index}`} className="rounded bg-stone-100 px-1 py-0.5 text-sm">
          {part.slice(1, -1)}
        </code>
      );
      continue;
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(
        <strong key={`${part}-${index}`} className="font-semibold text-stone-900">
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
        <ol key={`node-${key++}`} className="list-decimal space-y-1 pl-6 text-stone-700">
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
      <p key={`node-${key++}`} className="text-stone-700">
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

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-3xl border border-stone-300 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 p-6 text-stone-100 sm:p-8">
        <div className="absolute -right-6 top-4 h-36 w-36 rounded-full bg-amber-200/20 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.25em] text-stone-300">
          1. Hero · {listingTypeLabel(listing.type)}
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{listing.title}</h1>
            <p className="mt-3 text-base text-stone-200">
              {listing.tagline || listing.description || "Team blueprint listing"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {asStringArray(listing.categories).map((category, index) => (
                <span
                  key={`${category}-${index}`}
                  className="rounded-full border border-stone-400/70 bg-stone-100/10 px-3 py-1 text-xs uppercase tracking-wide"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full max-w-xs rounded-2xl border border-stone-400/60 bg-stone-950/45 p-5">
            <p className="text-sm text-stone-300">Price</p>
            <p className="mt-1 font-serif text-4xl text-stone-100">
              {listing.price > 0 ? moneyFormatter.format(listing.price / 100) : "Free"}
            </p>
            <Link
              href="#install"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-white"
            >
              Install Blueprint
            </Link>
            <div className="mt-4 rounded-xl border border-stone-500/50 bg-stone-100/5 p-3 text-sm">
              <p className="font-semibold text-stone-100">{listing.creatorName ?? "Unknown"}</p>
              <p className="text-stone-300">
                Creator {listing.creatorVerified ? "verified" : "unverified"}
              </p>
              <p className="mt-2 text-stone-200">
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

      <section className="space-y-5 rounded-3xl border border-stone-300 bg-stone-50/90 p-6 sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">4. Governance</p>
          <h2 className="mt-2 font-serif text-3xl text-stone-900">Approvals, budgets, escalation</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-stone-300 bg-white/85 p-4">
            <h3 className="font-semibold text-stone-900">Approval Rules</h3>
            {blueprint.governance?.approvalRules?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                {blueprint.governance.approvalRules.map((rule, index) => (
                  <li key={`rule-${index}`} className="rounded-xl bg-stone-100 px-3 py-2">
                    <code className="text-xs">{JSON.stringify(rule)}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-600">No explicit approval rules were provided.</p>
            )}
          </article>

          <article className="rounded-2xl border border-stone-300 bg-white/85 p-4">
            <h3 className="font-semibold text-stone-900">Budget Defaults</h3>
            {blueprint.governance?.budgetDefaults?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                {blueprint.governance.budgetDefaults.map((budget) => (
                  <li key={budget.role} className="flex items-center justify-between gap-3">
                    <span>{budget.role}</span>
                    <span className="font-semibold">
                      {moneyFormatter.format(budget.monthlyCents / 100)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-600">No budget defaults were defined.</p>
            )}
          </article>

          <article className="rounded-2xl border border-stone-300 bg-white/85 p-4">
            <h3 className="font-semibold text-stone-900">Escalation Chain</h3>
            {blueprint.governance?.escalationChain?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {blueprint.governance.escalationChain.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-stone-600">No escalation chain was included.</p>
            )}
          </article>
        </div>
      </section>

      <section className="space-y-5 rounded-3xl border border-stone-300 bg-white/85 p-6 sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">5. Included Projects</p>
          <h2 className="mt-2 font-serif text-3xl text-stone-900">Template workspace bundles</h2>
        </div>
        {blueprint.projects.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {blueprint.projects.map((project) => (
              <article key={project.name} className="rounded-2xl border border-stone-300 bg-stone-50 p-5">
                <h3 className="font-serif text-2xl text-stone-900">{project.name}</h3>
                <p className="mt-2 text-sm text-stone-700">
                  {project.description || "No project description included."}
                </p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone-500">Workspace path</dt>
                    <dd className="font-medium text-stone-900">
                      {project.workspace?.cwd || "Not configured"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-stone-500">Repository</dt>
                    <dd className="font-medium text-stone-900">
                      {project.workspace?.repoUrl || "None"}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-700">
            This listing does not include project templates.
          </p>
        )}
      </section>

      <section className="space-y-5 rounded-3xl border border-stone-300 bg-stone-50/90 p-6 sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">6. README</p>
          <h2 className="mt-2 font-serif text-3xl text-stone-900">Rendered documentation</h2>
        </div>
        {readme ? (
          <article className="prose prose-stone max-w-none space-y-4">{renderMarkdown(readme)}</article>
        ) : (
          <p className="rounded-2xl border border-stone-300 bg-white/85 p-4 text-sm text-stone-700">
            No README markdown has been published for this listing yet.
          </p>
        )}
      </section>

      <section className="space-y-5 rounded-3xl border border-stone-300 bg-white/85 p-6 sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">7. Reviews</p>
          <h2 className="mt-2 font-serif text-3xl text-stone-900">Ratings from operators</h2>
        </div>

        <div className="rounded-2xl border border-stone-300 bg-stone-50 p-4">
          <p className="text-sm text-stone-600">Average rating</p>
          <p className="mt-1 font-serif text-4xl text-stone-900">{ratingValue.toFixed(1)}</p>
          <p className="text-sm text-stone-700">
            {stars(ratingValue)} · {listing.reviewCount} published reviews · {listing.installCount} installs
          </p>
        </div>

        {reviewRows.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {reviewRows.map((review) => (
              <article key={review.id} className="rounded-2xl border border-stone-300 bg-stone-50 p-5">
                <p className="text-sm text-stone-700">
                  {stars(review.rating)} {review.rating.toFixed(1)}
                </p>
                <h3 className="mt-2 font-semibold text-stone-900">
                  {review.title || "Review"}
                </h3>
                <p className="mt-2 text-sm text-stone-700">{review.body || "No written details."}</p>
                <p className="mt-3 text-xs text-stone-500">
                  {review.authorName || "Anonymous"} · {formatTimestamp(review.createdAt)}{" "}
                  {review.verifiedPurchase ? "· Verified purchase" : ""}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-stone-300 bg-stone-50 p-4 text-sm text-stone-700">
            No reviews yet. Install count is {listing.installCount}, so early adopters can shape the first wave of feedback.
          </p>
        )}
      </section>

      <section className="space-y-5 rounded-3xl border border-stone-300 bg-stone-50/90 p-6 sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">8. Related Blueprints</p>
          <h2 className="mt-2 font-serif text-3xl text-stone-900">Cross-sell suggestions</h2>
        </div>
        {relatedRows.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {relatedRows.map((related) => (
              <Link
                key={related.id}
                href={`/listings/${related.slug}`}
                className="group rounded-2xl border border-stone-300 bg-white/90 p-4 transition hover:border-stone-500"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Related</p>
                <h3 className="mt-2 font-serif text-2xl text-stone-900 group-hover:underline">
                  {related.title}
                </h3>
                <p className="mt-2 text-sm text-stone-700">{related.tagline || "No tagline provided."}</p>
                <p className="mt-3 text-sm font-semibold text-stone-900">
                  {related.price > 0 ? moneyFormatter.format(related.price / 100) : "Free"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-stone-300 bg-white/85 p-4 text-sm text-stone-700">
            No related listings published yet in this category.
          </p>
        )}
      </section>

      <section
        id="install"
        className="rounded-3xl border border-stone-300 bg-white/85 p-6 sm:p-8"
      >
        <p className="text-xs uppercase tracking-[0.24em] text-stone-500">9. Creator Profile</p>
        <div className="mt-3 grid gap-5 md:grid-cols-[0.35fr_0.65fr]">
          <div className="rounded-2xl border border-stone-300 bg-stone-50 p-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-2xl font-semibold text-stone-100">
              {(listing.creatorName || "C").slice(0, 1).toUpperCase()}
            </div>
            <h2 className="mt-3 font-serif text-2xl text-stone-900">{listing.creatorName}</h2>
            <p className="text-sm text-stone-700">
              {listing.creatorVerified ? "Verified creator" : "Community creator"}
            </p>
            <Link
              href={`/creators/${slugify(listing.creatorName || "creator")}`}
              className="mt-4 inline-flex rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:border-stone-500"
            >
              View full profile
            </Link>
          </div>
          <div className="space-y-3 rounded-2xl border border-stone-300 bg-stone-50 p-5">
            <h3 className="font-semibold text-stone-900">About the creator</h3>
            <p className="text-sm text-stone-700">
              {listing.creatorBio || "No biography has been provided for this creator yet."}
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3 border-t border-stone-200 pt-2">
                <dt className="text-stone-500">Listing version</dt>
                <dd className="font-medium text-stone-900">{listing.version || "1.0.0"}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-stone-200 pt-2">
                <dt className="text-stone-500">Creator website</dt>
                <dd className="font-medium text-stone-900">
                  {listing.creatorWebsite ? (
                    <a
                      href={listing.creatorWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-stone-400 underline-offset-2 hover:decoration-stone-900"
                    >
                      {listing.creatorWebsite}
                    </a>
                  ) : (
                    "Not linked"
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-stone-200 pt-2">
                <dt className="text-stone-500">Install momentum</dt>
                <dd className="font-medium text-stone-900">{listing.installCount} installs</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
