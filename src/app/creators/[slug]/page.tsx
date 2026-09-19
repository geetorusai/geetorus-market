import Link from "next/link";
import { db } from "@/db";
import { creators, listings } from "@/db/schema";
import { slugify } from "@/lib/slug";
import { and, desc, eq } from "drizzle-orm";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const allCreators = await db.select().from(creators);
  const creator = allCreators.find((entry) => slugify(entry.displayName) === slug);

  if (!creator) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl border border-stone-300 bg-stone-50 p-8 text-center">
          <h1 className="font-serif text-3xl text-stone-900">Creator not found</h1>
          <p className="mt-3 text-stone-600">No creator profile exists for this slug.</p>
          <Link href="/browse" className="mt-5 inline-flex rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-100">
            Browse listings
          </Link>
        </div>
      </main>
    );
  }

  const publishedListings = await db
    .select()
    .from(listings)
    .where(and(eq(listings.creatorId, creator.id), eq(listings.status, "published")))
    .orderBy(desc(listings.updatedAt));

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-stone-300 bg-gradient-to-br from-stone-100 via-amber-50 to-white p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Creator Profile</p>
        <h1 className="mt-3 font-serif text-4xl text-stone-900">{creator.displayName}</h1>
        <p className="mt-4 max-w-3xl text-stone-700">{creator.bio || "No bio provided."}</p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl text-stone-900">Published listings</h2>
        {publishedListings.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {publishedListings.map((listing) => (
              <article key={listing.id} className="rounded-2xl border border-stone-300 bg-stone-50 p-5">
                <p className="text-xs uppercase tracking-wide text-stone-600">
                  {listing.type.replaceAll("_", " ")}
                </p>
                <h3 className="mt-2 font-serif text-2xl text-stone-900">{listing.title}</h3>
                <p className="mt-2 text-sm text-stone-700">{listing.tagline || "No tagline"}</p>
                <p className="mt-3 text-sm font-semibold text-stone-900">${(listing.price / 100).toFixed(2)}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-600">No published listings yet.</p>
        )}
      </section>
    </main>
  );
}
