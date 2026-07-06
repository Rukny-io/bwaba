import { EmbeddedRuknyForm } from '@/components/embedded-rukny-form';

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-[#f4f5f7]">
      <header className="bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-5 sm:px-8">
          <p className="text-[15px] font-semibold tracking-tight text-[#0f172a]">rukny.work</p>
          <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-[11px] font-medium text-[#64748b]">
            تواصل معنا
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-6 space-y-2 text-center sm:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0f172a] sm:text-[1.75rem]">
            نسعد بتواصلك
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[#64748b]">
            املأ النموذج أدناه وسنعود إليك في أقرب وقت.
          </p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-[#e8ecf1] bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-1.5">
          <EmbeddedRuknyForm />
        </section>
      </main>
    </div>
  );
}
