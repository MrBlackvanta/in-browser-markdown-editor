import {
  decodeCharacterReferences,
  safeImageSrc,
  safeLinkHref,
} from "@/lib/markdown";
import { lexer, type MarkedToken, type Token, type Tokens } from "marked";

const HEADING_LEVELS = [
  { Tag: "h1", className: "text-h1 text-ink-strong" },
  { Tag: "h2", className: "text-h2 text-ink-strong" },
  { Tag: "h3", className: "text-h3 text-ink-strong" },
  { Tag: "h4", className: "text-h4 text-ink-strong" },
  { Tag: "h5", className: "text-h5 text-ink-strong" },
  { Tag: "h6", className: "text-h6 text-accent-ink" },
] as const;

const CELL_ALIGNMENT = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export default function MarkdownPreview({ markdown }: { markdown: string }) {
  return <TokenList tokens={lexer(markdown)} />;
}

function TokenList({ tokens }: { tokens: Token[] }) {
  return (tokens as MarkedToken[]).map((token, index) => (
    <MarkdownToken key={index} token={token} />
  ));
}

function MarkdownToken({ token }: { token: MarkedToken }) {
  switch (token.type) {
    case "heading":
      return <Heading heading={token} />;
    case "paragraph":
      return (
        <p>
          <TokenList tokens={token.tokens} />
        </p>
      );
    case "blockquote":
      return (
        <blockquote className="space-y-5 rounded-sm border-l-4 border-accent bg-well p-6 pl-5 font-bold text-ink-strong">
          <TokenList tokens={token.tokens} />
        </blockquote>
      );
    case "list":
      return <List list={token} />;
    case "code":
      return (
        <pre className="rounded-sm bg-well p-6 whitespace-pre-wrap text-ink-strong">
          <code>{token.text}</code>
        </pre>
      );
    case "table":
      return <Table table={token} />;
    case "hr":
      return <hr className="border-rule" />;
    case "html":
      return token.block ? (
        <p className="whitespace-pre-wrap">{token.text}</p>
      ) : (
        token.text
      );
    case "text":
      return token.tokens ? (
        <TokenList tokens={token.tokens} />
      ) : (
        decodeCharacterReferences(token.text)
      );
    case "escape":
      return token.text;
    case "strong":
      return (
        <strong>
          <TokenList tokens={token.tokens} />
        </strong>
      );
    case "em":
      return (
        <em>
          <TokenList tokens={token.tokens} />
        </em>
      );
    case "del":
      return (
        <del>
          <TokenList tokens={token.tokens} />
        </del>
      );
    case "codespan":
      return <code className="text-ink-strong">{token.text}</code>;
    case "br":
      return <br />;
    case "link":
      return <MarkdownLink link={token} />;
    case "image":
      return <MarkdownImage image={token} />;
    case "checkbox":
      return (
        <input
          type="checkbox"
          checked={token.checked}
          readOnly
          disabled
          aria-label="Done"
          className="mr-2 accent-accent"
        />
      );
    default:
      return null;
  }
}

function Heading({ heading }: { heading: Tokens.Heading }) {
  const { Tag, className } = HEADING_LEVELS[heading.depth - 1];
  return (
    <Tag className={className}>
      <TokenList tokens={heading.tokens} />
    </Tag>
  );
}

function List({ list }: { list: Tokens.List }) {
  const items = list.items.map((item, index) => (
    <li
      key={index}
      data-task={item.task || undefined}
      data-loose={item.loose || undefined}
      className="relative pl-4.75 data-loose:space-y-5"
    >
      <TokenList tokens={item.tokens} />
    </li>
  ));

  return list.ordered ? (
    <ol
      start={Number(list.start)}
      className="space-y-1 pl-6 *:before:absolute *:before:left-0 *:before:content-[counter(list-item)'.'] in-[li]:mt-1"
    >
      {items}
    </ol>
  ) : (
    <ul className="space-y-1 pl-6 *:before:absolute *:before:top-2.75 *:before:left-0 *:before:size-0.75 *:before:rounded-full *:before:bg-accent in-[li]:mt-1 *:data-task:before:hidden">
      {items}
    </ul>
  );
}

function Table({ table }: { table: Tokens.Table }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          {table.header.map((cell, index) => (
            <th
              key={index}
              className={`border border-rule px-4 py-2 font-bold text-ink-strong ${CELL_ALIGNMENT[cell.align ?? "left"]}`}
            >
              <TokenList tokens={cell.tokens} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, index) => (
              <td
                key={index}
                className={`border border-rule px-4 py-2 ${CELL_ALIGNMENT[cell.align ?? "left"]}`}
              >
                <TokenList tokens={cell.tokens} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MarkdownLink({ link }: { link: Tokens.Link }) {
  const href = safeLinkHref(decodeCharacterReferences(link.href));
  const text = <TokenList tokens={link.tokens} />;
  if (!href) return text;

  const title = link.title ? decodeCharacterReferences(link.title) : undefined;
  if (href.startsWith("#")) {
    return (
      <a href={href} title={title} className="underline">
        {text}
      </a>
    );
  }

  return (
    <a
      href={href}
      title={title}
      target="_blank"
      rel="noreferrer"
      className="underline"
    >
      {text}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function MarkdownImage({ image }: { image: Tokens.Image }) {
  const alt = decodeCharacterReferences(image.text);
  const src = safeImageSrc(decodeCharacterReferences(image.href));
  if (!src) return alt;

  return (
    <img
      src={src}
      alt={alt}
      title={image.title ? decodeCharacterReferences(image.title) : undefined}
      loading="lazy"
      className="inline"
    />
  );
}
