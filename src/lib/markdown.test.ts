import { describe, expect, it } from "vite-plus/test";
import {
  decodeCharacterReferences,
  safeImageSrc,
  safeLinkHref,
} from "./markdown";

const REPLACEMENT = String.fromCodePoint(0xfffd);

describe("decodeCharacterReferences", () => {
  it.each([
    ["Tom &amp; Jerry", "Tom & Jerry"],
    ["&lt;p&gt;", "<p>"],
    ["&quot;hi&quot; &apos;yo&apos;", `"hi" 'yo'`],
    ["a&nbsp;b", `a${String.fromCodePoint(0xa0)}b`],
    ["&copy; 2026 &mdash; &hellip;", "© 2026 — …"],
    ["&#169;", "©"],
    ["&#x1F600; &#X41;", "😀 A"],
    ["&#0;", REPLACEMENT],
    ["&#xD800;", REPLACEMENT],
    ["&#x110000;", REPLACEMENT],
    ["&#x1000000; has too many digits", "&#x1000000; has too many digits"],
    ["&#1114112;", REPLACEMENT],
    ["&bogus; stays", "&bogus; stays"],
    ["&AMP; is case-sensitive", "&AMP; is case-sensitive"],
    ["&amp without a semicolon", "&amp without a semicolon"],
    [
      "&constructor; &toString; &__proto__;",
      "&constructor; &toString; &__proto__;",
    ],
    ["&#12345678; has too many digits", "&#12345678; has too many digits"],
    ["plain text", "plain text"],
  ])("decodes %j as %j", (text, decoded) => {
    expect(decodeCharacterReferences(text)).toBe(decoded);
  });
});

describe("safeLinkHref", () => {
  it.each([
    "https://example.com",
    "http://example.com/path?q=1#top",
    "mailto:someone@example.com",
    "/relative/path",
    "relative/path",
    "../up",
    "#heading",
    "?query",
    "//example.com",
  ])("keeps %j", (href) => {
    expect(safeLinkHref(href)).toBe(href);
  });

  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "vbscript:msgbox(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "ftp://example.com",
    "http://[::1",
  ])("drops %j", (href) => {
    expect(safeLinkHref(href)).toBeUndefined();
  });
});

describe("safeImageSrc", () => {
  it.each([
    "https://example.com/a.png",
    "http://example.com/a.png",
    "/a.png",
    "a.png",
  ])("keeps %j", (src) => {
    expect(safeImageSrc(src)).toBe(src);
  });

  it.each([
    "mailto:someone@example.com",
    "javascript:alert(1)",
    "data:image/svg+xml,<svg/>",
    "http://[::1",
  ])("drops %j", (src) => {
    expect(safeImageSrc(src)).toBeUndefined();
  });
});
