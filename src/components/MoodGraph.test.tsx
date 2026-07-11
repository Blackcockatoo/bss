import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MoodCheckIn, UserMood } from "@/lib/bond";
import { getDateKey } from "@/lib/wellness";
import { buildMoodSeries, MoodGraph } from "./MoodGraph";

const DAY_MS = 86400000;
// Fixed "now": 2026-07-10T12:00:00Z
const NOW = Date.UTC(2026, 6, 10, 12, 0, 0);

let idCounter = 0;
function checkIn(mood: UserMood, timestamp: number): MoodCheckIn {
  idCounter += 1;
  return { id: `mood-${idCounter}`, mood, timestamp };
}

describe("buildMoodSeries", () => {
  it("returns one point per day, oldest first, ending today", () => {
    const series = buildMoodSeries([], 7, NOW);

    expect(series).toHaveLength(7);
    expect(series[6].dateKey).toBe(getDateKey(NOW));
    expect(series[0].dateKey).toBe(getDateKey(NOW - 6 * DAY_MS));
    expect(series.every((point) => point.avg === null)).toBe(true);
  });

  it("averages multiple check-ins on the same day", () => {
    const history = [
      checkIn("struggling", NOW - 2 * 60 * 60 * 1000), // 1
      checkIn("great", NOW - 60 * 60 * 1000), // 5
      checkIn("neutral", NOW), // 3
    ];

    const series = buildMoodSeries(history, 7, NOW);
    const today = series[6];

    expect(today.avg).toBe(3);
    expect(today.count).toBe(3);
  });

  it("buckets check-ins onto their own days and leaves gaps null", () => {
    const history = [
      checkIn("good", NOW - 3 * DAY_MS), // 4, three days ago
      checkIn("low", NOW - 6 * DAY_MS), // 2, six days ago
    ];

    const series = buildMoodSeries(history, 7, NOW);

    expect(series[0].avg).toBe(2);
    expect(series[3].avg).toBe(4);
    expect(series[1].avg).toBeNull();
    expect(series[6].avg).toBeNull();
  });

  it("ignores check-ins outside the requested window", () => {
    const history = [checkIn("great", NOW - 10 * DAY_MS)];

    const sevenDay = buildMoodSeries(history, 7, NOW);
    expect(sevenDay.every((point) => point.avg === null)).toBe(true);

    const thirtyDay = buildMoodSeries(history, 30, NOW);
    expect(thirtyDay).toHaveLength(30);
    expect(thirtyDay[30 - 1 - 10].avg).toBe(5);
  });
});

describe("MoodGraph", () => {
  it("shows an empty state when there are no recent check-ins", () => {
    render(<MoodGraph moodHistory={[]} />);

    expect(screen.getByText(/No check-ins in the last 7 days/i)).toBeInTheDocument();
  });

  it("renders bars for days with check-ins", () => {
    const history = [checkIn("great", Date.now())];
    render(<MoodGraph moodHistory={history} />);

    expect(screen.queryByText(/No check-ins/i)).not.toBeInTheDocument();
    expect(screen.getByTitle(/1 check-in\)/)).toBeInTheDocument();
  });

  it("toggles between 7 and 30 day ranges", () => {
    render(<MoodGraph moodHistory={[]} />);

    const thirtyDay = screen.getByRole("button", { name: "30d" });
    fireEvent.click(thirtyDay);

    expect(thirtyDay).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/No check-ins in the last 30 days/i)).toBeInTheDocument();
  });
});
