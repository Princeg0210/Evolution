
import "~/styles/globals.css";
import "../server/normalize-local-storage";
import Script from "next/script";

import { type Metadata } from "next";
import { Inter } from "next/font/google";
import LayoutEffects from "../components/layout-effects";

export const metadata: Metadata = {
  title: "Evo2 | Variant Analysis",
  description: "Advanced human genome variant platform",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {/* IGV Genome Browser Script */}
        <Script
          src="https://cdn.jsdelivr.net/npm/igv@2.15.6/dist/igv.min.js"
          strategy="beforeInteractive"
        />

        <LayoutEffects />

        {children}
      </body>
    </html>
  );
}
