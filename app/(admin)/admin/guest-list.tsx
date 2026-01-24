"use client";

import { useMemo, useState } from "react";
import type { GuestLanguage } from "@/lib/guest-repository";
import { GuestCard } from "./guest-card";

type GuestItem = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  partySize: number;
  attending: boolean | null;
  language: GuestLanguage;
};

type LanguageOption = { value: GuestLanguage; label: string };

type GuestListProps = {
  title: string;
  guests: GuestItem[];
  languageOptions: LanguageOption[];
  updateGuestAction: (formData: FormData) => Promise<void>;
  deleteGuestAction: (formData: FormData) => Promise<void>;
  markInviteSentAction: (formData: FormData) => Promise<void>;
  markInviteSentFromWhatsapp: (guestId: string) => Promise<void>;
};

export function GuestList({
  title,
  guests,
  languageOptions,
  updateGuestAction,
  deleteGuestAction,
  markInviteSentAction,
  markInviteSentFromWhatsapp,
}: GuestListProps) {
  const [query, setQuery] = useState("");

  const filteredGuests = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return guests;
    }

    return guests.filter((guest) => {
      const fullName = `${guest.firstName} ${guest.lastName}`.toLowerCase();
      const phone = guest.phone.toLowerCase();
      return fullName.includes(normalized) || phone.includes(normalized);
    });
  }, [guests, query]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            {title} — {filteredGuests.length}
          </h2>
          <p className="text-xs text-zinc-500">
            Изменения сохраняются автоматически.
          </p>
        </div>
        <div className="w-full sm:max-w-xs">
          <label htmlFor="guest-search" className="sr-only">
            Поиск гостей
          </label>
          <input
            id="guest-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            placeholder="Поиск по имени или телефону"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredGuests.length === 0 && (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500">
            По вашему запросу никто не найден.
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
            languageOptions={languageOptions}
            updateGuestAction={updateGuestAction}
            deleteGuestAction={deleteGuestAction}
            markInviteSentAction={markInviteSentAction}
            markInviteSentFromWhatsapp={markInviteSentFromWhatsapp.bind(null, guest.id)}
          />
        ))}
      </div>
    </section>
  );
}
