"use client";

import { useState, useRef, useEffect, useCallback, type ChangeEvent } from "react";

type ReceiptUploadInputProps = {
  name?: string;
  existingReceiptUrl?: string | null;
  disabled?: boolean;
};

export function ReceiptUploadInput({
  name = "receipt",
  existingReceiptUrl,
  disabled = false,
}: ReceiptUploadInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleClearSelected = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setSelectedFile(null);
    setError(null);
    setRemoveExisting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Automatically clear input and preview when the parent form resets
  useEffect(() => {
    const form = fileInputRef.current?.form;
    if (!form) return;
    form.addEventListener("reset", handleClearSelected);
    return () => {
      form.removeEventListener("reset", handleClearSelected);
    };
  }, [handleClearSelected]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });

    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // 5MB client check
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be smaller than 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
    setRemoveExisting(false);
  };

  const handleToggleRemoveExisting = () => {
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setRemoveExisting((prev) => !prev);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasExisting = Boolean(existingReceiptUrl) && !removeExisting;

  return (
    <div className="space-y-2">
      <input type="hidden" name="removeReceipt" value={removeExisting ? "true" : "false"} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        name={name}
        id={name}
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        disabled={disabled}
        onChange={handleFileChange}
        className="sr-only"
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* State 1: Existing receipt in edit mode */}
      {hasExisting && !selectedFile && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Current Receipt attached</p>
              <a
                href={existingReceiptUrl!}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline dark:text-blue-400"
              >
                View file
              </a>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="rounded px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Replace
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={handleToggleRemoveExisting}
              className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* State 2: Existing receipt marked for removal */}
      {removeExisting && !selectedFile && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-red-200 bg-red-50/50 p-2.5 dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-xs text-red-700 dark:text-red-300">
            Receipt will be removed upon saving.
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={handleToggleRemoveExisting}
            className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Undo
          </button>
        </div>
      )}

      {/* State 3: Local file selected */}
      {selectedFile && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="h-10 w-10 shrink-0 rounded object-cover border border-zinc-200 dark:border-zinc-700"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {formatSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={handleClearSelected}
            className="rounded px-2 py-1 text-xs font-medium text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
          >
            Clear
          </button>
        </div>
      )}

      {/* State 4: No file selected yet */}
      {!hasExisting && !selectedFile && !removeExisting && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50/50 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-100/50 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/40"
        >
          <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Attach receipt (image or PDF, max 5MB)
        </button>
      )}
    </div>
  );
}
