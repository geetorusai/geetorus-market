import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-300/80 bg-stone-50/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-serif text-2xl text-stone-900">
            GeeTorus
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            <Link
              href="/browse"
              className="text-sm font-semibold text-stone-600 transition hover:text-stone-900"
            >
              Browse
            </Link>
            <Link
              href="/creator"
              className="text-sm font-semibold text-stone-600 transition hover:text-stone-900"
            >
              Creator
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-semibold text-stone-600 transition hover:text-stone-900"
            >
              Pricing
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/api/auth/sign-in"
            className="text-sm font-semibold text-stone-700 transition hover:text-stone-900"
          >
            Sign in
          </Link>
          <Link
            href="/creator"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:bg-stone-800"
          >
            Start selling
          </Link>
        </div>
      </div>
    </header>
  );
}
