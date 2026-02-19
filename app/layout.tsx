import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markd — Smart Bookmark Manager",
  description: "A private, real-time bookmark manager powered by Supabase.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔖</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary antialiased">
        {children}
      </body>
    </html>
  );
}