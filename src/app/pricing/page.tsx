const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "List free blueprints and grow your audience.",
    features: [
      "Unlimited free listings",
      "Install tracking",
      "Community support",
    ],
    cta: "Get started",
    href: "/creator",
    accent: false,
  },
  {
    id: "creator",
    name: "Creator",
    price: "$0",
    period: "+ revenue share",
    description: "Sell blueprints from $1 to $499. We take a small platform fee.",
    features: [
      "Paid listings up to $499",
      "Analytics dashboard",
      "Priority listing placement",
      "Creator profile page",
      "Email support",
    ],
    cta: "Open creator dashboard",
    href: "/creator",
    accent: true,
  },
];

export default function PricingPage() {
  return (
    <div style={{ padding: "4rem 0 6rem" }}>
      <div className="gt-container">

        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <p
            className="gt-label"
            style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <span className="gt-dot" />
            PRICING
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              marginBottom: "0.75rem",
            }}
          >
            Set your own price.
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", maxWidth: "44ch", lineHeight: 1.7 }}>
            List for free or monetize your blueprints. Set prices from $0 to $499 in the creator wizard.
          </p>
        </div>

        {/* Plans grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
            maxWidth: "720px",
          }}
        >
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: plan.accent ? "var(--bg-elevated)" : "var(--bg-card)",
                border: plan.accent
                  ? "1px solid rgba(124,58,237,0.3)"
                  : "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-xl)",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
                position: "relative",
              }}
            >
              {plan.accent && (
                <span
                  className="gt-badge"
                  style={{
                    position: "absolute",
                    top: "1.25rem",
                    right: "1.25rem",
                    color: "rgba(124,58,237,0.9)",
                    borderColor: "rgba(124,58,237,0.3)",
                    background: "rgba(124,58,237,0.08)",
                  }}
                >
                  POPULAR
                </span>
              )}

              <div>
                <p className="gt-label" style={{ marginBottom: "0.75rem" }}>
                  {plan.name}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: 700,
                      letterSpacing: "-0.04em",
                      fontFamily: "var(--font-mono)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {plan.period}
                  </span>
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                  {plan.description}
                </p>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  flex: 1,
                }}
              >
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "0.8125rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span style={{ color: "var(--accent-green)", fontSize: "0.75rem" }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={plan.accent ? "gt-btn-primary" : "gt-btn-ghost"}
                style={{ textAlign: "center" }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Note */}
        <p
          style={{
            marginTop: "2.5rem",
            fontSize: "0.8rem",
            color: "var(--text-ghost)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.04em",
          }}
        >
          // All pricing is set by creators. Geetorus charges a platform fee on paid transactions.
        </p>
      </div>
    </div>
  );
}
