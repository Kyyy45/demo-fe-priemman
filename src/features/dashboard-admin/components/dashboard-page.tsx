"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

import { AccountSettings } from "@/shared/layout/dashboard/account";
import { DashboardLayout } from "@/shared/layout/dashboard/dashboard-layout";
import { DashboardLoading } from "@/shared/layout/dashboard/dashboard-loading";
import { useDashboardNavigation } from "@/shared/layout/dashboard/use-dashboard-navigation";
import { AppSidebar } from "@/features/dashboard-admin/components/app-sidebar";
import {
  Overview,
  QUEUE_STATUSES,
  type QueueStatus,
  type RoleCounts,
  type UpgradeQueue,
  type UserRoleFilter,
} from "@/features/dashboard-admin/components/overview";
import {
  adminService,
  calendarService,
  getLocalizedErrorMessage,
  isInvalidSessionError,
  userService,
} from "@/shared/api";
import type { CalendarWorkspace } from "@/shared/lib/types/calendar";
import type {
  AdminUserEntry,
  AdminUsersResult,
  UpgradeRequestEntry,
} from "@/shared/lib/types/admin";
import type { CurrentUser } from "@/shared/lib/types/user";
import {
  clearRoleRedirectGuard,
  redirectToRoleDashboard,
} from "@/shared/lib/dashboard-role-routing";
import { useLanguage } from "@/shared/providers/language-provider";
import { Button } from "@/shared/ui/button";

const dashboardSections = {
  Dashboard: "overview",
  Account: "account",
};

type UserQuery = { role: UserRoleFilter; limit: number; offset: number };

const EMPTY_QUEUE: UpgradeQueue = {
  pending: [],
  approved: [],
  paid: [],
  rejected: [],
};

// Data contoh hanya untuk development (`?preview=design` atau backend/session
// tidak tersedia); production selalu memakai endpoint /v1/admin/*.
const PREVIEW_ADMIN: CurrentUser = {
  id: "local-preview-admin",
  email: "admin@priemman.local",
  firstName: "Priemman",
  lastName: "Admin",
  headline: "Platform administrator",
  company: "Priemman",
  websiteUrl: "",
  avatarUrl: "",
  isOnboarded: true,
  role: "admin",
  location: { country: "Indonesia", city: "Jakarta" },
  workExperience: [],
  connectedAccounts: [],
  aboutMe: { title: "", description: "" },
  createdAt: "",
  updatedAt: "",
};

const PREVIEW_USERS: AdminUserEntry[] = [
  ["Nari", "Putri", "user"],
  ["Ari", "Wibowo", "creator"],
  ["Dewi", "Lestari", "user"],
  ["Budi", "Santoso", "creator"],
  ["Sari", "Rahma", "user"],
  ["Priemman", "Admin", "admin"],
  ["Andre", "Sitompul", "user"],
].map(([firstName, lastName, role], index) => ({
  id: `preview-user-${index + 1}`,
  email: `${firstName.toLowerCase()}@priemman.local`,
  firstName,
  lastName,
  role: role as AdminUserEntry["role"],
  createdAt: new Date(Date.UTC(2026, 8, 28 - index * 3)).toISOString(),
}));

const PREVIEW_QUEUE: UpgradeQueue = (() => {
  const entry = (
    index: number,
    status: QueueStatus,
    extra: Partial<UpgradeRequestEntry> = {},
  ): UpgradeRequestEntry => ({
    id: `preview-request-${index}`,
    userId: PREVIEW_USERS[index % PREVIEW_USERS.length].id,
    email: PREVIEW_USERS[index % PREVIEW_USERS.length].email,
    status,
    invoiceId: "",
    invoiceAmount: 0,
    currency: "IDR",
    rejectionReason: "",
    requestedAt: new Date(Date.UTC(2026, 9, 6 - index)).toISOString(),
    ...extra,
  });
  const invoice = { invoiceId: "4f1c2a9e-preview-invoice", invoiceAmount: 100000 };
  return {
    pending: [entry(0, "pending"), entry(2, "pending"), entry(4, "pending")],
    approved: [entry(6, "approved", invoice)],
    paid: [entry(1, "paid", invoice), entry(3, "paid", invoice)],
    rejected: [
      entry(5, "rejected", {
        rejectionReason: "Add at least three published projects first.",
      }),
    ],
  };
})();

function previewUsers(query: UserQuery): AdminUsersResult {
  const filtered = PREVIEW_USERS.filter(
    (user) => query.role === "all" || user.role === query.role,
  );
  return {
    users: filtered.slice(query.offset, query.offset + query.limit),
    total: filtered.length,
    limit: query.limit,
    offset: query.offset,
  };
}

function previewRoleCounts(): RoleCounts {
  return {
    user: PREVIEW_USERS.filter((user) => user.role === "user").length,
    creator: PREVIEW_USERS.filter((user) => user.role === "creator").length,
    admin: PREVIEW_USERS.filter((user) => user.role === "admin").length,
  };
}

const queryKey = (query: UserQuery) =>
  `${query.role}:${query.limit}:${query.offset}`;

export function AdminDashboardPage() {
  const { t } = useLanguage();
  const copy = t.dashboardAdmin;
  const { activeParent, activeChild, setActiveParent, setActiveChild } =
    useDashboardNavigation({
      defaultParent: "Dashboard",
      sectionByParent: dashboardSections,
    });

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [calendar, setCalendar] = useState<CalendarWorkspace | null>(null);
  const [requests, setRequests] = useState<UpgradeQueue>(EMPTY_QUEUE);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [roleCounts, setRoleCounts] = useState<RoleCounts | null>(null);
  const [userQuery, setUserQuery] = useState<UserQuery>({
    role: "all",
    limit: 10,
    offset: 0,
  });
  const [usersState, setUsersState] = useState<{
    key: string;
    result: AdminUsersResult | null;
  }>({ key: "", result: null });
  const [busyId, setBusyId] = useState<string | null>(null);

  const errorMessage = (error: unknown, fallback: string) =>
    getLocalizedErrorMessage(error, copy.errors, fallback);

  // Keempat status diminta sekaligus: dipakai tab antrean dan metrik.
  const fetchQueue = async () => {
    const lists = await Promise.all(
      QUEUE_STATUSES.map((status) => adminService.listUpgradeRequests(status)),
    );
    return Object.fromEntries(
      QUEUE_STATUSES.map((status, index) => [status, lists[index]]),
    ) as UpgradeQueue;
  };

  // Jumlah per role memakai `total` dari /admin/users?role=…&limit=1.
  const fetchRoleCounts = async (): Promise<RoleCounts> => {
    const [user, creator, admin] = await Promise.all(
      (["user", "creator", "admin"] as const).map((role) =>
        adminService.listUsers({ role, limit: 1, offset: 0 }),
      ),
    );
    return { user: user.total, creator: creator.total, admin: admin.total };
  };

  // Profil admin → data dashboard. Sesi tidak valid diarahkan ke /login.
  useEffect(() => {
    let active = true;
    const isDesignPreview =
      process.env.NODE_ENV === "development" &&
      new URLSearchParams(window.location.search).get("preview") === "design";

    const applyPreview = () => {
      setPreview(true);
      setCurrentUser(PREVIEW_ADMIN);
      setRequests(PREVIEW_QUEUE);
      setRoleCounts(previewRoleCounts());
      setCalendar(null);
      setLoadError(null);
    };

    async function load() {
      try {
        if (isDesignPreview) {
          await Promise.resolve();
          if (active) applyPreview();
          return;
        }
        const me = await userService.getMe();
        if (!active) return;
        if (me.role !== "admin") {
          redirectToRoleDashboard(me.role);
          return;
        }
        clearRoleRedirectGuard();
        setCurrentUser(me);
        setPreview(false);
        setLoadError(null);

        const [queue, counts, workspace] = await Promise.allSettled([
          fetchQueue(),
          fetchRoleCounts(),
          calendarService.getWorkspace(),
        ]);
        if (!active) return;
        if (queue.status === "fulfilled") setRequests(queue.value);
        else toast.error(errorMessage(queue.reason, copy.feedback.loadError));
        if (counts.status === "fulfilled") setRoleCounts(counts.value);
        setCalendar(workspace.status === "fulfilled" ? workspace.value : null);
      } catch (error) {
        if (!active) return;
        if (isInvalidSessionError(error)) {
          const nextPath = `${window.location.pathname}${window.location.search}`;
          window.location.replace(`/login?next=${encodeURIComponent(nextPath)}`);
          return;
        }
        // Development tetap bisa menguji layout tanpa backend/session;
        // production menampilkan error dan tidak memalsukan data admin.
        if (process.env.NODE_ENV !== "production") applyPreview();
        else {
          setCurrentUser(null);
          setLoadError(errorMessage(error, copy.feedback.loadError));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dimuat ulang hanya saat retry
  }, [retryKey]);

  // Direktori pengguna: dimuat ulang tiap role/halaman/ukuran berubah.
  const currentKey = queryKey(userQuery);
  useEffect(() => {
    if (!currentUser || preview) return;
    let active = true;
    const key = queryKey(userQuery);
    adminService
      .listUsers({
        role: userQuery.role === "all" ? undefined : userQuery.role,
        limit: userQuery.limit,
        offset: userQuery.offset,
      })
      .then(
        (result) => {
          if (active) setUsersState({ key, result });
        },
        (error) => {
          if (!active) return;
          setUsersState({ key, result: null });
          toast.error(
            getLocalizedErrorMessage(error, copy.errors, copy.feedback.loadError),
          );
        },
      );
    return () => {
      active = false;
    };
  }, [copy.errors, copy.feedback.loadError, currentUser, preview, userQuery]);

  const users = useMemo(
    () =>
      preview
        ? previewUsers(userQuery)
        : usersState.key
          ? usersState.result
          : null,
    [preview, userQuery, usersState],
  );
  const usersLoading = !preview && Boolean(currentUser) && usersState.key !== currentKey;

  const refreshQueue = async () => {
    if (preview) return;
    setRequestsLoading(true);
    try {
      setRequests(await fetchQueue());
    } catch (error) {
      toast.error(errorMessage(error, copy.feedback.loadError));
    } finally {
      setRequestsLoading(false);
    }
  };

  // Preview: mutasi lokal supaya alur review bisa dicoba tanpa backend.
  const movePreviewRequest = (
    request: UpgradeRequestEntry,
    to: QueueStatus,
    extra: Partial<UpgradeRequestEntry> = {},
  ) =>
    setRequests((current) => ({
      ...current,
      [request.status as QueueStatus]: current[
        request.status as QueueStatus
      ].filter((item) => item.id !== request.id),
      [to]: [{ ...request, ...extra, status: to }, ...current[to]],
    }));

  const handleApprove = async (request: UpgradeRequestEntry) => {
    setBusyId(request.id);
    try {
      if (preview)
        movePreviewRequest(request, "approved", {
          invoiceId: crypto.randomUUID(),
          invoiceAmount: 100000,
        });
      else await adminService.reviewUpgradeRequest(request.id, true);
      toast.success(copy.feedback.approved);
    } catch (error) {
      toast.error(errorMessage(error, copy.feedback.reviewError));
    } finally {
      await refreshQueue();
      setBusyId(null);
    }
  };

  const handleReject = async (request: UpgradeRequestEntry, reason: string) => {
    setBusyId(request.id);
    try {
      if (preview)
        movePreviewRequest(request, "rejected", { rejectionReason: reason });
      else await adminService.reviewUpgradeRequest(request.id, false, reason);
      toast.success(copy.feedback.rejected);
      return true;
    } catch (error) {
      toast.error(errorMessage(error, copy.feedback.reviewError));
      return false;
    } finally {
      await refreshQueue();
      setBusyId(null);
    }
  };

  // Konfirmasi bayar mengubah role user → antrean, jumlah role, dan
  // direktori dimuat ulang.
  const handleConfirmPayment = async (request: UpgradeRequestEntry) => {
    setBusyId(request.id);
    try {
      if (preview) movePreviewRequest(request, "paid");
      else {
        await adminService.confirmUpgradePayment(request.id);
        const counts = await fetchRoleCounts().catch(() => null);
        if (counts) setRoleCounts(counts);
        setUserQuery((query) => ({ ...query }));
      }
      toast.success(copy.feedback.paid);
      return true;
    } catch (error) {
      toast.error(errorMessage(error, copy.feedback.confirmError));
      return false;
    } finally {
      await refreshQueue();
      setBusyId(null);
    }
  };

  if (loading) return <DashboardLoading label={copy.loading} />;

  if (!currentUser) {
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
            onClick={() => {
              setLoading(true);
              setRetryKey((value) => value + 1);
            }}
            type="button"
          >
            <ArrowClockwise className="size-4" weight="bold" />
            {copy.retry}
          </Button>
        </section>
      </main>
    );
  }

  return (
    <DashboardLayout
      activeChild={activeChild}
      activeParent={activeParent}
      setActiveChild={setActiveChild}
      setActiveParent={setActiveParent}
      sidebar={AppSidebar}
      user={currentUser}
    >
      {activeParent === "Dashboard" && !activeChild ? (
        <Overview
          busyId={busyId}
          calendar={calendar}
          onApprove={(request) => void handleApprove(request)}
          onConfirmPayment={handleConfirmPayment}
          onReject={handleReject}
          onUserQueryChange={setUserQuery}
          requests={requests}
          requestsLoading={requestsLoading}
          roleCounts={roleCounts}
          userQuery={userQuery}
          users={users}
          usersLoading={usersLoading}
        />
      ) : null}
      {activeParent === "Account" ? (
        <AccountSettings onUserUpdate={setCurrentUser} user={currentUser} />
      ) : null}
    </DashboardLayout>
  );
}
