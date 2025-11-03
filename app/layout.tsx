import "./globals.css";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "EstimateAI – AI-Powered Construction Estimating",
  description: "Generate accurate construction estimates in minutes with AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-navy text-cream antialiased min-h-screen flex flex-col">
        {/* Polished gradient header */}
        <header className="border-b border-slate-800 bg-gradient-to-b from-navy/95 to-navy/70 backdrop-blur px-6 py-3 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="text-gold">EstimateAI</span>
            <span className="text-xs bg-navy border border-slate-700 px-2 py-0.5 rounded-full text-slate-300">
              Demo
            </span>
          </div>
          <p className="text-xs text-slate-400">AI-Powered Construction Estimating</p>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-800 text-xs text-slate-400 text-center py-3">
          © {new Date().getFullYear()} EstimateAI • Built with AI • All Rights Reserved
        </footer>
      </body>
    </html>
  );
}


