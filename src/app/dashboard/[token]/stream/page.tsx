import type { Metadata } from "next";
import { StreamView } from "../StreamView";

export const metadata: Metadata = { title: "Stream" };
export default function Page() { return <StreamView />; }
