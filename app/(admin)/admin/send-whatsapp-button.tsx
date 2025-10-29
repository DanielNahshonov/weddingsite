"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GuestLanguage } from "@/lib/guest-repository";

const MESSAGES: Record<GuestLanguage, (args: { firstName: string; url: string }) => string> =
  {
    ru: ({ firstName, url }) =>
      `Привет, ${firstName}! Приглашаем тебя на нашу свадьбу. Пожалуйста, подтверди участие по ссылке: ${url}`,
    he: ({ firstName, url }) =>
      `היי ${firstName}! אנחנו שמחים להזמין אותך לחתונה שלנו. אשר/י הגעה בקישור: ${url}`,
  };

function sanitizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return phone;
  }
  return digits.startsWith("0") ? digits.replace(/^0+/, "") : digits;
}

export function SendWhatsappButton({
  phone,
  guestName,
  language,
  path,
  markInviteSent,
}: {
  phone: string;
  guestName: string;
  language: GuestLanguage;
  path: string;
  markInviteSent?: () => Promise<void>;
}) {
  const sanitizedPhone = useMemo(() => sanitizePhone(phone), [phone]);
  const [isMarking, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    const origin = window.location.origin;
    const inviteUrl = `${origin}${path}`;
    const messageFactory = MESSAGES[language] ?? MESSAGES.ru;
    const message = messageFactory({ firstName: guestName, url: inviteUrl });
    const phoneSegment = sanitizedPhone || phone;
    const waUrl = `https://wa.me/${phoneSegment}?text=${encodeURIComponent(message)}`;
    if (markInviteSent) {
      startTransition(async () => {
        try {
          await markInviteSent();
          router.refresh();
        } catch (error) {
          console.error("Failed to mark invite sent", error);
        }
      });
    }
    window.open(waUrl, "_blank");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
      disabled={isMarking}
      title="Send WhatsApp message"
    >
      WhatsApp
    </button>
  );
}
