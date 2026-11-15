import { RESTORE_GATE_SCRIPT } from "@/lib/restore-gate";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import Home from "./page";

describe("Home", () => {
  it("runs the restore gate before any of the app is parsed", () => {
    const page = document.createElement("div");
    page.innerHTML = renderToString(<Home />);

    const first = page.firstElementChild;

    expect(first?.tagName).toBe("SCRIPT");
    expect(first?.textContent).toBe(RESTORE_GATE_SCRIPT);
    expect(page.querySelector("main")).not.toBeNull();
  });
});
