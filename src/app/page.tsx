import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-stone-300 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-900 p-8 text-stone-100 sm:p-12">
        <div className="absolute left-10 top-6 h-24 w-24 rounded-full bg-amber-300/30 blur-2xl" />
        <p className="text-xs uppercase tracking-[0.28em] text-stone-300">GeeTorus</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
          Marketplace for complete AI company blueprints
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-stone-200 sm:text-base">
          Discover team configurations, install them into Geetorus, or publish your own listing as a creator.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/creator"
            className="rounded-xl bg-stone-100 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-white"
          >
            Open creator dashboard
          </Link>
          <Link
            href="/creators"
            className="rounded-xl border border-stone-500 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:border-stone-300"
          >
            Browse creators
          </Link>
        </div>
      </section>
    </main>
  );
}
