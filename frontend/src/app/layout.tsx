import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEOFlow AI | Next-Gen Content Engine",
  description: "Premium AI-powered SEO content generation workflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-[#0a0a0b] dark:text-gray-100 transition-colors duration-300">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          {/* Glassmorphism Sticky Nav */}
          <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-cyan-500 tracking-tight">
                  SEOFlow AI
                </span>
              </Link>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Link href="/brief/new">
                  <Button className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 text-white font-medium rounded-full px-6 transition-all hover:scale-105 shadow-md shadow-purple-500/20">
                    + New Brief
                  </Button>
                </Link>
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
