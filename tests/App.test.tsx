import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/App";

describe("SillCast app", () => {
  it("renders a calculated dashboard rather than an empty shell", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", {
        name: "Know exactly where the sun lands indoors.",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Direct sun")).toBeTruthy();
    expect(screen.getByText("Where the sun reaches")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Daily sunlight timeline" })).toBeTruthy();
  });

  it("switches language and applies a second real preset", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "中文" }));
    expect(
      screen.getByRole("heading", { name: "准确知道阳光何时落进房间。" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "伦敦 · 东窗书桌" }));
    expect(screen.getByDisplayValue("Europe/London")).toBeTruthy();
  });
});
