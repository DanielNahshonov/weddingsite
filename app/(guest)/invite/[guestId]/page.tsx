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
const EVENT_DURATION_HOURS = 4;
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
    introLineOne:
      "Дорогие родные и друзья!",
    introLineTwo: "В нашей жизни скоро состоится важное и радостное событие — наша свадьба.",
    introLineThree: "Мы будем счастливы, если вы проведете вместе с нами этот особенный день!",
    introGuestLine: (guestName: string) =>
      `Будем рады видеть вас, ${guestName}, в этот важный день нашей жизни.`,
    highlightsTitle: "Что вас ждёт",
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
    countdownTitle: "До нашей свадьбы",
    countdownUnits: ["Дней", "Часов", "Минут", "Секунд"],
    countdownComplete: "Сегодня мы празднуем!",
    timelineTitle: "Программа вечера",
    timelineIntro: "Будем рады видеть вас в эти моменты.",
    locationTitle: "Где проходит праздник",
    locationIntro: "Мы будем очень ждать вас в нашем зале. Ниже — адрес и карты.",
    locationAddressLabel: "Адрес",
    locationSiteLabel: "Сайт зала",
    locationOpenWaze: "Открыть в Waze",
    locationOpenGoogle: "Открыть в Google Maps",
    locationOpenApple: "Открыть в Apple Maps",
    calendarTitle: "Добавить в календарь",
    calendarIntro: "Сохрани дату, чтобы мы точно встретились.",
    calendarGoogle: "Google Calendar",
    calendarApple: "Apple Calendar",
    dressCodeTitle: "Dress code",
    dressCodeIntro:
      "Будем рады, если вы отдадите предпочтение следующим оттенкам:",
    dressCodeNote3: "",
    dressCodeNote2:
      "Просим не воспринимать это как строгий дресс-код, но пожалуйста по возможности воздержитесь от ярких цветов в нарядах.",
    dressCodeNote1:
      "Нам будет очень приятно, если вы поддержите эту цветовую палитру.",
    timelineSlots: [
      {
        time: "19:30",
        title: "Сбор гостей",
        description: "Начинаем собираться, наслаждаться встречами и атмосферой.",
      },
      {
        time: "20:30",
        title: "Торжественная церемония",
        description: "Главный момент вечера. Пожалуйста, не опаздывайте!",
      },
      {
        time: "21:15",
        title: "Свадебный ужин",
        description: "Время теплых тостов, угощений и общения.",
      },
    ],
    rsvpTitle: "Подтверди участие",
    rsvpSubtitle: "Расскажи, сможете ли ты прийти и сколько вас будет.",
    attendeesLabel: "Сколько человек придёт?",
    attendingQuestion: "Сможещь быть с нами?",
    attendingYes: "Да, будем!",
    attendingNo: "К сожалению, не сможем",
    submitLabel: "Сохранить ответ",
    footerNote: "С любовью, Daniel & Iryna",
    toastConfirmed: "Спасибо! Ты подтвердил участие. Мы очень ждём встречи!",
    toastDeclined: "Очень жаль, но мы всё равно вас любим!",
    toastGeneric: "Ответ сохранён.",
    toastError: "Не получилось сохранить ответ. Попробуй ещё раз.",
  },
  he: {
    heroHeadline: COUPLE_NAMES,
    heroSubheading: (guestName: string) =>
      `${guestName}, נשמח לחגוג איתך את האהבה שלנו.`,
    heroDateLine: "30.03.2026 • 19:30",
    heroScroll: "גלול מטה לכל המידע",
    introLineOne:
      "משפחה וחברים יקרים!",
    introLineTwo: "בקרוב יתקיים בחיינו אירוע חשוב ומשמח — החתונה שלנו.",
    introLineThree: " נשמח מאוד אם תבלו איתנו את היום המיוחד הזה!",
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
    timelineTitle: "תוכנית הערב",
    timelineIntro: "נשמח לראות אותך ברגעים האלה.",
    locationTitle: "איפה חוגגים",
    locationIntro: "נשמח לראות אותך באולם שלנו. כאן כל הפרטים והקישורים.",
    locationAddressLabel: "כתובת",
    locationSiteLabel: "אתר האולם",
    locationOpenWaze: "פתיחה ב-Waze",
    locationOpenGoogle: "פתיחה ב-Google Maps",
    locationOpenApple: "פתיחה ב-Apple Maps",
    calendarTitle: "הוספה ליומן",
    calendarIntro: "שמור/י את התאריך כדי לא לפספס.",
    calendarGoogle: "Google Calendar",
    calendarApple: "Apple Calendar",
    dressCodeTitle: "Dress code",
    dressCodeIntro: "נשמח אם תבחרו בגוונים הבאים:",
    dressCodeNote3: "",
dressCodeNote2:
  "אנא אל תראו בכך קוד לבוש מחייב, אך נבקש במידת האפשר להימנע מצבעים עזים בלבוש.",
dressCodeNote1:
  "נשמח מאוד אם תבחרו לתמוך בפלטת הצבעים הזו.",
    timelineSlots: [
      {
        time: "19:30",
        title: "התכנסות",
        description: "מתחילים להתאסף, להיפגש וליהנות מהאווירה.",
      },
      {
        time: "20:30",
        title: "טקס",
        description: "הרגע המרכזי של הערב. נשמח שתהיה/י שם לצידנו.",
      },
      {
        time: "21:15",
        title: "ארוחת ערב חגיגית",
        description: "זמן לטוסטים חמים, אוכל טוב ושיחה.",
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
    calendarTitle: string;
    calendarIntro: string;
    calendarGoogle: string;
    calendarApple: string;
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
    dressCodeTitle: string;
    dressCodeIntro: string;
    dressCodeNote1: string;
    dressCodeNote2: string;
    dressCodeNote3: string;
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

function formatGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(".000", "");
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
  const eventStart = new Date(WEDDING_DATE_ISO);
  const eventEnd = new Date(eventStart.getTime() + EVENT_DURATION_HOURS * 60 * 60 * 1000);
  const calendarTitle = encodeURIComponent(`${COUPLE_NAMES} Wedding`);
  const calendarDetails = encodeURIComponent(`Wedding celebration at ${venueDisplay}.`);
  const calendarLocation = encodeURIComponent(VENUE_ADDRESS);
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&details=${calendarDetails}&location=${calendarLocation}&dates=${formatGoogleCalendarDate(
    eventStart,
  )}/${formatGoogleCalendarDate(eventEnd)}`;

  return (
    <div
      className="bg-zinc-50 text-zinc-950"
      dir={direction}
      lang={guest.language}
    >
      <InviteToaster />
      <header className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden text-zinc-50">
        <Image
          src="/hero.jpeg"
          alt="Wedding invitation background"
          fill
          priority
          className=""
        />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-5 px-6 text-center">
          {/* <div
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
          </p> */}
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
            <div className="space-y-3 text-center text-lg text-zinc-700">
              <p>{copy.introLineOne}</p>
              <p>{copy.introLineTwo}</p>
              <p>{copy.introLineThree}</p>
            </div>
          {/* <p className={`mt-6 text-base text-zinc-600 ${alignment}`}>
            {copy.introGuestLine(guest.firstName)}
          </p> */}
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
            <div className="mt-12 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm">
              <div className="relative h-48 w-full sm:h-64">
                <Image
                  src="/location.png"
                  alt="Wedding venue"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
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
            <div className="mx-auto mt-12 max-w-md">
              {copy.timelineSlots.map((slot, index) => (
                <div
                  key={`${slot.time}-${slot.title}`}
                  className="relative flex flex-col items-center px-4 py-6 text-center"
                >
                  <div className="text-2xl font-light tracking-[0.2em] text-zinc-800 sm:text-3xl">
                    {slot.time}
                  </div>
                  <div className="mt-2 text-center text-base font-medium text-zinc-700">
                    {slot.title}
                  </div>
                  <p className="mt-2 text-center text-sm text-zinc-500">
                    {slot.description}
                  </p>
                  {index < copy.timelineSlots.length - 1 && (
                    <span className="mt-4 h-8 w-px self-center bg-zinc-300/80" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
            <h2 className={`${heroScript.className} text-4xl text-zinc-900 sm:text-5xl`}>
              {copy.dressCodeTitle}
            </h2>
            <p className="mt-4 text-base text-zinc-600">{copy.dressCodeIntro}</p>
            <div className="mt-8 grid grid-cols-4 gap-2">
              <div className="h-28 bg-[#1b1b1f]" />
              <div className="h-28 bg-[#5a463c]" />
              <div className="h-28 bg-[#efe5db]" />
              <div className="h-28 bg-[#4b2f25]" />
            </div>
            <div className={`mt-6 space-y-2 text-sm text-zinc-600 ${alignment}`}>
              <p>{copy.dressCodeNote1}</p>
              <p>{copy.dressCodeNote2}</p>
              <p>{copy.dressCodeNote3}</p>
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-gradient-to-b from-white to-zinc-100">
          <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
            <div className={`space-y-4 text-center ${alignment === "text-right" ? "sm:text-right" : "sm:text-left"}`}>
              {/* <h2 className="font-serif text-3xl font-light text-zinc-900 sm:text-4xl">
                {copy.rsvpTitle}
              </h2> */}
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

        <section className="border-t border-zinc-200 bg-zinc-50">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
            <h2 className="font-serif text-3xl font-light text-zinc-900 sm:text-4xl">
              {copy.calendarTitle}
            </h2>
            <p className="mt-4 text-base text-zinc-600">{copy.calendarIntro}</p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
              >
                {copy.calendarGoogle}
              </a>
              <a
                href="/wedding.ics"
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
              >
                {copy.calendarApple}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-zinc-900 py-12 text-center text-sm text-zinc-200">
        {copy.footerNote}
      </footer>
    </div>
  );
}
