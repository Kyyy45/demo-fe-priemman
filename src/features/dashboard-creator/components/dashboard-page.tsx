"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowClockwise,
  ArrowUpRight,
  Briefcase,
  WarningCircle,
} from "@phosphor-icons/react";
import { enUS, id } from "date-fns/locale";
import { toast } from "sonner";

import { AppSidebar } from "@/features/dashboard-creator/components/app-sidebar";
import { CreatorStudio } from "@/features/dashboard-creator/components/creator-studio";
import { CollectionsPanel } from "@/features/dashboard-creator/components/creator-studio/collections-panel";
import { ProjectLibrary } from "@/shared/layout/dashboard/project-library";
import {
  ApiError,
  calendarService,
  getErrorMessage,
  projectActionService,
  projectService,
  userService,
} from "@/shared/api";
import type { CalendarWorkspace } from "@/shared/lib/types/calendar";
import type {
  CurrentUser,
  UpgradeLog,
  UpgradeStatus,
} from "@/shared/lib/types/user";
import type { Project } from "@/shared/lib/types/project";
import { AccountSettings } from "@/shared/layout/dashboard/account";
import { DashboardLayout } from "@/shared/layout/dashboard/dashboard-layout";
import { DashboardLoading } from "@/shared/layout/dashboard/dashboard-loading";
import { useDashboardNavigation } from "@/shared/layout/dashboard/use-dashboard-navigation";
import { useLanguage } from "@/shared/providers/language-provider";
import { Button } from "@/shared/ui/button";
import { Calendar08 } from "@/shared/ui/shadcn-space/calendar-08";
import { Table01 } from "@/shared/ui/shadcn-space/table-01";
import {
  CutoutCard,
  CutoutCardAction,
  CutoutCardPin,
  CutoutCorner,
} from "@/shared/ui/cutout-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

// Creator dashboard memakai shell overview yang sama, tetapi data dimuat dari endpoint creator.
const dashboardSections = {
  Dashboard: "overview",
  Account: "account",
  "Creator Studio": "creator-studio",
  Library: "library",
};

// 2. Preview ini hanya membuka desain saat development; production tetap wajib session.
const DEVELOPMENT_PREVIEW_USER: CurrentUser = {
  id: "development-preview",
  email: "preview@localhost",
  firstName: "Design",
  lastName: "Preview",
  headline: "",
  company: "",
  websiteUrl: "",
  avatarUrl: "",
  isOnboarded: false,
  role: "creator",
  location: { country: "", city: "" },
  workExperience: [],
  connectedAccounts: [],
  aboutMe: { title: "", description: "" },
  createdAt: "",
  updatedAt: "",
};

function displayName(user: CurrentUser) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  );
}

function formatDate(value: string, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function upgradeStatusClass(status: string) {
  switch (status) {
    case "approved":
    case "paid":
      return "bg-success/12 text-success";
    case "rejected":
      return "bg-danger/12 text-danger";
    case "pending":
      return "bg-warning/12 text-warning";
    default:
      return "bg-surface-container-high text-copy-secondary";
  }
}

function isInvalidSessionError(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  if ([400, 401, 403].includes(error.status)) return true;
  return /unauthenticated|unauthorized|invalid.?session|session.?expired/i.test(
    error.code ?? "",
  );
}

type OverviewProps = {
  user: CurrentUser;
  upgrade: UpgradeStatus | null;
  upgradeLogs: UpgradeLog[];
  upgradeLogsLoading: boolean;
  upgradeLogLimit: number;
  upgradeLogOffset: number;
  calendar: CalendarWorkspace | null;
  libraryCounts: { liked: number; saved: number };
  projects: Project[];
  requesting: boolean;
  onOpenAccount: () => void;
  onOpenLibrary: (tab: "Liked" | "Saved") => void;
  onRequestUpgrade: () => void;
  onUpgradeLogPageChange: (limit: number, offset: number) => void;
};

// 3. Bento grid mengikuti referensi: folder fleksibel, dua kolom kanan tetap stabil.
function Overview({
  user,
  upgrade,
  upgradeLogs,
  upgradeLogsLoading,
  upgradeLogLimit,
  upgradeLogOffset,
  calendar,
  libraryCounts,
  projects,
  requesting,
  onOpenAccount,
  onOpenLibrary,
  onRequestUpgrade,
  onUpgradeLogPageChange,
}: OverviewProps) {
  const { lang, t } = useLanguage();
  const copy = t.dashboardCreator.overview;
  const localeCode = lang === "id" ? "id-ID" : "en-US";
  const [projectPageSize, setProjectPageSize] = useState(10);
  const [projectOffset, setProjectOffset] = useState(0);
  const visibleProjects = useMemo(
    () => projects.slice(projectOffset, projectOffset + projectPageSize),
    [projects, projectOffset, projectPageSize],
  );
  const publishedProjects = projects.filter(
    (project) => project.status === "published",
  ).length;
  const draftProjects = projects.filter(
    (project) => project.status === "draft",
  ).length;
  const welcomeTitle = copy.title.replace(
    "{name}",
    user.firstName || displayName(user),
  );
  const canRequestUpgrade =
    user.role === "user" && (status === "none" || status === "rejected");
  const calendarEvents = (calendar?.events ?? []).map((event, index) => ({
    title: event.title || t.calendar.untitled,
    from: event.start,
    to: event.end || event.start,
    color: (["blue", "teal", "orange"] as const)[index % 3],
  }));

  return (
    <section className="grid min-h-[calc(100svh-7.75rem)] w-full grid-cols-1 items-stretch gap-[var(--grid-gap)] m3-large:grid-cols-[minmax(0,1fr)_16.5rem_16.5rem] m3-large:grid-rows-[20rem_minmax(28rem,1fr)]">
      <FolderCard
        connectedCount={projects.length}
        likedCount={projects.reduce(
          (sum, project) => sum + project.metrics.likes,
          0,
        )}
        onOpenAccount={onOpenAccount}
        onOpenLibrary={onOpenLibrary}
        savedCount={projects.reduce(
          (sum, project) => sum + project.metrics.saves,
          0,
        )}
        subtitle={copy.subtitle}
        title={welcomeTitle}
      />

      <section className="relative min-h-80 overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface-container-low p-[var(--card-padding)]">
        <span
          aria-hidden="true"
          className="absolute -right-7 -top-7 size-28 rounded-full border-[1rem] border-brand/10"
        />
        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <span className="flex size-11 items-center justify-center rounded-[var(--radius-control)] bg-brand/10 text-brand">
              <Briefcase className="size-5" weight="duotone" />
            </span>
            <span className="dashboard-status-label rounded-full bg-surface-container px-3 py-1 text-copy-secondary">
              {projects.length} project
            </span>
          </div>
          <h2 className="dashboard-card-title mt-5">
            {copy.projectStatusTitle}
          </h2>
          <p className="dashboard-body mt-2">{copy.projectStatusDescription}</p>
          <div className="mt-auto grid grid-cols-2 gap-2">
            <div className="rounded-[var(--radius-control)] bg-surface-container p-3">
              <p className="dashboard-metric-value">{publishedProjects}</p>
              <p className="dashboard-status-label text-copy-secondary">
                {copy.publishedProjects}
              </p>
            </div>
            <div className="rounded-[var(--radius-control)] bg-surface-container p-3">
              <p className="dashboard-metric-value">{draftProjects}</p>
              <p className="dashboard-status-label text-copy-secondary">
                {copy.draftProjects}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Calendar08
        addEventLabel={t.calendar.refresh}
        className="min-h-[calc(48rem+var(--grid-gap))] m3-large:col-start-3 m3-large:row-span-2 m3-large:row-start-1"
        emptyLabel={t.calendar.noEvents}
        events={calendarEvents}
        locale={lang === "id" ? id : enUS}
        localeCode={localeCode}
      />

      <section className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface-container-low m3-large:col-span-2">
        <div className="border-b border-border-subtle p-[var(--dashboard-frame)]">
          <h2 className="dashboard-card-title text-copy-secondary">
            {copy.recentProjects}
          </h2>
          <p className="dashboard-status-label mt-1">
            {copy.recentProjectsDescription}
          </p>
        </div>
        <Table01
          count={visibleProjects.length}
          hasNextPage={projectOffset + projectPageSize < projects.length}
          labels={{
            next: lang === "id" ? "Berikutnya" : "Next",
            previous: lang === "id" ? "Sebelumnya" : "Previous",
            show: lang === "id" ? "Tampilkan" : "Show",
            showing:
              lang === "id"
                ? "Menampilkan {first}–{last} proyek"
                : "Showing {first}–{last} projects",
          }}
          offset={projectOffset}
          onNext={() => setProjectOffset((offset) => offset + projectPageSize)}
          onPageSizeChange={(value) => {
            setProjectPageSize(value);
            setProjectOffset(0);
          }}
          onPrevious={() =>
            setProjectOffset((offset) => Math.max(0, offset - projectPageSize))
          }
          pageSize={projectPageSize}
        >
          <Table>
            <TableHeader className="bg-surface-container-high/70">
              <TableRow className="hover:bg-transparent">
                <TableHead className="dashboard-table-label h-12 px-4 first:pl-5">
                  {lang === "id" ? "Proyek" : "Project"}
                </TableHead>
                <TableHead className="dashboard-table-label h-12 px-4">
                  Status
                </TableHead>
                <TableHead className="dashboard-table-label h-12 px-4">
                  {copy.metrics.views}
                </TableHead>
                <TableHead className="dashboard-table-label h-12 px-4">
                  {copy.metrics.likes}
                </TableHead>
                <TableHead className="dashboard-table-label h-12 px-4 last:pr-5">
                  {copy.metrics.saves}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleProjects.length ? (
                visibleProjects.map((project) => (
                  <TableRow
                    className="hover:bg-surface-container"
                    key={project.id}
                  >
                    <TableCell className="dashboard-body px-4 py-4 pl-5 font-medium !text-copy">
                      {project.title}
                    </TableCell>
                    <TableCell className="dashboard-body px-4 py-4 !text-copy">
                      {project.status}
                    </TableCell>
                    <TableCell className="dashboard-body px-4 py-4 !text-copy">
                      {project.metrics.views}
                    </TableCell>
                    <TableCell className="dashboard-body px-4 py-4 !text-copy">
                      {project.metrics.likes}
                    </TableCell>
                    <TableCell className="dashboard-body px-4 py-4 pr-5 !text-copy">
                      {project.metrics.saves}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="dashboard-body h-44 px-5 text-center"
                    colSpan={5}
                  >
                    {lang === "id" ? "Belum ada proyek." : "No projects yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Table01>
      </section>
    </section>
  );
}

export function FolderCard({
  title,
  subtitle,
  likedCount,
  savedCount,
  connectedCount,
  onOpenLibrary,
  onOpenAccount,
}: {
  title: string;
  subtitle: string;
  likedCount: number;
  savedCount: number;
  connectedCount: number;
  onOpenLibrary: (tab: "Liked" | "Saved") => void;
  onOpenAccount: () => void;
}) {
  const { lang } = useLanguage();
  const metricCopy =
    lang === "id"
      ? {
          liked: "Disukai",
          saved: "Tersimpan",
          connected: "Terhubung",
          projects: "Total project",
          accounts: "Total akun",
        }
      : {
          liked: "Liked projects",
          saved: "Saved projects",
          connected: "Connected",
          projects: "Total projects",
          accounts: "Total accounts",
        };
  return (
    <figure className="relative min-h-80 w-full overflow-hidden">
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full"
        preserveAspectRatio="none"
        viewBox="0 0 1000 320"
      >
        <defs>
          <clipPath id="dashboard-folder-clip">
            <path d="M0 84Q0 68 48 68H624Q638 68 648 55L690 10Q700 0 720 0H952Q1000 0 1000 24V296Q1000 320 952 320H48Q0 320 0 296Z" />
          </clipPath>
        </defs>
        <image
          clipPath="url(#dashboard-folder-clip)"
          height="320"
          href="/thumb_card.png"
          preserveAspectRatio="xMidYMid slice"
          width="1000"
        />
      </svg>
      <figcaption className="absolute left-0 right-[33%] top-2 z-10 min-w-0 overflow-hidden pr-3">
        <h1 className="dashboard-card-title block max-w-full overflow-hidden text-ellipsis whitespace-nowrap !text-base">
          {title}
        </h1>
        <p className="dashboard-body mt-0.5 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap !text-sm">
          {subtitle}
        </p>
      </figcaption>
      <div className="absolute inset-x-1.5 bottom-2 z-10 grid grid-cols-3 gap-1 min-[23.5rem]:inset-x-3 min-[23.5rem]:bottom-3 min-[23.5rem]:gap-2 m3-medium:inset-x-[var(--card-padding)] m3-medium:bottom-[var(--card-padding)] m3-medium:gap-3">
        <ReverseCutoutCard
          description={metricCopy.projects}
          metric={likedCount}
          onClick={() => onOpenLibrary("Liked")}
          surfaceClassName="[--metric-surface:var(--dashboard-metric-liked)]"
          title={metricCopy.liked}
        />
        <ReverseCutoutCard
          description={metricCopy.projects}
          metric={savedCount}
          onClick={() => onOpenLibrary("Saved")}
          surfaceClassName="[--metric-surface:var(--dashboard-metric-saved)]"
          title={metricCopy.saved}
        />
        <ReverseCutoutCard
          description={metricCopy.accounts}
          metric={connectedCount}
          onClick={onOpenAccount}
          surfaceClassName="[--metric-surface:var(--dashboard-metric-connected)]"
          title={metricCopy.connected}
        />
      </div>
    </figure>
  );
}

// 4. Cutout berada di kanan bawah, kebalikan card Explore yang memotong sisi atas.
function ReverseCutoutCard({
  surfaceClassName,
  title,
  description,
  metric,
  onClick,
}: {
  surfaceClassName: string;
  title: string;
  description: string;
  metric: number;
  onClick: () => void;
}) {
  return (
    <CutoutCard
      className={`group relative min-h-[9.875rem] overflow-hidden text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand m3-medium:min-h-40 ${surfaceClassName}`}
      initial={false}
      onClick={onClick}
      trackPointerHover={false}
    >
      <span className="absolute inset-x-0 top-0 bottom-12 rounded-t-[var(--radius-card)] rounded-br-[20px] bg-[var(--metric-surface)] m3-medium:bottom-[3.25rem]" />
      <span className="absolute inset-y-0 left-0 right-12 rounded-l-[var(--radius-card)] rounded-br-[20px] bg-[var(--metric-surface)] m3-medium:right-[3.25rem]" />
      <CutoutCorner
        className="absolute bottom-7 right-7 [transform:rotate(180deg)] text-[var(--metric-surface)] m3-medium:bottom-8 m3-medium:right-8"
        size={20}
      />
      <span className="absolute inset-0 flex min-w-0 flex-col p-1.5 pb-12 min-[23.5rem]:p-3 min-[23.5rem]:pb-14 m3-medium:p-4 m3-medium:pb-14">
        <span className="dashboard-card-title line-clamp-2 break-normal !text-xs !leading-[1.25] min-[23.5rem]:!text-sm m3-medium:!text-sm">
          {title}
        </span>
        <span className="dashboard-table-label mt-1 line-clamp-2 break-normal !text-[0.625rem] !leading-[1.3] min-[23.5rem]:!text-[0.6875rem] m3-medium:!text-xs">
          {description}
        </span>
        <strong className="mt-auto text-2xl font-semibold leading-none text-heading min-[23.5rem]:text-[1.75rem] m3-medium:text-[1.75rem]">
          {metric.toLocaleString()}
        </strong>
      </span>
      <CutoutCardPin className="bottom-0 right-0 p-1.5">
        <CutoutCardAction
          className="relative static transform-none opacity-100"
          revealOnHover={false}
        >
          <button
            aria-label={title}
            className="group/action flex size-[38px] cursor-pointer items-center justify-center rounded-full bg-action-ink text-on-dark shadow-[var(--shadow-control)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand m3-medium:size-10"
            onClick={(event) => {
              event.stopPropagation();
              onClick();
            }}
            type="button"
          >
            <ArrowUpRight
              className="icon-motion-arrow-up-right size-4"
              weight="bold"
            />
          </button>
        </CutoutCardAction>
      </CutoutCardPin>
    </CutoutCard>
  );
}

function UpgradeLogTable({
  logs,
  copy,
  localeCode,
  limit,
  offset,
  loading,
  onPageChange,
}: {
  logs: UpgradeLog[];
  copy: ReturnType<typeof useLanguage>["t"]["dashboardUser"]["overview"];
  localeCode: string;
  limit: number;
  offset: number;
  loading: boolean;
  onPageChange: (limit: number, offset: number) => void;
}) {
  const labels =
    localeCode === "id-ID"
      ? {
          id: "ID",
          status: "Status",
          requested: "Diajukan",
          reviewed: "Ditinjau",
          reason: "Catatan",
          show: "Tampilkan",
          showing: "Menampilkan {first}–{last} entri",
          previous: "Sebelumnya",
          next: "Berikutnya",
        }
      : {
          id: "ID",
          status: "Status",
          requested: "Requested",
          reviewed: "Reviewed",
          reason: "Notes",
          show: "Show",
          showing: "Showing {first}–{last} entries",
          previous: "Previous",
          next: "Next",
        };

  return (
    <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface-container-low m3-large:col-span-2 m3-large:col-start-1 m3-large:row-start-2">
      <div className="border-b border-border-subtle p-[var(--card-padding)]">
        <p className="dashboard-table-label">{copy.upgrade}</p>
        <h2 className="dashboard-card-title mt-1">{copy.historyTitle}</h2>
      </div>
      <Table01
        count={logs.length}
        hasNextPage={logs.length === limit}
        labels={labels}
        loading={loading}
        offset={offset}
        onNext={() => onPageChange(limit, offset + limit)}
        onPageSizeChange={(value) => onPageChange(value, 0)}
        onPrevious={() => onPageChange(limit, Math.max(0, offset - limit))}
        pageSize={limit}
      >
        <Table className="min-w-[48rem]">
          <TableHeader className="bg-surface-container-high/70">
            <TableRow className="hover:bg-transparent">
              {[
                labels.id,
                labels.status,
                labels.requested,
                labels.reviewed,
                labels.reason,
              ].map((label) => (
                <TableHead
                  className="dashboard-table-label h-12 px-4 first:pl-5 last:pr-5"
                  key={label}
                >
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className={loading ? "opacity-55" : undefined}>
            {logs.length ? (
              logs.map((log) => (
                <TableRow className="hover:bg-surface-container" key={log.id}>
                  <TableCell
                    className="dashboard-body max-w-36 truncate px-4 py-4 pl-5 font-medium !text-copy"
                    title={log.id}
                  >
                    #{log.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <span
                      className={`dashboard-status-label inline-flex rounded-full px-3 py-1 ${upgradeStatusClass(log.status)}`}
                    >
                      {(copy.statuses as Record<string, string>)[log.status] ??
                        log.status}
                    </span>
                  </TableCell>
                  <TableCell className="dashboard-body px-4 py-4 !text-copy">
                    {formatDate(log.requestedAt, localeCode)}
                  </TableCell>
                  <TableCell className="dashboard-body px-4 py-4 !text-copy">
                    {formatDate(log.reviewedAt, localeCode)}
                  </TableCell>
                  <TableCell className="dashboard-body max-w-72 whitespace-normal px-4 py-4 pr-5 !text-copy">
                    {log.rejectionReason || "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="dashboard-body h-44 px-5 text-center"
                  colSpan={5}
                >
                  {copy.historyEmpty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Table01>
    </section>
  );
}

export function CreatorDashboardPage() {
  const { t } = useLanguage();
  const { activeParent, activeChild, setActiveParent, setActiveChild } =
    useDashboardNavigation({
      defaultParent: "Dashboard",
      sectionByParent: dashboardSections,
    });
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [upgrade, setUpgrade] = useState<UpgradeStatus | null>(null);
  const [upgradeLogs, setUpgradeLogs] = useState<UpgradeLog[]>([]);
  const [upgradeLogLimit, setUpgradeLogLimit] = useState(5);
  const [upgradeLogOffset, setUpgradeLogOffset] = useState(0);
  const [upgradeLogsLoading, setUpgradeLogsLoading] = useState(false);
  const [calendar, setCalendar] = useState<CalendarWorkspace | null>(null);
  const [libraryCounts, setLibraryCounts] = useState({ liked: 0, saved: 0 });
  const [projects, setProjects] = useState<Project[]>([]);
  // Collections (sidebar: Creator Studio > Collections) memakai cover yang sama
  // seperti grid project Creator Studio: media cover eksplisit, atau media
  // pertama berdasarkan urutan, kalau belum ada cover yang dipilih. Hook ini
  // harus tetap dipanggil sebelum early return `if (!user)` di bawah, supaya
  // urutan hook antar-render konsisten.
  const collectionProjects = useMemo(
    () =>
      projects.map((project) => {
        const orderedMedia = [...project.media].sort(
          (left, right) => left.order - right.order,
        );
        const cover =
          orderedMedia.find((item) => item.id === project.coverMediaId)
            ?.url ??
          orderedMedia[0]?.url ??
          "";
        return { id: project.id, title: project.title, cover };
      }),
    [projects],
  );
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // 5. Profil membuka dashboard; data sekunder tidak boleh menahan shell selamanya.
  useEffect(() => {
    let active = true;
    const isDevelopmentPreview =
      process.env.NODE_ENV === "development" &&
      new URLSearchParams(window.location.search).get("preview") === "design";

    if (isDevelopmentPreview) {
      queueMicrotask(() => {
        if (!active) return;
        setUser(DEVELOPMENT_PREVIEW_USER);
        setUpgrade(null);
        setUpgradeLogs([]);
        setCalendar(null);
        setLibraryCounts({ liked: 0, saved: 0 });
        setLoadError(null);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    async function loadDashboard() {
      setLoading(true);
      setLoadError(null);
      try {
        const currentUser = await userService.getMe();
        if (!active) return;
        if (currentUser.role !== "creator") {
          window.location.replace(
            currentUser.role === "admin" ? "/dashboard-admin" : "/dashboard",
          );
          return;
        }
        setUser(currentUser);

        const [
          upgradeResult,
          logsResult,
          calendarResult,
          likedResult,
          savedResult,
          projectsResult,
        ] = await Promise.allSettled([
          userService.getUpgradeStatus(),
          userService.listUpgradeLogs(5, 0),
          calendarService.getWorkspace(),
          projectActionService.listLiked({ limit: 10, offset: 0 }),
          projectActionService.listSaved({ limit: 10, offset: 0 }),
          projectService.list({ pageSize: 50 }),
        ]);
        if (!active) return;
        setUpgrade(
          upgradeResult.status === "fulfilled" ? upgradeResult.value : null,
        );
        setUpgradeLogs(
          logsResult.status === "fulfilled" ? logsResult.value : [],
        );
        setCalendar(
          calendarResult.status === "fulfilled" ? calendarResult.value : null,
        );
        setLibraryCounts({
          liked:
            likedResult.status === "fulfilled" ? likedResult.value.length : 0,
          saved:
            savedResult.status === "fulfilled" ? savedResult.value.length : 0,
        });
        setProjects(
          projectsResult.status === "fulfilled"
            ? projectsResult.value.projects.filter(
                (project) => project.ownerId === currentUser.id,
              )
            : [],
        );
      } catch (error) {
        if (!active) return;
        if (isInvalidSessionError(error)) {
          const nextPath = `${window.location.pathname}${window.location.search}`;
          window.location.replace(
            `/login?next=${encodeURIComponent(nextPath)}`,
          );
          return;
        }
        // Local development tetap dapat menguji layout creator saat backend/session
        // belum tersedia; production tetap menampilkan error dan tidak memalsukan user.
        if (process.env.NODE_ENV !== "production") {
          setUser(DEVELOPMENT_PREVIEW_USER);
          setUpgrade(null);
          setUpgradeLogs([]);
          setCalendar(null);
          setLibraryCounts({ liked: 0, saved: 0 });
        }
        setLoadError(
          getErrorMessage(
            error,
            t.dashboardUser.overview.unavailableDescription,
          ),
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [retryKey, t.dashboardUser.overview.unavailableDescription]);

  const handleUpgradeLogPageChange = async (limit: number, offset: number) => {
    setUpgradeLogsLoading(true);
    try {
      const nextLogs = await userService.listUpgradeLogs(limit, offset);
      setUpgradeLogs(nextLogs);
      setUpgradeLogLimit(limit);
      setUpgradeLogOffset(offset);
    } catch (error) {
      toast.error(
        getErrorMessage(error, t.dashboardUser.overview.unavailableDescription),
      );
    } finally {
      setUpgradeLogsLoading(false);
    }
  };

  // 6. POST upgrade selalu diikuti refetch status dan log sesuai USER_CONTRACT.md.
  const handleRequestUpgrade = async () => {
    if (requesting) return;
    setRequesting(true);
    const toastId = toast.info(t.dashboardUser.overview.submitting);
    try {
      await userService.requestCreatorUpgrade();
      const [latestUser, latestUpgrade, latestLogs] = await Promise.all([
        userService.getMe(),
        userService.getUpgradeStatus(),
        userService.listUpgradeLogs(upgradeLogLimit, 0),
      ]);
      setUser(latestUser);
      setUpgrade(latestUpgrade);
      setUpgradeLogs(latestLogs);
      setUpgradeLogOffset(0);
      toast.success(t.dashboardUser.overview.requestSuccessTitle, {
        id: toastId,
        description: t.dashboardUser.overview.requestSuccessDescription,
      });
    } catch (error) {
      toast.error(t.dashboardUser.overview.requestErrorTitle, {
        id: toastId,
        description: getErrorMessage(
          error,
          t.dashboardUser.overview.requestError,
        ),
      });
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <DashboardLoading label="Loading creator dashboard" />;

  if (!user) {
    return (
      <main className="dashboard-manrope grid min-h-dvh place-items-center bg-canvas p-[var(--page-gutter)]">
        <section className="w-full max-w-md rounded-[var(--radius-card)] border border-border-subtle bg-surface-container-low p-[var(--panel-padding)] text-center">
          <WarningCircle
            className="mx-auto size-8 text-warning"
            weight="fill"
          />
          <h1 className="dashboard-page-title mt-4">
            {t.dashboardUser.overview.unavailableTitle}
          </h1>
          <p className="dashboard-body mt-2">
            {loadError ?? t.dashboardUser.overview.unavailableDescription}
          </p>
          <Button
            className="mt-6 !h-11 !min-h-11"
            onClick={() => setRetryKey((value) => value + 1)}
            type="button"
          >
            <ArrowClockwise className="size-4" weight="bold" />
            Retry
          </Button>
        </section>
      </main>
    );
  }

  const openAccount = () => {
    setActiveParent("Account");
    setActiveChild(null);
  };
  const openLibrary = (tab: "Liked" | "Saved") => {
    void tab;
    setActiveParent("Creator Studio");
    // "Projects" eksplisit (bukan null) — supaya submenu sidebar yang ter-highlight
    // primary sesuai konten yang benar-benar tampil (lihat render condition di bawah
    // dan isActive di NavMainSubItem, keduanya kini mengandalkan nilai eksplisit ini).
    setActiveChild("Projects");
  };

  // Konten Creator Studio tanpa child eksplisit (activeChild null, lihat kondisi
  // render di bawah) tetap menampilkan "Projects" sebagai fallback. Supaya submenu
  // sidebar yang ter-highlight primary sesuai konten yang benar-benar tampil —
  // termasuk saat masuk lewat URL langsung tanpa ?page=Projects — sidebar diberi
  // nilai activeChild yang sudah dinormalisasi ini, bukan nilai mentahnya.
  const sidebarActiveChild =
    activeParent === "Creator Studio" && !activeChild ? "Projects" : activeChild;

  return (
    <DashboardLayout
      activeChild={sidebarActiveChild}
      activeParent={activeParent}
      setActiveChild={setActiveChild}
      setActiveParent={setActiveParent}
      sidebar={AppSidebar}
      user={user}
    >
      {activeParent === "Dashboard" && !activeChild ? (
        <Overview
          calendar={calendar}
          libraryCounts={libraryCounts}
          projects={projects}
          onOpenAccount={openAccount}
          onOpenLibrary={openLibrary}
          onRequestUpgrade={handleRequestUpgrade}
          onUpgradeLogPageChange={handleUpgradeLogPageChange}
          requesting={requesting}
          upgrade={upgrade}
          upgradeLogLimit={upgradeLogLimit}
          upgradeLogOffset={upgradeLogOffset}
          upgradeLogs={upgradeLogs}
          upgradeLogsLoading={upgradeLogsLoading}
          user={user}
        />
      ) : null}
      {activeParent === "Account" ? (
        <AccountSettings onUserUpdate={setUser} user={user} />
      ) : null}
      {activeParent === "Creator Studio" &&
      (!activeChild || activeChild === "Projects") ? (
        <CreatorStudio />
      ) : null}
      {activeParent === "Creator Studio" && activeChild === "Collections" ? (
        <CollectionsPanel projects={collectionProjects} />
      ) : null}
      {activeParent === "Library" ? (
        <ProjectLibrary
          copy={t.dashboardUser.library}
          mode={activeChild === "Saved" ? "saved" : "liked"}
        />
      ) : null}
    </DashboardLayout>
  );
}
