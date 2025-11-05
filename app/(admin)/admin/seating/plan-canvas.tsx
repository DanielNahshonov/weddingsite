"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { SeatingTable } from "@/lib/seating-plan-repository";

function getTableDimensions(table: SeatingTable) {
  const base = 90;
  if (table.type === "rect") {
    const width = base * 1.4;
    const height = base * 0.7;
    return { width, height, radius: 0 };
  }

  const radius = base / 2;
  return { width: base, height: base, radius };
}

type TablePositionChangeHandler = (payload: { tableId: string; x: number; y: number }) => Promise<void>;

export function PlanCanvas({
  width,
  height,
  tables,
  onTablePositionChange,
  guestSeatLookup = {},
}: {
  width: number;
  height: number;
  tables: SeatingTable[];
  onTablePositionChange?: TablePositionChangeHandler;
  guestSeatLookup?: Record<string, number>;
}) {
  const aspectRatio = width && height ? `${width} / ${height}` : "4 / 3";
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [dragState, setDragState] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
    lastX: number;
    lastY: number;
    isPointerDown: boolean;
  } | null>(null);

  const tablesById = useMemo(() => {
    const map = new Map<string, SeatingTable>();
    tables.forEach((table) => map.set(table.id, table));
    return map;
  }, [tables]);

  const clamp = useCallback((value: number, max: number) => {
    if (Number.isNaN(value)) return 0;
    if (value < 0) return 0;
    if (value > max) return max;
    return value;
  }, []);

  const handlePointerDown = useCallback(
    (tableId: string) => (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!containerRef.current || width <= 0 || height <= 0) {
        return;
      }

      const table = tablesById.get(tableId);
      if (!table) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + (table.x / width) * rect.width;
      const centerY = rect.top + (table.y / height) * rect.height;
      const offsetX = event.clientX - centerX;
      const offsetY = event.clientY - centerY;

      setDragState({
        id: tableId,
        offsetX,
        offsetY,
        lastX: table.x,
        lastY: table.y,
        isPointerDown: true,
      });

      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [height, width, tablesById],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragState || !containerRef.current) {
        return;
      }
      if (width <= 0 || height <= 0) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clamp(
        ((event.clientX - rect.left - dragState.offsetX) / rect.width) * width,
        width,
      );
      const relativeY = clamp(
        ((event.clientY - rect.top - dragState.offsetY) / rect.height) * height,
        height,
      );

      const roundedX = Math.round(relativeX);
      const roundedY = Math.round(relativeY);

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              lastX: roundedX,
              lastY: roundedY,
              isPointerDown: true,
            }
          : prev,
      );
    },
    [clamp, dragState, height, width],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragState) {
        return;
      }

      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore if pointer capture was not set
      }

      const { id, lastX, lastY } = dragState;
      setDragState((prev) =>
        prev
          ? {
              ...prev,
              isPointerDown: false,
            }
          : prev,
      );

      if (!onTablePositionChange) {
        setDragState(null);
        return;
      }

      startTransition(async () => {
        try {
          await onTablePositionChange({ tableId: id, x: lastX, y: lastY });
        } catch (error) {
          console.error("Failed to persist table position", error);
        } finally {
          setDragState(null);
        }
      });
    },
    [dragState, onTablePositionChange],
  );

  const displayTables = useMemo(() => {
    if (!dragState) {
      return tables;
    }
    return tables.map((table) =>
      table.id === dragState.id
        ? {
            ...table,
            x: dragState.lastX,
            y: dragState.lastY,
          }
        : table,
    );
  }, [tables, dragState]);

  return (
    <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-4">
      <div
        ref={containerRef}
        className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-zinc-50 shadow-inner"
        style={{
          aspectRatio,
          cursor: dragState?.isPointerDown ? "grabbing" : "grab",
        }}
      >
        {displayTables.map((table) => {
          const { width: tableWidth, height: tableHeight, radius } = getTableDimensions(table);
          const left = width ? (table.x / width) * 100 : 50;
          const top = height ? (table.y / height) * 100 : 50;
          const occupiedSeats = table.guestIds.reduce((sum, guestId) => {
            return sum + (guestSeatLookup[guestId] ?? 0);
          }, 0);
          const remaining = Math.max(table.capacity - occupiedSeats, 0);
          const isDragging = dragState?.id === table.id && dragState.isPointerDown;

          return (
            <div
              key={table.id}
              onPointerDown={handlePointerDown(table.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-xs font-medium transition ${
                isDragging ? "shadow-lg ring-2 ring-emerald-400/60" : "shadow-sm"
              } ${isPending && !isDragging ? "opacity-90" : ""}`}
              style={{
                width: `${tableWidth}px`,
                height: `${tableHeight}px`,
                left: `${left}%`,
                top: `${top}%`,
                borderRadius: radius ? "9999px" : "18px",
                transform: `translate(-50%, -50%) rotate(${table.rotation}deg)`,
                backgroundColor: "rgba(244,244,245,0.9)",
                border: "1px solid rgb(228 228 231)",
                touchAction: "none",
              }}
            >
              <div className="flex flex-col items-center gap-1 px-2 text-center">
                <span className="text-sm font-semibold text-zinc-900">{table.label}</span>
                <span className="text-xs text-zinc-500">Мест: {table.capacity}</span>
                <span className="text-[11px] text-zinc-400">Свободно: {remaining}</span>
              </div>
            </div>
          );
        })}

        {displayTables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
            Пока нет столов. Добавьте первый стол справа.
          </div>
        )}
      </div>
    </div>
  );
}
