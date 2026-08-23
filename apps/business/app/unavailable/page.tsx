import {
  resolveAccountsUrl,
  resolveFormsUrl,
  resolveMailUrl,
} from '@rukny/auth/client/env-urls';

export const metadata = {
  title: 'غير متاح — ركني',
};

export default function UnavailablePage() {
  const formsUrl = `${resolveFormsUrl().replace(/\/$/, '')}/app`;
  const mailUrl = `${resolveMailUrl().replace(/\/$/, '')}/apps`;
  const accountsUrl = resolveAccountsUrl().replace(/\/$/, '');

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-center text-foreground">
      <img
        src="/rukny-logo.svg"
        alt="ركني"
        width={40}
        height={40}
        className="mb-6 size-10"
      />
      <h1 className="text-2xl font-semibold tracking-tight">هذا التطبيق غير متاح حالياً</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        يمكنك متابعة العمل من النماذج أو البريد أو حسابك.
      </p>
      <nav className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={formsUrl}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          النماذج
        </a>
        <a
          href={mailUrl}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium"
        >
          البريد
        </a>
        <a
          href={`${accountsUrl}/manage`}
          className="rounded-full border border-border px-5 py-2.5 text-sm font-medium"
        >
          الحساب
        </a>
      </nav>
    </main>
  );
}
