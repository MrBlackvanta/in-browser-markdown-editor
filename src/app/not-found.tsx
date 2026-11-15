import { ErrorPanel } from "@/components/layout";
import { SITE_NAME } from "@/data";
import type { Metadata } from "next";
import Link from "next/link";

const description =
  "There’s nothing at this address. Your documents are saved in this browser, so the editor still has them.";

export const metadata: Metadata = {
  title: `${SITE_NAME} | Page not found`,
  description,
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <ErrorPanel title="Page not found" description={description}>
      <Link
        href="/"
        className="grid h-10 place-items-center rounded-sm bg-action text-title text-white hover:bg-accent-hover motion-safe:transition-[background-color]"
      >
        Back to the editor
      </Link>
    </ErrorPanel>
  );
}
