import type { Announcement } from "./use-announcement";

export default function Announcer({
  announcement,
}: {
  announcement: Announcement | null;
}) {
  return (
    <output className="sr-only">
      {announcement && (
        <span key={announcement.id}>{announcement.message}</span>
      )}
    </output>
  );
}
