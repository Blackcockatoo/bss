import { readFile } from "node:fs/promises";
import { join } from "node:path";

import Link from "next/link";
import { notFound } from "next/navigation";

import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";
import { schoolPackageDocs } from "@/app/schools/content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function resolveDocFilePath(href: string): string {
  return join(process.cwd(), "public", href);
}

function renderMarkdownLine(line: string): string {
  return line
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="rounded bg-slate-800 px-1 py-0.5 text-amber-200">$1</code>');
}

export async function generateStaticParams() {
  return schoolPackageDocs.map((doc) => ({ slug: doc.slug }));
}

export default async function SchoolDocPage({ params }: PageProps) {
  const { slug } = await params;
  enforceChildSafeServerRoute(`/schools/docs/${slug}`);

  const doc = schoolPackageDocs.find((d) => d.slug === slug);
  if (!doc) {
    notFound();
  }

  let content: string;
  try {
    const filePath = resolveDocFilePath(doc.href);
    content = await readFile(filePath, "utf-8");
  } catch {
    notFound();
  }

  const lines = content.split("\n");
  const rendered: { type: "h1" | "h2" | "h3" | "p" | "li" | "ol-li" | "blank"; text: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed.startsWith("### ")) {
      rendered.push({ type: "h3", text: trimmed.slice(4) });
    } else if (trimmed.startsWith("## ")) {
      rendered.push({ type: "h2", text: trimmed.slice(3) });
    } else if (trimmed.startsWith("# ")) {
      rendered.push({ type: "h1", text: trimmed.slice(2) });
    } else if (/^\d+\.\s/.test(trimmed)) {
      rendered.push({ type: "ol-li", text: trimmed.replace(/^\d+\.\s/, "") });
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      rendered.push({ type: "li", text: trimmed.slice(2) });
    } else if (trimmed === "") {
      rendered.push({ type: "blank", text: "" });
    } else {
      rendered.push({ type: "p", text: trimmed });
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12 md:py-16">
        <header className="space-y-3">
          <Link
            href="/schools#downloads"
            className="text-sm text-amber-300 hover:text-amber-200"
          >
            &larr; Back to document pack
          </Link>
          <p className="text-xs uppercase tracking-[0.35em] text-amber-300">
            {doc.category}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {doc.title}
          </h1>
          <p className="text-sm text-slate-400">
            Audience: {doc.audience}
          </p>
          <a
            className="inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
            download
            href={doc.href}
          >
            Download original
          </a>
        </header>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <div className="prose-schools space-y-3">
            {rendered.map((block, i) => {
              const html = renderMarkdownLine(block.text);
              switch (block.type) {
                case "h1":
                  return (
                    <h2
                      key={i}
                      className="text-2xl font-semibold text-white pt-4 first:pt-0"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                case "h2":
                  return (
                    <h3
                      key={i}
                      className="text-xl font-semibold text-white pt-3"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                case "h3":
                  return (
                    <h4
                      key={i}
                      className="text-lg font-semibold text-slate-100 pt-2"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                case "li":
                  return (
                    <p
                      key={i}
                      className="text-sm leading-7 text-slate-300 pl-4 before:content-['•'] before:mr-2 before:text-slate-500"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                case "ol-li":
                  return (
                    <p
                      key={i}
                      className="text-sm leading-7 text-slate-300 pl-4"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                case "blank":
                  return <div key={i} className="h-2" />;
                default:
                  return (
                    <p
                      key={i}
                      className="text-sm leading-7 text-slate-300"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
              }
            })}
          </div>
        </article>
      </div>
    </main>
  );
}
