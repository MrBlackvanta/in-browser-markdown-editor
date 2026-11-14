import { SEED_WORKSPACE, type Workspace } from "@/data";
import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";

const KEY = "markdown-workspace";

const saved: Workspace = {
  documents: [
    {
      id: "notes",
      name: "notes.md",
      content: "# Notes",
      createdAt: "2024-01-02",
    },
  ],
  drafts: { notes: { name: "ideas", content: "# Notes" } },
  activeId: "notes",
};

async function loadStore() {
  vi.resetModules();
  return import("./workspace-store");
}

async function renderWorkspace() {
  const store = await loadStore();
  const { result } = renderHook(() => store.useWorkspace());
  return { store, result };
}

function stored() {
  return JSON.parse(localStorage.getItem(KEY) ?? "null");
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("reading the workspace", () => {
  it("starts from the seed when nothing is stored", async () => {
    const { result } = await renderWorkspace();

    expect(result.current).toEqual(SEED_WORKSPACE);
  });

  it("restores the stored workspace, drafts included", async () => {
    localStorage.setItem(KEY, JSON.stringify(saved));

    const { result } = await renderWorkspace();

    expect(result.current).toEqual(saved);
  });

  it.each([
    ["corrupt JSON", "{"],
    ["a different shape", JSON.stringify({ documents: [] })],
    ["the brief's raw data", JSON.stringify([{ name: "welcome.md" }])],
  ])("falls back to the seed for %s", async (_, value) => {
    localStorage.setItem(KEY, value);

    const { result } = await renderWorkspace();

    expect(result.current).toEqual(SEED_WORKSPACE);
  });

  it("prerenders the seed whatever is stored, so hydration matches the export", async () => {
    localStorage.setItem(KEY, JSON.stringify(saved));
    const { useWorkspace } = await loadStore();

    function ActiveName() {
      return useWorkspace().activeId;
    }

    expect(renderToString(<ActiveName />)).toBe("welcome");
  });
});

describe("changing the workspace", () => {
  it("persists every change", async () => {
    const { store, result } = await renderWorkspace();

    act(() => store.editDocument("# Hello"));

    expect(result.current.drafts).toEqual({
      welcome: { name: "welcome.md", content: "# Hello" },
    });
    expect(stored()).toEqual(result.current);
  });

  it("creates an untitled document dated today and opens it", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 14, 0, 30));
    const { store, result } = await renderWorkspace();

    act(() => store.createDocument());

    const [created] = result.current.documents;
    expect(created).toMatchObject({
      name: "untitled-document.md",
      content: "",
      createdAt: "2026-11-14",
    });
    expect(result.current.activeId).toBe(created.id);
    expect(result.current.documents).toHaveLength(3);
  });

  it("still creates unique documents where randomUUID is missing", async () => {
    vi.stubGlobal("crypto", {});
    const { store, result } = await renderWorkspace();

    act(() => store.createDocument());
    act(() => store.createDocument());

    const ids = result.current.documents.map(({ id }) => id);
    expect(new Set(ids).size).toBe(4);
  });

  it("renames, saves, selects and deletes through the reducer", async () => {
    const { store, result } = await renderWorkspace();

    act(() => store.renameDocument("intro"));
    act(() => store.saveDocument());
    expect(result.current.documents[1].name).toBe("intro.md");

    act(() => store.selectDocument("untitled-document"));
    act(() => store.deleteDocument());
    expect(result.current.documents.map(({ name }) => name)).toEqual([
      "intro.md",
    ]);
    expect(result.current.activeId).toBe("welcome");
  });

  it("keeps working in memory when storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    const { store, result } = await renderWorkspace();

    act(() => store.editDocument("# Offline"));

    expect(result.current.drafts.welcome.content).toBe("# Offline");
  });
});

describe("other tabs", () => {
  it("picks up a change another tab wrote", async () => {
    const { result } = await renderWorkspace();

    localStorage.setItem(KEY, JSON.stringify(saved));
    act(() => {
      dispatchEvent(new StorageEvent("storage", { key: KEY }));
    });

    expect(result.current).toEqual(saved);
  });

  it("re-reads after another tab clears storage", async () => {
    localStorage.setItem(KEY, JSON.stringify(saved));
    const { result } = await renderWorkspace();

    localStorage.clear();
    act(() => {
      dispatchEvent(new StorageEvent("storage", { key: null }));
    });

    expect(result.current).toEqual(SEED_WORKSPACE);
  });

  it("ignores another tab's change to a different key", async () => {
    const { result } = await renderWorkspace();

    localStorage.setItem(KEY, JSON.stringify(saved));
    act(() => {
      dispatchEvent(new StorageEvent("storage", { key: "theme" }));
    });

    expect(result.current).toEqual(SEED_WORKSPACE);
  });

  it("stops listening once nothing is subscribed", async () => {
    const store = await loadStore();
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => store.useWorkspace());

    unmount();

    expect(removeListener).toHaveBeenCalledWith(
      "storage",
      expect.any(Function),
    );
  });
});
