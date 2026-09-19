// Client for calling the Geetorus control plane API during blueprint installs

const GEETORUS_API_URL = process.env.GEETORUS_API_URL ?? "http://localhost:3100";

interface GeetorusRequestOptions {
  method: string;
  path: string;
  body?: unknown;
  apiKey: string;
}

async function geetorusFetch<T = unknown>({
  method,
  path,
  body,
  apiKey,
}: GeetorusRequestOptions): Promise<T> {
  const res = await fetch(`${GEETORUS_API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Geetorus API ${method} ${path} failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<T>;
}

export interface CreateAgentPayload {
  name: string;
  role: string;
  title: string;
  icon?: string;
  capabilities?: string;
  adapterType: string;
  adapterConfig?: Record<string, unknown>;
  reportsTo?: string;
  budgetMonthlyCents?: number;
  permissions?: { canCreateAgents?: boolean };
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  workspace?: {
    cwd?: string;
    repoUrl?: string;
  };
}

interface CreatedAgent {
  id: string;
  name: string;
  role: string;
  urlKey: string;
}

interface CreatedProject {
  id: string;
  name: string;
}

export const geetorusClient = {
  async createAgent(
    companyId: string,
    agent: CreateAgentPayload,
    apiKey: string
  ): Promise<CreatedAgent> {
    return geetorusFetch<CreatedAgent>({
      method: "POST",
      path: `/api/companies/${companyId}/agents`,
      body: agent,
      apiKey,
    });
  },

  async createProject(
    companyId: string,
    project: CreateProjectPayload,
    apiKey: string
  ): Promise<CreatedProject> {
    return geetorusFetch<CreatedProject>({
      method: "POST",
      path: `/api/companies/${companyId}/projects`,
      body: project,
      apiKey,
    });
  },

  async setInstructionsPath(
    agentId: string,
    path: string,
    apiKey: string
  ): Promise<void> {
    await geetorusFetch({
      method: "PATCH",
      path: `/api/agents/${agentId}/instructions-path`,
      body: { path },
      apiKey,
    });
  },

  async getCompany(
    companyId: string,
    apiKey: string
  ): Promise<{ id: string; name: string }> {
    return geetorusFetch({
      method: "GET",
      path: `/api/companies/${companyId}`,
      apiKey,
    });
  },
};
