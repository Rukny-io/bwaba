import { PublicFormEmptyState } from '@/components/public-form/public-form-empty-state';

export default function PublicFormNotFound() {
  return (
    <PublicFormEmptyState
      title="النموذج غير موجود"
      description="الرابط غير صحيح أو أن النموذج أُزيل. تحقق من الرابط أو تواصل مع من أرسله إليك."
    />
  );
}
