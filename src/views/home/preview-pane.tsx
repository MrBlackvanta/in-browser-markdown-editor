import { useDeferredValue } from "react";
import MarkdownPreview from "./markdown-preview";
import PaneBar from "./pane-bar";

export default function PreviewPane({ content }: { content: string }) {
  const deferredContent = useDeferredValue(content);

  return (
    <div className="hidden min-h-0 flex-col border-rule group-data-preview-only/panes:flex md:flex md:border-l md:group-data-preview-only/panes:border-l-0">
      <PaneBar id="preview-label" label="Preview" />
      <article
        aria-labelledby="preview-label"
        tabIndex={0}
        className="grow overflow-y-auto px-5 py-4 focus-visible:-outline-offset-2 md:px-6 md:py-5.5"
      >
        <div className="mx-auto max-w-2xl space-y-5 font-serif text-body wrap-anywhere text-muted">
          <MarkdownPreview markdown={deferredContent} />
        </div>
      </article>
    </div>
  );
}
