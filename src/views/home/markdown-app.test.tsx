import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";

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

afterEach(() => {
  vi.useRealTimers();
  delete document.documentElement.dataset.theme;
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

describe("MarkdownApp sidebar", () => {
  function sidebar() {
    return screen.getByRole("navigation", { name: "My documents" });
  }

  function menu() {
    return screen.getByRole("button", { name: "Menu" });
  }

  function documentNames() {
    return within(sidebar())
      .getAllByRole("listitem")
      .map((item) => within(item).getByRole("button").textContent);
  }

  it("is the panel the menu opens, unreachable while closed", async () => {
    const user = userEvent.setup();
    await renderApp();

    expect(sidebar().id).not.toBe("");
    expect(menu()).toHaveAttribute("aria-controls", sidebar().id);
    expect(sidebar()).toHaveAttribute("inert");
    await user.click(menu());
    expect(sidebar()).not.toHaveAttribute("inert");
    await user.click(menu());
    expect(sidebar()).toHaveAttribute("inert");
  });

  it("lists every saved document under its creation date", async () => {
    await renderApp();

    expect(documentNames()).toEqual(["untitled-document.md", "welcome.md"]);
    within(sidebar())
      .getAllByRole("listitem")
      .forEach((item) =>
        expect(within(item).getByText("01 April 2022")).toHaveAttribute(
          "datetime",
          "2022-04-01",
        ),
      );
  });

  it("marks the open document as current", async () => {
    await renderApp();

    expect(
      within(sidebar()).getByRole("button", { current: true }),
    ).toHaveTextContent("welcome.md");
    expect(
      within(sidebar()).getByRole("button", { name: "untitled-document.md" }),
    ).toHaveAttribute("aria-current", "false");
  });

  it("opens the document chosen from the list", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(menu());
    await user.click(
      within(sidebar()).getByRole("button", { name: "untitled-document.md" }),
    );

    expect(nameField()).toHaveValue("untitled-document.md");
    expect(screen.getByRole("textbox", { name: "Markdown" })).toHaveValue("");
    expect(
      within(sidebar()).getByRole("button", { current: true }),
    ).toHaveTextContent("untitled-document.md");
  });

  it("creates a document dated today and opens it", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 15, 9, 0));
    const user = userEvent.setup();
    await renderApp();

    await user.click(menu());
    await user.click(
      within(sidebar()).getByRole("button", { name: "New Document" }),
    );

    expect(documentNames()).toHaveLength(3);
    const [created] = within(sidebar()).getAllByRole("listitem");
    expect(
      within(created).getByRole("button", { current: true }),
    ).toHaveTextContent("untitled-document.md");
    expect(within(created).getByText("15 November 2026")).toHaveAttribute(
      "datetime",
      "2026-11-15",
    );
    expect(nameField()).toHaveValue("untitled-document.md");
  });

  it("lists saved names, not unsaved renames", async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.type(nameField(), "-draft");
    expect(documentNames()).toEqual(["untitled-document.md", "welcome.md"]);
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(documentNames()).toEqual([
      "untitled-document.md",
      "welcome.md-draft.md",
    ]);
  });

  it("switches between light and dark mode", async () => {
    const user = userEvent.setup();
    await renderApp();
    const toggle = within(sidebar()).getByRole("switch", {
      name: "Dark mode",
    });
    expect(toggle).not.toBeChecked();

    await user.click(menu());
    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    await user.click(toggle);

    expect(toggle).not.toBeChecked();
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("credits the author at its foot", async () => {
    await renderApp();

    expect(
      within(sidebar()).getByRole("link", { name: "Abdelrhman Abdelaal" }),
    ).toBeInTheDocument();
  });
});
