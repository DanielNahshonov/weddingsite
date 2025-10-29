"use client";

import { useState } from "react";

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);

  const handleCopy = async () => {
    if (pending) return;
    setPending(true);
    try {
      const absoluteUrl = new URL(path, window.location.origin).toString();
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link", error);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900 disabled:opacity-50"
      disabled={pending}
    >
      {copied ? "Скопировано!" : "Скопировать ссылку"}
    </button>
  );
}
