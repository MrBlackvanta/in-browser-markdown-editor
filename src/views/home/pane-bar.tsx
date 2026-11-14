export default function PaneBar({ id, label }: { id: string; label: string }) {
  return (
    <div className="flex h-10.5 shrink-0 items-center bg-pane px-4">
      <span id={id} className="text-label text-muted uppercase">
        {label}
      </span>
    </div>
  );
}
