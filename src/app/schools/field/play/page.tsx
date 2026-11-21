import Link from "next/link";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";
import { FIELD_PLAY_HOME } from "@/lib/productSurfaces";
import { enforceChildSafeServerRoute } from "@/lib/childSafeRoute.server";

export const metadata = { title: "Activities — MetaPet" };

export default function FieldActivitiesPage() {
  enforceChildSafeServerRoute(FIELD_PLAY_HOME, "field");
  return <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-950">
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-semibold">Discover with MetaPet</h1>
      <p className="mt-3 text-base text-slate-700">Open the activity your class is exploring today.</p>
      <Link href="/schools/field/play/invisible-trail"
        className="mt-6 block rounded-2xl border-2 border-emerald-800 bg-emerald-50 p-6 text-slate-950 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">New · Bonus learning lab</p>
        <h2 className="mt-2 text-2xl font-bold">The Invisible Trail</h2>
        <p className="mt-2 leading-7 text-slate-700">Reveal pretend digital footprints, decide which permissions an app needs, and design a more private MetaPet. Teacher-led · 15 minutes · no sign-in or real student data.</p>
        <span className="mt-3 inline-block font-semibold text-emerald-900 underline underline-offset-4">Play the privacy adventure</span>
      </Link>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {LESSON_DEFINITIONS.map((lesson) => <a key={lesson.id} href={FIELD_PLAY_HOME + "/" + lesson.slug}
          className="rounded-2xl border border-emerald-900/20 bg-white p-6 hover:border-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800">
          <p className="text-sm font-semibold text-emerald-800">Activity {lesson.number}</p>
          <h2 className="mt-2 text-xl font-semibold">{lesson.title}</h2>
          <p className="mt-3 text-base leading-7 text-slate-700">{lesson.shortDescription}</p>
        </a>)}
      </div>
    </div>
  </main>;
}
