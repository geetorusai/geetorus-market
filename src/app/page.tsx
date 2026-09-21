import Link from "next/link";

const STATS = [
  { value: "500+", label: "Blueprints" },
  { value: "12k+", label: "Installs" },
  { value: "200+", label: "Creators" },
  { value: "99%", label: "Uptime" },
];

const FEATURED_CATEGORIES = [
  { label: "Team Blueprints", tag: "TEAM_BP", count: 148 },
  { label: "Agent Configs", tag: "AGENT", count: 203 },
  { label: "Skills", tag: "SKILL", count: 94 },
  { label: "Governance", tag: "GOV_TPL", count: 61 },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        style={{
          padding: "6rem 0 4rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="gt-container">
          {/* Section label */}
          <p
            className="gt-label"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "2rem",
            }}
          >
            <span className="gt-dot" />
            GEETORUS / ENGINEERING PLATFORM
          </p>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(3rem, 8vw, 6rem)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              maxWidth: "16ch",
              marginBottom: "1.75rem",
            }}
          >
            BUILD.{" "}
            <span style={{ color: "var(--text-muted)" }}>SECURE.</span>{" "}
            <br />
            AUTOMATE.
          </h1>

          {/* Sub-copy */}
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--text-secondary)",
              maxWidth: "52ch",
              lineHeight: 1.7,
              marginBottom: "2.5rem",
            }}
          >
            Marketplace for complete AI company blueprints. Discover team
            configurations, install them into Geetorus, or publish your own
            listing as a creator.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "4rem" }}>
            <Link href="/browse" className="gt-btn-primary">
              Explore blueprints
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="m7 17 10-10M7 7h10v10"/>
              </svg>
            </Link>
            <Link href="/creator" className="gt-btn-ghost">
              Become a creator
            </Link>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "2rem",
              paddingTop: "2rem",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: "var(--text-primary)",
                    lineHeight: 1,
                    marginBottom: "4px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {value}
                </p>
                <p className="gt-label">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Terminal preview ──────────────────────────────────── */}
      <section
        style={{
          padding: "0 0 5rem",
        }}
      >
        <div className="gt-container">
          <div
            style={{
              background: "#080808",
              border: "1px solid var(--border-muted)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            {/* Terminal titlebar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border-subtle)",
                background: "#0a0a0a",
              }}
            >
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                <span
                  key={c}
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: c,
                    opacity: 0.7,
                  }}
                />
              ))}
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  letterSpacing: "0.06em",
                }}
              >
                geetorus — bash
              </span>
            </div>

            {/* Terminal body */}
            <div
              style={{
                padding: "20px 24px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                lineHeight: 1.9,
              }}
            >
              {[
                { prompt: true, text: "geetorus install enterprise-saas-team" },
                { prompt: false, text: "→ Resolving blueprint...", color: "var(--text-muted)" },
                { prompt: false, text: "[+] Fetching team configuration (v2.4.1)", color: "var(--text-secondary)" },
                { prompt: false, text: "[+] Configuring 12 agents...", color: "var(--text-secondary)" },
                { prompt: false, text: "[+] Applying governance templates...", color: "var(--text-secondary)" },
                { prompt: false, text: "[✓] Blueprint installed successfully.", color: "var(--accent-green)" },
                { prompt: true, text: "", cursor: true },
              ].map(({ prompt, text, color, cursor }, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", color: color ?? "var(--text-primary)" }}>
                  {prompt && (
                    <span style={{ color: "var(--accent-green)", userSelect: "none" }}>$</span>
                  )}
                  <span>
                    {text}
                    {cursor && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: "1em",
                          background: "var(--accent-green)",
                          marginLeft: 2,
                          verticalAlign: "text-bottom",
                          animation: "glow-pulse 1s step-end infinite",
                        }}
                      />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Category grid ─────────────────────────────────────── */}
      <section style={{ padding: "0 0 6rem" }}>
        <div className="gt-container">
          {/* Section header */}
          <div style={{ marginBottom: "2rem" }}>
            <p className="gt-label" style={{ marginBottom: "0.75rem" }}>
              01 — CATEGORIES
            </p>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginBottom: "0.5rem",
              }}
            >
              Everything you need to run an AI company.
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "52ch" }}>
              From solo agent scripts to full enterprise team configurations — browse by type.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {FEATURED_CATEGORIES.map(({ label, tag, count }) => (
              <Link
                key={tag}
                href={`/browse?type=${tag.toLowerCase()}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="gt-card"
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    cursor: "pointer",
                  }}
                >
                  <span className="gt-badge">{tag}</span>
                  <div>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        color: "var(--text-primary)",
                        marginBottom: "4px",
                      }}
                    >
                      {label}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {count} listings
                    </p>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--text-muted)"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path d="m7 17 10-10M7 7h10v10" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      <section style={{ padding: "0 0 6rem" }}>
        <div className="gt-container">
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-xl)",
              padding: "3rem 2.5rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Subtle radial accent */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: "-40%",
                right: "-5%",
                width: "300px",
                height: "300px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(124,58,237,0.06), transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <p className="gt-label" style={{ marginBottom: "0.75rem" }}>
                02 — FOR CREATORS
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  marginBottom: "0.5rem",
                }}
              >
                Publish your blueprints. Earn revenue.
              </h2>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "44ch" }}>
                Set your own pricing from $0 to $499. Reach thousands of engineers deploying AI teams.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              <Link href="/creator" className="gt-btn-primary">
                Open creator dashboard
              </Link>
              <Link href="/creators" className="gt-btn-ghost">
                Browse creators
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
