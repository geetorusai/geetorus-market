import Link from "next/link";

const FOOTER_COLS = [
  {
    title: "Product",
    links: [
      { label: "Browse", href: "/browse" },
      { label: "Pricing", href: "/pricing" },
      { label: "Creator Dashboard", href: "/creator" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Creators", href: "/creators" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "API Docs", href: "/api/docs" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        marginTop: "auto",
      }}
    >
      {/* Main footer content */}
      <div
        className="gt-container"
        style={{
          paddingTop: "3rem",
          paddingBottom: "2rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "2.5rem",
        }}
      >
        {/* Brand column */}
        <div style={{ gridColumn: "span 2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "var(--text-primary)",
                color: "var(--bg-base)",
                fontSize: "0.75rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                letterSpacing: "-0.04em",
              }}
            >
              GT
            </span>
            <span
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}
            >
              Geetorus
            </span>
          </div>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              maxWidth: "220px",
              lineHeight: 1.7,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.01em",
            }}
          >
            AI blueprints engineered, not assumed.
          </p>
        </div>

        {/* Nav columns */}
        {FOOTER_COLS.map((col) => (
          <div key={col.title}>
            <p className="gt-label" style={{ marginBottom: "0.875rem" }}>
              {col.title}
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {col.links.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      transition: "color 150ms",
                    }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        className="gt-container"
        style={{
          paddingTop: "1.25rem",
          paddingBottom: "1.5rem",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--text-ghost)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          © {year} GEETORUS. ALL RIGHTS RESERVED.
        </p>
        <div style={{ display: "flex", gap: "1.25rem" }}>
          {[
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontSize: "0.75rem",
                color: "var(--text-ghost)",
                textDecoration: "none",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                transition: "color 150ms",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
