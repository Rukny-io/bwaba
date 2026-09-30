import { cn } from "@/lib/utils"
import { agLayout } from "@/lib/accounts-antigravity-theme"

export const authScopeClass = "accounts-auth-scope"

export const authBadgeClass =
  "text-[12px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]"

export const authTitleClass =
  "text-[1.75rem] font-medium leading-tight tracking-[0em] text-[#1D1D1D]"

export const authLeadClass = agLayout.lead

export const authFieldShellClass =
  "auth-field flex h-11 items-center gap-2.5 overflow-hidden rounded-full border border-[#E8E8E8] bg-white px-3 transition-colors focus-within:border-[#1D1D1D]/25 focus-within:ring-2 focus-within:ring-[#1D1D1D]/8"

export const authInputClass =
  "h-full min-w-0 flex-1 border-0 bg-transparent text-left text-sm text-[#1D1D1D] outline-none ring-0 placeholder:text-[#9CA3AF] focus:outline-none focus:ring-0"

export const authLabelClass = "block text-sm font-medium text-[#1D1D1D]"

export const authBtnPrimaryClass = cn(agLayout.btnPrimary, "w-full gap-2")

export const authBtnSecondaryClass = cn(agLayout.btnSecondary, "w-full gap-2")

export const authLinkClass =
  "text-sm text-[#6B6F76] transition-colors hover:text-[#1D1D1D]"

export const authCardClass =
  "rounded-2xl border border-[#E8E8E8] bg-white px-4 py-3.5 text-start transition-colors hover:bg-[#FAFAFA]"

export const authAlertErrorClass =
  "rounded-xl bg-[#FEE2E2]/70 px-3 py-2 text-xs text-[#B91C1C]"

export const authAlertInfoClass =
  "rounded-xl bg-[#F5F5F5] px-3 py-2 text-xs text-[#6B6F76]"

export const authAlertSuccessClass =
  "rounded-xl bg-[#ECFDF3] px-3 py-2 text-sm text-[#166534]"

export const authTextareaClass =
  "w-full resize-none rounded-2xl border border-[#E8E8E8] bg-white px-3 py-2.5 text-sm text-[#1D1D1D] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#1D1D1D]/25 focus:ring-2 focus:ring-[#1D1D1D]/8"

export const authChipClass =
  "cursor-pointer rounded-full border border-[#E8E8E8] bg-white text-[#6B6F76] transition-colors hover:bg-[#FAFAFA]"

export const authChipSelectedClass =
  "border-[#1D1D1D]/25 bg-[#F5F5F5] font-medium text-[#1D1D1D]"

export const authPanelClass =
  "rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA]"

export const authBtnRowClass = "flex gap-3"
