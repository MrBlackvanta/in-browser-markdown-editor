import { mediaListenerCount, setMediaMatch } from "@/test/media";
import { act, renderHook } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { DARK_SCHEME_QUERY, THEME_STORAGE_KEY } from "./theme";

async function renderTheme() {
  vi.resetModules();
  const store = await import("./theme-store");
  const rendered = renderHook(() => store.useTheme());
  return { store, ...rendered };
}

function paintedTheme() {
  return document.documentElement.dataset.theme;
}

function storageEvent(key: string | null) {
  act(() => {
    dispatchEvent(new StorageEvent("storage", { key }));
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("useTheme", () => {
  it.each([
    ["dark", "dark"],
    ["light", "light"],
    [undefined, "light"],
  ])("reads a painted %s theme as %s", async (painted, theme) => {
    if (painted) document.documentElement.dataset.theme = painted;

    const { result } = await renderTheme();

    expect(result.current).toBe(theme);
  });
});

describe("toggleTheme", () => {
  it.each([
    ["light", "dark"],
    ["dark", "light"],
  ])("switches %s to %s, paints it and remembers it", async (from, to) => {
    document.documentElement.dataset.theme = from;
    const { store, result } = await renderTheme();

    act(() => store.toggleTheme());

    expect(result.current).toBe(to);
    expect(paintedTheme()).toBe(to);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(to);
  });

  it("still switches when storage throws", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    const { store, result } = await renderTheme();

    act(() => store.toggleTheme());

    expect(result.current).toBe("dark");
    expect(paintedTheme()).toBe("dark");
  });
});

describe("following changes made elsewhere", () => {
  it("paints the theme another tab chose", async () => {
    const { result } = await renderTheme();

    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    storageEvent(THEME_STORAGE_KEY);

    expect(result.current).toBe("dark");
    expect(paintedTheme()).toBe("dark");
  });

  it("falls back to the system after another tab clears storage", async () => {
    document.documentElement.dataset.theme = "light";
    setMediaMatch(DARK_SCHEME_QUERY, true);
    const { result } = await renderTheme();

    storageEvent(null);

    expect(result.current).toBe("dark");
  });

  it("ignores another tab's change to a different key", async () => {
    const { result } = await renderTheme();

    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    storageEvent("markdown-workspace");

    expect(result.current).toBe("light");
  });

  it("follows the system while no theme is chosen", async () => {
    const { result } = await renderTheme();

    act(() => setMediaMatch(DARK_SCHEME_QUERY, true));

    expect(result.current).toBe("dark");
    expect(paintedTheme()).toBe("dark");
  });

  it("keeps a chosen theme when the system changes", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    const { result } = await renderTheme();

    act(() => setMediaMatch(DARK_SCHEME_QUERY, true));

    expect(result.current).toBe("light");
  });

  it("treats an unknown stored theme as no choice", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    const { result } = await renderTheme();

    act(() => setMediaMatch(DARK_SCHEME_QUERY, true));

    expect(result.current).toBe("dark");
  });

  it("follows the system when storage cannot be read", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    const { result } = await renderTheme();

    act(() => setMediaMatch(DARK_SCHEME_QUERY, true));

    expect(result.current).toBe("dark");
  });

  it("stops listening once nothing is subscribed", async () => {
    const removeListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = await renderTheme();
    expect(mediaListenerCount(DARK_SCHEME_QUERY)).toBe(1);

    unmount();

    expect(mediaListenerCount(DARK_SCHEME_QUERY)).toBe(0);
    expect(removeListener).toHaveBeenCalledWith(
      "storage",
      expect.any(Function),
    );
  });
});
