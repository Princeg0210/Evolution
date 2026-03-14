import "~/styles/globals.css";
import "../server/normalize-local-storage";

import { type Metadata } from "next";
import { Inter } from "next/font/google";
import LayoutEffects from "../components/layout-effects";

export const metadata: Metadata = {
  title: "Evo2 | Variant Analysis",
  description: "Advanced human genome variant analysis platform",
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
        <LayoutEffects />
        {children}
      </body>
    </html>
  );
}
