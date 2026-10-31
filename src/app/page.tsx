import type { Metadata } from "next";
import "../styles/landing.css";
import { LANDING_HTML } from "./_landing/markup";
import { LandingEffects } from "./_landing/LandingEffects";

export const metadata: Metadata = {
  title: { absolute: "Tezeo — any coin in, dollars out" },
  description: "Fans tip from any wallet on any chain. Creators receive USDC on Solana, straight to their own wallet. No account needed for fans.",
};

// The page is the designer's prototype (design/landing.html), synced by `npm run landing:sync`.
// The markup is our own static content, so injecting it as HTML is safe.
const BOOT = `document.documentElement.classList.add("tzl-js")`;

export default function Landing() {
  return (
    <div className="tzl-page">
      <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      <div dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />
      <LandingEffects />
    </div>
  );
}
