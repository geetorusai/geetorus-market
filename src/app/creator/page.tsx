import Link from "next/link";
import { db } from "@/db";
import { creators, listings } from "@/db/schema";
import { getSessionUserId } from "@/lib/api-auth";
import { slugify } from "@/lib/slug";
import { desc, eq } from "drizzle-orm";
import { RegisterCreatorForm } from "@/components/creator/register-creator-form";

export default async function CreatorDashboardPage() {
  const userId = await getSessionUserId();

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl border border-stone-300 bg-stone-50 p-8 text-center">
          <h1 className="font-serif text-3xl text-stone-900">Creator dashboard</h1>
          <p className="mt-3 text-stone-600">
            Sign in first, then return here to register and publish listings.
          </p>
        </div>
      </main>
    );
  }

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
  });

  if (!creator) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <RegisterCreatorForm />
      </main>
    );
  }

  const creatorListings = await db
    .select()
    .from(listings)
    .where(eq(listings.creatorId, creator.id))
    .orderBy(desc(listings.updatedAt));

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-stone-300 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-900 p-8 text-stone-100">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-amber-300/30 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.25em] text-stone-300">Creator Console</p>
        <h1 className="mt-3 font-serif text-4xl">{creator.displayName}</h1>
        <p className="mt-4 max-w-2xl text-sm text-stone-200">
          {creator.bio || "No bio yet. Add one to help buyers understand your expertise."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs text-stone-300">
          <span className="rounded-full border border-stone-600 px-3 py-1">
            Installs: {creator.totalInstalls}
          </span>
          <span className="rounded-full border border-stone-600 px-3 py-1">
            Revenue: ${(creator.totalRevenue / 100).toFixed(2)}
          </span>
          <span className="rounded-full border border-stone-600 px-3 py-1">
            Public slug: {slugify(creator.displayName)}
          </span>
        </div>
      </section>

      <section className="rounded-3xl border border-stone-300 bg-stone-50 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl text-stone-900">Your listings</h2>
          <Link
            href="/creator/listings/new"
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:bg-stone-800"
          >
            New listing
          </Link>
        </div>

        {creatorListings.length ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200">
            <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
              <thead className="bg-stone-100 text-stone-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Listing</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white text-stone-800">
                {creatorListings.map((listing) => (
                  <tr key={listing.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{listing.title}</p>
                      <p className="text-xs text-stone-500">{listing.tagline || "No tagline"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs uppercase tracking-wide text-stone-600">
                      {listing.type.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">${(listing.price / 100).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/creator/listings/${listing.id}/edit`}
                        className="text-sm font-semibold text-stone-900 underline-offset-4 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-600">
            No listings yet. Start the wizard to publish your first package.
          </p>
        )}
      </section>
    </main>
  );
}
