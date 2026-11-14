"use client";

import { HidePreviewIcon, ShowPreviewIcon } from "@/components/icons";
import { activeDocument } from "@/lib/workspace";
import { deleteDocument, useWorkspace } from "@/lib/workspace-store";
import { useState } from "react";
import AppHeader from "./app-header";
import EditorPane from "./editor-pane";
import PreviewPane from "./preview-pane";

export default function MarkdownApp() {
  const workspace = useWorkspace();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPreviewOnly, setIsPreviewOnly] = useState(false);
  const { name, content } = activeDocument(workspace);

  return (
    <div className="h-dvh overflow-clip">
      <div
        data-sidebar-open={isSidebarOpen || undefined}
        className="flex h-full flex-col data-sidebar-open:translate-x-62.5 motion-safe:transition-transform motion-safe:duration-300"
      >
        <AppHeader
          documentName={name}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          onDelete={deleteDocument}
        />
        <main
          data-preview-only={isPreviewOnly || undefined}
          className="group/panes relative grid min-h-0 grow auto-cols-fr grid-rows-1 md:grid-flow-col"
        >
          <button
            type="button"
            aria-label="Preview only"
            aria-pressed={isPreviewOnly}
            onClick={() => setIsPreviewOnly((previewOnly) => !previewOnly)}
            className="absolute top-0 right-0 grid h-10.5 w-12 place-items-center text-icon hover:text-accent focus-visible:-outline-offset-2 motion-safe:transition-[color] dark:text-bar-muted"
          >
            {isPreviewOnly ? <HidePreviewIcon /> : <ShowPreviewIcon />}
          </button>
          <EditorPane content={content} />
          <PreviewPane content={content} />
        </main>
      </div>
    </div>
  );
}
