import Image from "next/image";
import type { Metadata } from "next";
import { Great_Vibes } from "next/font/google";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { findGuestById, updateGuest } from "@/lib/guest-repository";
import { CountdownTimer } from "./countdown-timer";
import { RsvpForm } from "./rsvp-form";
import { InviteToaster } from "./toaster-client";
import { MusicToggle } from "./music-toggle";
import type { RsvpActionPayload } from "./types";

const COUPLE_NAMES = "Daniel & Iryna";
const WEDDING_DATE_ISO = "2026-03-30T16:30:00Z";
const VENUE_NAME_EN = "SAY EVENTS";
const VENUE_NAME_HE = "סיי ארועים";
const VENUE_ADDRESS = "Moshe Sharett St 19, Rishon LeZion";
const VENUE_SITE_URL = "https://say-events.co.il/";
const heroScript = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
});

const translations = {
  ru: {
    heroHeadline: COUPLE_NAMES,
    heroSubheading: (guestName: string) =>
      `${guestName}, с радостью приглашаем вас на важное событие - нашу свадьбу!`,
    heroDateLine: "30 марта 2026 • 19:30",
    heroScroll: "Листай вниз, чтобы узнать подробности",
    introLineOne: "Мы будем счастливы разделить с вами",
    introLineTwo: "вечер любви, радости",
    introLineThree: "и начала новой главы.",
    introGuestLine: (guestName: string) =>
      `Будем рады видеть вас, ${guestName}, в этот важный день нашей жизни.`,
    highlightsTitle: "Что тебя ждёт",
    highlightsIntro:
      "Мы готовим день, полный эмоций. Праздник будет тёплым, атмосферным и очень личным.",
    scheduleHighlights: [
      {
        icon: "💍",
        title: "Церемония",
        time: "Торжественный момент",
        location: "Красивое место, которое мы выберем с любовью",
        description:
          "Клятвы, музыка и самый важный «да» — вместе с самыми близкими людьми.",
      },
      {
        icon: "🎉",
        title: "Праздник",
        time: "Вечеринка после церемонии",
        location: "Адрес и все детали поделимся отдельно",
        description:
          "Музыка, танцы и сюрпризы. Главное — приходить с отличным настроением!",
      },
    ],
    infoTitle: "Полезные детали",
    infoIntro:
      "Ниже несколько подсказок, чтобы ты знал, чего ожидать от нашего дня.",
    infoItems: [
      {
        title: "Дресс-код",
        text: "Лёгкая элегантность. Просто будь собой, в чем комфортно праздновать.",
      },
      {
        title: "Подарки",
        text: "Твоё присутствие — лучший подарок. Остальное расскажем лично.",
      },
      {
        title: "На связи",
        text: "Если появятся вопросы — просто напиши нам в ответ на это приглашение.",
      },
    ],
    countdownTitle: "До нашей свадьбы осталось",
    countdownUnits: ["Дней", "Часов", "Минут", "Секунд"],
    countdownComplete: "Сегодня мы празднуем!",
    timelineTitle: "Расписание вечера",
    timelineIntro:
      "Вот тайминг нашего праздника, чтобы ты точно знал, когда быть с нами.",
    locationTitle: "Где проходит праздник",
    locationIntro: "Мы будем очень ждать тебя в нашем зале. Ниже — адрес и карты.",
    locationAddressLabel: "Адрес",
    locationSiteLabel: "Сайт зала",
    locationOpenWaze: "Открыть в Waze",
    locationOpenGoogle: "Открыть в Google Maps",
    locationOpenApple: "Открыть в Apple Maps",
    timelineSlots: [
      {
        time: "18:30",
        title: "Приветствие гостей",
        description: "Коктейли, лёгкие закуски и первые объятия вечера.",
      },
      {
        time: "19:30",
        title: "Хупа",
        description: "Трогательная церемония под звёздами. Пожалуйста, не опаздывай!",
      },
      {
        time: "20:30",
        title: "Праздничная вечеринка",
        description: "Ужин, танцы и много радости до позднего вечера.",
      },
    ],
    rsvpTitle: "Подтверди участие",
    rsvpSubtitle: "Расскажи, сможешь ли ты прийти и сколько вас будет.",
    attendeesLabel: "Сколько человек придёт?",
    attendingQuestion: "Сможешь быть с нами?",
    attendingYes: "Да, я буду!",
    attendingNo: "К сожалению, не смогу",
    submitLabel: "Сохранить ответ",
    footerNote: "С любовью, Daniel & Irina",
    toastConfirmed: "Спасибо! Ты подтвердил участие. Мы очень ждём встречи!",
    toastDeclined: "Очень жаль, но мы всё равно тебя любим!",
    toastGeneric: "Ответ сохранён.",
    toastError: "Не получилось сохранить ответ. Попробуй ещё раз.",
  },
  he: {
    heroHeadline: COUPLE_NAMES,
    heroSubheading: (guestName: string) =>
      `${guestName}, נשמח לחגוג איתך את האהבה שלנו.`,
    heroDateLine: "30.03.2026 • 19:30",
    heroScroll: "גלול מטה לכל המידע",
    introLineOne: "נשמח לחלוק איתכם",
    introLineTwo: "ערב של אהבה ושמחה",
    introLineThree: "ותחילתה של פרק חדש.",
    introGuestLine: (guestName: string) =>
      `נשמח לראות אותך, ${guestName}, ביום החשוב הזה בחיינו.`,
    highlightsTitle: "מה מחכה לך",
    highlightsIntro:
      "אנחנו מתכננים ערב מלא אהבה ורגעים מיוחדים. הכל יהיה אישי, חם ומרגש.",
    scheduleHighlights: [
      {
        icon: "💍",
        title: "הטקס",
        time: "רגע השיא שלנו",
        location: "מקום מיוחד ומרגש שנבחר באהבה",
        description:
          "נשבע ונרים יחד כוסית. נשמח לראות אותך שם לצידנו.",
      },
      {
        icon: "🎉",
        title: "המסיבה",
        time: "ממשיכים לחגוג",
        location: "כתובת מדויקת תגיע בהמשך",
        description:
          "מוזיקה טובה, אוכל מעולה והרבה שמחה. בוא/י עם חיוך גדול!",
      },
    ],
    infoTitle: "פרטים חשובים",
    infoIntro: "כמה דברים קטנים שיעזרו להתכונן לערב שלנו יחד.",
    infoItems: [
      {
        title: "קוד לבוש",
        text: "לבוש חגיגי ונוח. הכי חשוב שתגיע/י בתחושת חג.",
      },
      {
        title: "מתנות",
        text: "הנוכחות שלך היא המתנה הגדולה ביותר. נעדכן אם יהיה צורך במשהו נוסף.",
      },
      {
        title: "לשאלות",
        text: "אם יש כל דבר שתרצה/י לדעת — כתוב/י לנו באותו וואטסאפ.",
      },
    ],
    countdownTitle: "מתרגשים לראות אותך בעוד",
    countdownUnits: ["ימים", "שעות", "דקות", "שניות"],
    countdownComplete: "היום זה קורה!",
    timelineTitle: "לוח זמנים לערב שלנו",
    timelineIntro: "כך ייראה הערב — כדי שתדע/י בדיוק מתי להיות איתנו.",
    locationTitle: "איפה חוגגים",
    locationIntro: "נשמח לראות אותך באולם שלנו. כאן כל הפרטים והקישורים.",
    locationAddressLabel: "כתובת",
    locationSiteLabel: "אתר האולם",
    locationOpenWaze: "פתיחה ב-Waze",
    locationOpenGoogle: "פתיחה ב-Google Maps",
    locationOpenApple: "פתיחה ב-Apple Maps",
    timelineSlots: [
      {
        time: "18:30",
        title: "קבלת פנים",
        description: "מגיעים, מחייכים ופותחים את הערב במשהו טעים.",
      },
      {
        time: "19:30",
        title: "חופה",
        description: "הרגע הכי מרגש שלנו בחתונה — נשמח שתהיה/י שם לצידנו.",
      },
      {
        time: "20:30",
        title: "מסיבה",
        description: "מתחילים לחגוג, רוקדים ואוכלים יחד עד מאוחר.",
      },
    ],
    rsvpTitle: "אשר/י הגעה",
    rsvpSubtitle: "ספר/י לנו אם את/ה מגיע/ה וכמה תהיו.",
    attendeesLabel: "כמה אנשים מגיעים?",
    attendingQuestion: "נראה אותך שם?",
    attendingYes: "כן, אני מגיע/ה",
    attendingNo: "לצערי לא אוכל להגיע",
    submitLabel: "שמור תשובה",
    footerNote: "באהבה, Daniel & Irina",
    toastConfirmed: "איזה כיף! מחכים לראותך בחתונה.",
    toastDeclined: "חבל שלא תפגשו אותנו, אנחנו אוהבים אותך בכל זאת!",
    toastGeneric: "התשובה נשמרה בהצלחה.",
    toastError: "לא הצלחנו לשמור את התשובה. נסה/י שוב.",
  },
} satisfies Record<
  string,
  {
    heroHeadline: string;
    heroSubheading: (guestName: string) => string;
    heroDateLine: string;
    heroScroll: string;
    introLineOne: string;
    introLineTwo: string;
    introLineThree: string;
    introGuestLine: (guestName: string) => string;
    highlightsTitle: string;
    highlightsIntro: string;
    scheduleHighlights: Array<{
      icon: string;
      title: string;
      time: string;
      location: string;
      description: string;
    }>;
    infoTitle: string;
    infoIntro: string;
    infoItems: Array<{ title: string; text: string }>;
    countdownTitle: string;
    countdownUnits: [string, string, string, string];
    countdownComplete: string;
    timelineTitle: string;
    timelineIntro: string;
    locationTitle: string;
    locationIntro: string;
    locationAddressLabel: string;
    locationSiteLabel: string;
    locationOpenWaze: string;
    locationOpenGoogle: string;
    locationOpenApple: string;
    timelineSlots: Array<{
      time: string;
      title: string;
      description: string;
    }>;
    rsvpTitle: string;
    rsvpSubtitle: string;
    attendeesLabel: string;
    attendingQuestion: string;
    attendingYes: string;
    attendingNo: string;
    submitLabel: string;
    footerNote: string;
    toastConfirmed: string;
    toastDeclined: string;
    toastGeneric: string;
    toastError: string;
  }
>;

function calculateInitialCountdown(targetIso: string): [number, number, number, number] {
  const targetDate = new Date(targetIso);
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  const safeDiff = Math.max(diff, 0);

  const totalSeconds = Math.floor(safeDiff / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return [days, hours, minutes, seconds];
}

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Wedding Invitation",
    description: "Personal wedding invitation and RSVP",
  };
}

async function submitRsvp(
  _prevState: RsvpActionPayload,
  formData: FormData,
): Promise<RsvpActionPayload> {
  "use server";

  const guestId = formData.get("guestId");
  const partySizeRaw = formData.get("partySize");
  const attendingRaw = formData.get("attending");

  const partySize = Number(partySizeRaw);
  const attending =
    attendingRaw === "yes" ? true : attendingRaw === "no" ? false : null;

  if (!guestId || typeof guestId !== "string") {
    return {
      status: "error",
      error: "Missing guest identifier",
      timestamp: Date.now(),
    };
  }

  if (!Number.isFinite(partySize) || partySize < 0) {
    return {
      status: "error",
      error: "Party size must be non-negative",
      timestamp: Date.now(),
    };
  }

  try {
    let updated = await updateGuest(guestId, {
      partySize,
      attending,
    });

    if (!updated) {
      updated = await findGuestById(guestId);
      if (!updated) {
        return {
          status: "error",
          error: "Guest could not be updated",
          timestamp: Date.now(),
        };
      }
    }

    await revalidatePath(`/invite/${guestId}`);

    return {
      status: "success",
      attending: updated.attending,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Failed to update guest RSVP", error);
    return {
      status: "error",
      error: "Failed to save RSVP",
      timestamp: Date.now(),
    };
  }
}

export default async function GuestInvitePage({
  params,
}: {
  params: Promise<{ guestId: string }>;
}) {
  const resolvedParams = await params;
  const guestId =
    typeof resolvedParams?.guestId === "string"
      ? resolvedParams.guestId.trim()
      : "";

  if (!guestId) {
    notFound();
  }

  const guest = await findGuestById(guestId);

  if (!guest) {
    notFound();
  }

  const hasResponse = guest.attending !== null;
  const copy = translations[guest.language] ?? translations.ru;
  const direction = guest.language === "he" ? "rtl" : "ltr";
  const alignment = guest.language === "he" ? "text-right" : "text-left";
  const initialCountdown = calculateInitialCountdown(WEDDING_DATE_ISO);
  const locationQuery = encodeURIComponent(VENUE_ADDRESS);
  const wazeUrl = `https://waze.com/ul?q=${locationQuery}&navigate=yes`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${locationQuery}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${locationQuery}`;
  const venueDisplay = guest.language === "he" ? VENUE_NAME_HE : VENUE_NAME_EN;

  return (
    <div
      className="bg-zinc-50 text-zinc-950"
      dir={direction}
    >
      <InviteToaster />
      <header className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden text-zinc-50">
        <Image
          src="/hero.jpg"
          alt="Wedding invitation background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-zinc-900/65 backdrop-blur-[2px]" />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-5 px-6 text-center">
          <div
            className={`${heroScript.className} text-7xl leading-tight text-zinc-100 sm:text-8xl`}
          >
            <span className="block">Daniel</span>
            <span className="block">&amp;</span>
            <span className="block">Iryna</span>
          </div>
          <p className={`${heroScript.className} text-3xl text-zinc-200 sm:text-4xl`}>
            March 30 2026
          </p>
          <p className={`${heroScript.className} text-4xl text-zinc-100 sm:text-5xl`}>
            Wedding Day
          </p>
          <MusicToggle />
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-300">
            Swipe down to see more
          </p>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-6 py-14 text-center sm:py-18">
          <div className={`space-y-3 text-lg text-zinc-700 ${alignment}`}>
            <p>{copy.introLineOne}</p>
            <p>{copy.introLineTwo}</p>
            <p>{copy.introLineThree}</p>
          </div>
          <p className={`mt-6 text-base text-zinc-600 ${alignment}`}>
            {copy.introGuestLine(guest.firstName)}
          </p>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
          <h2 className="font-serif text-3xl font-light tracking-wide text-zinc-900 sm:text-4xl">
            {copy.countdownTitle}
          </h2>
          <CountdownTimer
            target={WEDDING_DATE_ISO}
            labels={copy.countdownUnits}
            direction={direction as "ltr" | "rtl"}
            completeLabel={copy.countdownComplete}
            initialParts={initialCountdown}
          />
        </section>

        <section className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-light tracking-wide text-zinc-900 sm:text-4xl">
              {copy.highlightsTitle}
            </h2>
            <p className="mt-4 text-base text-zinc-600">{copy.highlightsIntro}</p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {copy.scheduleHighlights.map((item) => (
              <article
                key={item.title}
                className="rounded-3xl bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{item.icon}</span>
                  <span className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-400">
                    {item.time}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-medium text-zinc-500">
                  {item.location}
                </p>
                <p className="mt-4 text-sm leading-6 text-zinc-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-serif text-3xl font-light text-zinc-900 sm:text-4xl">
                {copy.locationTitle}
              </h2>
              <p className="mt-4 text-base text-zinc-600">
                {copy.locationIntro}
              </p>
            </div>
            <div className="mt-12 rounded-3xl border border-zinc-200 bg-zinc-50 p-8 shadow-sm">
              <div className={`text-center ${alignment}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
                  {copy.locationAddressLabel}
                </p>
                <h3 className="mt-3 font-serif text-2xl text-zinc-900 sm:text-3xl">
                  {venueDisplay}
                </h3>
                <p className="mt-3 text-sm text-zinc-600">{VENUE_ADDRESS}</p>
                <a
                  href={VENUE_SITE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-zinc-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
                >
                  {copy.locationSiteLabel}
                </a>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-2">
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={copy.locationOpenWaze}
                  className="flex h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:text-zinc-900 sm:h-14"
                >
                  <Image
                    src="/waze.svg"
                    alt="Waze"
                    width={34}
                    height={34}
                    className="h-8 w-8"
                  />
                </a>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={copy.locationOpenGoogle}
                  className="flex h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:text-zinc-900 sm:h-14"
                >
                  <Image
                    src="/google_maps.svg"
                    alt="Google Maps"
                    width={34}
                    height={34}
                    className="h-8 w-8"
                  />
                </a>
                <a
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={copy.locationOpenApple}
                  className="flex h-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:text-zinc-900 sm:h-14"
                >
                  <Image
                    src="/AppleMaps.svg"
                    alt="Apple Maps"
                    width={38}
                    height={38}
                    className="h-9 w-9"
                  />
                </a>
              </div>
              <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="relative h-0 w-full pb-[60%] sm:pb-[45%]">
                  <iframe
                    title="Venue map"
                    src={`https://www.google.com/maps?q=${locationQuery}&output=embed`}
                    className="absolute inset-0 h-full w-full border-0 grayscale"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-serif text-3xl font-light text-zinc-900 sm:text-4xl">
                {copy.timelineTitle}
              </h2>
              <p className="mt-4 text-base text-zinc-600">
                {copy.timelineIntro}
              </p>
            </div>
            <div className="mt-12 space-y-6">
              {copy.timelineSlots.map((slot) => (
                <div
                  key={`${slot.time}-${slot.title}`}
                  className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 px-6 py-5 shadow-sm transition hover:border-zinc-300 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-lg font-semibold text-white shadow">
                      {slot.time}
                    </div>
                    <div className={`text-left ${alignment}`}>
                      <h3 className="text-lg font-semibold text-zinc-900">
                        {slot.title}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-600">
                        {slot.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-serif text-3xl font-light text-zinc-900 sm:text-4xl">
                {copy.infoTitle}
              </h2>
              <p className="mt-4 text-base text-zinc-600">
                {copy.infoIntro}
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {copy.infoItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm"
                >
                  <h3 className={`text-lg font-semibold text-zinc-900 ${alignment}`}>
                    {item.title}
                  </h3>
                  <p className={`mt-3 text-sm text-zinc-600 leading-6 ${alignment}`}>
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-gradient-to-b from-white to-zinc-100">
          <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
            <div className={`space-y-4 text-center ${alignment === "text-right" ? "sm:text-right" : "sm:text-left"}`}>
              <h2 className="font-serif text-3xl font-light text-zinc-900 sm:text-4xl">
                {copy.rsvpTitle}
              </h2>
              <p className="text-sm text-zinc-600">{copy.rsvpSubtitle}</p>
            </div>
            <RsvpForm
              action={submitRsvp}
              guestId={guest._id.toString()}
              defaultPartySize={guest.partySize}
              defaultAttending={guest.attending}
              hasResponse={hasResponse}
              direction={direction as "ltr" | "rtl"}
              labels={{
                attendeesLabel: copy.attendeesLabel,
                attendingQuestion: copy.attendingQuestion,
                attendingYes: copy.attendingYes,
                attendingNo: copy.attendingNo,
                submitLabel: copy.submitLabel,
                toastConfirmed: copy.toastConfirmed,
                toastDeclined: copy.toastDeclined,
                toastGeneric: copy.toastGeneric,
                toastError: copy.toastError,
              }}
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-zinc-900 py-12 text-center text-sm text-zinc-200">
        {copy.footerNote}
      </footer>
    </div>
  );
}
