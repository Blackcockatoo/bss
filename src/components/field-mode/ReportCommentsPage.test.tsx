import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { reportCommentBankFor } from "@/lib/schools/reportComments";
import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

import { ReportCommentsPage } from "./ReportCommentsPage";

afterEach(cleanup);

describe("report comment starters", () => {
  it("shows the caveat, published codes and copyable starters for a lesson", async () => {
    const lesson = LESSON_DEFINITIONS[0]!;
    const bank = reportCommentBankFor(lesson);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });

    render(<ReportCommentsPage banks={[bank]} lesson={lesson} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByText(/not official achievement standards/i),
    ).toBeInTheDocument();
    expect(screen.getByText(lesson.learningIntention)).toBeInTheDocument();
    expect(screen.getByText(bank.codes.join(", "))).toBeInTheDocument();
    const box = screen.getByLabelText("At") as HTMLTextAreaElement;
    expect(box.value).toContain("[alias] can explain that a digital system");

    fireEvent.click(
      screen.getByRole("button", { name: /Copy at comment/i }),
    );
    expect(writeText).toHaveBeenCalledWith(box.value);
    vi.unstubAllGlobals();
  });
});
