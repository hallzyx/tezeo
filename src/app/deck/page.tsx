import type { Metadata } from "next";
import "../../styles/deck.css";
import Deck from "./Deck";

export const metadata: Metadata = {
  title: { absolute: "Tezeo pitch" },
  description: "Tezeo, the hackathon pitch: any coin in, dollars out.",
  robots: { index: false, follow: false },
};

// Dark by default (it reads best on a projector); `?theme=light` opts out. Runs before paint, and the
// previous theme is remembered so Deck can restore it when you leave the route.
const THEME = `(function(){var d=document.documentElement;d.dataset.dkPrevTheme=d.dataset.theme||"";d.dataset.theme=/[?&]theme=light(&|$)/.test(location.search)?"light":"dark"})()`;

export default async function DeckPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { print } = await searchParams;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME }} />
      <Deck print={print === "1"} />
    </>
  );
}
