import { DocumentIcon } from "@/components/icons";
import { renameDocument } from "@/lib/workspace-store";

export default function DocumentNameField({ name }: { name: string }) {
  return (
    <div className="ml-6 flex min-w-0 grow items-center gap-4">
      <DocumentIcon className="shrink-0 text-white" />
      <div className="flex min-w-0 grow flex-col gap-0.75">
        <label
          htmlFor="document-name"
          className="sr-only text-caption text-bar-muted md:not-sr-only"
        >
          Document Name
        </label>
        <div className="relative max-w-100 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-white after:opacity-0 focus-within:after:opacity-100 hover:after:opacity-100">
          <input
            id="document-name"
            type="text"
            value={name}
            onChange={(event) => renameDocument(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="block w-full pb-0.5 text-title text-ellipsis text-white caret-accent outline-transparent in-data-restoring:invisible"
          />
        </div>
      </div>
    </div>
  );
}
