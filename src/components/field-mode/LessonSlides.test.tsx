import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LESSON_DEFINITIONS } from "@/lib/teacher-lessons/lessonDefinitions";

import { LessonSlides } from "./LessonSlides";

const lesson = LESSON_DEFINITIONS[0];

afterEach(cleanup);

describe("Lesson projector slides", () => {
  it("opens on the lesson title with teacher notes hidden", () => {
    const { container } = render(<LessonSlides lesson={lesson} />);

    expect(
      screen.getByRole("heading", {
        name: `Lesson ${lesson.number}: ${lesson.title}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(`Slide 1 of 10`)).toBeInTheDocument();
    expect(screen.queryByText(/Teacher note:/i)).not.toBeInTheDocument();
    expect(container.textContent).toMatch(/No student data is shown/i);
    expect(container.textContent).not.toMatch(/student name|email|phone/i);
    expect(screen.getByRole("link", { name: /Exit to lesson/i })).toHaveAttribute(
      "href",
      `/schools/field/lessons/${lesson.slug}`,
    );
  });

  it("follows the teacher script and moves with the keyboard", () => {
    render(<LessonSlides lesson={lesson} />);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(lesson.learningIntention)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(lesson.teacherScript)).toBeInTheDocument();
    expect(screen.queryByText(/Teacher note:/i)).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "n" });
    expect(screen.getByText(/Teacher note:/i)).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "End" });
    expect(screen.getByText(/Slide 10 of 10/)).toBeInTheDocument();
    expect(screen.getByText(lesson.reflectionPrompt)).toBeInTheDocument();
  });
});
