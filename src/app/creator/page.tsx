import Link from "next/link";
import { db } from "@/db";
import { creators, listings } from "@/db/schema";
import { getSessionUserId } from "@/lib/api-auth";
import { slugify } from "@/lib/slug";
import { desc, eq } from "drizzle-orm";
import { RegisterCreatorForm } from "@/components/creator/register-creator-form";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default async function CreatorDashboardPage() {
  const userId = await getSessionUserId();

  if (!userId) {
    return (
      <div style={{ padding: "4rem 0 6rem" }}>
        <div className="gt-container" style={{ maxWidth: "640px" }}>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-xl)",
              padding: "3rem 2.5rem",
              textAlign: "center",
            }}
          >
            <p className="gt-label" style={{ marginBottom: "1rem", justifyContent: "center", display: "flex", gap: "8px", alignItems: "center" }}>
              <span className="gt-dot" />
              CREATOR CONSOLE
            </p>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginBottom: "0.75rem",
              }}
            >
              Sign in to continue
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.7 }}>
              Sign in first, then return here to register and publish listings.
            </p>
            <Link href="/api/auth/sign-in" className="gt-btn-primary">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  });

  if (!creator) {
    return (
      <div style={{ padding: "3rem 0 6rem" }}>
        <div className="gt-container" style={{ maxWidth: "720px" }}>
          <RegisterCreatorForm />
        </div>
      </div>
    );
  }

  const creatorListings = await db
    .select()
    .from(listings)
    .where(eq(listings.creatorId, creator.id))
    .orderBy(desc(listings.updatedAt));

  return (
    <div style={{ padding: "3rem 0 6rem" }}>
      <div className="gt-container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

        {/* ── Creator header ── */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xl)",
            padding: "2rem 2.5rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle accent */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "-30%",
              right: "-5%",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,58,237,0.05), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <p
            className="gt-label"
            style={{
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <span className="gt-dot" />
            CREATOR CONSOLE
          </p>

          <h1
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              marginBottom: "0.5rem",
              position: "relative",
              zIndex: 1,
            }}
          >
            {creator.displayName}
          </h1>

          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              maxWidth: "52ch",
              lineHeight: 1.7,
              marginBottom: "1.5rem",
              position: "relative",
              zIndex: 1,
            }}
          >
            {creator.bio ?? "No bio yet. Add one to help buyers understand your expertise."}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {[
              { label: "INSTALLS", value: String(creator.totalInstalls) },
              { label: "REVENUE", value: moneyFormatter.format(creator.totalRevenue / 100) },
              { label: "SLUG", value: `@${slugify(creator.displayName)}` },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-muted)",
                  borderRadius: "var(--radius-md)",
                  padding: "8px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <span className="gt-label" style={{ fontSize: "0.6rem" }}>{label}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Listings section ── */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
          }}
        >
          {/* Section header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <p className="gt-label" style={{ marginBottom: "2px" }}>LISTINGS</p>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
                Your published packages
              </h2>
            </div>
            <Link href="/creator/listings/new" className="gt-btn-primary" style={{ fontSize: "0.8rem", padding: "7px 14px" }}>
              + New listing
            </Link>
          </div>

          {creatorListings.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.8125rem",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {["Listing", "Type", "Status", "Price", "Actions"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.65rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--text-muted)",
                          fontWeight: 500,
                          background: "var(--bg-elevated)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {creatorListings.map((listing, i) => (
                    <tr
                      key={listing.id}
                      style={{
                        borderBottom: i < creatorListings.length - 1 ? "1px solid var(--border-subtle)" : "none",
                        transition: "background 150ms",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                          {listing.title}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {listing.tagline ?? "No tagline"}
                        </p>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className="gt-badge">
                          {listing.type.replaceAll("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.7rem",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: listing.status === "published" ? "var(--accent-green)" : "var(--text-muted)",
                            background: listing.status === "published"
                              ? "var(--accent-green-dim)"
                              : "var(--bg-elevated)",
                            border: `1px solid ${listing.status === "published" ? "rgba(0,208,132,0.2)" : "var(--border-subtle)"}`,
                            borderRadius: "3px",
                            padding: "2px 8px",
                          }}
                        >
                          {listing.status === "published" && <span className="gt-dot" style={{ width: 4, height: 4 }} />}
                          {listing.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                          color: listing.price === 0 ? "var(--accent-green)" : "var(--text-primary)",
                        }}
                      >
                        {listing.price === 0 ? "FREE" : moneyFormatter.format(listing.price / 100)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Link
                          href={`/creator/listings/${listing.id}/edit`}
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-secondary)",
                            textDecoration: "none",
                            fontFamily: "var(--font-mono)",
                            letterSpacing: "0.04em",
                            borderBottom: "1px solid var(--border-muted)",
                            paddingBottom: "1px",
                            transition: "color 150ms, border-color 150ms",
                          }}
                        >
                          Edit →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
              <p className="gt-label" style={{ marginBottom: "0.75rem", justifyContent: "center", display: "flex" }}>
                NO LISTINGS YET
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                Start the wizard to publish your first package.
              </p>
              <Link href="/creator/listings/new" className="gt-btn-ghost">
                Create first listing →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
