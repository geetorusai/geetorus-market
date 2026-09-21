import Link from "next/link";
import { db } from "@/db";
import { creators, listings } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { and, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let creator: (typeof creators.$inferSelect) | undefined;
  let publishedListings: Array<typeof listings.$inferSelect> = [];

  try {
    const allCreators = await db.select().from(creators);
    creator = allCreators.find((entry) => slugify(entry.displayName) === slug);

    if (creator) {
      publishedListings = await db
        .select()
        .from(listings)
        .where(and(eq(listings.creatorId, creator.id), eq(listings.status, "published")))
        .orderBy(desc(listings.updatedAt));
    }
  } catch (err) {
    console.warn("Error fetching creator profile:", err);
  }

  if (!creator) {
    return (
      <div style={{ minHeight: "80vh", padding: "5rem 1.5rem" }}>
        <div className="gt-container" style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <div className="gt-card" style={{ padding: "3rem 2rem" }}>
            <span className="gt-badge gt-badge-muted" style={{ marginBottom: "1rem" }}>
              404 // CREATOR_NOT_FOUND
            </span>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
              }}
            >
              Creator Not Found
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "2rem" }}>
              No registered architect profile matches slug <code style={{ color: "var(--accent)" }}>&quot;{slug}&quot;</code>.
            </p>
            <Link href="/browse" className="gt-btn-primary">
              ← Return to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "80vh", padding: "3rem 1.5rem 5rem" }}>
      <div className="gt-container" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Creator Hero */}
        <section
          className="gt-card"
          style={{
            padding: "2.5rem 2rem",
            marginBottom: "2.5rem",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: "1.5rem" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "var(--radius-lg)",
                background: "var(--bg-elevated)",
                border: "2px solid var(--accent)",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--accent)",
              }}
            >
              {creator.displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {creator.displayName}
                </h1>
                {creator.verified && (
                  <span className="gt-badge gt-badge-accent">
                    ✓ VERIFIED ARCHITECT
                  </span>
                )}
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  maxWidth: "680px",
                }}
              >
                {creator.bio || "Independent agent systems architect publishing on Geetorus Market."}
              </p>
              {creator.website && (
                <a
                  href={creator.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "0.75rem",
                    fontSize: "0.85rem",
                    color: "var(--accent)",
                    fontFamily: "var(--font-mono)",
                    textDecoration: "underline",
                  }}
                >
                  {creator.website} ↗
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Published Listings */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Published Blueprints & Skills ({publishedListings.length})
            </h2>
          </div>

          {publishedListings.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {publishedListings.map((listing) => (
                <article
                  key={listing.id}
                  className="gt-card"
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <span
                      className="gt-badge gt-badge-muted"
                      style={{ marginBottom: "0.75rem", display: "inline-block" }}
                    >
                      {listing.type.replaceAll("_", " ").toUpperCase()}
                    </span>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {listing.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.5,
                        marginBottom: "1.25rem",
                      }}
                    >
                      {listing.tagline || "No description provided."}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid var(--border-subtle)",
                      paddingTop: "1rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        fontSize: "1rem",
                      }}
                    >
                      {listing.price === 0 ? "FREE" : `$${(listing.price / 100).toFixed(2)}`}
                    </span>
                    <Link
                      href={`/listings/${listing.slug}`}
                      className="gt-btn-accent"
                      style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem" }}
                    >
                      Inspect Blueprint →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div
              className="gt-card"
              style={{
                padding: "3rem 2rem",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
                No active published listings under this profile.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
