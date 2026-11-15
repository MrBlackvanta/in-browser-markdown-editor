import { Logo } from "@/components/icons";
import { Signature } from "@/components/layout";
import type { MarkdownDocument } from "@/data";
import { createDocument } from "@/lib/workspace-store";
import DocumentList from "./document-list";
import ThemeSwitch from "./theme-switch";

type SidebarProps = {
  id: string;
  isOpen: boolean;
  documents: readonly MarkdownDocument[];
  activeId: string;
};

export default function Sidebar({
  id,
  isOpen,
  documents,
  activeId,
}: SidebarProps) {
  return (
    <nav
      id={id}
      aria-labelledby="documents-label"
      inert={!isOpen}
      className="absolute inset-y-0 right-full flex w-62.5 flex-col bg-sidebar px-6 pb-8 scheme-dark md:pb-6 lg:pt-7"
    >
      <div className="flex h-18 shrink-0 items-center lg:hidden">
        <Logo className="text-white" />
      </div>
      <span
        id="documents-label"
        className="text-label text-sidebar-muted uppercase"
      >
        My documents
      </span>
      <button
        type="button"
        onClick={createDocument}
        className="mt-7 h-10 shrink-0 rounded-sm bg-action text-title text-white hover:bg-accent-hover motion-safe:transition-[background-color]"
      >
        <span aria-hidden="true">+ </span>New Document
      </button>
      <DocumentList documents={documents} activeId={activeId} />
      <ThemeSwitch />
      <Signature />
    </nav>
  );
}
