import Link from "next/link";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { desc } from "drizzle-orm";

export default async function CreatorsIndexPage() {
  const allCreators = await db.select().from(creators).orderBy(desc(creators.totalInstalls));

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-stone-300 bg-stone-50 p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Creator Directory</p>
        <h1 className="mt-3 font-serif text-4xl text-stone-900">Meet the makers</h1>
      </section>

      {allCreators.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {allCreators.map((creator) => (
            <article key={creator.id} className="rounded-2xl border border-stone-300 bg-white/70 p-5">
              <h2 className="font-serif text-2xl text-stone-900">{creator.displayName}</h2>
              <p className="mt-2 text-sm text-stone-700">{creator.bio || "No bio provided."}</p>
              <Link
                href={`/creators/${slugify(creator.displayName)}`}
                className="mt-4 inline-flex text-sm font-semibold text-stone-900 underline-offset-4 hover:underline"
              >
                View profile
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-600">No creators registered yet.</p>
      )}
    </main>
  );
}
