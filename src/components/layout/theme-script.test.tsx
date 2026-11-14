import { applyStoredTheme } from "@/lib/theme";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import ThemeScript from "./theme-script";

describe("ThemeScript", () => {
  it("holds the first render until the theme script has run", () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector("script");
    const renderGate = document.querySelector('link[rel="expect"]');

    expect(script).toHaveTextContent(applyStoredTheme);
    expect(renderGate).toHaveAttribute("blocking", "render");
    expect(renderGate).toHaveAttribute("href", `#${script?.id}`);
  });
});
