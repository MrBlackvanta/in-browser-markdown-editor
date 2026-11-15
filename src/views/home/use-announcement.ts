import { useState } from "react";

export type Announcement = { message: string; id: number };

export default function useAnnouncement() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  function announce(message: string) {
    setAnnouncement((previous) => ({ message, id: (previous?.id ?? 0) + 1 }));
  }

  return [announcement, announce] as const;
}
