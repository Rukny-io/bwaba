import { FormWorkspaceNav } from '@/components/forms/workspace/form-workspace-nav';
import { FormWorkspaceMobileDock } from '@/components/forms/workspace/form-workspace-mobile-dock';
import { FormSharedContextBanner } from '@/components/forms/workspace/form-shared-context-banner';
import { fetchFormServer } from '@/lib/forms-api-server';

export default async function FormWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await fetchFormServer(id);

  return (
    <div className="dashboard-page flex w-full flex-col gap-5 sm:gap-6 dashboard-brand">
      <FormWorkspaceNav
        formId={id}
        formSlug={form?.slug}
        formTitle={form?.title}
        formStatus={form?.status}
        submissionCount={
          form?._count?.submissions ?? form?.submissionCount ?? 0
        }
        isShared={form?.isShared}
        sharedRole={form?.sharedWorkspace?.role}
      />
      {form?.isShared && form.sharedWorkspace ? (
        <FormSharedContextBanner workspace={form.sharedWorkspace} />
      ) : null}
      {children}
      <FormWorkspaceMobileDock
        formId={id}
        isShared={form?.isShared}
        sharedRole={form?.sharedWorkspace?.role}
      />
    </div>
  );
}
