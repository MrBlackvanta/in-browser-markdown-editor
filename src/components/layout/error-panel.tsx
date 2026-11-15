import { Logo } from "@/components/icons";
import type { ReactNode } from "react";

type ErrorPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function ErrorPanel({
  title,
  description,
  children,
}: ErrorPanelProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center bg-bar px-4 md:h-18 md:px-6">
        <Logo className="text-white" />
      </header>
      <main className="grid grow place-items-center px-4 py-12">
        <div className="w-full max-w-85.75 text-center">
          <h1 className="font-serif text-h1 text-ink-strong">{title}</h1>
          <p className="mt-4 font-serif text-body text-balance text-muted">
            {description}
          </p>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
