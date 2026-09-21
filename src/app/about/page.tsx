import Link from "next/link";

export const metadata = {
  title: "About — Geetorus Market",
  description: "The autonomous engineering collective and marketplace for full-stack AI agent blueprints.",
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: "80vh", padding: "4rem 1.5rem" }}>
      <div className="gt-container" style={{ maxWidth: "860px", margin: "0 auto" }}>
        {/* Header badge */}
        <div style={{ marginBottom: "1.5rem" }}>
          <span className="gt-badge gt-badge-accent">MANIFESTO // SPEC 01</span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            color: "var(--text-primary)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "1.5rem",
          }}
        >
          Autonomous Engineering, <br />
          <span style={{ color: "var(--accent)" }}>Codified into Blueprints.</span>
        </h1>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "1.125rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "2.5rem",
          }}
        >
          Geetorus Market is the open exchange for high-precision autonomous agent harnesses, multi-agent workflows,
          and hardened operational governance templates. Built for engineering teams that run an office of agent clones.
        </p>

        {/* Technical Principles Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.25rem",
            marginBottom: "3rem",
          }}
        >
          <div className="gt-card" style={{ padding: "1.75rem" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--accent)",
                marginBottom: "0.75rem",
                letterSpacing: "0.08em",
              }}
            >
              [01] HARNESSED AUTONOMY
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "0.5rem",
              }}
            >
              Deterministic Guardrails
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Agents operate inside strict containment boundaries with explicit tool access, audit ledgers, and budget limits.
            </p>
          </div>

          <div className="gt-card" style={{ padding: "1.75rem" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--sky)",
                marginBottom: "0.75rem",
                letterSpacing: "0.08em",
              }}
            >
              [02] REPRODUCIBLE CLONES
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "0.5rem",
              }}
            >
              One-Click Deployment
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Export and distribute battle-tested agent topologies. Clone entire engineering squads in under 30 seconds.
            </p>
          </div>

          <div className="gt-card" style={{ padding: "1.75rem" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                marginBottom: "0.75rem",
                letterSpacing: "0.08em",
              }}
            >
              [03] OPEN PROTOCOL
            </div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "0.5rem",
              }}
            >
              Tool & Model Agnostic
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Standardized schemas compatible with OpenCode, Claude, OpenAI, Ollama, and custom enterprise adapter pipelines.
            </p>
          </div>
        </div>

        {/* Action strip */}
        <div
          style={{
            padding: "2rem",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-muted)",
            borderRadius: "var(--radius-lg)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1.25rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h4 style={{ color: "var(--text-primary)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              Ready to explore verified blueprints?
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Browse engineering-tested templates or publish your own squad configuration.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/browse" className="gt-btn-primary">
              Browse Market →
            </Link>
            <Link href="/creator" className="gt-btn-ghost">
              Publish Blueprint
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
