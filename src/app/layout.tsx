import type { Metadata, Viewport } from "next";
import { Yeseva_One, Manrope, Lora, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/shared/lib/utils";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import { LanguageProvider } from "@/shared/providers/language-provider";

// Font yang dipakai desain landing final: Yeseva (display/heading),
// Manrope (body/UI), Lora (accent serif italic), IBM Plex Mono (mono).
const yeseva = Yeseva_One({
  variable: "--font-yeseva",
  subsets: ["latin"],
  weight: "400",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Priemman: A home for work you're proud of",
  description:
    "Priemman is a community for designers and developers to publish real projects, get feedback, and get discovered.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        yeseva.variable,
        manrope.variable,
        lora.variable,
        plexMono.variable,
        "h-full antialiased",
      )}
    >
      <body suppressHydrationWarning className="relative flex min-h-full flex-col bg-canvas text-copy">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
