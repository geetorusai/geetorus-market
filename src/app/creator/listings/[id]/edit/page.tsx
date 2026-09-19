import Link from "next/link";
import { db } from "@/db";
import { creators, listings } from "@/db/schema";
import { getSessionUserId } from "@/lib/api-auth";
import { and, eq } from "drizzle-orm";
import {
  ListingWizardForm,
  type ListingWizardInitialValues,
} from "@/components/creator/listing-wizard-form";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item)).filter(Boolean);
}

export default async function EditCreatorListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getSessionUserId();

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl border border-stone-300 bg-stone-50 p-8 text-center">
          <h1 className="font-serif text-3xl text-stone-900">Edit listing</h1>
          <p className="mt-3 text-stone-600">Sign in and register as a creator first.</p>
          <Link
            href="/creator"
            className="mt-5 inline-flex rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-100"
          >
            Go to creator dashboard
          </Link>
        </div>
      </main>
    );
  }

  const creator = await db.query.creators.findFirst({
    where: eq(creators.userId, userId),
    columns: { id: true },
  });

  if (!creator) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl border border-stone-300 bg-stone-50 p-8 text-center">
          <h1 className="font-serif text-3xl text-stone-900">Creator profile required</h1>
          <p className="mt-3 text-stone-600">Create your profile first.</p>
          <Link
            href="/creator"
            className="mt-5 inline-flex rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-100"
          >
            Register creator profile
          </Link>
        </div>
      </main>
    );
  }

  const listing = await db.query.listings.findFirst({
    where: and(eq(listings.id, id), eq(listings.creatorId, creator.id)),
  });

  if (!listing) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl border border-stone-300 bg-stone-50 p-8 text-center">
          <h1 className="font-serif text-3xl text-stone-900">Listing not found</h1>
          <p className="mt-3 text-stone-600">
            This listing either does not exist or is not owned by your profile.
          </p>
          <Link
            href="/creator"
            className="mt-5 inline-flex rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-100"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const initialValues: ListingWizardInitialValues = {
    id: listing.id,
    type: listing.type as ListingWizardInitialValues["type"],
    title: listing.title,
    tagline: listing.tagline ?? "",
    description: listing.description ?? "",
    categories: toStringArray(listing.categories),
    tags: toStringArray(listing.tags),
    includedFiles: toStringArray(listing.includedFiles),
    readmeMarkdown: listing.readmeMarkdown ?? "",
    agentCount: listing.agentCount,
    price: Math.round(listing.price / 100),
    status: listing.status as ListingWizardInitialValues["status"],
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <ListingWizardForm mode="edit" listingId={listing.id} initialValues={initialValues} />
    </main>
  );
}
