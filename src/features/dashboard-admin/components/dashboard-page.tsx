"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AccountSettings } from "@/shared/layout/dashboard/account";
import { DashboardLayout } from "@/shared/layout/dashboard/dashboard-layout";
import { DashboardLoading } from "@/shared/layout/dashboard/dashboard-loading";
import { useDashboardNavigation } from "@/shared/layout/dashboard/use-dashboard-navigation";
import { AppSidebar } from "@/features/dashboard-admin/components/app-sidebar";
import { Overview } from "@/features/dashboard-admin/components/overview";
import { adminService, calendarService, getErrorMessage, userService } from "@/shared/api";
import type { CalendarWorkspace } from "@/shared/lib/types/calendar";
import type {
  AdminUserEntry,
  UpgradeRequestEntry,
} from "@/shared/lib/types/admin";
import type { CurrentUser } from "@/shared/lib/types/user";

const fallbackAdmin: CurrentUser = {
  id: "local-preview-admin",
  email: "admin@priemman.local",
  firstName: "Priemman",
  lastName: "Admin",
  headline: "Platform administrator",
  company: "Priemman",
  websiteUrl: "https://priemman.my.id",
  avatarUrl: "",
  isOnboarded: true,
  role: "admin",
  location: {
    country: "Indonesia",
    city: "Jakarta",
  },
  workExperience: [],
  connectedAccounts: [],
  aboutMe: {
    title: "Admin",
    description:
      "Local preview profile. Production data is loaded from the Priemman API.",
  },
  createdAt: "",
  updatedAt: "",
};

const fallbackUsers: AdminUserEntry[] = [
  {
    id: "local-user-1",
    email: "user@priemman.local",
    firstName: "Priemman",
    lastName: "User",
    role: "user",
    createdAt: "",
  },
  {
    id: "local-user-2",
    email: "creator@priemman.local",
    firstName: "Priemman",
    lastName: "Creator",
    role: "creator",
    createdAt: "",
  },
  {
    id: "local-user-3",
    email: "admin@priemman.local",
    firstName: "Priemman",
    lastName: "Admin",
    role: "admin",
    createdAt: "",
  },
];

const fallbackRequests: UpgradeRequestEntry[] = [
  {
    id: "local-request-1",
    userId: "local-user-1",
    email: "user@priemman.local",
    status: "pending",
    invoiceId: "",
    invoiceAmount: 0,
    currency: "IDR",
    rejectionReason: "",
    requestedAt: "",
  },
  {
    id: "local-request-2",
    userId: "local-user-2",
    email: "creator@priemman.local",
    status: "approved",
    invoiceId: "INV-LOCAL-001",
    invoiceAmount: 250000,
    currency: "IDR",
    rejectionReason: "",
    requestedAt: "",
  },
];

const canUseLocalPreview = process.env.NODE_ENV !== "production";
const dashboardSections = {
  Dashboard: "overview",
  Account: "account",
};

export function AdminDashboardPage() {
  const { activeParent, activeChild, setActiveParent, setActiveChild } =
    useDashboardNavigation({
      defaultParent: "Dashboard",
      sectionByParent: dashboardSections,
    });
  // Menyimpan data admin, daftar user, request upgrade, dan proses yang sedang berjalan
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<AdminUserEntry[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPage, setUserPage] = useState(0);
  const userPageSize = 12;
  const [requests, setRequests] = useState<UpgradeRequestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<CalendarWorkspace | null>(null);

  // Langkah 2 — Memuat user sesuai halaman aktif dan seluruh queue upgrade.
  const loadAdminData = async (page = userPage) => {
    try {
      const [adminUsers, pendingRequests, approvedRequests, calendarResult] = await Promise.all(
        [
          adminService.listUsers({
            limit: userPageSize,
            offset: page * userPageSize,
          }),
          adminService.listUpgradeRequests("pending"),
          adminService.listUpgradeRequests("approved"),
          calendarService.getWorkspace(),
        ],
      );
      setUsers(adminUsers.users);
      setTotalUsers(adminUsers.total);
      setRequests([...pendingRequests, ...approvedRequests]);
      setCalendar(calendarResult);
    } catch {
      if (!canUseLocalPreview) throw new Error("Failed to load admin data");

      setUsers(fallbackUsers);
      setTotalUsers(fallbackUsers.length);
      setRequests(fallbackRequests);
    }
  };

  // Memastikan user adalah admin sebelum memuat seluruh data dashboard
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const me = await userService.getMe();
        if (!active) return;

        if (me.role !== "admin") {
          const destination =
            me.role === "creator" ? "/dashboard-creator" : "/dashboard";
          window.location.replace(destination);
          return;
        }

        setCurrentUser(me);
        await loadAdminData();
      } catch (error) {
        if (active)
          toast.error(
            getErrorMessage(error, "Unable to load admin dashboard."),
          );
        if (canUseLocalPreview) {
          setCurrentUser(fallbackAdmin);
          setUsers(fallbackUsers);
          setTotalUsers(fallbackUsers.length);
          setRequests(fallbackRequests);
          setCalendar(null);
        } else {
          setCurrentUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  // Menyimpan hasil review lalu memuat ulang data admin
  const handleReview = async (id: string, approve: boolean, rejectionReason = "") => {
    setBusyId(id);
    try {
      await adminService.reviewUpgradeRequest(
        id,
        approve,
        rejectionReason,
      );
      await loadAdminData();
      toast.success(
        approve ? "Creator request approved." : "Creator request rejected.",
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to review creator request."));
    } finally {
      setBusyId(null);
    }
  };

  // Mengonfirmasi pembayaran lalu memperbarui daftar request
  const handleConfirmPayment = async (id: string) => {
    setBusyId(id);
    try {
      await adminService.confirmUpgradePayment(id);
      await loadAdminData();
      toast.success("Creator payment confirmed.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to confirm creator payment."));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <DashboardLoading label="Loading admin dashboard" />;

  if (!currentUser) return null;

  return (
    // Dashboard Layout
    <DashboardLayout
      activeChild={activeChild}
      activeParent={activeParent}
      setActiveChild={setActiveChild}
      setActiveParent={setActiveParent}
      sidebar={AppSidebar}
      user={currentUser}
    >
      {activeParent === "Dashboard" && !activeChild && (
        <Overview
          currentUser={currentUser}
          users={users}
          totalUsers={totalUsers}
          userPage={userPage}
          userPageSize={userPageSize}
          onUserPageChange={(page) => {
            setUserPage(page);
            void loadAdminData(page);
          }}
          requests={requests}
          busyId={busyId}
          onReview={handleReview}
          onConfirmPayment={handleConfirmPayment}
          calendar={calendar}
        />
      )}
      {activeParent === "Account" && (
        <AccountSettings user={currentUser} onUserUpdate={setCurrentUser} />
      )}
    </DashboardLayout>
  );
}
