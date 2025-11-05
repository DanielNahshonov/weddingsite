import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminAuthenticated } from "@/lib/auth";
import { listGuests } from "@/lib/guest-repository";
import {
  createTablePlaceholder,
  getSeatingPlan,
  removeTable,
  replaceTable,
  updateSeatingPlan,
  upsertSeatingPlan,
  type SeatingPlanDocument,
  type SeatingPlanInput,
  type SeatingTable,
} from "@/lib/seating-plan-repository";
import { PlanCanvas } from "./plan-canvas";

export const dynamic = "force-dynamic";

const DEFAULT_PLAN: SeatingPlanInput = {
  slug: "main-hall",
  name: "Основной зал",
  width: 1200,
  height: 800,
  tables: [],
};

const TABLE_TYPES = [
  { value: "round", label: "Круглый стол" },
  { value: "rect", label: "Прямоугольный стол" },
] as const;

type GuestInfo = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  partySize: number;
  attending: boolean | null;
};

async function loadPlanOrCreate(): Promise<SeatingPlanDocument> {
  const existing = await getSeatingPlan(DEFAULT_PLAN.slug);
  if (existing) {
    return existing;
  }
  const created = await upsertSeatingPlan({
    slug: DEFAULT_PLAN.slug,
    name: DEFAULT_PLAN.name,
    width: DEFAULT_PLAN.width,
    height: DEFAULT_PLAN.height,
    tables: [],
  });
  if (!created) {
    throw new Error("Не удалось создать план рассадки");
  }
  return created;
}

function sanitizeTableType(type: FormDataEntryValue | null): SeatingTable["type"] {
  if (type === "rect" || type === "round") {
    return type;
  }
  return "round";
}

function parseNumber(
  value: FormDataEntryValue | null,
  fallback: number,
  options?: { min?: number; max?: number },
) {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (typeof options?.min === "number" && parsed < options.min) {
    return options.min;
  }
  if (typeof options?.max === "number" && parsed > options.max) {
    return options.max;
  }
  return parsed;
}

async function updatePlanDetailsAction(formData: FormData) {
  "use server";

  await requireAdminAuthenticated();
  await loadPlanOrCreate();

  const name = formData.get("name");
  const width = parseNumber(formData.get("width"), DEFAULT_PLAN.width, { min: 200 });
  const height = parseNumber(formData.get("height"), DEFAULT_PLAN.height, {
    min: 200,
  });

  if (typeof name !== "string" || name.trim() === "") {
    redirect("/admin/seating?error=invalid-plan");
  }

  await updateSeatingPlan(DEFAULT_PLAN.slug, {
    name: name.trim(),
    width,
    height,
  });

  revalidatePath("/admin/seating");
  redirect("/admin/seating?status=plan-updated");
}

async function addTableAction(formData: FormData) {
  "use server";

  await requireAdminAuthenticated();

  const plan = await loadPlanOrCreate();

  const labelRaw = formData.get("label");
  const label =
    typeof labelRaw === "string" && labelRaw.trim()
      ? labelRaw.trim()
      : `Стол ${plan.tables.length + 1}`;
  const type = sanitizeTableType(formData.get("type"));
  const capacity = parseNumber(formData.get("capacity"), 8, { min: 1, max: 30 });
  const x = parseNumber(formData.get("x"), plan.width / 2, {
    min: 0,
    max: plan.width,
  });
  const y = parseNumber(formData.get("y"), plan.height / 2, {
    min: 0,
    max: plan.height,
  });

  const newTable = createTablePlaceholder({
    label,
    type,
    capacity,
    x,
    y,
    rotation: 0,
    guestIds: [],
  });

  await updateSeatingPlan(DEFAULT_PLAN.slug, {
    tables: [...plan.tables, newTable],
  });

  revalidatePath("/admin/seating");
  redirect("/admin/seating?status=table-added");
}

async function updateTableAction(formData: FormData) {
  "use server";

  await requireAdminAuthenticated();

  const plan = await loadPlanOrCreate();
  const tableId = formData.get("tableId");

  if (typeof tableId !== "string" || !tableId) {
    redirect("/admin/seating?error=unknown-table");
  }

  const target = plan.tables.find((table) => table.id === tableId);
  if (!target) {
    redirect("/admin/seating?error=unknown-table");
  }

  const label =
    typeof formData.get("label") === "string" && formData.get("label")!.trim()
      ? (formData.get("label") as string).trim()
      : target.label;
  const type = sanitizeTableType(formData.get("type"));
  const capacity = parseNumber(formData.get("capacity"), target.capacity, {
    min: 1,
    max: 30,
  });
  const x = parseNumber(formData.get("x"), target.x, {
    min: 0,
    max: plan.width,
  });
  const y = parseNumber(formData.get("y"), target.y, {
    min: 0,
    max: plan.height,
  });
  const rotation = parseNumber(formData.get("rotation"), target.rotation, {
    min: -180,
    max: 180,
  });

  await replaceTable(DEFAULT_PLAN.slug, {
    ...target,
    label,
    type,
    capacity,
    x,
    y,
    rotation,
  });

  revalidatePath("/admin/seating");
  redirect("/admin/seating?status=table-updated");
}

async function removeTableAction(formData: FormData) {
  "use server";

  await requireAdminAuthenticated();

  const tableId = formData.get("tableId");
  if (typeof tableId !== "string" || !tableId) {
    redirect("/admin/seating?error=unknown-table");
  }

  const result = await removeTable(DEFAULT_PLAN.slug, tableId);
  if (!result) {
    redirect("/admin/seating?error=unknown-table");
  }
  revalidatePath("/admin/seating");
  redirect("/admin/seating?status=table-removed");
}

async function moveTablePositionAction(payload: { tableId: string; x: number; y: number }) {
  "use server";

  await requireAdminAuthenticated();

  const plan = await loadPlanOrCreate();
  const table = plan.tables.find((item) => item.id === payload.tableId);
  if (!table) {
    return;
  }

  const clampedX = Math.max(0, Math.min(Math.round(payload.x), plan.width));
  const clampedY = Math.max(0, Math.min(Math.round(payload.y), plan.height));

  await replaceTable(DEFAULT_PLAN.slug, {
    ...table,
    x: clampedX,
    y: clampedY,
  });

  revalidatePath("/admin/seating");
}

async function assignGuestToTableAction(formData: FormData) {
  "use server";

  await requireAdminAuthenticated();

  const tableId = formData.get("tableId");
  const guestId = formData.get("guestId");

  if (typeof tableId !== "string" || !tableId || typeof guestId !== "string" || !guestId) {
    redirect("/admin/seating?error=guest-not-found");
  }

  const plan = await loadPlanOrCreate();
  const guests = await listGuests();
  const guestEntries: GuestInfo[] = guests.map((guest) => ({
    id: guest._id.toHexString(),
    firstName: guest.firstName,
    lastName: guest.lastName,
    phone: guest.phone,
    partySize: guest.partySize,
    attending: guest.attending,
  }));
  const guestMap = new Map(guestEntries.map((guest) => [guest.id, guest]));

  const guest = guestMap.get(guestId);
  if (!guest) {
    redirect("/admin/seating?error=guest-not-found");
  }

  const tables = plan.tables.map((table) =>
    table.guestIds.includes(guestId)
      ? {
          ...table,
          guestIds: table.guestIds.filter((id) => id !== guestId),
        }
      : table,
  );

  const targetIndex = tables.findIndex((table) => table.id === tableId);
  if (targetIndex === -1) {
    redirect("/admin/seating?error=unknown-table");
  }

  const targetTable = tables[targetIndex];
  const occupiedSeats = targetTable.guestIds.reduce((sum, id) => {
    return sum + (guestMap.get(id)?.partySize ?? 0);
  }, 0);

  if (occupiedSeats + guest.partySize > targetTable.capacity) {
    redirect("/admin/seating?error=table-capacity");
  }

  tables[targetIndex] = {
    ...targetTable,
    guestIds: [...targetTable.guestIds, guestId],
  };

  await updateSeatingPlan(DEFAULT_PLAN.slug, { tables });
  revalidatePath("/admin/seating");
  redirect("/admin/seating?status=guest-assigned");
}

async function removeGuestFromTableAction(formData: FormData) {
  "use server";

  await requireAdminAuthenticated();

  const tableId = formData.get("tableId");
  const guestId = formData.get("guestId");

  if (typeof tableId !== "string" || !tableId || typeof guestId !== "string" || !guestId) {
    redirect("/admin/seating?error=guest-not-found");
  }

  const plan = await loadPlanOrCreate();
  const tables = plan.tables.map((table) =>
    table.id === tableId
      ? {
          ...table,
          guestIds: table.guestIds.filter((id) => id !== guestId),
        }
      : table,
  );

  await updateSeatingPlan(DEFAULT_PLAN.slug, { tables });
  revalidatePath("/admin/seating");
  redirect("/admin/seating?status=guest-removed");
}

export default async function AdminSeatingPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  await requireAdminAuthenticated();
  const plan = await loadPlanOrCreate();
  const guests = await listGuests();

  const statusParam = Array.isArray(searchParams?.status)
    ? searchParams?.status[0]
    : searchParams?.status;
  const errorParam = Array.isArray(searchParams?.error)
    ? searchParams?.error[0]
    : searchParams?.error;

  const statusMessages: Record<string, string> = {
    "plan-updated": "Параметры зала обновлены.",
    "table-added": "Стол добавлен.",
    "table-updated": "Данные стола сохранены.",
    "table-removed": "Стол удалён.",
    "guest-assigned": "Гость посажен за стол.",
    "guest-removed": "Гость снят со стола.",
  };

  const errorMessages: Record<string, string> = {
    "invalid-plan": "Заполните название и размеры зала.",
    "unknown-table": "Стол не найден. Попробуйте обновить страницу.",
    "guest-not-found": "Гость не найден.",
    "table-capacity": "На столе недостаточно мест для этого гостя.",
  };

  const activeMessage =
    (statusParam && statusMessages[statusParam]) ||
    (errorParam && errorMessages[errorParam]);
  const isError = Boolean(errorParam && errorMessages[errorParam]);

  const totalGuests = guests.length;
  const guestEntries: GuestInfo[] = guests.map((guest) => ({
    id: guest._id.toHexString(),
    firstName: guest.firstName,
    lastName: guest.lastName,
    phone: guest.phone,
    partySize: guest.partySize,
    attending: guest.attending,
  }));
  const guestMap = new Map(guestEntries.map((guest) => [guest.id, guest]));
  const guestSeatLookup = Object.fromEntries(guestEntries.map((guest) => [guest.id, guest.partySize]));
  const totalSeatCount = guestEntries.reduce((sum, guest) => sum + guest.partySize, 0);

  const assignedGuestIds = new Set<string>();
  plan.tables.forEach((table) => {
    table.guestIds.forEach((guestId) => {
      assignedGuestIds.add(guestId);
    });
  });
  const assignedSeatCount = Array.from(assignedGuestIds).reduce(
    (sum, guestId) => sum + (guestMap.get(guestId)?.partySize ?? 0),
    0,
  );
  const unassignedSeatCount = Math.max(totalSeatCount - assignedSeatCount, 0);
  const unassignedGuests = guestEntries.filter((guest) => !assignedGuestIds.has(guest.id));

  return (
    <div className="min-h-screen bg-zinc-100 pb-16">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              План рассадки гостей
            </h1>
            <p className="text-sm text-zinc-500">
              Создаём схему зала, расставляем столы и помогают посадить гостей.
            </p>
          </div>
          <a
            href="/admin"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900"
          >
            Назад к админке
          </a>
        </div>
      </header>

      <main className="mx-auto mt-10 flex max-w-6xl flex-col gap-10 px-6">
        {activeMessage && (
          <div
            className={`rounded-3xl px-5 py-4 text-sm ${
              isError
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {activeMessage}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <PlanCanvas
            width={plan.width}
            height={plan.height}
            tables={plan.tables}
            guestSeatLookup={guestSeatLookup}
            onTablePositionChange={moveTablePositionAction}
          />

          <aside className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">
                Параметры зала
              </h2>
              <form action={updatePlanDetailsAction} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Название схемы
                  </label>
                  <input
                    name="name"
                    defaultValue={plan.name}
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Ширина, px
                    <input
                      name="width"
                      type="number"
                      min={200}
                      defaultValue={plan.width}
                      className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                    />
                  </label>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Высота, px
                    <input
                      name="height"
                      type="number"
                      min={200}
                      defaultValue={plan.height}
                      className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Сохранить параметры
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">
                Добавить стол
              </h2>
              <form action={addTableAction} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Название
                  </label>
                  <input
                    name="label"
                    placeholder="Например, Стол семьи"
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Тип стола
                    <select
                      name="type"
                      defaultValue="round"
                      className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                    >
                      {TABLE_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Вместимость
                    <input
                      name="capacity"
                      type="number"
                      min={1}
                      max={30}
                      defaultValue={8}
                      className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Позиция X
                    <input
                      name="x"
                      type="number"
                      min={0}
                      max={plan.width}
                      placeholder={`${Math.round(plan.width / 2)}`}
                      className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                    />
                  </label>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Позиция Y
                    <input
                      name="y"
                      type="number"
                      min={0}
                      max={plan.height}
                      placeholder={`${Math.round(plan.height / 2)}`}
                      className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Добавить стол
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">
                Статистика гостей
              </h2>
              <dl className="mt-4 space-y-3 text-sm text-zinc-600">
                <div className="flex items-center justify-between">
                  <dt>Всего гостей</dt>
                  <dd className="font-semibold text-zinc-900">{totalGuests}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Посажено человек</dt>
                  <dd className="font-semibold text-zinc-900">
                    {assignedSeatCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Ещё без места</dt>
                  <dd className="font-semibold text-amber-600">
                    {unassignedSeatCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Столов на плане</dt>
                  <dd className="font-semibold text-zinc-900">
                    {plan.tables.length}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Управление столами
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            Здесь можно обновить параметры стола или удалить его. Скоро появится
            интерактивное перетаскивание.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {plan.tables.length === 0 && (
              <div className="md:col-span-2 rounded-3xl border border-dashed border-zinc-300 px-6 py-12 text-center text-sm text-zinc-500">
                Столов пока нет. Добавьте стол через форму справа.
              </div>
            )}

            {plan.tables.map((table) => {
              const assignedGuests = table.guestIds
                .map((guestId) => guestMap.get(guestId))
                .filter((guest): guest is GuestInfo => Boolean(guest));
              const occupiedSeats = assignedGuests.reduce((sum, guest) => sum + guest.partySize, 0);
              const remainingSeats = Math.max(table.capacity - occupiedSeats, 0);
              const canAssignGuests = unassignedGuests.length > 0 && remainingSeats > 0;

              return (
                <div
                  key={table.id}
                  className="rounded-3xl border border-zinc-200 p-5 shadow-sm"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">
                        {table.label}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Занято мест: {occupiedSeats} / {table.capacity}
                      </p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] uppercase tracking-wide text-zinc-500">
                      {table.type === "round" ? "Круглый" : "Прямоугольный"}
                    </span>
                  </div>

                  <form action={updateTableAction} className="mt-4 grid gap-3 text-sm">
                    <input type="hidden" name="tableId" value={table.id} />
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Название
                      <input
                        name="label"
                        defaultValue={table.label}
                        className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Тип
                        <select
                          name="type"
                          defaultValue={table.type}
                          className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                        >
                          {TABLE_TYPES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Вместимость
                        <input
                          name="capacity"
                          type="number"
                          min={1}
                          max={30}
                          defaultValue={table.capacity}
                          className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        X
                        <input
                          name="x"
                          type="number"
                          min={0}
                          max={plan.width}
                          defaultValue={table.x}
                          className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                        />
                      </label>
                      <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Y
                        <input
                          name="y"
                          type="number"
                          min={0}
                          max={plan.height}
                          defaultValue={table.y}
                          className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                        />
                      </label>
                      <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Поворот
                        <input
                          name="rotation"
                          type="number"
                          min={-180}
                          max={180}
                          defaultValue={table.rotation}
                          className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                        />
                      </label>
                    </div>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="submit"
                        className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
                      >
                        Сохранить изменения
                      </button>
                      <button
                        type="submit"
                        formAction={removeTableAction}
                        className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700"
                      >
                        Удалить стол
                      </button>
                    </div>
                  </form>

                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">Гости за столом</h4>
                      {assignedGuests.length === 0 ? (
                        <p className="mt-2 text-xs text-zinc-500">
                          Пока никого нет. Добавьте гостя из списка ниже.
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-3 text-sm">
                          {assignedGuests.map((guest) => (
                            <li
                              key={guest.id}
                              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-3 py-2"
                            >
                              <div>
                                <p className="font-medium text-zinc-900">
                                  {guest.firstName} {guest.lastName}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  Мест: {guest.partySize}
                                </p>
                              </div>
                              <form
                                action={removeGuestFromTableAction}
                                className="flex items-center gap-2"
                              >
                                <input type="hidden" name="tableId" value={table.id} />
                                <input type="hidden" name="guestId" value={guest.id} />
                                <button
                                  type="submit"
                                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 transition hover:border-red-200 hover:text-red-600"
                                >
                                  Убрать
                                </button>
                              </form>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">Добавить гостя</h4>
                      <form
                        action={assignGuestToTableAction}
                        className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center"
                      >
                        <input type="hidden" name="tableId" value={table.id} />
                        <select
                          name="guestId"
                          required
                          disabled={!canAssignGuests}
                          className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-100"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            {remainingSeats <= 0
                              ? "Нет свободных мест"
                              : unassignedGuests.length === 0
                                ? "Все гости уже посажены"
                                : "Выберите гостя"}
                          </option>
                          {unassignedGuests.map((guest) => (
                            <option key={guest.id} value={guest.id}>
                              {guest.firstName} {guest.lastName} • {guest.partySize} мест
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={!canAssignGuests}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
                        >
                          Посадить
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
