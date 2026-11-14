const NAMED_CHARACTERS: ReadonlyMap<string, string> = new Map(
  Object.entries({
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: "\u00a0",
    copy: "©",
    reg: "®",
    trade: "™",
    hellip: "…",
    mdash: "—",
    ndash: "–",
    lsquo: "‘",
    rsquo: "’",
    ldquo: "“",
    rdquo: "”",
    laquo: "«",
    raquo: "»",
    bull: "•",
    middot: "·",
    times: "×",
    divide: "÷",
    plusmn: "±",
    deg: "°",
    sect: "§",
    para: "¶",
    euro: "€",
    pound: "£",
    yen: "¥",
    cent: "¢",
    larr: "←",
    rarr: "→",
    uarr: "↑",
    darr: "↓",
    harr: "↔",
  }),
);

const CHARACTER_REFERENCE =
  /&(?:#(\d{1,7})|#[xX]([\da-fA-F]{1,6})|([a-zA-Z][a-zA-Z\d]*));/g;

const LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const IMAGE_PROTOCOLS = new Set(["http:", "https:"]);
const RELATIVE_BASE = "https://relative.invalid";

function fromCodePoint(codePoint: number) {
  const isScalarValue =
    codePoint > 0 &&
    codePoint <= 0x10ffff &&
    (codePoint < 0xd800 || codePoint > 0xdfff);
  return String.fromCodePoint(isScalarValue ? codePoint : 0xfffd);
}

export function decodeCharacterReferences(text: string) {
  return text.replace(
    CHARACTER_REFERENCE,
    (reference, decimal?: string, hex?: string, name?: string) => {
      if (decimal) return fromCodePoint(Number.parseInt(decimal, 10));
      if (hex) return fromCodePoint(Number.parseInt(hex, 16));
      return (name && NAMED_CHARACTERS.get(name)) ?? reference;
    },
  );
}

function hasProtocol(url: string, protocols: ReadonlySet<string>) {
  try {
    return protocols.has(new URL(url, RELATIVE_BASE).protocol);
  } catch {
    return false;
  }
}

export function safeLinkHref(href: string) {
  return hasProtocol(href, LINK_PROTOCOLS) ? href : undefined;
}

export function safeImageSrc(src: string) {
  return hasProtocol(src, IMAGE_PROTOCOLS) ? src : undefined;
}
