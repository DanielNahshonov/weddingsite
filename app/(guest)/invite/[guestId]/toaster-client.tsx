"use client";

import { Toaster } from "react-hot-toast";

export function InviteToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className: "rounded-2xl bg-zinc-900 text-white px-4 py-3 text-sm",
        duration: 4000,
      }}
    />
  );
}
