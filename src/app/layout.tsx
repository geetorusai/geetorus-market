import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// Primary heading font
const displayFont = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Secondary / body font
const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Geetorus 2D monospace — JetBrains Mono
const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Geetorus Market — AI Engineering Blueprints",
  description:
    "Marketplace for Geetorus team blueprints, agent configurations, skills, and governance templates. Built by engineers, for engineers.",
  keywords: ["ai agents", "team blueprints", "developer tools", "automation", "geetorus"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased`}
        style={{
          background: "var(--bg-base)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
        }}
      >
        {/* Geetorus 2D warm grid background */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(214, 197, 158, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(214, 197, 158, 0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            pointerEvents: "none",
            zIndex: 0,
          }}
          aria-hidden="true"
        />
        <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <Header />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
