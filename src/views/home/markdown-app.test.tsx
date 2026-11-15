import { RESTORE_GATE_SCRIPT } from "@/lib/restore-gate";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
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

function deleteButton() {
  return screen.getByRole("button", { name: "Delete document" });
}

function deleteDialog() {
  return screen.getByRole("alertdialog", { name: "Delete this document?" });
}

function confirmButton() {
  return within(deleteDialog()).getByRole("button", {
    name: "Confirm & Delete",
  });
}

async function deleteOpenDocument(user: ReturnType<typeof userEvent.setup>) {
  await user.click(deleteButton());
  await user.click(confirmButton());
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
    await deleteOpenDocument(user);
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

  it("keeps working when a pasted document nests thousands of levels deep", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.clear(editor());

    await user.paste(`${">".repeat(2000)} deep`);
    await user.type(editor(), "!");

    expect(editor()).toHaveValue(`${">".repeat(2000)} deep!`);
    expect(
      await within(preview()).findByText(`${">".repeat(1900)} deep!`),
    ).toBeVisible();
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

describe("MarkdownApp delete dialog", () => {
  function heading() {
    return within(deleteDialog()).getByRole("heading", {
      name: "Delete this document?",
    });
  }

  function documentList() {
    return within(
      screen.getByRole("navigation", { name: "My documents" }),
    ).getByRole("list");
  }

  it("asks before deleting, naming the document", async () => {
    const user = userEvent.setup();
    await renderApp();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(deleteButton()).toHaveAttribute("aria-haspopup", "dialog");

    await user.click(deleteButton());

    expect(deleteDialog()).toHaveAccessibleDescription(
      "Are you sure you want to delete the ‘welcome.md’ document and its contents? This action cannot be reversed.",
    );
    expect(heading()).toHaveFocus();
    expect(nameField()).toHaveValue("welcome.md");
  });

  it("deletes once confirmed, opens the next document and announces it", async () => {
    const user = userEvent.setup();
    await renderApp();

    await deleteOpenDocument(user);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(nameField()).toHaveValue("untitled-document.md");
    expect(screen.getByRole("status")).toHaveTextContent("Document deleted");
    expect(deleteButton()).toHaveFocus();
  });

  it("keeps the document when Escape cancels", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(deleteButton());

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(nameField()).toHaveValue("welcome.md");
    expect(deleteButton()).toHaveFocus();
  });

  it("keeps the document when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    await renderApp();
    await user.click(deleteButton());

    await user.click(
      within(deleteDialog()).getByRole("button", { hidden: true, name: "" }),
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(nameField()).toHaveValue("welcome.md");
    expect(deleteButton()).toHaveFocus();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it.each([
    ["an unsaved rename", "notes", "‘notes.md’"],
    ["a blank name", "", "‘untitled-document.md’"],
  ])("names %s as it would be saved", async (_, typed, named) => {
    const user = userEvent.setup();
    await renderApp();
    await user.clear(nameField());
    if (typed) await user.type(nameField(), typed);

    await user.click(deleteButton());

    expect(deleteDialog()).toHaveAccessibleDescription(
      expect.stringContaining(named),
    );
  });

  it("keeps naming the deleted document while it closes", async () => {
    const user = userEvent.setup();
    await renderApp();

    await deleteOpenDocument(user);

    expect(
      screen.getByRole("alertdialog", { hidden: true }),
    ).toHaveAccessibleDescription(expect.stringContaining("‘welcome.md’"));
  });

  it("deletes only one document on a double click", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 15, 9, 0));
    const user = userEvent.setup();
    await renderApp();
    await user.click(deleteButton());

    await user.dblClick(confirmButton());

    const remaining = within(documentList()).getByRole("listitem");
    expect(remaining).toHaveTextContent("01 April 2022");
    expect(screen.getByRole("status")).toHaveTextContent("Document deleted");
  });
});

describe("MarkdownApp restoring a session", () => {
  const saved = {
    documents: [
      {
        id: "notes",
        name: "notes.md",
        content: "# Notes",
        createdAt: "2024-01-02",
      },
    ],
    drafts: { notes: { name: "ideas", content: "# Draft notes" } },
    activeId: "notes",
  };

  let root: Root | undefined;

  afterEach(() => {
    act(() => root?.unmount());
    root = undefined;
    document.body.innerHTML = "";
    delete document.documentElement.dataset.restoring;
  });

  function runRestoreGate() {
    const script = document.createElement("script");
    script.textContent = RESTORE_GATE_SCRIPT;
    document.body.append(script);
    script.remove();
  }

  async function prerenderThenHydrate() {
    vi.resetModules();
    const { MarkdownApp } = await import("./index");
    runRestoreGate();
    const container = document.createElement("div");
    container.innerHTML = renderToString(<MarkdownApp />);
    document.body.append(container);
    const prerendered = {
      name: nameField().getAttribute("value"),
      restoring: document.documentElement.hasAttribute("data-restoring"),
    };
    const onRecoverableError = vi.fn();
    const sessionShownWhenLifted: boolean[] = [];
    const html = document.documentElement;
    vi.spyOn(html, "removeAttribute").mockImplementation((name) => {
      if (name === "data-restoring")
        sessionShownWhenLifted.push(
          screen.queryByDisplayValue("ideas") !== null,
        );
      Element.prototype.removeAttribute.call(html, name);
    });

    await act(async () => {
      root = hydrateRoot(container, <MarkdownApp />, { onRecoverableError });
    });

    return { prerendered, onRecoverableError, sessionShownWhenLifted };
  }

  it("hides the prerendered seed until the saved session has rendered", async () => {
    localStorage.setItem("markdown-workspace", JSON.stringify(saved));

    const { prerendered, onRecoverableError, sessionShownWhenLifted } =
      await prerenderThenHydrate();

    expect(prerendered).toEqual({ name: "welcome.md", restoring: true });
    expect(sessionShownWhenLifted).toEqual([true]);
    expect(document.documentElement).not.toHaveAttribute("data-restoring");
    expect(nameField()).toHaveValue("ideas");
    expect(screen.getByRole("textbox", { name: "Markdown" })).toHaveValue(
      "# Draft notes",
    );
    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("paints a first visit without hiding anything", async () => {
    const { prerendered, onRecoverableError } = await prerenderThenHydrate();

    expect(prerendered).toEqual({ name: "welcome.md", restoring: false });
    expect(nameField()).toHaveValue("welcome.md");
    expect(onRecoverableError).not.toHaveBeenCalled();
  });
});
