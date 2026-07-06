import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  FileText,
  FormInput,
  HelpCircle,
  MessageCircle,
  ShoppingBag,
  Star,
  UserPlus,
} from 'lucide-react';
import type { FormType } from '@/lib/forms-api';

export const FORM_TYPE_STYLES: Record<
  FormType,
  { icon: LucideIcon; color: string; bg: string }
> = {
  CONTACT: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-500' },
  SURVEY: { icon: ClipboardList, color: 'text-violet-500', bg: 'bg-violet-500' },
  REGISTRATION: { icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-500' },
  ORDER: { icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-500' },
  FEEDBACK: { icon: Star, color: 'text-amber-500', bg: 'bg-amber-500' },
  QUIZ: { icon: HelpCircle, color: 'text-pink-500', bg: 'bg-pink-500' },
  APPLICATION: { icon: FormInput, color: 'text-indigo-500', bg: 'bg-indigo-500' },
  OTHER: { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-500' },
};
