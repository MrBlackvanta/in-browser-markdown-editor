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
  openRestoreGate,
  RESTORE_GATE_SCRIPT,
  RESTORE_GATE_TIMEOUT,
} from "./restore-gate";
import { WORKSPACE_STORAGE_KEY } from "./workspace";

const root = document.documentElement;

function runGate() {
  const script = document.createElement("script");
  script.textContent = RESTORE_GATE_SCRIPT;
  document.body.append(script);
  script.remove();
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  openRestoreGate();
  vi.useRealTimers();
});

describe("RESTORE_GATE_SCRIPT", () => {
  it("hides the document before paint when a session is saved", () => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, "{}");

    runGate();

    expect(root).toHaveAttribute("data-restoring");
  });

  it("leaves a first visit visible", () => {
    localStorage.setItem("theme", "dark");

    runGate();

    expect(root).not.toHaveAttribute("data-restoring");
  });

  it("leaves the page visible when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(() => runInThisContext(RESTORE_GATE_SCRIPT)).not.toThrow();
    expect(root).not.toHaveAttribute("data-restoring");
  });

  it("shows the document anyway if the app never lifts the gate", () => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, "{}");
    runGate();

    vi.advanceTimersByTime(RESTORE_GATE_TIMEOUT - 1);
    expect(root).toHaveAttribute("data-restoring");
    vi.advanceTimersByTime(1);

    expect(root).not.toHaveAttribute("data-restoring");
  });
});

describe("openRestoreGate", () => {
  it("shows the document", () => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, "{}");
    runGate();

    openRestoreGate();

    expect(root).not.toHaveAttribute("data-restoring");
  });
});
