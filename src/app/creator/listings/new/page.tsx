import Link from "next/link";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { getSessionUserId } from "@/lib/api-auth";
import { eq } from "drizzle-orm";
import { ListingWizardForm } from "@/components/creator/listing-wizard-form";

export default async function NewCreatorListingPage() {
  const userId = await getSessionUserId();

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl border border-stone-300 bg-stone-50 p-8 text-center">
          <h1 className="font-serif text-3xl text-stone-900">Listing wizard</h1>
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
          <p className="mt-3 text-stone-600">Create your profile first, then publish listings.</p>
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <ListingWizardForm mode="create" />
    </main>
  );
}
