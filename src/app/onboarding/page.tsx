import type { Metadata } from "next";
import { Onboarding } from "./Onboarding";

export const metadata: Metadata = { title: "Create your page", robots: { index: false } };

export default function Page() {
  return <Onboarding />;
}
