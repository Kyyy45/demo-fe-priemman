"use client";

import { useState } from "react";

import {
  CalendarDays,
  Check,
  Clock3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { enUS } from "date-fns/locale";
import type { CalendarWorkspace } from "@/shared/lib/types/calendar";
import { Calendar08 } from "@/shared/ui/shadcn-space/calendar-08";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import type {
  AdminUserEntry,
  UpgradeRequestEntry,
} from "@/shared/lib/types/admin";
import type { CurrentUser } from "@/shared/lib/types/user";

// Memilih variant badge berdasarkan role user
function roleBadge(role: string) {
  if (role === "admin") return "default";
  if (role === "creator") return "secondary";

  return "outline";
}

// Membuat nama lengkap admin untuk ditampilkan
function displayName(user: CurrentUser) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  );
}

// Membuat nama user dari profile atau email
function adminUserName(user: AdminUserEntry) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  );
}

// Membuat inisial untuk fallback avatar user
function userInitials(user: AdminUserEntry) {
  const parts = adminUserName(user)
    .split(/[\s@._-]+/)
    .filter(Boolean);
  return `${parts[0]?.[0] ?? "U"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

// Mengubah tanggal pendaftaran menjadi label singkat
function joinedDate(value: string) {
  if (!value) return "Join date unavailable";
  return `Joined ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value))}`;
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-[var(--grid-gap)] type-label">
      <span className="text-copy-secondary">{label}</span>
      <span className="text-right font-medium text-copy break-words">
        {value || "-"}
      </span>
    </div>
  );
}

export function Overview({
  currentUser,
  users,
  totalUsers,
  userPage,
  userPageSize,
  onUserPageChange,
  requests,
  busyId,
  onReview,
  onConfirmPayment,
  calendar,
}: {
  currentUser: CurrentUser;
  users: AdminUserEntry[];
  totalUsers: number;
  userPage: number;
  userPageSize: number;
  onUserPageChange: (page: number) => void;
  requests: UpgradeRequestEntry[];
  busyId: string | null;
  onReview: (id: string, approve: boolean, rejectionReason?: string) => void;
  onConfirmPayment: (id: string) => void;
  calendar: CalendarWorkspace | null;
}) {
  const calendarEvents = (calendar?.events ?? []).map((event, index) => ({
    title: event.title || "Untitled event",
    from: event.start,
    to: event.end || event.start,
    color: (["blue", "teal", "orange"] as const)[index % 3],
  }));
  // Memisahkan request yang masih menunggu dan sudah disetujui
  const pendingRequests = requests.filter(
    (request) => request.status === "pending",
  );
  const approvedRequests = requests.filter(
    (request) => request.status === "approved",
  );
  const activeRequest =
    pendingRequests[0] ?? approvedRequests[0] ?? requests[0];
  const totalUserPages = Math.max(1, Math.ceil(totalUsers / userPageSize));
  const [rejectRequest, setRejectRequest] = useState<UpgradeRequestEntry | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  return (
    <div className="flex min-w-0 flex-col gap-[var(--grid-gap)]">
      {/* Admin Header */}
      <div>
        <h2 className="type-page-title">Admin Dashboard</h2>
        <p className="text-copy-secondary">
          Account summary, user activity, and creator upgrade review.
        </p>
      </div>

      {/* Admin Metrics */}
      <section className="grid min-w-0 gap-[var(--grid-gap)] m3-medium:grid-cols-3">
        <Card className="min-w-0 bg-surface-container-low shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="m3-title-medium">Total users</CardTitle>
            <UsersRound className="h-4 w-4 text-copy-secondary" />
          </CardHeader>
          <CardContent>
            <div className="m3-dashboard-metric font-mono tabular-nums text-heading">
              {totalUsers}
            </div>
            <p className="mt-1 type-metadata text-copy-secondary">
              Accounts returned by the admin endpoint.
            </p>
          </CardContent>
        </Card>
        <Card className="min-w-0 bg-surface-container-low shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="m3-title-medium">Pending upgrades</CardTitle>
            <Clock3 className="h-4 w-4 text-copy-secondary" />
          </CardHeader>
          <CardContent>
            <div className="m3-dashboard-metric font-mono tabular-nums text-heading">
              {pendingRequests.length}
            </div>
            <p className="mt-1 type-metadata text-copy-secondary">
              Creator requests waiting for review.
            </p>
          </CardContent>
        </Card>
        <Card className="min-w-0 bg-surface-container-low shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="m3-title-medium">Access level</CardTitle>
            <ShieldCheck className="h-4 w-4 text-copy-secondary" />
          </CardHeader>
          <CardContent>
            <div className="m3-title-medium capitalize text-heading">
              {currentUser.role}
            </div>
            <p className="mt-1 type-metadata text-copy-secondary">
              Current authenticated role.
            </p>
          </CardContent>
        </Card>
      </section>

      <Calendar08
        className="min-h-[28rem]"
        events={calendarEvents}
        locale={enUS}
        localeCode="en-US"
      />

      {/* Upgrade Requests */}
      <section className="grid min-w-0 gap-[var(--grid-gap)] m3-large:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="min-w-0 bg-surface-container-low shadow-none">
          <CardHeader>
            <CardTitle className="m3-title-medium">
              Creator upgrade queue
            </CardTitle>
            <CardDescription>
              Review pending requests and confirm approved payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 space-y-[var(--grid-gap)]">
            {activeRequest ? (
              <div className="min-w-0 rounded-[var(--radius-control)] bg-surface-container p-[var(--card-padding)]">
                <div className="flex min-w-0 flex-col gap-[var(--grid-gap)] m3-medium:flex-row m3-medium:items-start m3-medium:justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {activeRequest.email}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-[var(--grid-gap)] type-label text-copy-secondary">
                      <Badge className="m3-label-small" variant="outline">
                        {activeRequest.status}
                      </Badge>
                      <span>{activeRequest.invoiceId || "No invoice yet"}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-[var(--grid-gap)]">
                    {activeRequest.status === "pending" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-danger hover:border-danger hover:bg-danger/10 hover:text-danger"
                          disabled={busyId === activeRequest.id}
                          onClick={() => {
                            setRejectionReason("");
                            setRejectRequest(activeRequest);
                          }}
                        >
                          <X className="mr-1 size-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-success text-on-brand hover:bg-success/90"
                          disabled={busyId === activeRequest.id}
                          onClick={() => onReview(activeRequest.id, true)}
                        >
                          <Check className="mr-1 size-4" />
                          Approve
                        </Button>
                      </>
                    ) : null}
                    {activeRequest.status === "approved" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === activeRequest.id}
                        onClick={() => onConfirmPayment(activeRequest.id)}
                      >
                        Confirm
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[var(--radius-control)] border border-dashed p-[var(--card-padding)] text-center type-label text-copy-secondary">
                No pending upgrade requests.
              </div>
            )}

            <Separator />

            <div className="min-w-0 overflow-x-auto">
              <Table className="min-w-[560px]">
                <TableHeader className="bg-surface-container">
                  <TableRow>
                    <TableHead className="m3-label-medium uppercase text-copy-secondary">
                      Email
                    </TableHead>
                    <TableHead className="m3-label-medium uppercase text-copy-secondary">
                      Status
                    </TableHead>
                    <TableHead className="m3-label-medium text-right uppercase text-copy-secondary">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-20 text-center text-copy-secondary"
                      >
                        No upgrade requests.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.slice(0, 6).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.email}
                        </TableCell>
                        <TableCell>
                          <Badge className="m3-label-small" variant="outline">
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status === "pending" ? (
                            <Button
                              size="sm"
                              className="bg-success text-on-brand hover:bg-success/90"
                              disabled={busyId === request.id}
                              onClick={() => onReview(request.id, true)}
                            >
                              Approve
                            </Button>
                          ) : request.status === "approved" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busyId === request.id}
                              onClick={() => onConfirmPayment(request.id)}
                            >
                              Confirm
                            </Button>
                          ) : (
                            <span className="type-label text-copy-secondary">
                              -
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 bg-surface-container-low shadow-none">
          <CardHeader>
            <CardTitle className="m3-title-medium">Admin snapshot</CardTitle>
            <CardDescription>
              Current admin profile and recent users.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 space-y-[var(--grid-gap)]">
            <div className="space-y-[var(--grid-gap)]">
              <ProfileField label="Name" value={displayName(currentUser)} />
              <ProfileField label="Email" value={currentUser.email} />
              <ProfileField
                label="Role"
                value={
                  <Badge className="m3-label-small" variant="outline">
                    {currentUser.role}
                  </Badge>
                }
              />
              <ProfileField label="Company" value={currentUser.company} />
              <ProfileField
                label="Location"
                value={[currentUser.location.city, currentUser.location.country]
                  .filter(Boolean)
                  .join(", ")}
              />
            </div>

            <Separator />

            <div className="space-y-[var(--grid-gap)]">
              <div className="m3-title-medium">Recent users</div>
              {users.length === 0 ? (
                <p className="type-label text-copy-secondary">
                  No users returned.
                </p>
              ) : (
                users.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex min-w-0 items-center justify-between gap-[var(--grid-gap)] type-label"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{user.email}</div>
                      <div className="truncate type-metadata text-copy-secondary">
                        {[user.firstName, user.lastName]
                          .filter(Boolean)
                          .join(" ") || "-"}
                      </div>
                    </div>
                    <Badge
                      className="m3-label-small"
                      variant={roleBadge(user.role)}
                    >
                      {user.role}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* User Directory */}
      <Card className="min-w-0 bg-surface-container-low shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-[var(--grid-gap)]">
            <div>
              <CardTitle className="m3-title-medium">User directory</CardTitle>
              <CardDescription>
                Profile and account information for registered users.
              </CardDescription>
            </div>
            <Badge className="m3-label-small" variant="outline">
              {totalUsers} accounts
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="rounded-[var(--radius-control)] border border-dashed p-[var(--card-padding)] text-center type-label text-copy-secondary">
              No users returned.
            </div>
          ) : (
            <div className="grid min-w-0 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-extra-large:grid-cols-3">
              {users.map((user) => {
                return (
                  <article
                    key={user.id}
                    className="flex min-w-0 flex-col rounded-[var(--radius-card)] bg-surface-container p-[var(--card-padding)]"
                  >
                    <div className="flex min-w-0 items-start gap-[var(--grid-gap)]">
                      <Avatar className="size-12 border">
                        <AvatarFallback>{userInitials(user)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-[var(--grid-gap)]">
                          <h3 className="m3-title-medium truncate">
                            {adminUserName(user)}
                          </h3>
                          <Badge
                            className="m3-label-small"
                            variant={roleBadge(user.role)}
                          >
                            {user.role}
                          </Badge>
                        </div>
                        <a
                          className="flex min-h-12 items-center truncate rounded-[var(--radius-control)] type-label text-copy-secondary hover:text-copy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                          href={`mailto:${user.email}`}
                        >
                          {user.email}
                        </a>
                      </div>
                    </div>

                    <div className="mt-[var(--grid-gap)] flex items-center gap-[var(--grid-gap)] border-t pt-[var(--grid-gap)] type-label text-copy-secondary">
                      <CalendarDays className="size-4 shrink-0" />
                      <span>{joinedDate(user.createdAt)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {totalUserPages > 1 ? (
            <div className="mt-[var(--grid-gap)] flex items-center justify-between gap-3 border-t pt-[var(--grid-gap)]">
              <span className="type-label text-copy-secondary">
                Page {userPage + 1} of {totalUserPages}
              </span>
              <div className="flex gap-2">
                <Button
                  aria-label="Previous users page"
                  disabled={userPage === 0}
                  onClick={() => onUserPageChange(userPage - 1)}
                  size="icon-sm"
                  variant="outline"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  aria-label="Next users page"
                  disabled={userPage >= totalUserPages - 1}
                  onClick={() => onUserPageChange(userPage + 1)}
                  size="icon-sm"
                  variant="outline"
                >
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setRejectRequest(null);
        }}
        open={Boolean(rejectRequest)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject creator request?</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason so the applicant understands what needs to be improved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label="Rejection reason"
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Reason for rejection"
            value={rejectionReason}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectRequest(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!rejectionReason.trim() || !rejectRequest}
              onClick={() => {
                if (!rejectRequest || !rejectionReason.trim()) return;
                onReview(rejectRequest.id, false, rejectionReason.trim());
                setRejectRequest(null);
              }}
            >
              Reject request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
