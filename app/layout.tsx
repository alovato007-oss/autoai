import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "AutoAI — Revenue Engine",
  description: "AI-powered prospecting, research, scoring, and revenue intelligence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}

      </body>
    </html>
  );
}