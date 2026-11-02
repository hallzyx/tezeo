import type { Metadata } from "next";
import { TipsView } from "../TipsView";

export const metadata: Metadata = { title: "Tips" };
export default function Page() { return <TipsView />; }
