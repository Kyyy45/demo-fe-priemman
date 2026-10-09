"use client";

import { useEffect, useState } from "react";
import { DashboardErrorScreen } from "@/shared/components/error-pages";
import {
  Briefcase,
} from "@phosphor-icons/react";
import { enUS, id } from "date-fns/locale";
import { toast } from "sonner";

import { AppSidebar } from "@/features/dashboard-user/components/app-sidebar";
import { ProjectLibrary } from "@/shared/layout/dashboard/project-library";
import {
  calendarService,
  getErrorMessage,
  isInvalidSessionError,
  projectActionService,
  userService,
} from "@/shared/api";
import { upgradeStatusClass } from "@/shared/lib/upgrade-status";
import {
  clearRoleRedirectGuard,
  redirectToRoleDashboard,
} from "@/shared/lib/dashboard-role-routing";
import type { CalendarWorkspace } from "@/shared/lib/types/calendar";
import type {
  CurrentUser,
  UpgradeLog,
  UpgradeStatus,
} from "@/shared/lib/types/user";
import { AccountSettings } from "@/shared/layout/dashboard/account";
import { DashboardLayout } from "@/shared/layout/dashboard/dashboard-layout";
import { DashboardLoading } from "@/shared/layout/dashboard/dashboard-loading";
import { DashboardFolderCard } from "@/shared/layout/dashboard/folder-card";
import { useDashboardNavigation } from "@/shared/layout/dashboard/use-dashboard-navigation";
import { useLanguage } from "@/shared/providers/language-provider";
import { Calendar08 } from "@/shared/ui/shadcn-space/calendar-08";
import { Table01 } from "@/shared/ui/shadcn-space/table-01";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

// 1. Dashboard hanya mengekspos section yang mempunyai UI dan endpoint User.
const dashboardSections = {
  Dashboard: "overview",
  Account: "account",
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
  role: "user",
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

type OverviewProps = {
  user: CurrentUser;
  upgrade: UpgradeStatus | null;
  upgradeLogs: UpgradeLog[];
  upgradeLogsLoading: boolean;
  upgradeLogLimit: number;
  upgradeLogOffset: number;
  calendar: CalendarWorkspace | null;
  libraryCounts: { liked: number; saved: number };
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
  requesting,
  onOpenAccount,
  onOpenLibrary,
  onRequestUpgrade,
  onUpgradeLogPageChange,
}: OverviewProps) {
  const { lang, t } = useLanguage();
  const copy = t.dashboardUser.overview;
  const localeCode = lang === "id" ? "id-ID" : "en-US";
  const status = upgrade?.status ?? "none";
  const statusLabel =
    (copy.statuses as Record<string, string>)[status] ?? status;
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
    <section className="grid min-h-[calc(100svh-7.75rem)] w-full grid-cols-1 items-stretch gap-[var(--grid-gap)] m3-large:-mb-[var(--dashboard-content-padding)] m3-large:h-[max(calc(100svh_-_var(--dashboard-header-height)_-_var(--dashboard-frame)_*_3),40rem)] m3-large:min-h-0 m3-large:grid-cols-[minmax(0,1fr)_16.5rem_16.5rem] m3-large:grid-rows-[20rem_minmax(0,1fr)]">
      <FolderCard
        connectedCount={user.connectedAccounts.length}
        likedCount={libraryCounts.liked}
        onOpenAccount={onOpenAccount}
        onOpenLibrary={onOpenLibrary}
        savedCount={libraryCounts.saved}
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
              {statusLabel}
            </span>
          </div>
          <h2 className="dashboard-card-title mt-5">{copy.upgrade}</h2>
          <p className="dashboard-body mt-2">
            {canRequestUpgrade ? copy.upgradeDescription : copy.currentLevel}
          </p>
          <Button
            className="mt-auto w-full !h-11 !min-h-11"
            disabled={!canRequestUpgrade || requesting}
            onClick={onRequestUpgrade}
            type="button"
          >
            {requesting
              ? copy.submitting
              : canRequestUpgrade
                ? copy.requestAccess
                : copy.requestState.replace("{status}", statusLabel)}
          </Button>
        </div>
      </section>

      <Calendar08
        addEventLabel={t.calendar.refresh}
        className="min-h-[calc(48rem+var(--grid-gap))] m3-large:col-start-3 m3-large:row-span-2 m3-large:row-start-1 m3-large:min-h-0"
        emptyLabel={t.calendar.noEvents}
        events={calendarEvents}
        locale={lang === "id" ? id : enUS}
        localeCode={localeCode}
      />

      <UpgradeLogTable
        copy={copy}
        limit={upgradeLogLimit}
        loading={upgradeLogsLoading}
        localeCode={localeCode}
        logs={upgradeLogs}
        offset={upgradeLogOffset}
        onPageChange={onUpgradeLogPageChange}
      />
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
    <DashboardFolderCard
      metrics={[
        {
          description: metricCopy.projects,
          metric: likedCount,
          onClick: () => onOpenLibrary("Liked"),
          surfaceClassName: "[--metric-surface:var(--dashboard-metric-liked)]",
          title: metricCopy.liked,
        },
        {
          description: metricCopy.projects,
          metric: savedCount,
          onClick: () => onOpenLibrary("Saved"),
          surfaceClassName: "[--metric-surface:var(--dashboard-metric-saved)]",
          title: metricCopy.saved,
        },
        {
          description: metricCopy.accounts,
          metric: connectedCount,
          onClick: onOpenAccount,
          surfaceClassName:
            "[--metric-surface:var(--dashboard-metric-connected)]",
          title: metricCopy.connected,
        },
      ]}
      subtitle={subtitle}
      title={title}
    />
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
    <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface-container-low m3-large:col-span-2 m3-large:col-start-1 m3-large:row-start-2 m3-large:min-h-0">
      <div className="border-b border-border-subtle p-[var(--dashboard-frame)]">
        <h2 className="dashboard-card-table">{copy.upgrade}</h2>
        <p className="dashboard-table-label mt-1">{copy.historyTitle}</p>
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
                  <TableCell className="dashboard-body max-w-72 whitespace-normal px-4 py-4 pr-5 !text-copy [overflow-wrap:anywhere]">
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

export function UserDashboardPage() {
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
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [loadError, setLoadError] = useState<unknown>(null);
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
        if (currentUser.role === "creator") {
          redirectToRoleDashboard(currentUser.role);
          return;
        }
        if (currentUser.role === "admin") {
          redirectToRoleDashboard(currentUser.role);
          return;
        }
        clearRoleRedirectGuard();
        setUser(currentUser);

        const [
          upgradeResult,
          logsResult,
          calendarResult,
          likedResult,
          savedResult,
        ] = await Promise.allSettled([
          userService.getUpgradeStatus(),
          userService.listUpgradeLogs(5, 0),
          calendarService.getWorkspace(),
          projectActionService.listLiked({ limit: 10, offset: 0 }),
          projectActionService.listSaved({ limit: 10, offset: 0 }),
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
      } catch (error) {
        if (!active) return;
        if (isInvalidSessionError(error)) {
          const nextPath = `${window.location.pathname}${window.location.search}`;
          window.location.replace(
            `/login?next=${encodeURIComponent(nextPath)}`,
          );
          return;
        }
        setLoadError(error);
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
      if (latestUser.role === "creator") {
        redirectToRoleDashboard(latestUser.role);
        return;
      }
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

  if (loading) return <DashboardLoading label="Loading user dashboard" />;

  if (!user) {
    return (
      <DashboardErrorScreen
        error={loadError}
        onRetry={() => setRetryKey((value) => value + 1)}
      />
    );
  }

  const openAccount = () => {
    setActiveParent("Account");
    setActiveChild(null);
  };
  const openLibrary = (tab: "Liked" | "Saved") => {
    setActiveParent("Library");
    setActiveChild(tab);
  };

  // ProjectLibrary jatuh balik ke mode "liked" saat activeChild null (lihat
  // mode={activeChild === "Saved" ? "saved" : "liked"} di bawah). Supaya
  // submenu sidebar "Liked" ikut ter-highlight primary sesuai konten yang
  // benar-benar tampil — termasuk saat masuk lewat URL langsung tanpa
  // ?page=Liked — sidebar diberi nilai activeChild yang sudah dinormalisasi.
  const sidebarActiveChild =
    activeParent === "Library" && !activeChild ? "Liked" : activeChild;

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
      {activeParent === "Library" ? (
        <ProjectLibrary
          copy={t.dashboardUser.library}
          mode={activeChild === "Saved" ? "saved" : "liked"}
        />
      ) : null}
    </DashboardLayout>
  );
}
