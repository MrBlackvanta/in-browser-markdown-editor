export type MarkdownDocument = {
  id: string;
  name: string;
  content: string;
  createdAt: string;
};

export type Draft = Pick<MarkdownDocument, "name" | "content">;

export type Workspace = {
  documents: readonly MarkdownDocument[];
  drafts: Readonly<Record<string, Draft>>;
  activeId: string;
};
