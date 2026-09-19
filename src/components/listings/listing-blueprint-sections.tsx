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
      <div key={slug} className="space-y-3" style={{ marginLeft: depth ? 20 : 0 }}>
        <button
          type="button"
          onClick={() => setSelectedSlug(slug)}
          className={`relative w-full rounded-2xl border px-4 py-3 text-left transition ${
            isSelected
              ? "border-stone-900 bg-stone-900 text-stone-100"
              : "border-stone-300 bg-stone-50/80 text-stone-900 hover:border-stone-500"
          }`}
        >
          {depth > 0 ? (
            <span className="absolute -left-4 top-1/2 h-px w-3 -translate-y-1/2 bg-stone-300" />
          ) : null}
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-70">
            {titleFromRole(agent.role)}
          </p>
          <p className="mt-1 font-semibold">{agent.name}</p>
          <p className="text-xs opacity-80">{agent.title || "Team member"}</p>
        </button>

        {children.length ? (
          <div className="ml-3 space-y-3 border-l border-dashed border-stone-300 pl-4">
            {children.map((childSlug) => renderNode(childSlug, depth + 1, nextTrail))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <section className="space-y-5 rounded-3xl border border-stone-300 bg-stone-50/90 p-6 sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">2. Org Chart</p>
          <h2 className="mt-2 font-serif text-3xl text-stone-900">Interactive team hierarchy</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4 rounded-2xl border border-stone-300 bg-white/85 p-4">
            {hierarchy.roots.map((rootSlug) => renderNode(rootSlug, 0, new Set()))}
          </div>
          <aside className="rounded-2xl border border-stone-300 bg-white/85 p-5">
            {selectedAgent ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Selected Agent</p>
                <h3 className="font-serif text-2xl text-stone-900">{selectedAgent.name}</h3>
                <p className="text-sm font-semibold text-stone-700">
                  {selectedAgent.title || titleFromRole(selectedAgent.role)}
                </p>
                <p className="text-sm text-stone-700">
                  {selectedAgent.capabilities || "Capabilities not provided for this role yet."}
                </p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3 border-t border-stone-200 pt-2">
                    <dt className="text-stone-500">Adapter</dt>
                    <dd className="font-medium text-stone-900">
                      {selectedAgent.adapterType || "Not specified"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-stone-200 pt-2">
                    <dt className="text-stone-500">Monthly Budget</dt>
                    <dd className="font-medium text-stone-900">
                      {formatMoney(selectedAgent.budgetMonthlyCents)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="text-sm text-stone-600">No agent data available for this blueprint.</p>
            )}
          </aside>
        </div>
      </section>

      <section className="space-y-5 rounded-3xl border border-stone-300 bg-white/85 p-6 sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            3. Agent Breakdown
          </p>
          <h2 className="mt-2 font-serif text-3xl text-stone-900">Expandable role details</h2>
        </div>
        <div className="space-y-4">
          {agents.map((agent) => {
            const isExpanded = expandedAgents.has(agent.slug);
            return (
              <article key={agent.slug} className="rounded-2xl border border-stone-300 bg-stone-50/90">
                <button
                  type="button"
                  onClick={() => toggleExpanded(agent.slug)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                      {titleFromRole(agent.role)}
                    </p>
                    <h3 className="mt-1 font-serif text-2xl text-stone-900">{agent.name}</h3>
                    <p className="text-sm text-stone-700">{agent.title || "No title provided"}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">
                    {isExpanded ? "Collapse" : "Expand"}
                  </span>
                </button>

                {isExpanded ? (
                  <div className="grid gap-4 border-t border-stone-200 px-4 py-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-stone-800">Capabilities</p>
                      <p className="mt-1 text-stone-700">
                        {agent.capabilities || "No capabilities listed for this agent."}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800">Runtime</p>
                      <ul className="mt-1 space-y-1 text-stone-700">
                        <li>Adapter: {agent.adapterType || "Not specified"}</li>
                        <li>Budget: {formatMoney(agent.budgetMonthlyCents)}</li>
                        <li>
                          Instructions: {agent.instructionsPath ? agent.instructionsPath : "None"}
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800">Permissions</p>
                      <ul className="mt-1 space-y-1 text-stone-700">
                        <li>
                          Create agents: {agent.permissions?.canCreateAgents ? "Yes" : "No"}
                        </li>
                        <li>
                          Approve hires: {agent.permissions?.canApproveHires ? "Yes" : "No"}
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800">Skills</p>
                      {agent.skills?.length ? (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {agent.skills.map((skill, index) => (
                            <li
                              key={`${agent.slug}-${skill}-${index}`}
                              className="rounded-full border border-stone-300 bg-stone-100 px-2 py-1 text-xs text-stone-700"
                            >
                              {skill}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-stone-700">No bundled skills listed.</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
