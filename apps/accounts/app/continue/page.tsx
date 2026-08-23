import type { Metadata } from "next"
import { ContinueChooser } from "@/components/auth/continue-chooser"

export const metadata: Metadata = {
  title: "متابعة — Rukny",
}

export default function ContinuePage() {
  return <ContinueChooser />
}
