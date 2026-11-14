import { render, screen } from "@testing-library/react";
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
