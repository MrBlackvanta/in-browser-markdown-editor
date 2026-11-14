import type { Draft, MarkdownDocument, Workspace } from "@/data";

export type WorkspaceAction =
  | { type: "create"; document: MarkdownDocument }
  | { type: "select"; id: string }
  | { type: "rename"; name: string }
  | { type: "edit"; content: string }
  | { type: "save" }
  | { type: "delete"; replacement: MarkdownDocument };

const UNTITLED = "untitled-document";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function toFileName(name: string) {
  const stem = name.trim().replace(/\.md$/i, "").trimEnd();
  return `${stem || UNTITLED}.md`;
}

export function blankDocument(id: string, createdAt: string): MarkdownDocument {
  return { id, name: `${UNTITLED}.md`, content: "", createdAt };
}

function savedDocument({ documents, activeId }: Workspace) {
  return documents.find(({ id }) => id === activeId) ?? documents[0];
}

export function activeDocument(workspace: Workspace): MarkdownDocument {
  const saved = savedDocument(workspace);
  return { ...saved, ...workspace.drafts[saved.id] };
}

function withoutDraft(drafts: Workspace["drafts"], id: string) {
  return Object.fromEntries(
    Object.entries(drafts).filter(([key]) => key !== id),
  );
}

function withDraft(workspace: Workspace, change: Partial<Draft>): Workspace {
  const saved = savedDocument(workspace);
  const { name, content } = { ...activeDocument(workspace), ...change };
  const drafts = withoutDraft(workspace.drafts, saved.id);
  if (name === saved.name && content === saved.content)
    return { ...workspace, drafts };
  return { ...workspace, drafts: { ...drafts, [saved.id]: { name, content } } };
}

function save(workspace: Workspace): Workspace {
  const working = activeDocument(workspace);
  const saved = { ...working, name: toFileName(working.name) };
  return {
    ...workspace,
    documents: workspace.documents.map((document) =>
      document.id === saved.id ? saved : document,
    ),
    drafts: withoutDraft(workspace.drafts, saved.id),
  };
}

function remove(
  workspace: Workspace,
  replacement: MarkdownDocument,
): Workspace {
  const { id } = savedDocument(workspace);
  const remaining = workspace.documents.filter(
    (document) => document.id !== id,
  );
  const documents = remaining.length > 0 ? remaining : [replacement];
  return {
    documents,
    drafts: withoutDraft(workspace.drafts, id),
    activeId: documents[0].id,
  };
}

export function workspaceReducer(
  workspace: Workspace,
  action: WorkspaceAction,
): Workspace {
  switch (action.type) {
    case "create":
      return {
        ...workspace,
        documents: [action.document, ...workspace.documents],
        activeId: action.document.id,
      };
    case "select":
      return workspace.documents.some(({ id }) => id === action.id)
        ? { ...workspace, activeId: action.id }
        : workspace;
    case "rename":
      return withDraft(workspace, { name: action.name });
    case "edit":
      return withDraft(workspace, { content: action.content });
    case "save":
      return save(workspace);
    case "delete":
      return remove(workspace, action.replacement);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDraft(value: unknown): value is Draft {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.content === "string"
  );
}

function isDraftEntry(entry: [string, unknown]): entry is [string, Draft] {
  return isDraft(entry[1]);
}

function isDocument(value: unknown): value is MarkdownDocument {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    ISO_DATE.test(value.createdAt) &&
    !Number.isNaN(Date.parse(value.createdAt)) &&
    isDraft(value)
  );
}

export function parseWorkspace(value: unknown): Workspace | null {
  if (!isRecord(value)) return null;
  const { documents, drafts, activeId } = value;
  if (
    !Array.isArray(documents) ||
    !documents.every(isDocument) ||
    !isRecord(drafts) ||
    typeof activeId !== "string"
  )
    return null;

  const ids = new Set(documents.map(({ id }) => id));
  if (ids.size !== documents.length || !ids.has(activeId)) return null;

  const draftEntries = Object.entries(drafts);
  if (!draftEntries.every(isDraftEntry)) return null;
  if (draftEntries.some(([id]) => !ids.has(id))) return null;

  return { documents, drafts: Object.fromEntries(draftEntries), activeId };
}
