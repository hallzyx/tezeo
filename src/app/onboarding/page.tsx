import type { Metadata } from "next";
import { TopBar } from "@/components/ui";
import { Onboarding } from "./Onboarding";

export const metadata: Metadata = { title: "Create your page" };

export default function Page() {
  return (
    <div className="tzs-page">
      <TopBar />
      <main className="tzs-main"><Onboarding /></main>
    </div>
  );
}
