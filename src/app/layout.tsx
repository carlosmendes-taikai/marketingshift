import type { Metadata, Viewport } from "next";
import { Fragment_Mono, Instrument_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Instrument Sans: a readable modern grotesk with a condensed width axis for the wordmark.
const sans = Instrument_Sans({ variable: "--font-app-sans", subsets: ["latin"], axes: ["wdth"] });
const mono = Fragment_Mono({ variable: "--font-app-mono", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "unfold: type it, get the right card",
  description:
    "One text box for a marketer's day. Type a note and it becomes the right card: UTM links, content ideas, leads, meetings and more. Powered by TypeSafe AI's Jev.",
  // Absolute URLs for the Open Graph image: explicit site URL, else Vercel's production domain.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  ),
  openGraph: {
    title: "unfold",
    description: "Type it, get the right card.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "unfold", description: "Type it, get the right card." },
};

// viewport-fit=cover lets fixed chrome (HUD, toasts) pad itself away from the home indicator.
export const viewport: Viewport = { themeColor: "#f5efe3", colorScheme: "light", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
