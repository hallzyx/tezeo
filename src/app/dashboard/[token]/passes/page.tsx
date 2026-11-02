import type { Metadata } from "next";
import { PassesView } from "../PassesView";

export const metadata: Metadata = { title: "Passes" };
export default function Page() { return <PassesView />; }
