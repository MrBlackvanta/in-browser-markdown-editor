import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";
import HomeError from "./error";

describe("HomeError", () => {
  it("names the failure as the only heading of the main landmark", () => {
    render(<HomeError error={new Error("boom")} reset={vi.fn()} />);

    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { level: 1, name: "Something went wrong" }),
    );
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("retries in place rather than linking back to the page it is on", async () => {
    const reset = vi.fn();
    render(<HomeError error={new Error("boom")} reset={reset} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledOnce();
  });
});
