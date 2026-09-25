export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-white px-4 pt-8">
      <div className="mx-auto flex w-full max-w-md animate-pulse flex-col items-center">
        <div className="size-24 rounded-full bg-[#f1f1f2]" />
        <div className="mt-4 h-5 w-36 rounded-md bg-[#f1f1f2]" />
        <div className="mt-2 h-3.5 w-20 rounded-md bg-[#f1f1f2]" />
        <div className="mt-4 h-4 w-56 max-w-full rounded-md bg-[#f1f1f2]" />
        <div className="mt-6 h-px w-full bg-[#f1f1f2]" />
        <div className="mt-4 w-full space-y-2">
          <div className="h-12 rounded-xl bg-[#f8f8f8]" />
          <div className="h-12 rounded-xl bg-[#f8f8f8]" />
          <div className="h-12 rounded-xl bg-[#f8f8f8]" />
        </div>
      </div>
    </div>
  );
}
