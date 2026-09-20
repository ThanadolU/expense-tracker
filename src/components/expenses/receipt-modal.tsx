"use client";

import { useEffect } from "react";

type ReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string;
  title?: string;
};

export function ReceiptModal({
  isOpen,
  onClose,
  receiptUrl,
  title = "Receipt",
}: ReceiptModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPdf = receiptUrl.toLowerCase().includes(".pdf");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 min-w-0">
            <svg
              className="h-5 w-5 text-zinc-500 dark:text-zinc-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            <h3
              id="receipt-modal-title"
              className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Open original
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-zinc-100/50 p-4 dark:bg-zinc-950/50">
          {isPdf ? (
            <iframe
              src={receiptUrl}
              className="h-[65vh] w-full rounded border-0"
              title="Receipt PDF"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={receiptUrl}
              alt="Receipt preview"
              className="max-h-[70vh] w-auto max-w-full rounded-md object-contain shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
