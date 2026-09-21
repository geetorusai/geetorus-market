"use client";

import { useMemo, useState } from "react";

export interface ListingAgent {
  slug: string;
  name: string;
  role: string;
  title: string;
  icon?: string;
  capabilities?: string;
  adapterType?: string;
  skills?: string[];
  budgetMonthlyCents?: number;
  instructionsPath?: string | null;
  permissions?: {
    canCreateAgents?: boolean;
    canApproveHires?: boolean;
  };
}

export interface ReportingLink {
  agentSlug: string;
  reportsTo: string | null;
}

interface ListingBlueprintSectionsProps {
  agents: ListingAgent[];
  reportingChain: ReportingLink[];
}

function formatMoney(cents?: number): string {
  if (typeof cents !== "number" || Number.isNaN(cents)) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function titleFromRole(role: string): string {
  return role.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ListingBlueprintSections({
  agents,
  reportingChain,
}: ListingBlueprintSectionsProps) {
  const hierarchy = useMemo(() => {
    const agentBySlug = new Map<string, ListingAgent>();
    const childrenBySlug = new Map<string, string[]>();
    const parentBySlug = new Map<string, string | null>();

    for (const agent of agents) {
      agentBySlug.set(agent.slug, agent);
      childrenBySlug.set(agent.slug, []);
      parentBySlug.set(agent.slug, null);
    }

    for (const link of reportingChain) {
      if (!agentBySlug.has(link.agentSlug)) {
        continue;
      }

      parentBySlug.set(link.agentSlug, link.reportsTo);
      if (link.reportsTo && childrenBySlug.has(link.reportsTo)) {
        childrenBySlug.get(link.reportsTo)?.push(link.agentSlug);
      }
    }

    const roots = agents
      .filter((agent) => {
        const parent = parentBySlug.get(agent.slug);
        return !parent || !agentBySlug.has(parent);
      })
      .map((agent) => agent.slug);

    if (!roots.length && agents[0]) {
      roots.push(agents[0].slug);
    }

    return { agentBySlug, childrenBySlug, roots };
  }, [agents, reportingChain]);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    hierarchy.roots[0] ?? agents[0]?.slug ?? null
  );
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (agents[0]) {
      initial.add(agents[0].slug);
    }
    return initial;
  });

  const selectedAgent = selectedSlug
    ? hierarchy.agentBySlug.get(selectedSlug) ?? null
    : null;

  const toggleExpanded = (slug: string) => {
    setExpandedAgents((previous) => {
      const next = new Set(previous);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const renderNode = (slug: string, depth: number, trail: Set<string>): React.ReactNode => {
    if (trail.has(slug)) {
      return null;
    }

    const agent = hierarchy.agentBySlug.get(slug);
    if (!agent) {
      return null;
    }

    const nextTrail = new Set(trail);
    nextTrail.add(slug);
    const children = hierarchy.childrenBySlug.get(slug) ?? [];
    const isSelected = slug === selectedSlug;

    return (
      <div key={slug} style={{ marginLeft: depth ? 20 : 0, display: "flex", flexDirection: "column", gap: "10px" }}>
        <button
          type="button"
          onClick={() => setSelectedSlug(slug)}
          style={{
            position: "relative",
            width: "100%",
            textAlign: "left",
            background: isSelected ? "var(--bg-elevated)" : "var(--bg-base)",
            border: `1px solid ${isSelected ? "var(--text-muted)" : "var(--border-subtle)"}`,
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            cursor: "pointer",
            transition: "border-color 150ms, background 150ms",
          }}
        >
          {depth > 0 && (
            <span style={{ position: "absolute", left: -16, top: "50%", width: 10, height: 1, background: "var(--border-accent)", transform: "translateY(-50%)" }} />
          )}
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "4px" }}>
            {titleFromRole(agent.role)}
          </p>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>{agent.name}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{agent.title ?? "Team member"}</p>
        </button>

        {children.length > 0 && (
          <div style={{ marginLeft: 12, borderLeft: "1px dashed var(--border-muted)", paddingLeft: 16, display: "flex", flexDirection: "column", gap: "10px" }}>
            {children.map((childSlug) => renderNode(childSlug, depth + 1, nextTrail))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <section style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xl)", padding: "2rem" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "0.75rem" }}>02 — ORG CHART</p>
        <h2 style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "1.25rem" }}>Interactive team hierarchy</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "1.25rem" }}>
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1rem", display: "flex", flexDirection: "column", gap: "10px" }}>
            {hierarchy.roots.map((rootSlug) => renderNode(rootSlug, 0, new Set()))}
          </div>
          <aside style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            {selectedAgent ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-muted)" }}>SELECTED AGENT</p>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.02em" }}>{selectedAgent.name}</h3>
                <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  {selectedAgent.title ?? titleFromRole(selectedAgent.role)}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  {selectedAgent.capabilities ?? "Capabilities not provided for this role yet."}
                </p>
                <dl style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    { label: "Adapter", value: selectedAgent.adapterType ?? "Not specified" },
                    { label: "Monthly Budget", value: formatMoney(selectedAgent.budgetMonthlyCents) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "0.75rem", borderTop: "1px solid var(--border-subtle)", padding: "7px 0" }}>
                      <dt style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>{label}</dt>
                      <dd style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontWeight: 500 }}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>// No agent data available.</p>
            )}
          </aside>
        </div>
      </section>

      <section style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xl)", padding: "2rem" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "0.75rem" }}>03 — AGENT BREAKDOWN</p>
        <h2 style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "1.25rem" }}>Expandable role details</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {agents.map((agent) => {
            const isExpanded = expandedAgents.has(agent.slug);
            return (
              <article key={agent.slug} style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => toggleExpanded(agent.slug)}
                  style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "12px 16px", textAlign: "left" as const, background: "transparent", border: "none", cursor: "pointer" }}
                >
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "4px" }}>
                      {titleFromRole(agent.role)}
                    </p>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text-primary)", marginBottom: "2px" }}>{agent.name}</h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{agent.title ?? "No title provided"}</p>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)", flexShrink: 0 }}>
                    {isExpanded ? "[ COLLAPSE ]" : "[ EXPAND ]"}
                  </span>
                </button>

                {isExpanded && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", borderTop: "1px solid var(--border-subtle)", padding: "1rem 1.25rem", background: "var(--bg-elevated)" }}>
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Capabilities</p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                        {agent.capabilities ?? "No capabilities listed for this agent."}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Runtime</p>
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        <li>adapter: {agent.adapterType ?? "not specified"}</li>
                        <li>budget: {formatMoney(agent.budgetMonthlyCents)}</li>
                        <li>instructions: {agent.instructionsPath ?? "none"}</li>
                      </ul>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Permissions</p>
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        <li>canCreateAgents: {agent.permissions?.canCreateAgents ? "true" : "false"}</li>
                        <li>canApproveHires: {agent.permissions?.canApproveHires ? "true" : "false"}</li>
                      </ul>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Skills</p>
                      {agent.skills?.length ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {agent.skills.map((skill, index) => (
                            <span key={`${agent.slug}-${skill}-${index}`} className="gt-tag">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>// no bundled skills</p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
