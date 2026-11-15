import { useSyncExternalStore } from "react";
import { DARK_SCHEME_QUERY, THEME_STORAGE_KEY } from "./theme";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();
let darkScheme: MediaQueryList | null = null;

function storedTheme(): Theme | null {
  try {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    return theme === "dark" || theme === "light" ? theme : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return matchMedia(DARK_SCHEME_QUERY).matches ? "dark" : "light";
}

function paint(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  listeners.forEach((onChange) => onChange());
}

function followOtherTab({ key }: StorageEvent) {
  if (key !== THEME_STORAGE_KEY && key !== null) return;
  paint(storedTheme() ?? systemTheme());
}

function followSystem() {
  if (storedTheme() === null) paint(systemTheme());
}

function subscribe(onChange: () => void) {
  if (listeners.size === 0) {
    darkScheme = matchMedia(DARK_SCHEME_QUERY);
    darkScheme.addEventListener("change", followSystem);
    addEventListener("storage", followOtherTab);
  }
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (listeners.size > 0) return;
    darkScheme?.removeEventListener("change", followSystem);
    removeEventListener("storage", followOtherTab);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function toggleTheme() {
  const theme = getSnapshot() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
  paint(theme);
}
