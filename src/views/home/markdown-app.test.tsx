import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

async function renderApp() {
  vi.resetModules();
  const { MarkdownApp } = await import("./index");
  return render(<MarkdownApp />);
}

function nameField() {
  return screen.getByRole("textbox", { name: "Document Name" });
}

beforeEach(() => {
  localStorage.clear();
});

describe("MarkdownApp header", () => {
  it("opens welcome.md on a first visit", async () => {
    await renderApp();

    expect(nameField()).toHaveValue("welcome.md");
  });

  it("saves a rename under a cleaned file name and announces it", async () => {
    const user = userEvent.setup();
    await renderApp();
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();

    await user.clear(nameField());
    await user.type(nameField(), "  project notes ");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(nameField()).toHaveValue("project notes.md");
    expect(status).toHaveTextContent("Document saved");
  });

  it("announces every save, not just the first", async () => {
    const user = userEvent.setup();
    await renderApp();
    const save = screen.getByRole("button", { name: "Save Changes" });

    await user.click(save);
    const first = screen.getByText("Document saved");
    await user.click(save);

    expect(screen.getByText("Document saved")).not.toBe(first);
  });

  it("keeps an unsaved rename across a reload", async () => {
    const user = userEvent.setup();
    const { unmount } = await renderApp();

    await user.type(nameField(), "-draft");
    unmount();
    await renderApp();

    expect(nameField()).toHaveValue("welcome.md-draft");
  });

  it("deletes the open document and opens the next one", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole("button", { name: "Delete document" }));

    expect(nameField()).toHaveValue("untitled-document.md");
  });

  it("toggles the menu", async () => {
    const user = userEvent.setup();
    await renderApp();
    const menu = screen.getByRole("button", { name: "Menu" });

    expect(menu).toHaveAttribute("aria-expanded", "false");
    await user.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    await user.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "false");
  });
});

describe("MarkdownApp panes", () => {
  function editor() {
    return screen.getByRole("textbox", { name: "Markdown" });
  }

  function preview() {
    return screen.getByRole("article", { name: "Preview" });
  }

  it("shows the open document's markdown beside its preview", async () => {
    await renderApp();

    expect(editor()).toHaveDisplayValue(/^# Welcome to Markdown\n/);
    expect(
      within(preview()).getByRole("heading", {
        level: 1,
        name: "Welcome to Markdown",
      }),
    ).toBeVisible();
  });

  it("renders the preview from what is typed", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(screen.getByRole("button", { name: "Delete document" }));
    expect(editor()).toHaveValue("");

    await user.type(editor(), "## Fresh start");

    expect(
      await within(preview()).findByRole("heading", {
        level: 2,
        name: "Fresh start",
      }),
    ).toBeVisible();
  });

  it("keeps unsaved edits across a reload", async () => {
    const user = userEvent.setup();
    const { unmount } = await renderApp();

    await user.clear(editor());
    await user.type(editor(), "draft");
    unmount();
    await renderApp();

    expect(editor()).toHaveValue("draft");
  });

  it("lets the preview take keyboard focus so it can scroll", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(editor());
    await user.tab();

    expect(preview()).toHaveFocus();
  });

  it("toggles preview-only mode", async () => {
    const user = userEvent.setup();
    await renderApp();
    const toggle = screen.getByRole("button", { name: "Preview only" });

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
