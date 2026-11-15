"use client";

import { HidePreviewIcon, ShowPreviewIcon } from "@/components/icons";
import { openRestoreGate } from "@/lib/restore-gate";
import useHydrated from "@/lib/use-hydrated";
import { activeDocument, toFileName } from "@/lib/workspace";
import {
  deleteDocument,
  saveDocument,
  useWorkspace,
} from "@/lib/workspace-store";
import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Announcer from "./announcer";
import AppHeader from "./app-header";
import DeleteDialog from "./delete-dialog";
import EditorPane from "./editor-pane";
import PreviewPane from "./preview-pane";
import Sidebar from "./sidebar";
import useAnnouncement from "./use-announcement";

export default function MarkdownApp() {
  const workspace = useWorkspace();
  const isHydrated = useHydrated();
  const sidebarId = useId();
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPreviewOnly, setIsPreviewOnly] = useState(false);
  const [nameToDelete, setNameToDelete] = useState("");
  const [announcement, announce] = useAnnouncement();
  const { id, name, content } = activeDocument(workspace);

  useEffect(() => {
    if (isHydrated) openRestoreGate();
  }, [isHydrated]);

  function save() {
    saveDocument();
    announce("Document saved");
  }

  function askToDelete() {
    flushSync(() => setNameToDelete(toFileName(name)));
    deleteDialogRef.current?.showModal();
  }

  function confirmDelete() {
    const dialog = deleteDialogRef.current;
    if (!dialog?.open) return;

    deleteDocument();
    dialog.close();
    announce("Document deleted");
  }

  return (
    <div className="h-dvh overflow-clip">
      <div
        data-sidebar-open={isSidebarOpen || undefined}
        className="relative flex h-full flex-col data-sidebar-open:translate-x-62.5 motion-safe:transition-transform motion-safe:duration-300"
      >
        <AppHeader
          documentName={name}
          sidebarId={sidebarId}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          onDelete={askToDelete}
          onSave={save}
          sidebar={
            <Sidebar
              id={sidebarId}
              isOpen={isSidebarOpen}
              documents={workspace.documents}
              activeId={id}
            />
          }
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
      <DeleteDialog
        ref={deleteDialogRef}
        documentName={nameToDelete}
        onCancel={() => deleteDialogRef.current?.close()}
        onConfirm={confirmDelete}
      />
      <Announcer announcement={announcement} />
    </div>
  );
}
