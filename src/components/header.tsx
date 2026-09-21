"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/browse", label: "Browse" },
  { href: "/creators", label: "Creators" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: "64px",
        borderBottom: "1px solid",
        borderColor: scrolled ? "var(--border-subtle)" : "rgba(255,255,255,0.04)",
        background: scrolled ? "rgba(5,5,5,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "background 250ms ease, border-color 250ms ease",
      }}
    >
      <div
        className="gt-container"
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "var(--text-primary)",
              color: "var(--bg-base)",
              fontSize: "0.75rem",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              letterSpacing: "-0.04em",
              flexShrink: 0,
            }}
          >
            GT
          </span>
          <span
            style={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Geetorus
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Primary navigation"
          style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1, justifyContent: "center" }}
          className="hidden-mobile"
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: active ? 500 : 400,
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  textDecoration: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background: active ? "var(--bg-elevated)" : "transparent",
                  border: active ? "1px solid var(--border-subtle)" : "1px solid transparent",
                  transition: "color 150ms, background 150ms, border-color 150ms",
                  letterSpacing: "0.005em",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <Link
            href="/api/auth/sign-in"
            style={{
              fontSize: "0.8125rem",
              fontWeight: 500,
              color: "var(--text-secondary)",
              textDecoration: "none",
              padding: "6px 12px",
              transition: "color 150ms",
            }}
            className="hidden-mobile"
          >
            Sign in
          </Link>
          <Link
            href="/creator"
            className="gt-btn-primary"
            style={{ fontSize: "0.8rem", padding: "7px 14px" }}
          >
            Start selling
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="show-mobile"
            style={{
              background: "transparent",
              border: "1px solid var(--border-muted)",
              borderRadius: 6,
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "none",
              padding: "6px 8px",
              lineHeight: 1,
              fontSize: "1rem",
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: "64px",
            left: 0,
            right: 0,
            background: "rgba(5,5,5,0.97)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "var(--text-secondary)",
                textDecoration: "none",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid transparent",
                transition: "background 150ms, color 150ms",
              }}
            >
              {label}
            </Link>
          ))}
          <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "8px 0" }} />
          <Link
            href="/api/auth/sign-in"
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "var(--text-secondary)",
              textDecoration: "none",
              padding: "10px 12px",
              borderRadius: "6px",
            }}
          >
            Sign in
          </Link>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .show-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
