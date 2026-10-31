import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "../styles/tokens.css";
import "../styles/components.css";
import "../styles/screens.css";
import "../styles/icons.css";
import { Sprite } from "@/components/ui";

const display = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--font-bricolage" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: { default: "Tezeo — tips from any chain, paid in USDC on Solana", template: "%s · Tezeo" },
  description: "Fans pay from any wallet on any chain. Creators receive USDC on Solana. No login for fans.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#D1245A" };

// Runs before paint so the saved theme never flashes.
const THEME_BOOT = `try{var t=localStorage.getItem("tz-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} /></head>
      <body className="tz-app">
        <Sprite />
        {children}
      </body>
    </html>
  );
}
