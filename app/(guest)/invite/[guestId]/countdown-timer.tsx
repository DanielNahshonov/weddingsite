"use client";

import { useEffect, useMemo, useState } from "react";

function getParts(targetDate: Date): [number, number, number, number] {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  const safeDiff = Math.max(diff, 0);

  const seconds = Math.floor(safeDiff / 1000);
  const days = Math.floor(seconds / (60 * 60 * 24));
  const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = seconds % 60;

  return [days, hours, minutes, secs];
}

interface CountdownTimerProps {
  target: string;
  labels: [string, string, string, string];
  direction: "ltr" | "rtl";
  completeLabel: string;
  initialParts?: [number, number, number, number];
}

export function CountdownTimer({
  target,
  labels,
  direction,
  completeLabel,
  initialParts,
}: CountdownTimerProps) {
  const targetDate = useMemo(() => new Date(target), [target]);
  const [parts, setParts] = useState<[number, number, number, number]>(() =>
    initialParts ?? getParts(targetDate),
  );
  const [isComplete, setIsComplete] = useState(() =>
    (initialParts ?? getParts(targetDate)).every((value) => value === 0),
  );

  useEffect(() => {
    if (initialParts) {
      setParts(initialParts);
      setIsComplete(initialParts.every((value) => value === 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialParts?.[0], initialParts?.[1], initialParts?.[2], initialParts?.[3]]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextParts = getParts(targetDate);
      setParts(nextParts);
      if (nextParts.every((value) => value === 0)) {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatted = parts.map((value) =>
    value.toLocaleString(undefined, { minimumIntegerDigits: 2 }),
  );

  return (
    <div className="mt-10 space-y-6">
      <div
        className="mx-auto flex w-full max-w-3xl flex-wrap justify-center gap-4"
        dir={direction}
      >
        {formatted.map((value, index) => (
          <div
            key={labels[index]}
            className="flex min-w-[120px] flex-1 basis-40 flex-col items-center rounded-3xl bg-white/80 px-4 py-5 text-center shadow-sm backdrop-blur transition hover:shadow-md"
          >
            <span className="text-3xl font-semibold tracking-wide text-zinc-900">
              {value}
            </span>
            <span className="mt-2 text-xs font-medium uppercase tracking-[0.3em] text-zinc-500">
              {labels[index]}
            </span>
          </div>
        ))}
      </div>
      {isComplete && (
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">
          {completeLabel}
        </p>
      )}
    </div>
  );
}
