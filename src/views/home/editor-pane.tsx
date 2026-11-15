import { editDocument } from "@/lib/workspace-store";
import PaneBar from "./pane-bar";

export default function EditorPane({ content }: { content: string }) {
  return (
    <div className="flex min-h-0 flex-col group-data-preview-only/panes:hidden">
      <PaneBar id="markdown-label" label="Markdown" />
      <textarea
        aria-labelledby="markdown-label"
        value={content}
        onChange={(event) => editDocument(event.target.value)}
        className="grow resize-none bg-page p-4 font-mono text-body text-ink caret-accent outline-transparent in-data-restoring:invisible md:pt-2.25"
      />
    </div>
  );
}
