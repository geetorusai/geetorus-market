import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const headingFont = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GeeTorus",
  description: "Marketplace for Geetorus team blueprints and creator listings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} bg-[radial-gradient(circle_at_top_right,_rgba(255,204,128,0.25),_transparent_45%),radial-gradient(circle_at_top_left,_rgba(202,213,255,0.22),_transparent_40%),#f4efe6] text-stone-900 antialiased`}
      >
        <div className="min-h-screen">
          <Header />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
