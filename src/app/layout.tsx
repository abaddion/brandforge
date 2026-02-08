import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BrandForge - AI Brand DNA & Campaign Generator",
  description: "Analyze websites and generate brand DNA profiles with AI-powered social media campaigns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b border-dark-border">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              BrandForge
            </h1>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}