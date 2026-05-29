import { useEffect, useId, useRef, useState } from "react";

type ConfirmDialogProps = {
  cancelLabel: string;
  confirmLabel: string;
  confirmingLabel?: string;
  isConfirming?: boolean;
  isOpen: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

export function ConfirmDialog({
  cancelLabel,
  confirmLabel,
  confirmingLabel,
  isConfirming = false,
  isOpen,
  message,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const messageId = useId();
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      const timeoutId = window.setTimeout(() => {
        setShouldRender(true);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      setShouldRender(false);
    }, 160);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isConfirming) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirming, isOpen, onCancel]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`confirm-dialog-backdrop ${isOpen ? "confirm-dialog-open" : "confirm-dialog-closing"}`}
      onClick={isConfirming ? undefined : onCancel}
      role="presentation"
    >
      <section
        aria-labelledby={titleId}
        aria-describedby={messageId}
        aria-modal="true"
        className="confirm-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div>
          <h2 id={titleId}>{title}</h2>
          <p className="muted" id={messageId}>
            {message}
          </p>
        </div>

        <div className="confirm-dialog-actions">
          <button
            className="secondary-button"
            disabled={isConfirming}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="danger-button"
            disabled={isConfirming}
            onClick={onConfirm}
            type="button"
          >
            {isConfirming ? confirmingLabel ?? confirmLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
