import { MongoServerError } from "mongodb";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  isAdminAuthenticated,
  requireAdminAuthenticated,
  verifyAdminPassword,
} from "@/lib/auth";
import {
  createGuest,
  deleteGuest,
  listGuests,
  markInvitationSent,
  updateGuest,
  type GuestLanguage,
} from "@/lib/guest-repository";
import { GuestCard } from "./guest-card";

export const dynamic = "force-dynamic";

const LANGUAGE_OPTIONS: Array<{ value: GuestLanguage; label: string }> = [
  { value: "ru", label: "Русский" },
  { value: "he", label: "עברית" },
];

type FilterId = "all" | "invited" | "not_invited" | "attending" | "declined" | "pending";

const FILTER_TITLES: Record<FilterId, string> = {
  all: "Все гости",
  invited: "Отправили приглашение",
  not_invited: "Ещё не отправили",
  attending: "Придут",
  declined: "Не придут",
  pending: "Ждём ответ",
};

async function loginAction(formData: FormData) {
  "use server";

  const password = formData.get("password");

  if (!password || typeof password !== "string" || password.length === 0) {
    redirect("/admin?error=invalid-credentials");
  }

  if (!verifyAdminPassword(password)) {
    redirect("/admin?error=invalid-credentials");
  }

  await createAdminSessionCookie();
  redirect("/admin");
}

async function logoutAction() {
  "use server";
  await clearAdminSessionCookie();
  redirect("/admin");
}

async function createGuestAction(formData: FormData) {
  "use server";

  await requireAdminAuthenticated();

  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const phone = formData.get("phone");
  const partySizeRaw = formData.get("partySize");
  const languageRaw = formData.get("language");

  const trimmedFirst = typeof firstName === "string" ? firstName.trim() : "";
  const trimmedLast = typeof lastName === "string" ? lastName.trim() : "";
  const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
  const partySize = Number(partySizeRaw);
  const language =
    typeof languageRaw === "string" && ["ru", "he"].includes(languageRaw)
      ? (languageRaw as GuestLanguage)
      : null;

  if (
    !trimmedFirst ||
    !trimmedLast ||
    !trimmedPhone ||
    !language ||
    !Number.isInteger(partySize) ||
    partySize <= 0
  ) {
    redirect("/admin?error=create-validation");
  }

  try {
    await createGuest({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      phone: trimmedPhone,
      partySize,
      attending: null,
      language,
    });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      redirect("/admin?error=duplicate-phone");
    }
    throw error;
  }

  revalidatePath("/admin");
  redirect("/admin?status=guest-created");
}

async function updateGuestAction(formData: FormData) {
  "use server";

  await requireAdminAuthenticated();

  const guestId = formData.get("guestId");
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const phone = formData.get("phone");
  const partySizeRaw = formData.get("partySize");
  const attendingRaw = formData.get("attending");
  const languageRaw = formData.get("language");

  if (!guestId || typeof guestId !== "string") {
    redirect("/admin?error=unknown-guest");
  }

  const payload: Parameters<typeof updateGuest>[1] = {};

  if (typeof firstName === "string") {
    const trimmed = firstName.trim();
    if (!trimmed) {
      redirect("/admin?error=update-validation");
    }
    payload.firstName = trimmed;
  }
  if (typeof lastName === "string") {
    const trimmed = lastName.trim();
    if (!trimmed) {
      redirect("/admin?error=update-validation");
    }
    payload.lastName = trimmed;
  }
  if (typeof phone === "string") {
    const trimmed = phone.trim();
    if (!trimmed) {
      redirect("/admin?error=update-validation");
    }
    payload.phone = trimmed;
  }
  if (typeof languageRaw === "string") {
    if (!["ru", "he"].includes(languageRaw)) {
      redirect("/admin?error=update-validation");
    }
    payload.language = languageRaw as GuestLanguage;
  }
  if (typeof partySizeRaw === "string") {
    if (partySizeRaw.trim() === "") {
      redirect("/admin?error=update-validation");
    }
    const partySize = Number(partySizeRaw);
    if (!Number.isInteger(partySize) || partySize < 0) {
      redirect("/admin?error=update-validation");
    }
    payload.partySize = partySize;
  }
  if (typeof attendingRaw === "string") {
    if (attendingRaw === "yes") {
      payload.attending = true;
    } else if (attendingRaw === "no") {
      payload.attending = false;
    } else {
      payload.attending = null;
    }
  }

  try {
    const updated = await updateGuest(guestId, payload);
    if (!updated) {
      redirect("/admin?error=unknown-guest");
    }
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      redirect("/admin?error=duplicate-phone");
    }
    throw error;
  }

  revalidatePath("/admin");
  redirect("/admin?status=guest-updated");
}

async function deleteGuestAction(formData: FormData) {
  "use server";

  await requireAdminAuthenticated();

  const guestId = formData.get("guestId");
  if (!guestId || typeof guestId !== "string") {
    redirect("/admin?error=unknown-guest");
  }

  await deleteGuest(guestId);
  revalidatePath("/admin");
  redirect("/admin?status=guest-deleted");
}

async function markInviteSentInternal(guestId: string) {
  await requireAdminAuthenticated();
  await markInvitationSent(guestId);
  revalidatePath("/admin");
}

async function markInviteSentAction(formData: FormData) {
  "use server";

  const guestId = formData.get("guestId");
  if (!guestId || typeof guestId !== "string") {
    redirect("/admin?error=unknown-guest");
  }

  await markInviteSentInternal(guestId);
  redirect("/admin?status=invite-marked");
}

async function markInviteSentFromWhatsapp(guestId: string) {
  "use server";
  await markInviteSentInternal(guestId);
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  const errorParam = Array.isArray(resolvedSearchParams.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams.error;
  const statusParam = Array.isArray(resolvedSearchParams.status)
    ? resolvedSearchParams.status[0]
    : resolvedSearchParams.status;
  const filterParamRaw = Array.isArray(resolvedSearchParams.filter)
    ? resolvedSearchParams.filter[0]
    : resolvedSearchParams.filter;

  const filterParam = (["all", "invited", "not_invited", "attending", "declined", "pending"] as FilterId[]).includes(
    filterParamRaw as FilterId,
  )
    ? (filterParamRaw as FilterId)
    : "all";

  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-zinc-900">Вход в админку</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Введите пароль, чтобы управлять приглашениями.
          </p>
          {errorParam === "invalid-credentials" && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Неверный пароль. Попробуйте ещё раз.
            </div>
          )}
          <form action={loginAction} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700"
              >
                Пароль администратора
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                placeholder="Введите пароль"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Войти
            </button>
          </form>
        </div>
      </main>
    );
  }

  const guests = (await listGuests()).map((guest) => ({
    id: guest._id.toHexString(),
    firstName: guest.firstName,
    lastName: guest.lastName,
    phone: guest.phone,
    partySize: guest.partySize,
    attending: guest.attending,
    language: guest.language,
    lastInviteSentAt: guest.lastInviteSentAt,
    invited: Boolean(guest.lastInviteSentAt),
  }));

  const totalGuests = guests.length;
  const invitedCount = guests.filter((guest) => guest.invited).length;
  const notInvitedCount = totalGuests - invitedCount;
  const attendingGuests = guests.filter((guest) => guest.attending === true);
  const declinedCount = guests.filter((guest) => guest.attending === false).length;
  const pendingCount = guests.filter((guest) => guest.attending === null).length;
  const attendingCount = attendingGuests.length;
  const attendingHeadcount = attendingGuests.reduce(
    (sum, guest) => sum + (guest.partySize ?? 0),
    0,
  );

  const statsCards: Array<{
    id: FilterId;
    title: string;
    value: number;
    subtitle?: string;
  }> = [
    {
      id: "all",
      title: "Все гости",
      value: totalGuests,
      subtitle: "всего контактов",
    },
    {
      id: "invited",
      title: "Приглашение отправлено",
      value: invitedCount,
      subtitle: "получили ссылку",
    },
    {
      id: "not_invited",
      title: "Нужно отправить",
      value: notInvitedCount,
      subtitle: "ждут приглашение",
    },
    {
      id: "attending",
      title: "Придут",
      value: attendingCount,
      subtitle: attendingHeadcount
        ? `${attendingHeadcount} человек`
        : "пока без подтверждений",
    },
    {
      id: "declined",
      title: "Не придут",
      value: declinedCount,
      subtitle: "сообщили, что не смогут",
    },
    {
      id: "pending",
      title: "Ждём ответ",
      value: pendingCount,
      subtitle: "нет ответа",
    },
  ];

  const filteredGuests = guests.filter((guest) => {
    switch (filterParam) {
      case "invited":
        return guest.invited;
      case "not_invited":
        return !guest.invited;
      case "attending":
        return guest.attending === true;
      case "declined":
        return guest.attending === false;
      case "pending":
        return guest.attending === null;
      default:
        return true;
    }
  });

  const statusMessages: Record<string, string> = {
    "guest-created": "Гость добавлен.",
    "guest-updated": "Данные гостя обновлены.",
    "guest-deleted": "Гость удалён.",
    "invite-marked": "Статус приглашения обновлён.",
  };

  const errorMessages: Record<string, string> = {
    "create-validation": "Проверьте корректность данных гостя.",
    "update-validation": "Не удалось обновить гостя. Проверьте поля.",
    "duplicate-phone": "Гость с таким номером уже существует.",
    "unknown-guest": "Гость не найден.",
  };

  const activeMessage =
    (statusParam && statusMessages[statusParam]) ||
    (errorParam && errorMessages[errorParam]);
  const isError = Boolean(errorParam && errorMessages[errorParam]);

  const buildFilterHref = (id: FilterId) => {
    const params = new URLSearchParams();
    if (id !== "all") {
      params.set("filter", id);
    }
    if (statusParam) {
      params.set("status", statusParam);
    }
    if (errorParam) {
      params.set("error", errorParam);
    }
    const query = params.toString();
    return query ? `/admin?${query}` : "/admin";
  };

  return (
    <div className="min-h-screen bg-zinc-100 pb-16">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Панель приглашений
            </h1>
            <p className="text-sm text-zinc-500">
              Ведём учёт гостей, отправляем ссылки и отслеживаем ответы.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/seating"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900"
            >
              План рассадки
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900"
              >
                Выйти
              </button>
            </form>
          </div>
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

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {statsCards.map((card) => {
            const isActive = card.id === filterParam;
            return (
              <a
                key={card.id}
                href={buildFilterHref(card.id)}
                className={`group flex flex-col gap-1.5 rounded-3xl border px-4 py-3 transition sm:gap-2 sm:px-5 sm:py-4 ${
                  isActive
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-lg"
                    : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400 hover:shadow-sm"
                }`}
              >
                <span className="text-sm font-medium uppercase tracking-[0.2em]">
                  {FILTER_TITLES[card.id]}
                </span>
                <span className="text-2xl font-semibold sm:text-3xl">
                  {card.value}
                </span>
                {card.subtitle && (
                  <span
                    className={`text-xs ${
                      isActive ? "text-zinc-200" : "text-zinc-500"
                    }`}
                  >
                    {card.subtitle}
                  </span>
                )}
              </a>
            );
          })}
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            Добавить гостя
          </h2>
          <form
            action={createGuestAction}
            className="mt-6 grid gap-4 md:grid-cols-6"
          >
            <div className="md:col-span-1">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-zinc-700"
              >
                Имя
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>
            <div className="md:col-span-1">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-zinc-700"
              >
                Фамилия
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="mt-2 w-full rounded-xl border border-зinc-300 px-3 py-2 text-sm outline-none transition focus:border-зinc-900 focus:ring-2 focus:ring-зinc-900/10"
              />
            </div>
            <div className="md:col-span-1">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-zinc-700"
              >
                Телефон
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="mt-2 w-full rounded-xl border border-зinc-300 px-3 py-2 text-sm outline-none transition focus:border-зinc-900 focus:ring-2 focus:ring-зinc-900/10"
                placeholder="+972..."
              />
            </div>
            <div className="md:col-span-1">
              <label
                htmlFor="partySize"
                className="block text-sm font-medium text-зinc-700"
              >
                Количество гостей
              </label>
              <input
                id="partySize"
                name="partySize"
                type="number"
                min={1}
                defaultValue={1}
                required
                className="mt-2 w-full rounded-xl border border-зinc-300 px-3 py-2 text-sm outline-none transition focus:border-зinc-900 focus:ring-2 focus:ring-зinc-900/10"
              />
            </div>
            <div className="md:col-span-1">
              <label
                htmlFor="language"
                className="block text-sm font-medium text-зinc-700"
              >
                Язык приглашения
              </label>
              <select
                id="language"
                name="language"
                defaultValue={LANGUAGE_OPTIONS[0]?.value}
                className="mt-2 w-full rounded-xl border border-зinc-300 px-3 py-2 text-sm outline-none transition focus:border-зinc-900 focus:ring-2 focus:ring-зinc-900/10"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end md:col-span-1">
              <button
                type="submit"
                className="w-full rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-зinc-800"
              >
                Сохранить гостя
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                {FILTER_TITLES[filterParam]} — {filteredGuests.length}
              </h2>
              <p className="text-xs text-zinc-500">
                Изменения сохраняются автоматически.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {filteredGuests.length === 0 && (
              <div className="rounded-3xl border border-dashed border-зinc-300 bg-white px-6 py-12 text-center text-sm text-зinc-500">
                Пока нет гостей в этой категории.
              </div>
            )}

            {filteredGuests.map((guest) => (
              <GuestCard
                key={guest.id}
                guest={{
                  id: guest.id,
                  firstName: guest.firstName,
                  lastName: guest.lastName,
                  phone: guest.phone,
                  partySize: guest.partySize,
                  attending: guest.attending,
                  language: guest.language,
                }}
                languageOptions={LANGUAGE_OPTIONS}
                updateGuestAction={updateGuestAction}
                deleteGuestAction={deleteGuestAction}
                markInviteSentAction={markInviteSentAction}
                markInviteSentFromWhatsapp={markInviteSentFromWhatsapp.bind(null, guest.id)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
