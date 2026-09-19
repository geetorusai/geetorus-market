"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RegisterCreatorForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, website }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "Failed to create creator profile");
        return;
      }

      router.refresh();
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-2xl border border-stone-300 bg-stone-50/70 p-6"
    >
      <div className="space-y-2">
        <h2 className="font-serif text-2xl text-stone-900">Register as a creator</h2>
        <p className="text-sm text-stone-600">
          Create a public profile before you can publish listings.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-stone-800">Display name</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
          maxLength={100}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-0 focus:border-stone-800"
          placeholder="Studio Meridian"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-stone-800">Bio</span>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={1600}
          rows={4}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-0 focus:border-stone-800"
          placeholder="We build practical blueprints for product and growth teams."
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-stone-800">Website</span>
        <input
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          maxLength={500}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-0 focus:border-stone-800"
          placeholder="https://example.com"
        />
      </label>

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:bg-stone-800 disabled:opacity-60"
      >
        {isPending ? "Creating profile..." : "Create creator profile"}
      </button>
    </form>
  );
}
