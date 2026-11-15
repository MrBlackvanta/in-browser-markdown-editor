import { DocumentIcon } from "@/components/icons";
import type { MarkdownDocument } from "@/data";
import { formatIsoDate } from "@/lib/dates";
import { selectDocument } from "@/lib/workspace-store";

type DocumentListProps = {
  documents: readonly MarkdownDocument[];
  activeId: string;
};

export default function DocumentList({
  documents,
  activeId,
}: DocumentListProps) {
  return (
    <ul className="my-6 min-h-0 grow space-y-6.5 overflow-y-auto">
      {documents.map(({ id, name, createdAt }) => (
        <li key={id} className="relative flex items-center gap-4">
          <DocumentIcon className="shrink-0 text-white" />
          <div className="flex min-w-0 flex-col gap-0.75">
            <time
              dateTime={createdAt}
              className="text-caption text-sidebar-muted"
            >
              {formatIsoDate(createdAt)}
            </time>
            <button
              type="button"
              aria-current={id === activeId}
              onClick={() => selectDocument(id)}
              className="text-left text-title wrap-anywhere text-white after:absolute after:inset-0 hover:text-accent motion-safe:transition-[color]"
            >
              {name}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
