"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import toast from "react-hot-toast";
import type { RsvpActionPayload } from "./types";

interface RsvpFormProps {
  action: (state: RsvpActionPayload, formData: FormData) => Promise<RsvpActionPayload>;
  guestId: string;
  defaultPartySize: number;
  defaultAttending: boolean | null;
  hasResponse: boolean;
  direction: "ltr" | "rtl";
  labels: {
    attendeesLabel: string;
    attendingQuestion: string;
    attendingYes: string;
    attendingNo: string;
    submitLabel: string;
    toastConfirmed: string;
    toastDeclined: string;
    toastGeneric: string;
    toastError: string;
  };
}

const initialState: RsvpActionPayload = {
  status: "idle",
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-600"
    >
      {pending ? `${label}…` : label}
    </button>
  );
}

export function RsvpForm({
  action,
  guestId,
  defaultPartySize,
  defaultAttending,
  hasResponse,
  direction,
  labels,
}: RsvpFormProps) {
  const [state, formAction] = useActionState<RsvpActionPayload, FormData>(
    action,
    initialState,
  );
  const lastToastRef = useRef<number | undefined>(undefined);
  const { toastConfirmed, toastDeclined, toastGeneric, toastError } = labels;

  useEffect(() => {
    if (!state.timestamp || state.timestamp === lastToastRef.current) {
      return;
    }
    lastToastRef.current = state.timestamp;

    if (state.status === "success") {
      if (state.attending === true) {
        toast.success(toastConfirmed);
      } else if (state.attending === false) {
        toast.success(toastDeclined);
      } else {
        toast.success(toastGeneric);
      }
    } else if (state.status === "error") {
      toast.error(state.error ?? toastError);
    }
  }, [
    state.status,
    state.attending,
    state.error,
    state.timestamp,
    toastConfirmed,
    toastDeclined,
    toastGeneric,
    toastError,
  ]);

  return (
    <form
      action={formAction}
      className="mt-10 space-y-8 rounded-3xl border border-zinc-200 bg-white/90 p-8 shadow-sm backdrop-blur"
      dir={direction}
    >
      <input type="hidden" name="guestId" value={guestId} />

      <div>
        <label
          htmlFor="partySize"
          className="block text-sm font-semibold text-zinc-800"
        >
          {labels.attendeesLabel}
        </label>
        <input
          id="partySize"
          name="partySize"
          type="number"
          min={0}
          defaultValue={defaultPartySize}
          className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          required
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-zinc-800">
          {labels.attendingQuestion}
        </legend>
        <label className="flex items-center gap-3 rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-500">
          <input
            type="radio"
            name="attending"
            value="yes"
            defaultChecked={defaultAttending === true}
            className="h-4 w-4"
            required={!hasResponse}
          />
          <span>{labels.attendingYes}</span>
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-500">
          <input
            type="radio"
            name="attending"
            value="no"
            defaultChecked={defaultAttending === false}
            className="h-4 w-4"
            required={!hasResponse}
          />
          <span>{labels.attendingNo}</span>
        </label>
      </fieldset>

      <SubmitButton label={labels.submitLabel} />
    </form>
  );
}
