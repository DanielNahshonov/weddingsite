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

  const orderedValues = direction === "rtl" ? [...formatted].reverse() : formatted;
  const orderedLabels = direction === "rtl" ? [...labels].reverse() : labels;

  return (
    <div className="mt-10 space-y-6">
      <div
        className="mx-auto w-full max-w-3xl text-center"
        dir={direction}
      >
        <div
          className="grid gap-2 text-center sm:gap-4"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
        >
          {orderedValues.map((value, index) => (
            <div
              key={orderedLabels[index]}
              className="flex min-w-0 flex-col items-center"
            >
              <div className="whitespace-nowrap text-[26px] font-light tracking-[0.1em] text-zinc-800 sm:text-4xl">
                {value}
                {index < orderedValues.length - 1 && (
                  <span className="mx-0.5 text-zinc-400">:</span>
                )}
              </div>
              <div className="mt-2 text-[9px] uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
                {orderedLabels[index]}
              </div>
            </div>
          ))}
        </div>
      </div>
      {isComplete && (
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">
          {completeLabel}
        </p>
      )}
    </div>
  );
}
