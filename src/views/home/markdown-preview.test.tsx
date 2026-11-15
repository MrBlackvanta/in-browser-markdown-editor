import { SEED_WORKSPACE } from "@/data";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import MarkdownPreview from "./markdown-preview";

function renderMarkdown(markdown: string) {
  return render(<MarkdownPreview markdown={markdown} />);
}

describe("MarkdownPreview blocks", () => {
  it.each([1, 2, 3, 4, 5, 6])("renders a level %i heading", (level) => {
    renderMarkdown(`${"#".repeat(level)} Title`);

    expect(screen.getByRole("heading", { level, name: "Title" })).toBeVisible();
  });

  it("styles the sixth heading level in the accent colour", () => {
    renderMarkdown("##### Five\n\n###### Six");

    expect(screen.getByRole("heading", { level: 5 })).toHaveClass(
      "text-ink-strong",
    );
    expect(screen.getByRole("heading", { level: 6 })).toHaveClass(
      "text-accent-ink",
    );
  });

  it("renders setext headings", () => {
    renderMarkdown("Big\n===\n\nSmall\n---");

    expect(
      screen.getByRole("heading", { level: 1, name: "Big" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 2, name: "Small" }),
    ).toBeVisible();
  });

  it("renders each paragraph separately", () => {
    renderMarkdown("First line\nsame paragraph\n\nSecond");

    const paragraphs = screen.getAllByRole("paragraph");
    expect(paragraphs.map((paragraph) => paragraph.textContent)).toEqual([
      "First line\nsame paragraph",
      "Second",
    ]);
  });

  it("renders a blockquote around its blocks", () => {
    renderMarkdown("> Quoted\n>\n> Twice");

    const quote = screen.getByRole("blockquote");
    expect(within(quote).getAllByRole("paragraph")).toHaveLength(2);
  });

  it("renders a code block as literal text", () => {
    const { container } = renderMarkdown(
      "```html\n<main>\n  <h1>Hi &amp; bye</h1>\n</main>\n```",
    );

    const code = container.querySelector("pre > code");
    expect(code).toHaveTextContent("<main> <h1>Hi &amp; bye</h1> </main>", {
      normalizeWhitespace: true,
    });
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders an indented code block", () => {
    const { container } = renderMarkdown("    let a = 1;");

    expect(container.querySelector("pre > code")).toHaveTextContent(
      "let a = 1;",
    );
  });

  it("renders a thematic break", () => {
    renderMarkdown("Above\n\n---\n\nBelow");

    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("renders an empty document as nothing", () => {
    const { container } = renderMarkdown("");

    expect(container).toBeEmptyDOMElement();
  });
});

describe("MarkdownPreview lists", () => {
  it("renders an unordered list with an item per line", () => {
    renderMarkdown("- milk\n- eggs");

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("UL");
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["milk", "eggs"]);
  });

  it("renders an ordered list that keeps its starting number", () => {
    renderMarkdown("3. three\n4. four");

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(list).toHaveAttribute("start", "3");
  });

  it("starts an ordered list from zero when the source does", () => {
    renderMarkdown("0. zero\n1. one");

    expect(screen.getByRole("list")).toHaveAttribute("start", "0");
  });

  it("does not number an unordered list", () => {
    renderMarkdown("- item");

    expect(screen.getByRole("list")).not.toHaveAttribute("start");
  });

  it("formats inline content inside an item", () => {
    renderMarkdown("- a **bold** item");

    expect(
      within(screen.getByRole("listitem")).getByRole("strong"),
    ).toHaveTextContent("bold");
  });

  it("nests a list inside its parent item", () => {
    renderMarkdown("1. parent\n   - child");

    const [outer, inner] = screen.getAllByRole("list");
    const [parent] = within(outer).getAllByRole("listitem");
    expect(parent).toContainElement(inner);
  });

  it("marks loose items so their paragraphs are spaced", () => {
    renderMarkdown("- one\n\n- two");

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveAttribute("data-loose");
    expect(within(items[0]).getByRole("paragraph")).toHaveTextContent("one");
  });

  it("leaves tight items unmarked", () => {
    renderMarkdown("- one\n- two");

    expect(screen.getAllByRole("listitem")[0]).not.toHaveAttribute(
      "data-loose",
    );
  });

  it("renders task items as disabled checkboxes without a bullet", () => {
    renderMarkdown("- [ ] open\n- [x] done\n- plain");

    const [open, done] = screen.getAllByRole("checkbox", { name: "Done" });
    expect(open).not.toBeChecked();
    expect(done).toBeChecked();
    expect(open).toBeDisabled();
    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.hasAttribute("data-task"))).toEqual([
      true,
      true,
      false,
    ]);
  });
});

describe("MarkdownPreview inline", () => {
  it("renders strong, emphasis, strikethrough and inline code", () => {
    renderMarkdown("**bold** _em_ ~~gone~~ `<p>code</p>`");

    expect(screen.getByRole("strong")).toHaveTextContent("bold");
    expect(screen.getByRole("emphasis")).toHaveTextContent("em");
    expect(screen.getByRole("deletion")).toHaveTextContent("gone");
    expect(screen.getByRole("code")).toHaveTextContent("<p>code</p>");
  });

  it("nests inline styles", () => {
    renderMarkdown("**bold _both_**");

    expect(screen.getByRole("strong")).toContainElement(
      screen.getByRole("emphasis"),
    );
  });

  it("renders a hard line break", () => {
    const { container } = renderMarkdown("one  \ntwo");

    expect(container.querySelector("p > br")).toBeInTheDocument();
  });

  it("decodes character references in text", () => {
    renderMarkdown("Tom &amp; Jerry &copy; &#169; &bogus;");

    expect(screen.getByRole("paragraph")).toHaveTextContent(
      "Tom & Jerry © © &bogus;",
    );
  });

  it("shows backslash escapes literally", () => {
    renderMarkdown("\\*not emphasis\\*");

    expect(screen.queryByRole("emphasis")).not.toBeInTheDocument();
    expect(screen.getByRole("paragraph")).toHaveTextContent("*not emphasis*");
  });

  it("shows raw HTML as text instead of markup", () => {
    const { container } = renderMarkdown(
      '<div onclick="alert(1)">block</div>\n\nan <b onmouseover="alert(1)">inline</b> tag',
    );

    expect(container.querySelector("[onclick], [onmouseover], b")).toBeNull();
    const [block, inline] = screen.getAllByRole("paragraph");
    expect(block).toHaveTextContent('<div onclick="alert(1)">block</div>');
    expect(inline).toHaveTextContent(
      'an <b onmouseover="alert(1)">inline</b> tag',
    );
  });
});

describe("MarkdownPreview links", () => {
  it("opens an external link in a new tab and says so", () => {
    renderMarkdown(
      '[guide](https://example.com/?a=1&amp;b=2 "The &amp; guide")',
    );

    const link = screen.getByRole("link", {
      name: /^guide.*opens in a new tab/,
    });
    expect(link).toHaveAttribute("href", "https://example.com/?a=1&b=2");
    expect(link).toHaveAttribute("title", "The & guide");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });

  it("keeps an in-page link in the same tab", () => {
    renderMarkdown("[top](#top)");

    const link = screen.getByRole("link", { name: "top" });
    expect(link).toHaveAttribute("href", "#top");
    expect(link).not.toHaveAttribute("target");
  });

  it("links bare URLs", () => {
    renderMarkdown("Visit https://example.com today");

    expect(
      screen.getByRole("link", {
        name: /^https:\/\/example\.com.*opens in a new tab/,
      }),
    ).toHaveAttribute("href", "https://example.com");
  });

  it("renders a link to a script as plain text", () => {
    renderMarkdown("[click me](javascript:alert(1))");

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("paragraph")).toHaveTextContent("click me");
  });

  it("renders a link with no title without one", () => {
    renderMarkdown("[plain](https://example.com)");

    expect(screen.getByRole("link")).not.toHaveAttribute("title");
  });
});

describe("MarkdownPreview images", () => {
  it("renders an image with its alt text and title", () => {
    renderMarkdown('![A &amp; B](https://example.com/a.png "Pic &amp; more")');

    const image = screen.getByRole("img", { name: "A & B" });
    expect(image).toHaveAttribute("src", "https://example.com/a.png");
    expect(image).toHaveAttribute("title", "Pic & more");
    expect(image).toHaveAttribute("loading", "lazy");
  });

  it("decodes character references in the image address", () => {
    renderMarkdown("![chart](/chart.png?w=1&amp;h=2)");

    expect(screen.getByRole("img", { name: "chart" })).toHaveAttribute(
      "src",
      "/chart.png?w=1&h=2",
    );
  });

  it("shows the alt text instead of an image with an unsafe source", () => {
    renderMarkdown("![tracking pixel](javascript:alert(1))");

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("paragraph")).toHaveTextContent("tracking pixel");
  });
});

describe("MarkdownPreview tables", () => {
  it("renders headers and cells with their alignment", () => {
    renderMarkdown(
      "| Left | Centre | Right | None |\n|:-|:-:|-:|-|\n| a | b | c | d |",
    );

    const table = screen.getByRole("table");
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual([
      "Left",
      "Centre",
      "Right",
      "None",
    ]);
    const alignments = ["text-left", "text-center", "text-right", "text-left"];
    headers.forEach((header, index) =>
      expect(header).toHaveClass(alignments[index]),
    );
    within(table)
      .getAllByRole("cell")
      .forEach((cell, index) => expect(cell).toHaveClass(alignments[index]));
  });
});

describe("MarkdownPreview on the welcome document", () => {
  it("renders every block the design shows", () => {
    const welcome = SEED_WORKSPACE.documents.find(
      (document) => document.id === "welcome",
    );
    renderMarkdown(welcome?.content ?? "");

    expect(
      screen
        .getAllByRole("heading")
        .map((heading) => [heading.tagName, heading.textContent]),
    ).toEqual([
      ["H1", "Welcome to Markdown"],
      ["H2", "How to use this?"],
      ["H3", "Features"],
      ["H4", "Headings"],
      ["H5", "Lists"],
      ["H6", "Code Blocks"],
    ]);
    expect(screen.getAllByRole("list").map((list) => list.tagName)).toEqual([
      "OL",
      "UL",
    ]);
    expect(screen.getByRole("blockquote")).toContainElement(
      screen.getByRole("link", {
        name: /^markdown cheatsheet.*opens in a new tab/,
      }),
    );
    expect(screen.getAllByRole("code").map((code) => code.textContent)).toEqual(
      [
        "<p>I'm inline</p>",
        ["<main>", "  <h1>This is a larger code block</h1>", "</main>"].join(
          "\n",
        ),
      ],
    );
  });
});

describe("MarkdownPreview on deeply nested markdown", () => {
  function nestedList(levels: number) {
    return Array.from(
      { length: levels },
      (_, level) => `${"  ".repeat(level)}- item`,
    ).join("\n");
  }

  it("stops nesting quotes at 100 levels and shows the rest as source", () => {
    renderMarkdown(`${">".repeat(150)} deep`);

    const quotes = screen.getAllByRole("blockquote");
    expect(quotes).toHaveLength(100);
    expect(
      within(quotes[99]).getByText(`${">".repeat(50)} deep`),
    ).toBeVisible();
  });

  it("stops nesting lists at 100 levels", () => {
    renderMarkdown(nestedList(120));

    expect(screen.getAllByRole("list")).toHaveLength(100);
  });

  it("explains instead of crashing when the markdown is too deep to parse", () => {
    renderMarkdown(`${">".repeat(20000)} deep`);

    expect(screen.queryByRole("blockquote")).not.toBeInTheDocument();
    expect(screen.getByText(/This document can’t be previewed/)).toBeVisible();
  });
});
