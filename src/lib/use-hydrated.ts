import { useSyncExternalStore } from "react";

function subscribeToNothing() {
  return () => {};
}

export default function useHydrated() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}
