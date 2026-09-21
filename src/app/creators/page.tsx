import Link from "next/link";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Creators Directory — Geetorus Market",
  description: "Meet the engineers and architects designing autonomous agent workflows and templates.",
};

export default async function CreatorsIndexPage() {
  let allCreators: Array<typeof creators.$inferSelect> = [];
  try {
    allCreators = await db.select().from(creators).orderBy(desc(creators.totalInstalls));
  } catch (err) {
    console.warn("Could not load creators from DB:", err);
  }

  return (
    <div style={{ minHeight: "80vh", padding: "3rem 1.5rem 5rem" }}>
      <div className="gt-container" style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header section */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-muted)",
            borderRadius: "var(--radius-xl)",
            padding: "2.5rem 2rem",
            marginBottom: "2.5rem",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span className="gt-badge gt-badge-accent" style={{ marginBottom: "1rem", display: "inline-block" }}>
            VERIFIED DIRECTORY
          </span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              marginBottom: "0.75rem",
            }}
          >
            Meet the Makers
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "680px", lineHeight: 1.6 }}>
            Top engineers, AI architects, and systems designers publishing blueprints for the Geetorus ecosystem.
          </p>
        </div>

        {/* Creators Grid */}
        {allCreators.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {allCreators.map((creator) => (
              <article
                key={creator.id}
                className="gt-card"
                style={{
                  padding: "1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "var(--radius-md)",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: "var(--accent)",
                        fontSize: "1.1rem",
                      }}
                    >
                      {creator.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {creator.displayName}
                      </h2>
                      {creator.verified && (
                        <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                          ✓ VERIFIED ARCHITECT
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.6,
                      marginBottom: "1.25rem",
                    }}
                  >
                    {creator.bio || "No bio provided."}
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
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {creator.totalInstalls || 0} installs
                  </span>
                  <Link
                    href={`/creators/${slugify(creator.displayName)}`}
                    className="gt-btn-ghost"
                    style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem" }}
                  >
                    View Profile →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div
            className="gt-card"
            style={{
              padding: "3.5rem 2rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                letterSpacing: "0.08em",
              }}
            >
              [CREATOR_REGISTRY_STANDBY]
            </div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
              Become the First Published Creator
            </h3>
            <p style={{ color: "var(--text-muted)", maxWidth: "450px", fontSize: "0.9rem" }}>
              Join the ecosystem to distribute your agent swarms, workflows, and automated skillsets to teams worldwide.
            </p>
            <Link href="/creator" className="gt-btn-primary" style={{ marginTop: "0.5rem" }}>
              Register as Creator →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
