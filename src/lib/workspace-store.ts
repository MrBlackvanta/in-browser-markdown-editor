import { SEED_WORKSPACE, type Workspace } from "@/data";
import { useSyncExternalStore } from "react";
import { toIsoDate } from "./dates";
import {
  blankDocument,
  parseWorkspace,
  workspaceReducer,
  type WorkspaceAction,
} from "./workspace";

export const WORKSPACE_STORAGE_KEY = "markdown-workspace";

const listeners = new Set<() => void>();
let cached: Workspace | null = null;

function readStored(): Workspace {
  try {
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (stored !== null)
      return parseWorkspace(JSON.parse(stored)) ?? SEED_WORKSPACE;
  } catch {}
  return SEED_WORKSPACE;
}

function getSnapshot() {
  cached ??= readStored();
  return cached;
}

function getServerSnapshot() {
  return SEED_WORKSPACE;
}

function notify() {
  listeners.forEach((onChange) => onChange());
}

function syncFromOtherTab({ key }: StorageEvent) {
  if (key !== WORKSPACE_STORAGE_KEY && key !== null) return;
  cached = null;
  notify();
}

function subscribe(onChange: () => void) {
  if (listeners.size === 0) addEventListener("storage", syncFromOtherTab);
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) removeEventListener("storage", syncFromOtherTab);
  };
}

function dispatch(action: WorkspaceAction) {
  cached = workspaceReducer(getSnapshot(), action);
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(cached));
  } catch {}
  notify();
}

function insecureContextId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function newDocumentId() {
  return crypto.randomUUID?.() ?? insecureContextId();
}

function newDocument() {
  return blankDocument(newDocumentId(), toIsoDate(new Date()));
}

export function useWorkspace() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function createDocument() {
  dispatch({ type: "create", document: newDocument() });
}

export function selectDocument(id: string) {
  dispatch({ type: "select", id });
}

export function renameDocument(name: string) {
  dispatch({ type: "rename", name });
}

export function editDocument(content: string) {
  dispatch({ type: "edit", content });
}

export function saveDocument() {
  dispatch({ type: "save" });
}

export function deleteDocument() {
  dispatch({ type: "delete", replacement: newDocument() });
}
