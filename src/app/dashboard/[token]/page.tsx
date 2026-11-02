import type { Metadata } from "next";
import { OverviewView } from "./OverviewView";

export const metadata: Metadata = { title: "Home" };
export default function Page() { return <OverviewView />; }
