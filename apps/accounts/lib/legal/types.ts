import type { LucideIcon } from "lucide-react"

export interface LegalSubsection {
  title: string
  text: string
}

export interface LegalSection {
  id: string
  title: string
  icon: LucideIcon
  paragraphs?: string[]
  subsections?: LegalSubsection[]
  bullets?: string[]
  tocIgnore?: boolean
}

export interface LegalDocumentContent {
  title: string
  description: string
  lastUpdated: string
  sections: LegalSection[]
}
