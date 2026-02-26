import LegalNotice from "@/components/LegalNotice";

export default function LegalPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-100">Legal</h1>
      <p className="text-sm text-slate-300">
        This page outlines licensing and intellectual property notices for the
        Jewble experience.
      </p>
      <section className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
        <LegalNotice className="text-slate-300" />
      </section>
    </main>
  );
}
