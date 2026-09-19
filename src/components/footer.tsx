import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-300 bg-stone-50/70">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-sm text-stone-600">
          GeeTorus, the marketplace for Geetorus team blueprints
        </p>
        <div className="flex gap-6">
          <Link href="/about" className="text-sm text-stone-600 transition hover:text-stone-900">
            About
          </Link>
          <Link
            href="/creators"
            className="text-sm text-stone-600 transition hover:text-stone-900"
          >
            Creators
          </Link>
        </div>
      </div>
    </footer>
  );
}
