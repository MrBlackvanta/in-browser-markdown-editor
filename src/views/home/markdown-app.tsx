"use client";

import { activeDocument } from "@/lib/workspace";
import { deleteDocument, useWorkspace } from "@/lib/workspace-store";
import { useState } from "react";
import AppHeader from "./app-header";

export default function MarkdownApp() {
  const workspace = useWorkspace();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { name } = activeDocument(workspace);

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
        <main className="grow" />
      </div>
    </div>
  );
}
