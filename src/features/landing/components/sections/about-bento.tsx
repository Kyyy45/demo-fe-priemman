"use client";

import {
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { BookmarkSimple, Briefcase, CheckCircle, Heart } from "@phosphor-icons/react";
import { useInView } from "motion/react";

import { getAvatarFallbackUrl } from "@/shared/lib/avatar";
import { cn } from "@/shared/lib/utils";
import { useLanguage } from "@/shared/providers/language-provider";
import { IPhone17ProMax } from "@/shared/ui/apple-iphone-17-pro";
import {
  AnalyticsLineChart,
  type AnalyticsDataPoint,
} from "@/shared/ui/analytics-chart";
import { AvatarStack, type AvatarStackItem } from "@/shared/ui/avatar-stack";
import { DitherImageContent, DitherImageFrame } from "@/shared/ui/dither-image";
import { FolderFloat } from "@/shared/ui/folder-float";
import { MacScreen } from "@/shared/ui/mac-screen";
import { RollingNumber } from "@/shared/ui/rolling-number";
import {
  TearOffCalendar,
  toDay,
  toIso,
  useLocalToday,
} from "@/shared/ui/tear-off-calendar";

// Layar mockup. iPhone: screenshot Beranda di 440×956 (DPR 3) dengan area
// status bar 62px di atas, supaya navbar tidak tertutup jam & Dynamic Island.
// Mac: WebP animasi hero Jelajah (640×480, 4:3 seperti layar Macintosh).
const PHONE_SCREEN_SRC = "/mockups/home-mobile.webp";
const MAC_SCREEN_SRC = "/mockups/explore-desktop.webp";

// Pratinjau dashboard analitik (mockup fitur statistik di dashboard creator):
// angka contoh yang selalu terisi, bukan klaim data komunitas.
// Mengikuti data backend: tiap proyek hanya punya total views/likes/saves
// (ProjectMetrics), tanpa riwayat per waktu — jadi grafiknya views per
// proyek (urut unggahan) dan tidak ada persentase pertumbuhan.
const SAMPLE_PROJECTS = [
  { title: "Brand identity", views: 820 },
  { title: "Poster series", views: 1140 },
  { title: "Packaging", views: 980 },
  { title: "Mobile app UI", views: 1460 },
  { title: "Editorial layout", views: 1720 },
  { title: "Logo set", views: 1610 },
  { title: "Motion reel", views: 2140 },
  { title: "Portfolio site", views: 2580 },
];
const SAMPLE_TOTAL_VIEWS = SAMPLE_PROJECTS.reduce((sum, project) => sum + project.views, 0);
const SAMPLE_ROWS = [
  { key: "likes", value: 1284 },
  { key: "saves", value: 342 },
] as const;

// Avatar contoh — sama dengan avatar stack di hero.
// Avatar kreator contoh dari DiceBear "notionists" (sama dengan avatar
// cadangan user); 8 nama, 5 tampil + badge "+3".
const COMMUNITY_AVATARS: AvatarStackItem[] = [
  "Maya",
  "Jonas",
  "Aida",
  "Reza",
  "Kim",
  "Sari",
  "Dimas",
  "Lena",
].map((name) => ({ name, src: getAvatarFallbackUrl(name) }));

const COLLECTION_TAGS = ["Branding", "UI design", "Motion", "Illustration", "3D"];


// Warna kartu bento: ungu brand solid dan ungu muda, bergantian per kolom
// seperti referensi (lime solid / lime muda).
const TONE = {
  solid: "bg-brand text-on-brand",
  tint: "bg-brand/10 text-heading dark:bg-brand/20",
} as const;

const CARD_CLASS =
  "relative flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-feature)] p-[var(--card-padding)]";

function BentoCard({
  aspect,
  children,
  className,
  tone,
}: {
  aspect: string;
  children: ReactNode;
  className?: string;
  tone: keyof typeof TONE;
}) {
  return (
    <div className={cn(CARD_CLASS, aspect, TONE[tone], className)} data-about-img>
      {children}
    </div>
  );
}

// Ukuran judul mengikuti peran kartu (seperti referensi): "lg" untuk kartu
// unggulan yang judulnya di tengah, "md" untuk kartu pendukung.
const TITLE_SIZE = {
  lg: "text-[clamp(1.625rem,2.4vw,2.25rem)] leading-[1.15] tracking-tight",
  md: "text-[clamp(1.25rem,1.7vw,1.5rem)] leading-tight",
} as const;

function CardTitle({
  center = false,
  children,
  size = "md",
}: {
  center?: boolean;
  children: ReactNode;
  size?: keyof typeof TITLE_SIZE;
}) {
  // text-current: h3 global memasang warna heading sendiri; di kartu
  // ungu/gelap judul harus mengikuti warna teks kartu.
  return (
    <h3
      className={cn(
        "font-semibold !text-current",
        TITLE_SIZE[size],
        center && "mx-auto max-w-md text-center",
      )}
    >
      {children}
    </h3>
  );
}

function CardText({
  center = false,
  children,
}: {
  center?: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "mt-2 max-w-sm type-label !text-current opacity-75",
        center && "mx-auto text-center",
      )}
    >
      {children}
    </p>
  );
}

/**
 * Menampilkan perangkat berukuran desain tetap (mis. iPhone 620px) yang
 * diskalakan mengikuti lebar kartu, supaya proporsi bingkai, Dynamic Island,
 * dan sudutnya tetap benar di setiap ukuran layar.
 */
function FitScale({
  children,
  designHeight,
  designWidth,
  widthRatio,
}: {
  children: ReactNode;
  designHeight: number;
  designWidth: number;
  widthRatio: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setScale((entry.contentRect.width * widthRatio) / designWidth);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [designWidth, widthRatio]);

  return (
    <div className="relative w-full" ref={ref} style={{ height: designHeight * scale }}>
      <div
        className="absolute left-1/2 top-0 origin-top"
        style={{
          height: designHeight,
          marginLeft: -designWidth / 2,
          transform: `scale(${scale})`,
          visibility: scale ? "visible" : "hidden",
          width: designWidth,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Seperti FitScale, tetapi mengisi sisa ruang kartu (lebar & tinggi) dan
 * memakai skala terkecil dari keduanya ("contain"), lalu memusatkan isinya.
 */
function FitContain({
  children,
  designHeight,
  designWidth,
}: {
  children: ReactNode;
  designHeight: number;
  designWidth: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { height, width } = entry.contentRect;
      setScale(Math.min(width / designWidth, height / designHeight, 1));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [designHeight, designWidth]);

  return (
    <div className="relative min-h-0 w-full flex-1" ref={ref}>
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          height: designHeight,
          marginLeft: -designWidth / 2,
          marginTop: -designHeight / 2,
          transform: `scale(${scale})`,
          visibility: scale ? "visible" : "hidden",
          width: designWidth,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Ukuran asli kalender sobek (lebar maks. 380px + teks tanggal & tombol).
const CALENDAR_WIDTH = 380;
const CALENDAR_HEIGHT = 464;

// 700px = tinggi yang dipakai demo cult-ui; ukuran piksel di dalam komponen
// (Dynamic Island 110px, sudut 55px, status bar) disetel untuk tinggi ini,
// jadi proporsinya sama dengan demo. FitScale yang mengecilkannya ke kartu.
const PHONE_HEIGHT = 700;

const PHONE_WIDTH = Math.round((PHONE_HEIGHT * 71.5) / 149.6);

/**
 * Enam kartu bento di section About. Isinya ilustrasi fitur yang statis (tanpa
 * data backend), jadi landing selalu tampil penuh dan konsisten. Layar ≥1000px (m3-laptop) memakai mosaik tiga
 * kolom bertingkat yang sudah ada; di layar lebih kecil kolomnya "dilebur"
 * (display: contents) menjadi grid 1 kolom (ponsel) / 2 kolom (tablet).
 */
export function AboutBento() {
  const { lang, t } = useLanguage();
  const copy = t.about.bento;
  const locale = lang === "id" ? "id-ID" : "en-US";
  // Angka "bergulir" dari 0 saat kartu analitik benar-benar terlihat di layar.
  const analyticsRef = useRef<HTMLDivElement>(null);
  const analyticsInView = useInView(analyticsRef, { once: true, amount: 0.4 });
  const formatNumber = (value: number) => new Intl.NumberFormat(locale).format(value);

  // Kalender sobek: dimulai dari hari ini (lokal), disimpan sebagai selisih
  // hari supaya halamannya ikut berganti setelah tanggal asli dimuat.
  const today = useLocalToday();
  const [dayOffset, setDayOffset] = useState(0);
  const calendarValue = toIso(toDay(today) + dayOffset);

  // Label minggu ("Minggu 1"…), bukan tanggal: HTML statis dibuat saat build,
  // jadi tanggal nyata akan berbeda dengan saat halaman dibuka.
  const chartData: AnalyticsDataPoint[] = SAMPLE_PROJECTS.map((project) => ({
    date: project.title,
    label: copy.analytics.views,
    value: project.views,
  }));
  const formatProject = (title: string) => title;

  const column = "contents m3-laptop:flex m3-laptop:min-w-0 m3-laptop:flex-col m3-laptop:gap-[var(--grid-gap)]";

  return (
    <div
      className="mt-16 grid grid-cols-1 gap-[var(--grid-gap)] m3-medium:mt-24 m3-medium:grid-cols-2 m3-laptop:grid-cols-3"
      data-about-mosaic
    >
      {/* Kolom kiri — turun paling jauh di desktop */}
      <div className={cn(column, "m3-laptop:mt-40")}>
        <BentoCard aspect="aspect-[4/3]" tone="tint">
          <CardTitle>{copy.collections.title}</CardTitle>
          <CardText>{copy.collections.description}</CardText>
          <div className="mt-auto flex justify-center pt-4">
            <FolderFloat
              folderColor="color-mix(in oklab, var(--brand-primary) 70%, black)"
              frontColor="var(--brand-primary)"
              height={104}
              itemColor="var(--surface-raised)"
              itemTextColor="var(--text-heading)"
              items={COLLECTION_TAGS}
              label={copy.collections.folder}
              labelColor="var(--brand-on-primary)"
              lift={18}
              spread={130}
              sublabel={copy.collections.hint}
              width={150}
            />
          </div>
        </BentoCard>

        <BentoCard
          aspect="aspect-[2/1]"
          className="items-center justify-center gap-4 text-center"
          tone="solid"
        >
          <CardTitle center size="lg">
            {copy.community.title}
          </CardTitle>
          {/* Avatar stack bawaan (tanpa pil), hanya diperbesar untuk kartu. */}
          <AvatarStack
            avatars={COMMUNITY_AVATARS}
            className="-space-x-3 [&_[data-slot=avatar]]:size-11 [&_[data-slot=avatar]]:bg-muted [&_[data-slot=avatar-group-count]]:size-11 [&_[data-slot=avatar-group-count]]:text-base m3-medium:[&_[data-slot=avatar]]:size-12 m3-medium:[&_[data-slot=avatar-group-count]]:size-12"
            max={5}
          />
        </BentoCard>
      </div>

      {/* Kolom tengah — tidak digeser */}
      <div className={column}>
        <BentoCard aspect="aspect-square" className="gap-2" tone="tint">
          <CardTitle center>{copy.calendar.title}</CardTitle>
          {/* Kalender sobek (xevrion lab): tarik halaman ke atas untuk hari
              berikutnya, ke bawah untuk kembali — mewakili kalender di
              dashboard creator. */}
          <FitContain designHeight={CALENDAR_HEIGHT} designWidth={CALENDAR_WIDTH}>
            <TearOffCalendar
              labels={copy.calendar.labels}
              locale={locale}
              onChange={(next) => setDayOffset(toDay(next) - toDay(today))}
              today={today}
              value={calendarValue}
            />
          </FitContain>
        </BentoCard>

        <BentoCard aspect="aspect-[2/3]" className="pb-0" tone="solid">
          <CardTitle center size="lg">
            {copy.studio.title}
          </CardTitle>
          <CardText center>{copy.studio.description}</CardText>
          {/* Ponsel sengaja terpotong di tepi bawah kartu, seperti referensi. */}
          <div className="mt-auto pt-6">
            <FitScale
              designHeight={PHONE_HEIGHT}
              designWidth={PHONE_WIDTH}
              widthRatio={0.72}
            >
              <IPhone17ProMax
                className="!p-0"
                dynamicIslandContent={
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="size-5 text-brand" weight="fill" />
                    {copy.studio.island}
                  </span>
                }
                height={`${PHONE_HEIGHT}px`}
              >
                <Image
                  alt=""
                  className="object-cover object-top"
                  fill
                  sizes="320px"
                  src={PHONE_SCREEN_SRC}
                />
              </IPhone17ProMax>
            </FitScale>
          </div>
        </BentoCard>
      </div>

      {/* Kolom kanan — turun sedang di desktop */}
      <div className={cn(column, "m3-laptop:mt-20")}>
        <BentoCard aspect="aspect-[3/4]" className="gap-3" tone="solid">
          <div>
            <CardTitle>{copy.analytics.title}</CardTitle>
            <CardText>{copy.analytics.description}</CardText>
          </div>
          {/* Panel dashboard: total views + views per proyek (mockup). */}
          <div
            className="flex min-h-0 flex-1 flex-col rounded-[var(--radius-card)] bg-surface-raised p-4 text-heading shadow-[var(--shadow-control)]"
            ref={analyticsRef}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="type-metadata text-copy-secondary">{copy.analytics.panel}</p>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">
                  <RollingNumber format={formatNumber} value={analyticsInView ? SAMPLE_TOTAL_VIEWS : 0} />
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-1 type-metadata font-semibold text-brand">
                <Briefcase className="size-3.5" weight="bold" />
                {copy.analytics.projects.replace("{count}", String(SAMPLE_PROJECTS.length))}
              </span>
            </div>
            <div className="mt-auto">
              <AnalyticsLineChart
                className="-mx-3 -mb-2"
                data={chartData}
                dotColors={chartData.map((_, index) =>
                  index === chartData.length - 1 ? "var(--brand-primary)" : "color-mix(in oklab, var(--brand-primary) 55%, white)",
                )}
                formatDate={formatProject}
                gradientStops={[
                  { offset: "0%", color: "color-mix(in oklab, var(--brand-primary) 35%, white)" },
                  { offset: "100%", color: "var(--brand-primary)" },
                ]}
                gridLines={4}
                height={220}
                pinnedIndices={[]}
                valueLabel=""
              />
            </div>
          </div>
          <dl className="flex flex-col gap-2">
            {SAMPLE_ROWS.map((row) => (
              <div
                className="flex items-center gap-3 rounded-[var(--radius-control)] bg-surface-raised px-4 py-3 text-heading shadow-[var(--shadow-control)]"
                key={row.key}
              >
                {row.key === "likes" ? (
                  <Heart className="size-5 text-[#f43f5e]" weight="fill" />
                ) : (
                  <BookmarkSimple className="size-5 text-brand" weight="fill" />
                )}
                <dt className="sr-only">{copy.analytics[row.key]}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  <RollingNumber format={formatNumber} value={analyticsInView ? row.value : 0} />{" "}
                  <span className="type-label font-normal text-copy-secondary">{copy.analytics[row.key]}</span>
                </dd>
              </div>
            ))}
          </dl>
        </BentoCard>

        <BentoCard
          aspect="aspect-[16/9]"
          className="flex-row gap-2 py-0 pr-0"
          tone="tint"
        >
          {/* Teks di kiri, komputer di kanan — seperti kartu "Real-time Data". */}
          <div className="flex w-[44%] shrink-0 flex-col justify-center py-[var(--card-padding)]">
            <CardTitle>{copy.explore.title}</CardTitle>
            <CardText>{copy.explore.description}</CardText>
          </div>
          {/* Bingkai 1365×768 memuat banyak ruang kosong di kiri-kanan; tingginya
              dibuat melebihi kartu supaya komputernya mengisi sisi kanan. */}
          <div className="relative min-w-0 flex-1 overflow-hidden">
            <MacScreen
              className="absolute left-1/2 top-1/2 h-[125%] -translate-x-1/2 -translate-y-1/2"
              imageClassName="h-full w-auto max-w-none"
            >
              {/* Dither (cult-ui) versi berwarna & lembut: tetap ada tekstur
                  titik ala layar lama, tanpa dipaksa jadi hitam-putih. Isinya
                  WebP animasi hero halaman Jelajah. */}
              <DitherImageFrame
                brightness={1.02}
                className="h-full"
                contrast={1.3}
                grayscale={0}
                opacity={0.35}
                rounded={false}
                size="sm"
              >
                <DitherImageContent
                  alt=""
                  className="object-top"
                  fill
                  sizes="240px"
                  src={MAC_SCREEN_SRC}
                  unoptimized
                />
              </DitherImageFrame>
            </MacScreen>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
