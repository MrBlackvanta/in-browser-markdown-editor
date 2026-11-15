import {
  CloseIcon,
  DeleteIcon,
  Logo,
  MenuIcon,
  SaveIcon,
} from "@/components/icons";
import DocumentNameField from "./document-name-field";

type AppHeaderProps = {
  documentName: string;
  sidebarId: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onDelete: () => void;
  onSave: () => void;
  sidebar: React.ReactNode;
};

export default function AppHeader({
  documentName,
  sidebarId,
  isSidebarOpen,
  onToggleSidebar,
  onDelete,
  onSave,
  sidebar,
}: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center bg-bar md:h-18">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={isSidebarOpen}
        aria-controls={sidebarId}
        onClick={onToggleSidebar}
        className="grid size-14 shrink-0 place-items-center bg-menu text-white hover:bg-accent focus-visible:-outline-offset-2 focus-visible:outline-white motion-safe:transition-[background-color] md:size-18"
      >
        {isSidebarOpen ? (
          <CloseIcon className="size-4.5 md:size-6" />
        ) : (
          <MenuIcon className="h-3.5 w-5.75 md:h-4.5 md:w-7.5" />
        )}
      </button>
      {sidebar}
      <Logo className="ml-6 hidden shrink-0 text-white lg:block" />
      <div className="ml-7.5 hidden h-10 w-px shrink-0 bg-divider lg:block" />
      <DocumentNameField name={documentName} />
      <button
        type="button"
        aria-label="Delete document"
        aria-haspopup="dialog"
        onClick={onDelete}
        className="mx-3 shrink-0 p-3 text-icon hover:text-accent motion-safe:transition-[color]"
      >
        <DeleteIcon />
      </button>
      <button
        type="button"
        onClick={onSave}
        className="mr-2 flex size-10 shrink-0 items-center justify-center gap-1.75 rounded-sm bg-action text-title text-white hover:bg-accent-hover motion-safe:transition-[background-color] md:mr-4 md:w-38 md:justify-start md:px-4"
      >
        <SaveIcon />
        <span className="sr-only md:not-sr-only">Save Changes</span>
      </button>
    </header>
  );
}
