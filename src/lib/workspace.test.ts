import { SEED_WORKSPACE, type MarkdownDocument, type Workspace } from "@/data";
import { describe, expect, it } from "vite-plus/test";
import {
  activeDocument,
  blankDocument,
  parseWorkspace,
  toFileName,
  workspaceReducer,
} from "./workspace";

const notes: MarkdownDocument = {
  id: "notes",
  name: "notes.md",
  content: "# Notes",
  createdAt: "2024-01-02",
};
const todo: MarkdownDocument = {
  id: "todo",
  name: "todo.md",
  content: "- milk",
  createdAt: "2024-03-04",
};
const fresh = blankDocument("fresh", "2026-11-14");
const workspace: Workspace = {
  documents: [notes, todo],
  drafts: {},
  activeId: "notes",
};

describe("toFileName", () => {
  it.each([
    ["notes", "notes.md"],
    ["notes.md", "notes.md"],
    ["  notes.md  ", "notes.md"],
    ["Notes.MD", "Notes.md"],
    ["notes .md", "notes.md"],
    ["notes.md.md", "notes.md.md"],
    ["readme.markdown", "readme.markdown.md"],
    ["my notes", "my notes.md"],
    ["", "untitled-document.md"],
    ["   ", "untitled-document.md"],
    [".md", "untitled-document.md"],
    ["  .MD ", "untitled-document.md"],
  ])("saves %j as %j", (name, fileName) => {
    expect(toFileName(name)).toBe(fileName);
  });
});

describe("blankDocument", () => {
  it("is an empty untitled document with the given id and date", () => {
    expect(fresh).toEqual({
      id: "fresh",
      name: "untitled-document.md",
      content: "",
      createdAt: "2026-11-14",
    });
  });
});

describe("activeDocument", () => {
  it("is the saved document when there is no draft", () => {
    expect(activeDocument(workspace)).toEqual(notes);
  });

  it("overlays the draft on the saved document", () => {
    const drafted = {
      ...workspace,
      drafts: { notes: { name: "ideas", content: "# Ideas" } },
    };

    expect(activeDocument(drafted)).toEqual({
      ...notes,
      name: "ideas",
      content: "# Ideas",
    });
  });
});

describe("workspaceReducer", () => {
  it("creates a document at the top of the list and opens it", () => {
    const next = workspaceReducer(workspace, {
      type: "create",
      document: fresh,
    });

    expect(next.documents).toEqual([fresh, notes, todo]);
    expect(next.activeId).toBe("fresh");
  });

  it("opens an existing document", () => {
    expect(
      workspaceReducer(workspace, { type: "select", id: "todo" }).activeId,
    ).toBe("todo");
  });

  it("ignores a select for a document that does not exist", () => {
    expect(workspaceReducer(workspace, { type: "select", id: "gone" })).toBe(
      workspace,
    );
  });

  it("keeps a rename as a draft until it is saved", () => {
    const next = workspaceReducer(workspace, {
      type: "rename",
      name: "ideas",
    });

    expect(next.documents).toEqual(workspace.documents);
    expect(next.drafts).toEqual({
      notes: { name: "ideas", content: "# Notes" },
    });
  });

  it("keeps an edit as a draft until it is saved", () => {
    const next = workspaceReducer(workspace, {
      type: "edit",
      content: "# Notes\n\nMore",
    });

    expect(next.documents).toEqual(workspace.documents);
    expect(next.drafts).toEqual({
      notes: { name: "notes.md", content: "# Notes\n\nMore" },
    });
  });

  it("combines a rename and an edit in one draft", () => {
    const renamed = workspaceReducer(workspace, {
      type: "rename",
      name: "ideas",
    });
    const next = workspaceReducer(renamed, { type: "edit", content: "" });

    expect(next.drafts).toEqual({ notes: { name: "ideas", content: "" } });
  });

  it("drops the draft once it matches the saved document again", () => {
    const edited = workspaceReducer(workspace, { type: "edit", content: "" });
    const next = workspaceReducer(edited, { type: "edit", content: "# Notes" });

    expect(next.drafts).toEqual({});
  });

  it("keeps each document's draft separate", () => {
    const edited = workspaceReducer(workspace, { type: "edit", content: "A" });
    const switched = workspaceReducer(edited, { type: "select", id: "todo" });
    const next = workspaceReducer(switched, { type: "edit", content: "B" });

    expect(activeDocument(next).content).toBe("B");
    expect(next.drafts).toEqual({
      notes: { name: "notes.md", content: "A" },
      todo: { name: "todo.md", content: "B" },
    });
  });

  it("saves the draft under a cleaned file name and drops it", () => {
    const drafted = {
      ...workspace,
      drafts: {
        notes: { name: "  ideas ", content: "# Ideas" },
        todo: { name: "todo.md", content: "- eggs" },
      },
    };

    const next = workspaceReducer(drafted, { type: "save" });

    expect(next.documents).toEqual([
      { ...notes, name: "ideas.md", content: "# Ideas" },
      todo,
    ]);
    expect(next.drafts).toEqual({
      todo: { name: "todo.md", content: "- eggs" },
    });
    expect(next.activeId).toBe("notes");
  });

  it("saves an unchanged document as it is", () => {
    expect(workspaceReducer(workspace, { type: "save" })).toEqual(workspace);
  });

  it("deletes the open document and its draft, then opens the first one left", () => {
    const drafted = {
      ...workspace,
      activeId: "todo",
      drafts: {
        notes: { name: "notes.md", content: "A" },
        todo: { name: "todo.md", content: "B" },
      },
    };

    expect(
      workspaceReducer(drafted, { type: "delete", replacement: fresh }),
    ).toEqual({
      documents: [notes],
      drafts: { notes: { name: "notes.md", content: "A" } },
      activeId: "notes",
    });
  });

  it("opens the first document left, not the neighbour", () => {
    const three = {
      documents: [notes, todo, fresh],
      drafts: {},
      activeId: "todo",
    };

    expect(
      workspaceReducer(three, { type: "delete", replacement: fresh }).activeId,
    ).toBe("notes");
  });

  it("replaces the last document with a blank one", () => {
    const single = {
      documents: [notes],
      drafts: { notes: { name: "notes.md", content: "A" } },
      activeId: "notes",
    };

    expect(
      workspaceReducer(single, { type: "delete", replacement: fresh }),
    ).toEqual({ documents: [fresh], drafts: {}, activeId: "fresh" });
  });
});

describe("parseWorkspace", () => {
  it("accepts the seed after a round trip through JSON", () => {
    expect(parseWorkspace(JSON.parse(JSON.stringify(SEED_WORKSPACE)))).toEqual(
      SEED_WORKSPACE,
    );
  });

  it("accepts drafts for documents that exist", () => {
    const drafted = {
      ...workspace,
      drafts: { todo: { name: "todo.md", content: "- eggs" } },
    };

    expect(parseWorkspace(drafted)).toEqual(drafted);
  });

  it.each([
    ["null", null],
    ["a string", "workspace"],
    ["an array", [workspace]],
    ["no documents", { ...workspace, documents: [] }],
    ["documents that are not an array", { ...workspace, documents: notes }],
    [
      "a document without content",
      { ...workspace, documents: [{ ...notes, content: undefined }] },
    ],
    ["a numeric id", { ...workspace, documents: [notes, { ...todo, id: 2 }] }],
    [
      "the brief's MM-DD-YYYY date",
      { ...workspace, documents: [{ ...notes, createdAt: "04-01-2022" }] },
    ],
    [
      "an impossible date",
      { ...workspace, documents: [{ ...notes, createdAt: "2022-13-45" }] },
    ],
    [
      "duplicate ids",
      { ...workspace, documents: [notes, { ...todo, id: "notes" }] },
    ],
    ["an active id that does not exist", { ...workspace, activeId: "gone" }],
    ["a missing active id", { ...workspace, activeId: undefined }],
    ["drafts that are an array", { ...workspace, drafts: [] }],
    [
      "a draft for a missing document",
      { ...workspace, drafts: { gone: { name: "a", content: "b" } } },
    ],
    [
      "a draft without a name",
      { ...workspace, drafts: { notes: { content: "b" } } },
    ],
  ])("rejects %s", (_, value) => {
    expect(parseWorkspace(value)).toBeNull();
  });
});
