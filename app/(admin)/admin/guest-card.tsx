"use client";

import { useState } from "react";
import type { GuestLanguage } from "@/lib/guest-repository";
import { CopyLinkButton } from "./copy-link-button";
import { SendWhatsappButton } from "./send-whatsapp-button";

type LanguageOption = { value: GuestLanguage; label: string };

type GuestCardProps = {
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    partySize: number;
    attending: boolean | null;
    language: GuestLanguage;
  };
  languageOptions: LanguageOption[];
  updateGuestAction: (formData: FormData) => Promise<void>;
  deleteGuestAction: (formData: FormData) => Promise<void>;
  markInviteSentAction: (formData: FormData) => Promise<void>;
  markInviteSentFromWhatsapp: () => Promise<void>;
};

function getAttendingLabel(attending: boolean | null) {
  if (attending === true) {
    return { label: "Придёт", className: "text-emerald-600" };
  }
  if (attending === false) {
    return { label: "Не придёт", className: "text-red-600" };
  }
  return { label: "Ждём ответ", className: "text-amber-600" };
}

export function GuestCard({
  guest,
  languageOptions,
  updateGuestAction,
  deleteGuestAction,
  markInviteSentAction,
  markInviteSentFromWhatsapp,
}: GuestCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const attending = getAttendingLabel(guest.attending);

  const closeModal = () => setIsEditing(false);

  return (
    <article className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-zinc-900">
            {guest.firstName} {guest.lastName}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
            <span>{guest.phone}</span>
            <span>Гостей: {guest.partySize}</span>
            <span className={`font-medium ${attending.className}`}>
              {attending.label}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <SendWhatsappButton
            path={`/invite/${guest.id}`}
            guestName={guest.firstName}
            language={guest.language}
            phone={guest.phone}
            markInviteSent={markInviteSentFromWhatsapp}
          />
          <CopyLinkButton path={`/invite/${guest.id}`} />
          <form action={markInviteSentAction}>
            <input type="hidden" name="guestId" value={guest.id} />
            <button
              type="submit"
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900"
            >
              Отметить отправленным
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-900"
        >
          Редактировать
        </button>
        <form action={deleteGuestAction}>
          <input type="hidden" name="guestId" value={guest.id} />
          <button
            type="submit"
            className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700"
          >
            Удалить гостя
          </button>
        </form>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 px-4 py-6">
          <div
            className="absolute inset-0"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-zinc-900">
                Редактировать гостя
              </h4>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-transparent p-1 text-zinc-500 transition hover:border-zinc-200 hover:text-zinc-700"
                aria-label="Закрыть окно"
              >
                ×
              </button>
            </div>
            <form action={updateGuestAction} className="mt-4 space-y-4">
              <input type="hidden" name="guestId" value={guest.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Имя
                  <input
                    name="firstName"
                    defaultValue={guest.firstName}
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  />
                </label>
                <label className="flex flex-col text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Фамилия
                  <input
                    name="lastName"
                    defaultValue={guest.lastName}
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  />
                </label>
                <label className="flex flex-col text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Телефон
                  <input
                    name="phone"
                    defaultValue={guest.phone}
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  />
                </label>
                <label className="flex flex-col text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Количество гостей
                  <input
                    name="partySize"
                    type="number"
                    min={0}
                    defaultValue={guest.partySize}
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  />
                </label>
                <label className="flex flex-col text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Статус
                  <select
                    name="attending"
                    defaultValue={
                      guest.attending === true
                        ? "yes"
                        : guest.attending === false
                          ? "no"
                          : "pending"
                    }
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  >
                    <option value="pending">Ждём ответ</option>
                    <option value="yes">Придёт</option>
                    <option value="no">Не придёт</option>
                  </select>
                </label>
                <label className="flex flex-col text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Язык
                  <select
                    name="language"
                    defaultValue={guest.language}
                    className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  >
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-800"
                >
                  Отменить
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  );
}
