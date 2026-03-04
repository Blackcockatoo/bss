import LegalNotice from "@/components/LegalNotice";

export default function LegalPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-100">Legal</h1>
      <p className="text-sm text-slate-300">
        This page outlines licensing and intellectual property notices for the
        Meta-Pet experience.
      </p>
      <section className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
        <LegalNotice className="text-slate-300" />
      </section>
      <section className="rounded-lg border border-slate-800/60 bg-slate-950/20 p-4 text-xs text-slate-600 space-y-2">
        <p className="font-medium text-slate-500">Our principles</p>
        <p>
          Blue Snake Studios builds software we&apos;d trust with our own children. That means no hidden data collection, no manipulative engagement loops, and no selling user information — ever. The code is MIT-licensed because transparency earns trust.
        </p>
        <p>
          We believe digital companions should teach kids about science, privacy, and ownership in ways that respect their intelligence. Every system in this app — from the genome to the cryptography — is real, not theatre.
        </p>
      </section>
    </main>
  );
}
