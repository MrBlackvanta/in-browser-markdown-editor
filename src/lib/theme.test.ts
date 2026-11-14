import { setMediaMatch } from "@/test/media";
import { runInThisContext } from "node:vm";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import {
  applyStoredTheme,
  DARK_SCHEME_QUERY,
  THEME_STORAGE_KEY,
} from "./theme";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("applyStoredTheme", () => {
  it.each([
    { stored: "dark", systemDark: false, theme: "dark" },
    { stored: "light", systemDark: true, theme: "light" },
    { stored: null, systemDark: true, theme: "dark" },
    { stored: null, systemDark: false, theme: "light" },
    { stored: "sepia", systemDark: true, theme: "dark" },
    { stored: "sepia", systemDark: false, theme: "light" },
  ])(
    "stored $stored with a dark system $systemDark paints $theme",
    ({ stored, systemDark, theme }) => {
      if (stored) localStorage.setItem(THEME_STORAGE_KEY, stored);
      setMediaMatch(DARK_SCHEME_QUERY, systemDark);

      runInThisContext(applyStoredTheme);

      expect(document.documentElement.dataset.theme).toBe(theme);
    },
  );

  it("follows the system when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    setMediaMatch(DARK_SCHEME_QUERY, true);

    runInThisContext(applyStoredTheme);

    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
