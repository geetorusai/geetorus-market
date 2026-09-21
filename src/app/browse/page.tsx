"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { slugify } from "@/lib/slug";

type ListingType =
  | "team_blueprint"
  | "agent_blueprint"
  | "skill"
  | "governance_template";

interface ListingItem {
  id: string;
  slug: string;
  type: ListingType;
  title: string;
  tagline: string | null;
  price: number;
  creatorName: string | null;
  categories: string[];
  agentCount: number | null;
  installCount: number;
  rating: number | string | null;
  reviewCount: number;
}

interface ListingsResponse {
  data: ListingItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const TYPE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All types", value: "" },
  { label: "Team blueprints", value: "team_blueprint" },
  { label: "Agent blueprints", value: "agent_blueprint" },
  { label: "Skills", value: "skill" },
  { label: "Governance templates", value: "governance_template" },
];

const CATEGORY_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All categories", value: "" },
  { label: "SaaS", value: "saas" },
  { label: "Engineering", value: "engineering" },
  { label: "Marketing", value: "marketing" },
  { label: "Operations", value: "ops" },
  { label: "Content", value: "content" },
  { label: "Finance", value: "finance" },
];

const SORT_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Most popular", value: "popular" },
  { label: "Newest", value: "newest" },
  { label: "Price: low → high", value: "price_asc" },
  { label: "Price: high → low", value: "price_desc" },
  { label: "Highest rated", value: "rating" },
];

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function listingTypeLabel(type: ListingType): string {
  return type.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function listingTypeTag(type: ListingType): string {
  const map: Record<ListingType, string> = {
    team_blueprint: "TEAM_BP",
    agent_blueprint: "AGENT",
    skill: "SKILL",
    governance_template: "GOV_TPL",
  };
  return map[type] ?? type.toUpperCase();
}

function parseRating(rating: number | string | null): number | null {
  if (typeof rating === "number" && Number.isFinite(rating)) return rating;
  if (typeof rating === "string") {
    const parsed = Number.parseFloat(rating);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function centsToDollarInput(centsValue: string | null): string {
  if (!centsValue) return "";
  const cents = Number.parseInt(centsValue, 10);
  if (!Number.isFinite(cents)) return "";
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
}

/** Dark blueprint structure preview */
function BlueprintPreview({ agentCount }: { agentCount: number | null }) {
  const count = Math.max(2, Math.min(agentCount ?? 3, 5));
  const leaves = Math.max(2, count - 1);

  return (
    <div
      style={{
        height: "80px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
        gap: "6px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Root node */}
      <div
        style={{
          background: "var(--text-primary)",
          color: "var(--bg-base)",
          borderRadius: "3px",
          fontSize: "0.6rem",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          padding: "2px 10px",
          letterSpacing: "0.08em",
        }}
      >
        LEAD
      </div>
      {/* Connector line */}
      <div style={{ width: 1, height: 8, background: "var(--border-accent)" }} />
      {/* Leaf nodes */}
      <div style={{ display: "flex", gap: "6px" }}>
        {Array.from({ length: leaves }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-muted)",
              borderRadius: "3px",
              fontSize: "0.55rem",
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              padding: "1px 6px",
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
            }}
          >
            A{i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Loading skeleton */
function BrowseSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1rem",
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "1.25rem",
          }}
        >
          <div className="gt-skeleton" style={{ height: 80, marginBottom: "1rem" }} />
          <div className="gt-skeleton" style={{ height: 12, width: "40%", marginBottom: "0.5rem" }} />
          <div className="gt-skeleton" style={{ height: 18, width: "75%", marginBottom: "0.5rem" }} />
          <div className="gt-skeleton" style={{ height: 14, width: "90%", marginBottom: "0.25rem" }} />
          <div className="gt-skeleton" style={{ height: 14, width: "60%" }} />
        </div>
      ))}
    </div>
  );
}

function BrowseContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<ListingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = searchParams.toString();

  const filters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      type: searchParams.get("type") ?? "",
      category: searchParams.get("category") ?? "",
      minPrice: centsToDollarInput(searchParams.get("minPrice")),
      maxPrice: centsToDollarInput(searchParams.get("maxPrice")),
      sort: searchParams.get("sort") ?? "popular",
      page: Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10)),
      limit: Math.max(1, Math.min(48, Number.parseInt(searchParams.get("limit") ?? "12", 10))),
    }),
    [searchParams]
  );

  useEffect(() => {
    let ignore = false;

    async function loadListings() {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams(queryString);
      if (!params.get("sort")) params.set("sort", "popular");
      if (!params.get("page")) params.set("page", "1");
      if (!params.get("limit")) params.set("limit", "12");

      try {
        const response = await fetch(`/api/listings?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const payload = (await response.json()) as ListingsResponse;
        if (!ignore) setResult(payload);
      } catch (loadError) {
        if (!ignore) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load listings."
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadListings();
    return () => { ignore = true; };
  }, [queryString]);

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    next.set("sort", String(data.get("sort") || "popular"));
    next.set("limit", String(filters.limit));
    next.set("page", "1");

    for (const key of ["search", "type", "category"]) {
      const v = String(data.get(key) || "").trim();
      if (v.length > 0) next.set(key, v);
    }

    for (const key of ["minPrice", "maxPrice"]) {
      const v = String(data.get(key) || "").trim();
      if (!v) continue;
      const dollars = Number.parseFloat(v);
      if (Number.isFinite(dollars) && dollars >= 0) next.set(key, String(Math.round(dollars * 100)));
    }

    router.push(`${pathname}?${next.toString()}`);
  }

  function resetFilters() { router.push(pathname); }

  function gotoPage(page: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(page));
    if (!next.get("sort")) next.set("sort", "popular");
    if (!next.get("limit")) next.set("limit", "12");
    router.push(`${pathname}?${next.toString()}`);
  }

  const listings = result?.data ?? [];
  const pagination = result?.pagination ?? {
    page: filters.page,
    limit: filters.limit,
    total: 0,
    totalPages: 1,
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-muted)",
    borderRadius: "var(--radius-md)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-sans)",
    fontSize: "0.8125rem",
    outline: "none",
    padding: "9px 14px",
    transition: "border-color 150ms",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none" as const,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    paddingRight: "30px",
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "3rem 0 5rem" }}>
      <div className="gt-container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

        {/* ── Page header ── */}
        <div>
          <p className="gt-label" style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="gt-dot" />
            GEETORUS MARKETPLACE
          </p>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: "0.5rem",
            }}
          >
            Browse listings
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "52ch" }}>
            Filter team blueprints, agent packs, skills, and governance templates for your Geetorus company.
          </p>
        </div>

        {/* ── Filters ── */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "1.25rem",
          }}
        >
          <form onSubmit={submitFilters}>
            {/* Search row */}
            <div style={{ marginBottom: "0.75rem", position: "relative" }}>
              <svg
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="SEARCH BLUEPRINTS..."
                style={{
                  ...inputStyle,
                  paddingLeft: "36px",
                  width: "100%",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.04em",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  color: "var(--text-ghost)",
                  background: "var(--bg-base)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  letterSpacing: "0.04em",
                  pointerEvents: "none",
                }}
              >
                /
              </span>
            </div>

            {/* Filter row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "0.5rem",
                alignItems: "end",
              }}
            >
              <select name="type" defaultValue={filters.type} style={selectStyle}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value || "all-types"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select name="category" defaultValue={filters.category} style={selectStyle}>
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value || "all-cats"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select name="sort" defaultValue={filters.sort} style={selectStyle}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                name="minPrice"
                defaultValue={filters.minPrice}
                placeholder="Min $"
                style={inputStyle}
              />
              <input
                type="number"
                min={0}
                name="maxPrice"
                defaultValue={filters.maxPrice}
                placeholder="Max $"
                style={inputStyle}
              />

              <div style={{ display: "flex", gap: "6px" }}>
                <button type="submit" className="gt-btn-primary" style={{ flex: 1 }}>
                  Apply
                </button>
                <button type="button" onClick={resetFilters} className="gt-btn-ghost" style={{ flexShrink: 0 }}>
                  ↺
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── Results ── */}
        {isLoading ? (
          <BrowseSkeleton />
        ) : error ? (
          <div
            style={{
              background: "rgba(255,59,48,0.06)",
              border: "1px solid rgba(255,59,48,0.25)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
            }}
          >
            <p className="gt-label" style={{ color: "rgba(255,100,100,0.8)", marginBottom: "0.5rem" }}>
              ERROR / FAILED TO LOAD
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              {error}
            </p>
          </div>
        ) : listings.length === 0 ? (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "3rem",
              textAlign: "center",
            }}
          >
            <p className="gt-label" style={{ marginBottom: "1rem" }}>NO RESULTS</p>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              No listings match these filters
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Try widening your category or price range to discover more blueprints.
            </p>
            <button type="button" onClick={resetFilters} className="gt-btn-ghost">
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Count */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                SHOWING {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} OF {pagination.total}
              </p>
            </div>

            {/* Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1rem",
              }}
            >
              {listings.map((listing) => {
                const rating = parseRating(listing.rating);
                const creatorName = listing.creatorName ?? "Unknown creator";

                return (
                  <article
                    key={listing.id}
                    className="gt-card"
                    style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}
                  >
                    {/* Blueprint preview */}
                    <BlueprintPreview agentCount={listing.agentCount} />

                    {/* Type badge */}
                    <span className="gt-badge">{listingTypeTag(listing.type)}</span>

                    {/* Title */}
                    <div>
                      <h2
                        style={{
                          fontSize: "1rem",
                          fontWeight: 600,
                          letterSpacing: "-0.01em",
                          lineHeight: 1.3,
                          marginBottom: "0.375rem",
                        }}
                      >
                        <Link
                          href={`/listings/${listing.slug}`}
                          style={{ color: "var(--text-primary)", textDecoration: "none" }}
                        >
                          {listing.title}
                        </Link>
                      </h2>
                      <p
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--text-muted)",
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {listing.tagline ?? "No description provided."}
                      </p>
                    </div>

                    {/* Metadata tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      <span className="gt-tag">{listing.agentCount ?? "?"} agents</span>
                      <span className="gt-tag">{listing.installCount} installs</span>
                      {rating !== null && (
                        <span className="gt-tag gt-tag-accent">★ {rating.toFixed(1)}</span>
                      )}
                    </div>

                    {/* Footer row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "auto",
                        paddingTop: "0.875rem",
                        borderTop: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Link
                        href={`/creators/${slugify(creatorName)}`}
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          textDecoration: "none",
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "0.02em",
                        }}
                      >
                        @{slugify(creatorName)}
                      </Link>
                      <p
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                          color: listing.price === 0 ? "var(--accent-green)" : "var(--text-primary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {listing.price > 0 ? moneyFormatter.format(listing.price / 100) : "FREE"}
                      </p>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/listings/${listing.slug}`}
                      className={listing.price > 0 ? "gt-btn-primary" : "gt-btn-accent"}
                      style={{ width: "100%", fontSize: "0.8rem" }}
                    >
                      {listing.price > 0 ? "Buy / Install" : "Install free"}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="m7 17 10-10M7 7h10v10" />
                      </svg>
                    </Link>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: "0.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => gotoPage(Math.max(1, pagination.page - 1))}
                disabled={pagination.page <= 1}
                className="gt-btn-ghost"
                style={{ opacity: pagination.page <= 1 ? 0.35 : 1 }}
              >
                ← Previous
              </button>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
                PAGE {pagination.page} / {Math.max(1, pagination.totalPages)}
              </p>
              <button
                type="button"
                onClick={() => gotoPage(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="gt-btn-ghost"
                style={{ opacity: pagination.page >= pagination.totalPages ? 0.35 : 1 }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="gt-container" style={{ paddingTop: "2.5rem", paddingBottom: "4rem" }}>
          <BrowseSkeleton />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
