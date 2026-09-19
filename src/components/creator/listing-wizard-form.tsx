"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ListingType =
  | "team_blueprint"
  | "agent_blueprint"
  | "skill"
  | "governance_template";

type ListingStatus = "draft" | "published" | "archived";

const TYPE_OPTIONS: Array<{ value: ListingType; label: string; hint: string }> = [
  {
    value: "team_blueprint",
    label: "Team Blueprint",
    hint: "Complete company configuration with multi-agent org charts.",
  },
  {
    value: "agent_blueprint",
    label: "Agent Blueprint",
    hint: "Single agent package designed to plug into an existing org.",
  },
  {
    value: "skill",
    label: "Skill Bundle",
    hint: "Portable capability packs you can attach to multiple agents.",
  },
  {
    value: "governance_template",
    label: "Governance Template",
    hint: "Approval chains, budget policies, and escalation defaults.",
  },
];

const STEPS = [
  "Type",
  "Basics",
  "Bundle",
  "Preview",
  "Pricing",
  "Review",
] as const;

export type ListingWizardInitialValues = {
  id?: string;
  type?: ListingType;
  title?: string;
  tagline?: string;
  description?: string;
  categories?: string[];
  tags?: string[];
  includedFiles?: string[];
  readmeMarkdown?: string;
  agentCount?: number | null;
  price?: number;
  status?: ListingStatus;
};

type ListingWizardFormProps = {
  mode: "create" | "edit";
  listingId?: string;
  initialValues?: ListingWizardInitialValues;
};

function asCsv(items: string[] | undefined): string {
  if (!items) {
    return "";
  }

  return items.join(", ");
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function derivePreviewNodes(type: ListingType, agentCount: number) {
  if (type === "skill" || type === "governance_template") {
    return ["Publisher", "Installer"];
  }

  const count = Math.max(2, Math.min(12, agentCount || 3));

  return ["Lead", ...Array.from({ length: count - 1 }, (_, index) => `Agent ${index + 1}`)];
}

export function ListingWizardForm({
  mode,
  listingId,
  initialValues,
}: ListingWizardFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [type, setType] = useState<ListingType>(
    initialValues?.type ?? "team_blueprint",
  );
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [tagline, setTagline] = useState(initialValues?.tagline ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [categories, setCategories] = useState(asCsv(initialValues?.categories));
  const [tags, setTags] = useState(asCsv(initialValues?.tags));
  const [bundleMode, setBundleMode] = useState<"upload" | "manual">("upload");
  const [includedFiles, setIncludedFiles] = useState(asCsv(initialValues?.includedFiles));
  const [readmeMarkdown, setReadmeMarkdown] = useState(
    initialValues?.readmeMarkdown ?? "",
  );
  const [agentCount, setAgentCount] = useState(
    Math.max(0, initialValues?.agentCount ?? 0),
  );
  const [price, setPrice] = useState(initialValues?.price ?? 0);
  const [status, setStatus] = useState<ListingStatus>(
    initialValues?.status ?? "draft",
  );

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const summary = useMemo(
    () => ({
      type,
      title: title.trim() || "Untitled listing",
      tagline: tagline.trim() || "No tagline yet",
      categories: parseCsv(categories),
      tags: parseCsv(tags),
      includedFiles: parseCsv(includedFiles),
      readmeMarkdown,
      agentCount,
      price,
      status,
    }),
    [
      agentCount,
      categories,
      includedFiles,
      price,
      readmeMarkdown,
      status,
      tagline,
      tags,
      title,
      type,
    ],
  );

  const maxStep = STEPS.length - 1;

  const nextStep = () => setStep((current) => Math.min(current + 1, maxStep));
  const previousStep = () => setStep((current) => Math.max(current - 1, 0));

  const submit = () => {
    setError(null);

    if (!title.trim()) {
      setError("Title is required before publish.");
      setStep(1);
      return;
    }

    startTransition(async () => {
      const payload = {
        type,
        title,
        tagline,
        description,
        categories: parseCsv(categories),
        tags: parseCsv(tags),
        includedFiles: parseCsv(includedFiles),
        readmeMarkdown,
        agentCount,
        price,
        status,
      };

      const endpoint =
        mode === "create" ? "/api/creator/listings" : `/api/creator/listings/${listingId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responsePayload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(responsePayload?.error ?? "Unable to save listing");
        return;
      }

      router.push("/creator");
      router.refresh();
    });
  };

  const previewNodes = derivePreviewNodes(type, agentCount);

  return (
    <div className="space-y-8 rounded-3xl border border-stone-300 bg-white/85 p-6 shadow-[0_24px_70px_-50px_rgba(34,31,25,0.8)] backdrop-blur sm:p-8">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {STEPS.map((label, index) => {
            const stateClass =
              index === step
                ? "bg-stone-900 text-stone-100"
                : index < step
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-stone-100 text-stone-500";

            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition ${stateClass}`}
              >
                {index + 1}. {label}
              </button>
            );
          })}
        </div>
        <h1 className="font-serif text-3xl text-stone-900">
          {mode === "create" ? "New listing wizard" : "Edit listing wizard"}
        </h1>
        <p className="text-sm text-stone-600">
          Complete all six stages to publish a marketplace-ready listing.
        </p>
      </div>

      {step === 0 ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {TYPE_OPTIONS.map((option) => {
            const isActive = option.value === type;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? "border-stone-900 bg-stone-900 text-stone-100"
                    : "border-stone-300 bg-stone-50 text-stone-800 hover:border-stone-500"
                }`}
              >
                <p className="font-semibold">{option.label}</p>
                <p className="mt-2 text-sm opacity-90">{option.hint}</p>
              </button>
            );
          })}
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-stone-800">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={255}
              required
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-stone-900 outline-none focus:border-stone-800"
              placeholder="SaaS Team Launch Kit"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-stone-800">Tagline</span>
            <input
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              maxLength={120}
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-stone-900 outline-none focus:border-stone-800"
              placeholder="Deploy a full product and growth team in minutes."
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-stone-800">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-stone-900 outline-none focus:border-stone-800"
              placeholder="Explain workflow, assumptions, and best fit buyer profile."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-800">Categories</span>
              <input
                value={categories}
                onChange={(event) => setCategories(event.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-stone-900 outline-none focus:border-stone-800"
                placeholder="saas, growth, engineering"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-800">Tags</span>
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-stone-900 outline-none focus:border-stone-800"
                placeholder="5-agent, codex, startup"
              />
            </label>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-5">
          <div className="flex gap-2 rounded-xl bg-stone-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => setBundleMode("upload")}
              className={`flex-1 rounded-lg px-3 py-2 font-semibold transition ${
                bundleMode === "upload"
                  ? "bg-white text-stone-900"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Upload bundle
            </button>
            <button
              type="button"
              onClick={() => setBundleMode("manual")}
              className={`flex-1 rounded-lg px-3 py-2 font-semibold transition ${
                bundleMode === "manual"
                  ? "bg-white text-stone-900"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Manual entry
            </button>
          </div>

          {bundleMode === "upload" ? (
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-800">Bundle files</span>
              <input
                type="file"
                multiple
                onChange={(event) => {
                  const fileNames = Array.from(event.target.files ?? []).map((file) => file.name);
                  setIncludedFiles(fileNames.join(", "));
                }}
                className="w-full rounded-xl border border-dashed border-stone-400 bg-stone-50 px-3 py-8 text-sm text-stone-600"
              />
            </label>
          ) : (
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-800">
                Included files (comma separated)
              </span>
              <input
                value={includedFiles}
                onChange={(event) => setIncludedFiles(event.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-stone-900 outline-none focus:border-stone-800"
                placeholder="manifest.json, README.md, agents/cto/AGENTS.md"
              />
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-stone-800">README markdown</span>
            <textarea
              value={readmeMarkdown}
              onChange={(event) => setReadmeMarkdown(event.target.value)}
              rows={8}
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 font-mono text-xs text-stone-900 outline-none focus:border-stone-800"
              placeholder="# Package overview\n\nDescribe setup instructions and outcomes."
            />
          </label>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-stone-900">Live preview</p>
              <h3 className="mt-3 font-serif text-2xl text-stone-900">{summary.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{summary.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {summary.categories.length ? (
                  summary.categories.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-stone-200 px-2 py-1 font-medium text-stone-700"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-stone-500">No categories yet</span>
                )}
              </div>
              <p className="mt-4 text-xs text-stone-500">
                Files: {summary.includedFiles.length ? summary.includedFiles.join(", ") : "none"}
              </p>
            </div>

            <div className="rounded-2xl border border-stone-900 bg-stone-900 p-4 text-stone-100">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-300">
                Org preview
              </p>
              <div className="mt-3 space-y-2">
                {previewNodes.map((node, index) => (
                  <div
                    key={node}
                    className={`rounded-lg border border-stone-600 px-3 py-2 text-xs ${
                      index === 0 ? "bg-stone-100 text-stone-900" : "bg-stone-800"
                    }`}
                  >
                    {node}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-stone-800">Approximate agent count</span>
            <input
              type="number"
              min={0}
              max={99}
              value={agentCount}
              onChange={(event) => setAgentCount(Number(event.target.value))}
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-stone-900 outline-none focus:border-stone-800"
            />
          </label>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-stone-800">Price (USD)</span>
            <input
              type="range"
              min={0}
              max={499}
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
              className="w-full accent-stone-900"
            />
            <div className="flex items-center justify-between text-sm text-stone-600">
              <span>$0</span>
              <span className="rounded-full bg-stone-900 px-3 py-1 font-semibold text-stone-100">
                ${price}
              </span>
              <span>$499</span>
            </div>
          </label>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <h3 className="font-serif text-xl text-stone-900">Final review</h3>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-stone-600">Type</dt>
                <dd className="text-stone-900">{summary.type}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-600">Price</dt>
                <dd className="text-stone-900">${summary.price}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-600">Agent count</dt>
                <dd className="text-stone-900">{summary.agentCount || 0}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-600">Tags</dt>
                <dd className="text-stone-900">{summary.tags.join(", ") || "none"}</dd>
              </div>
            </dl>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-stone-800">Publish state</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ListingStatus)}
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-stone-900 outline-none focus:border-stone-800"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </section>
      ) : null}

      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={previousStep}
          disabled={step === 0 || isPending}
          className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-500 disabled:opacity-50"
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          {step < maxStep ? (
            <button
              type="button"
              onClick={nextStep}
              className="rounded-xl bg-stone-900 px-5 py-2 text-sm font-semibold text-stone-100 transition hover:bg-stone-800"
            >
              Next step
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {isPending ? "Saving..." : mode === "create" ? "Publish listing" : "Save changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
