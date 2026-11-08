import { notFound } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { demoHandle } from "@/lib/demo";
import { env } from "@/lib/env";
import { DEFAULT_ACCENT } from "@/lib/accent";
import { getExtras, goalProgress } from "@/lib/extras";
import { getCreatorByHandle } from "@/lib/tips";
import { DemoStage } from "./DemoStage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Demo stage", robots: { index: false, follow: false } };

/** A mock livestream for the demo video. Only exists when DEMO_STAGE_HANDLE is set; it is not a product feature. */
export default async function Page() {
  const handle = demoHandle();
  if (!handle) notFound();
  const c = await getCreatorByHandle(handle);
  if (!c) notFound();
  const extras = await getExtras(c.id);
  const progress = await goalProgress(c);
  const qrSvg = await QRCode.toString(`${env.baseUrl}/@${c.handle}`, { type: "svg", margin: 0, color: { dark: "#1C1424", light: "#FFFFFF" } });
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=new URLSearchParams(location.search).get('theme')==='light'?'light':'dark'}catch(e){}" }} />
      <DemoStage
        handle={c.handle} name={c.display_name} accent={c.accent || DEFAULT_ACCENT} mode={env.auroraMode}
        goal={{ title: extras.goal_title, target: progress?.targetUsd ?? 0, raised: progress?.raisedUsd ?? 0 }} qrSvg={qrSvg}
      />
    </>
  );
}
