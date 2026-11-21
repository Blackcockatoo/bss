"use client";

import { ProjectorSlides } from "@/components/field-mode/ProjectorSlides";
import {
  FIELD_MODE_HOME_PATH,
  FIELD_MODE_ROLLOUT_PATH,
} from "@/lib/childSafeBaseline";
import { FIELD_MODE_PRINT_STAFF_PD_PATH } from "@/lib/schools/classroomPack";
import { STAFF_PD_SLIDES } from "@/lib/schools/staffPd";

const linkClassName =
  "inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold";

export function StaffPdSlides() {
  return (
    <ProjectorSlides
      slides={STAFF_PD_SLIDES}
      notesLabel="Speaker note"
      footer="Arrow keys or space to move. N toggles speaker notes. This briefing does not show student data."
      links={
        <>
          <a href={FIELD_MODE_PRINT_STAFF_PD_PATH} className={linkClassName}>
            Print handout
          </a>
          <a href={FIELD_MODE_ROLLOUT_PATH} className={linkClassName}>
            Rollout plan
          </a>
          <a href={FIELD_MODE_HOME_PATH} className={linkClassName}>
            Home
          </a>
        </>
      }
    />
  );
}
