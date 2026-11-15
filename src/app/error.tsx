"use client";

import { ErrorPanel } from "@/components/layout";

type HomeErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function HomeError({ reset }: HomeErrorProps) {
  return (
    <ErrorPanel
      title="Something went wrong"
      description="The editor couldn’t be shown. Your documents are still saved in this browser."
    >
      <button
        type="button"
        onClick={reset}
        className="h-10 w-full rounded-sm bg-action text-title text-white hover:bg-accent-hover motion-safe:transition-[background-color]"
      >
        Try again
      </button>
    </ErrorPanel>
  );
}
