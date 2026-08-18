"use client";

/**
 * Way2News-style home feature carousel: large swipeable cards for News, Local
 * News (preferred location from localStorage), Calendar, and Weather (GPS +
 * Open-Meteo, no API key). All client-side — no backend, doesn't touch the
 * editorial flow.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Newspaper,
  MapPin,
  GraduationCap,
  CalendarDays,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Sun,
  CloudSun,
  Navigation,
  type LucideIcon,
} from "lucide-react";
import type { Article } from "@/lib/content/types";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { FAVOURITE_COLLEGE_KEY, FAVOURITE_LOCATION_KEY } from "@/lib/prefs";
import { cn } from "@/lib/utils";

interface LocationOption {
  id: string;
  name: string;
}

export function HomeFeatureCarousel({
  articles,
  locations,
  colleges,
}: {
  articles: Article[];
  locations: LocationOption[];
  colleges: LocationOption[];
}) {
  const [favId] = useLocalStorage(FAVOURITE_LOCATION_KEY);
  const favLocation = locations.find((l) => l.id === favId) ?? null;
  const localArticles = favId
    ? articles.filter((a) => a.locationId === favId)
    : [];

  const [favCollegeId] = useLocalStorage(FAVOURITE_COLLEGE_KEY);
  const favCollege = colleges.find((c) => c.id === favCollegeId) ?? null;
  const collegeArticles = favCollegeId
    ? articles.filter((a) => a.collegeId === favCollegeId)
    : [];

  const newsCover = articles[0]?.coverImage ?? null;
  const localCover = localArticles[0]?.coverImage ?? null;
  const collegeCover = collegeArticles[0]?.coverImage ?? null;

  // 5 feature cards.
  const total = 5;

  return (
    <div className="-mx-4 flex h-full snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* 1 · News */}
      <FeatureCard
        index={1}
        total={total}
        href="/news/all"
        cover={newsCover}
        gradient="from-slate-800 to-slate-950"
        icon={Newspaper}
        eyebrow="Top stories"
        title="News"
        footer={`${articles.length} ${articles.length === 1 ? "story" : "stories"} →`}
      />

      {/* 2 · Local News */}
      <FeatureCard
        index={2}
        total={total}
        href={favId ? `/news/locations/${favId}` : "/news/locations"}
        cover={localCover}
        gradient="from-amber-500 to-orange-600"
        icon={MapPin}
        eyebrow={favLocation ? "Your location" : "Pick a location"}
        title="Local News"
        footer={
          favLocation
            ? `${favLocation.name} · ${localArticles.length} →`
            : "Set your location →"
        }
      />

      {/* 3 · College News */}
      <FeatureCard
        index={3}
        total={total}
        href={favCollegeId ? `/news/colleges/${favCollegeId}` : "/news/colleges"}
        cover={collegeCover}
        gradient="from-emerald-500 to-teal-600"
        icon={GraduationCap}
        eyebrow={favCollege ? "Your college" : "Pick a college"}
        title="College News"
        footer={
          favCollege
            ? `${favCollege.name} · ${collegeArticles.length} →`
            : "Set your college →"
        }
      />

      {/* 4 · Calendar */}
      <CalendarCard index={4} total={total} />

      {/* 5 · Weather */}
      <WeatherCard index={5} total={total} />
    </div>
  );
}

/* ---------------- shared card shell ---------------- */

function CardShell({
  index,
  total,
  gradient,
  cover,
  children,
}: {
  index: number;
  total: number;
  gradient: string;
  cover?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex size-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg",
        gradient,
      )}
    >
      {cover && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />
        </>
      )}
      <div className="absolute right-4 top-4 text-right text-white/70">
        <span className="text-3xl font-extrabold leading-none text-white/90">
          {index}
        </span>
        <span className="ml-1 text-xs">of {total}</span>
      </div>
      <div className="relative flex h-full flex-col">{children}</div>
    </div>
  );
}

function FeatureCard({
  index,
  total,
  href,
  cover,
  gradient,
  icon: Icon,
  eyebrow,
  title,
  footer,
}: {
  index: number;
  total: number;
  href: string;
  cover: string | null;
  gradient: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  footer: string;
}) {
  return (
    <Link href={href} className="h-full w-[80%] shrink-0 snap-start sm:w-[64%]">
      <CardShell index={index} total={total} gradient={gradient} cover={cover}>
        <Icon className="size-7" />
        <div className="mt-auto">
          <p className="text-sm font-medium text-white/70">{eyebrow}</p>
          <h3 className="text-3xl font-extrabold tracking-tight">{title}</h3>
          <p className="mt-1 flex items-center gap-0.5 text-sm font-medium text-white/90">
            {footer}
          </p>
        </div>
      </CardShell>
    </Link>
  );
}

/* ---------------- calendar ---------------- */

function CalendarCard({ index, total }: { index: number; total: number }) {
  const now = new Date();
  const weekday = now.toLocaleDateString(undefined, { weekday: "long" });
  const month = now.toLocaleDateString(undefined, { month: "long" });
  const day = now.getDate();
  const year = now.getFullYear();

  return (
    <Link
      href="/news/category/EVENTS"
      className="h-full w-[80%] shrink-0 snap-start sm:w-[64%]"
    >
      <CardShell index={index} total={total} gradient="from-violet-600 to-fuchsia-600">
        <CalendarDays className="size-7" />
        <div className="mt-auto" suppressHydrationWarning>
          <p className="text-sm font-medium text-white/70">{weekday}</p>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-extrabold leading-none">{day}</span>
            <span className="pb-1 text-lg font-semibold">
              {month} {year}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-0.5 text-sm font-medium text-white/90">
            Events <ChevronRight className="size-4" />
          </p>
        </div>
      </CardShell>
    </Link>
  );
}

/* ---------------- weather ---------------- */

type WxState = "loading" | "ready" | "error";

interface Wx {
  temp: number;
  code: number;
}

function weatherInfo(code: number): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: "Clear sky", Icon: Sun };
  if (code <= 3) return { label: "Partly cloudy", Icon: CloudSun };
  if (code === 45 || code === 48) return { label: "Fog", Icon: CloudFog };
  if (code >= 51 && code <= 67) return { label: "Rain", Icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: "Snow", Icon: CloudSnow };
  if (code >= 80 && code <= 82) return { label: "Showers", Icon: CloudRain };
  if (code >= 95) return { label: "Thunderstorm", Icon: CloudLightning };
  return { label: "Cloudy", Icon: Cloud };
}

async function fetchWeather(lat: number, lon: number): Promise<Wx> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
  );
  const data = await res.json();
  return {
    temp: Math.round(data.current.temperature_2m),
    code: data.current.weather_code,
  };
}

function WeatherCard({ index, total }: { index: number; total: number }) {
  const [state, setState] = useState<WxState>("loading");
  const [wx, setWx] = useState<Wx | null>(null);

  const run = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // Defer so we never setState synchronously inside an effect.
      Promise.resolve().then(() => setState("error"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude)
          .then((w) => {
            setWx(w);
            setState("ready");
          })
          .catch(() => setState("error"));
      },
      () => setState("error"),
      { timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  const info = wx ? weatherInfo(wx.code) : null;
  const Icon = info?.Icon ?? Cloud;

  return (
    <div className="h-full w-[80%] shrink-0 snap-start sm:w-[64%]">
      <CardShell index={index} total={total} gradient="from-sky-500 to-blue-600">
        <Icon className="size-7" />
        <div className="mt-auto">
          <p className="text-sm font-medium text-white/70">Weather</p>
          {state === "ready" && wx ? (
            <>
              <div className="flex items-start">
                <span className="text-5xl font-extrabold leading-none">
                  {wx.temp}
                </span>
                <span className="text-xl font-bold">°C</span>
              </div>
              <p className="mt-1 text-sm font-medium text-white/90">
                {info?.label} · your location
              </p>
            </>
          ) : state === "loading" ? (
            <p className="text-sm font-medium text-white/90">
              Getting your local weather…
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setState("loading");
                run();
              }}
              className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold hover:bg-white/30"
            >
              <Navigation className="size-4" />
              Enable location
            </button>
          )}
        </div>
      </CardShell>
    </div>
  );
}
