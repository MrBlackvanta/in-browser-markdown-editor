import { type Ref, useId } from "react";

type DeleteDialogProps = {
  ref: Ref<HTMLDialogElement>;
  documentName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteDialog({
  ref,
  documentName,
  onCancel,
  onConfirm,
}: DeleteDialogProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const textId = `${id}-text`;

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={textId}
      className="group/dialog size-full max-h-none max-w-none bg-transparent p-4 backdrop:bg-transparent open:grid open:backdrop:bg-scrim motion-safe:transition-[display,overlay] motion-safe:transition-discrete motion-safe:duration-200 motion-safe:backdrop:transition-[background-color] motion-safe:backdrop:duration-200 starting:open:backdrop:bg-transparent"
    >
      <div className="m-auto w-full max-w-85.75 scale-96 rounded-sm bg-dialog p-6 group-open/dialog:scale-100 motion-safe:transition-transform motion-safe:duration-200 starting:group-open/dialog:scale-96">
        <h2
          id={titleId}
          tabIndex={-1}
          className="font-serif text-h4 text-ink-strong"
        >
          Delete this document?
        </h2>
        <p
          id={textId}
          className="mt-4 font-serif text-body wrap-anywhere text-muted"
        >
          Are you sure you want to delete the ‘{documentName}’ document and its
          contents? This action cannot be reversed.
        </p>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-4 h-10 w-full rounded-sm bg-action text-title text-white hover:bg-accent-hover motion-safe:transition-[background-color]"
        >
          Confirm & Delete
        </button>
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onCancel}
        className="absolute inset-0 -z-10 cursor-default"
      />
    </dialog>
  );
}
