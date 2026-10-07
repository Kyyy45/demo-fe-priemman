"use client";

import { useRef, useState } from "react";
import { Check, CircleDollarSign, X } from "lucide-react";
import { enUS, id } from "date-fns/locale";

import type { CalendarWorkspace } from "@/shared/lib/types/calendar";
import type {
  AdminUserEntry,
  AdminUsersResult,
  UpgradeRequestEntry,
} from "@/shared/lib/types/admin";
import { MAX_REJECTION_REASON_LENGTH } from "@/shared/api/admin";
import { upgradeStatusClass } from "@/shared/lib/upgrade-status";
import { cn } from "@/shared/lib/utils";
import { DashboardBanner } from "@/shared/layout/dashboard/dashboard-banner";
import { ReverseCutoutCard } from "@/shared/layout/dashboard/reverse-cutout-card";
import { useLanguage } from "@/shared/providers/language-provider";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Calendar08 } from "@/shared/ui/shadcn-space/calendar-08";
import { Table01 } from "@/shared/ui/shadcn-space/table-01";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";

// Status upgrade yang bisa difilter backend (GET /v1/admin/upgrades?status=).
export const QUEUE_STATUSES = ["pending", "approved", "paid", "rejected"] as const;
export type QueueStatus = (typeof QUEUE_STATUSES)[number];
export type UpgradeQueue = Record<QueueStatus, UpgradeRequestEntry[]>;

// Filter role GET /v1/admin/users?role= ("all" = tanpa parameter).
export const USER_ROLE_FILTERS = ["all", "user", "creator", "admin"] as const;
export type UserRoleFilter = (typeof USER_ROLE_FILTERS)[number];
export type RoleCounts = Record<Exclude<UserRoleFilter, "all">, number>;

// Daftar upgrade dibatasi 100 baris oleh backend (tanpa pagination).
const UPGRADE_LIST_LIMIT = 100;
const TABLE_BUTTON_CLASS = "!h-10 !min-h-10 rounded-[var(--radius-control)] px-4";
const DIALOG_BUTTON_CLASS =
  "min-h-12 rounded-[var(--radius-control)] px-4 type-label";
const SECTION_CLASS =
  "flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface-container-low";
const STATUS_PILL_CLASS =
  "dashboard-status-label inline-flex rounded-full px-3 py-1";

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

function formatAmount(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function userName(user: AdminUserEntry) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ");
}

function userInitials(user: AdminUserEntry) {
  const parts = (userName(user) || user.email)
    .split(/[\s@._-]+/)
    .filter(Boolean);
  return `${parts[0]?.[0] ?? "U"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function roleClass(role: string) {
  if (role === "admin") return "bg-brand/12 text-brand";
  if (role === "creator") return "bg-success/12 text-success";
  return "bg-surface-container-high text-copy-secondary";
}

// Header section tabel, sama dengan riwayat upgrade di dashboard creator:
// eyebrow dashboard-table-label + dashboard-card-title, tab di sisi kanan.
function SectionHeader({
  children,
  description,
  eyebrow,
  title,
}: {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-[var(--grid-gap)] border-b border-border-subtle p-[var(--card-padding)] m3-large:flex-row m3-large:items-end m3-large:justify-between">
      <div className="min-w-0">
        <p className="dashboard-table-label">{eyebrow}</p>
        <h2 className="dashboard-card-title mt-1">{title}</h2>
        <p className="dashboard-body mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function Overview({
  busyId,
  calendar,
  onApprove,
  onConfirmPayment,
  onReject,
  onUserQueryChange,
  requests,
  requestsLoading,
  roleCounts,
  userQuery,
  users,
  usersLoading,
}: {
  busyId: string | null;
  calendar: CalendarWorkspace | null;
  onApprove: (request: UpgradeRequestEntry) => void;
  onConfirmPayment: (request: UpgradeRequestEntry) => Promise<boolean>;
  onReject: (request: UpgradeRequestEntry, reason: string) => Promise<boolean>;
  onUserQueryChange: (query: {
    role: UserRoleFilter;
    limit: number;
    offset: number;
  }) => void;
  requests: UpgradeQueue;
  requestsLoading: boolean;
  roleCounts: RoleCounts | null;
  userQuery: { role: UserRoleFilter; limit: number; offset: number };
  users: AdminUsersResult | null;
  usersLoading: boolean;
}) {
  const { lang, t } = useLanguage();
  const copy = t.dashboardAdmin;
  const localeCode = lang === "id" ? "id-ID" : "en-US";

  const queueRef = useRef<HTMLElement>(null);
  const usersRef = useRef<HTMLElement>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>("pending");
  const [queueLimit, setQueueLimit] = useState(5);
  const [queueOffset, setQueueOffset] = useState(0);
  const [rejecting, setRejecting] = useState<UpgradeRequestEntry | null>(null);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState<UpgradeRequestEntry | null>(
    null,
  );

  const countLabel = (items: UpgradeRequestEntry[]) =>
    items.length >= UPGRADE_LIST_LIMIT ? `${UPGRADE_LIST_LIMIT}+` : items.length;
  const totalUsers = roleCounts
    ? roleCounts.user + roleCounts.creator + roleCounts.admin
    : (users?.total ?? 0);
  const tableLabels = copy.table;

  const showQueue = (status: QueueStatus) => {
    setQueueStatus(status);
    setQueueOffset(0);
    queueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const calendarEvents = (calendar?.events ?? []).map((event, index) => ({
    title: event.title || t.calendar.untitled,
    from: event.start,
    to: event.end || event.start,
    color: (["blue", "teal", "orange"] as const)[index % 3],
  }));

  const queueRows = requests[queueStatus].slice(
    queueOffset,
    queueOffset + queueLimit,
  );
  const thirdColumn =
    queueStatus === "rejected"
      ? copy.rejectDialog.label
      : copy.queue.columns.invoice;

  return (
    // Wrapper sama dengan halaman dashboard lain (Creator Studio, Library).
    <div className="flex w-full min-w-0 flex-col gap-[var(--grid-gap)] overflow-x-clip">
      <DashboardBanner subtitle={copy.subtitle} title={copy.title} />

      {/* Metrik — kartu yang sama dengan metrik dashboard user/creator */}
      <section className="grid grid-cols-3 gap-1 min-[23.5rem]:gap-2 m3-medium:gap-[var(--grid-gap)]">
        <ReverseCutoutCard
          description={
            roleCounts
              ? copy.metrics.usersBreakdown
                  .replace("{creator}", String(roleCounts.creator))
                  .replace("{admin}", String(roleCounts.admin))
              : copy.metrics.usersHint
          }
          metric={totalUsers}
          onClick={() =>
            usersRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
          surfaceClassName="[--metric-surface:var(--dashboard-metric-connected)]"
          title={copy.metrics.users}
        />
        <ReverseCutoutCard
          description={copy.metrics.pendingHint}
          metric={countLabel(requests.pending)}
          onClick={() => showQueue("pending")}
          surfaceClassName="[--metric-surface:var(--dashboard-metric-liked)]"
          title={copy.metrics.pending}
        />
        <ReverseCutoutCard
          description={copy.metrics.approvedHint}
          metric={countLabel(requests.approved)}
          onClick={() => showQueue("approved")}
          surfaceClassName="[--metric-surface:var(--dashboard-metric-saved)]"
          title={copy.metrics.approved}
        />
      </section>

      <div className="grid min-w-0 items-stretch gap-[var(--grid-gap)] m3-large:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        {/* Antrean upgrade creator */}
        <section className={cn(SECTION_CLASS, "scroll-mt-4")} ref={queueRef}>
          <SectionHeader
            description={copy.queue.description}
            eyebrow={copy.queue.eyebrow}
            title={copy.queue.title}
          >
            <Tabs
              onValueChange={(value) => {
                setQueueStatus(value as QueueStatus);
                setQueueOffset(0);
              }}
              value={queueStatus}
            >
              <TabsList className="h-12! max-w-full overflow-x-auto overflow-y-hidden">
                {QUEUE_STATUSES.map((status) => (
                  <TabsTrigger key={status} value={status}>
                    {copy.statuses[status]} ({countLabel(requests[status])})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </SectionHeader>
          <Table01
            count={queueRows.length}
            hasNextPage={
              queueOffset + queueLimit < requests[queueStatus].length
            }
            labels={tableLabels}
            loading={requestsLoading}
            offset={queueOffset}
            onNext={() => setQueueOffset(queueOffset + queueLimit)}
            onPageSizeChange={(value) => {
              setQueueLimit(value);
              setQueueOffset(0);
            }}
            onPrevious={() =>
              setQueueOffset(Math.max(0, queueOffset - queueLimit))
            }
            pageSize={queueLimit}
          >
            <Table className="min-w-[48rem]">
              <TableHeader className="bg-surface-container-high/70">
                <TableRow className="hover:bg-transparent">
                  {[
                    copy.queue.columns.applicant,
                    copy.queue.columns.requested,
                    thirdColumn,
                    copy.queue.columns.status,
                    copy.queue.columns.action,
                  ].map((label, index) => (
                    <TableHead
                      className={cn(
                        "dashboard-table-label h-12 px-4 first:pl-5 last:pr-5",
                        index === 4 && "text-right",
                      )}
                      key={label}
                    >
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className={requestsLoading ? "opacity-55" : undefined}>
                {queueRows.length ? (
                  queueRows.map((request) => {
                    const busy = busyId === request.id;
                    return (
                      <TableRow
                        className="hover:bg-surface-container"
                        key={request.id}
                      >
                        <TableCell className="max-w-64 px-4 py-4 pl-5">
                          <p
                            className="dashboard-body truncate font-medium !text-copy"
                            title={request.email}
                          >
                            {request.email}
                          </p>
                          <p
                            className="dashboard-status-label text-copy-secondary"
                            title={request.id}
                          >
                            #{request.id.slice(0, 8)}
                          </p>
                        </TableCell>
                        <TableCell className="dashboard-body px-4 py-4 !text-copy">
                          {formatDate(request.requestedAt, localeCode)}
                        </TableCell>
                        <TableCell className="dashboard-body max-w-72 whitespace-normal px-4 py-4 !text-copy [overflow-wrap:anywhere]">
                          {queueStatus === "rejected" ? (
                            request.rejectionReason || "—"
                          ) : request.invoiceId ? (
                            <>
                              <span className="block font-medium">
                                {formatAmount(
                                  request.invoiceAmount,
                                  request.currency,
                                  localeCode,
                                )}
                              </span>
                              <span
                                className="dashboard-status-label text-copy-secondary"
                                title={request.invoiceId}
                              >
                                #{request.invoiceId.slice(0, 8)}
                              </span>
                            </>
                          ) : (
                            <span className="text-copy-secondary">
                              {copy.queue.noInvoice}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <span
                            className={cn(
                              STATUS_PILL_CLASS,
                              upgradeStatusClass(request.status),
                            )}
                          >
                            {copy.statuses[request.status] ?? request.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4 pr-5">
                          <div className="flex justify-end gap-2">
                            {request.status === "pending" ? (
                              <>
                                <Button
                                  className={cn(
                                    TABLE_BUTTON_CLASS,
                                    "text-danger hover:border-danger hover:bg-danger/10 hover:text-danger",
                                  )}
                                  disabled={busy}
                                  onClick={() => {
                                    setReason("");
                                    setRejecting(request);
                                  }}
                                  variant="outline"
                                >
                                  <X aria-hidden="true" className="size-4" />
                                  {copy.queue.reject}
                                </Button>
                                <Button
                                  className={TABLE_BUTTON_CLASS}
                                  disabled={busy}
                                  onClick={() => onApprove(request)}
                                >
                                  <Check aria-hidden="true" className="size-4" />
                                  {copy.queue.approve}
                                </Button>
                              </>
                            ) : request.status === "approved" ? (
                              <Button
                                className={TABLE_BUTTON_CLASS}
                                disabled={busy}
                                onClick={() => setConfirming(request)}
                              >
                                <CircleDollarSign
                                  aria-hidden="true"
                                  className="size-4"
                                />
                                {copy.queue.confirmPayment}
                              </Button>
                            ) : (
                              <span className="dashboard-body">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      className="dashboard-body h-44 px-5 text-center"
                      colSpan={5}
                    >
                      {copy.queue.empty}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Table01>
        </section>

        <Calendar08
          addEventLabel={t.calendar.refresh}
          className="min-h-[40rem]"
          emptyLabel={t.calendar.noEvents}
          events={calendarEvents}
          locale={lang === "id" ? id : enUS}
          localeCode={localeCode}
        />
      </div>

      {/* Direktori pengguna */}
      <section className={cn(SECTION_CLASS, "scroll-mt-4")} ref={usersRef}>
        <SectionHeader
          description={copy.users.description}
          eyebrow={copy.users.eyebrow}
          title={copy.users.title}
        >
          <Tabs
            onValueChange={(value) =>
              onUserQueryChange({
                ...userQuery,
                role: value as UserRoleFilter,
                offset: 0,
              })
            }
            value={userQuery.role}
          >
            <TabsList className="h-12! max-w-full overflow-x-auto overflow-y-hidden">
              {USER_ROLE_FILTERS.map((role) => (
                <TabsTrigger key={role} value={role}>
                  {copy.users.tabs[role]}
                  {roleCounts
                    ? ` (${role === "all" ? totalUsers : roleCounts[role]})`
                    : ""}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </SectionHeader>
        <Table01
          count={users?.users.length ?? 0}
          hasNextPage={
            users
              ? userQuery.offset + users.users.length < users.total
              : false
          }
          labels={tableLabels}
          loading={usersLoading}
          offset={userQuery.offset}
          onNext={() =>
            onUserQueryChange({
              ...userQuery,
              offset: userQuery.offset + userQuery.limit,
            })
          }
          onPageSizeChange={(value) =>
            onUserQueryChange({ ...userQuery, limit: value, offset: 0 })
          }
          onPrevious={() =>
            onUserQueryChange({
              ...userQuery,
              offset: Math.max(0, userQuery.offset - userQuery.limit),
            })
          }
          pageSize={userQuery.limit}
        >
          <Table className="min-w-[40rem]">
            <TableHeader className="bg-surface-container-high/70">
              <TableRow className="hover:bg-transparent">
                {[
                  copy.users.columns.account,
                  copy.users.columns.role,
                  copy.users.columns.joined,
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
            <TableBody className={usersLoading ? "opacity-55" : undefined}>
              {users?.users.length ? (
                users.users.map((user) => (
                  <TableRow className="hover:bg-surface-container" key={user.id}>
                    <TableCell className="px-4 py-3 pl-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarFallback className="bg-surface-container-high type-label font-semibold text-copy-secondary">
                            {userInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="dashboard-body truncate font-medium !text-copy">
                            {userName(user) || user.email}
                          </p>
                          <a
                            className="dashboard-status-label block truncate text-copy-secondary hover:text-copy hover:underline"
                            href={`mailto:${user.email}`}
                          >
                            {user.email}
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className={cn(STATUS_PILL_CLASS, roleClass(user.role))}>
                        {copy.users.roles[user.role] ?? user.role}
                      </span>
                    </TableCell>
                    <TableCell className="dashboard-body px-4 py-3 pr-5 !text-copy">
                      {formatDate(user.createdAt, localeCode)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="dashboard-body h-44 px-5 text-center"
                    colSpan={3}
                  >
                    {copy.users.empty}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Table01>
      </section>

      {/* Tolak — alasan wajib supaya pemohon tahu apa yang harus diperbaiki */}
      <Dialog
        onOpenChange={(open) => {
          if (!open && busyId !== rejecting?.id) setRejecting(null);
        }}
        open={Boolean(rejecting)}
      >
        <DialogContent className="min-w-0 max-w-md" showCloseButton={false}>
          <form
            className="grid min-w-0 gap-6"
            onSubmit={async (event) => {
              event.preventDefault();
              const normalizedReason = reason.trim();
              if (
                !rejecting ||
                !normalizedReason ||
                normalizedReason.length > MAX_REJECTION_REASON_LENGTH
              ) {
                return;
              }
              if (await onReject(rejecting, normalizedReason)) {
                setRejecting(null);
              }
            }}
          >
            <DialogHeader>
              <div className="flex size-12 items-center justify-center rounded-full border border-danger/20 bg-danger/10 text-danger">
                <X aria-hidden="true" className="size-5" />
              </div>
              <DialogTitle>{copy.rejectDialog.title}</DialogTitle>
              <DialogDescription>
                {copy.rejectDialog.description.replace(
                  "{email}",
                  rejecting?.email ?? "",
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="admin-reject-reason">
                {copy.rejectDialog.label}
              </Label>
              <Textarea
                autoFocus
                className="min-h-24 min-w-0 w-full max-w-full resize-y rounded-[var(--radius-control)] px-4 py-3 type-body"
                id="admin-reject-reason"
                maxLength={MAX_REJECTION_REASON_LENGTH}
                onChange={(event) => setReason(event.target.value)}
                placeholder={copy.rejectDialog.placeholder}
                value={reason}
              />
            </div>
            <DialogFooter className="m-0 rounded-none border-0 bg-transparent p-0">
              <Button
                className={DIALOG_BUTTON_CLASS}
                disabled={busyId === rejecting?.id}
                onClick={() => setRejecting(null)}
                type="button"
                variant="outline"
              >
                {copy.rejectDialog.cancel}
              </Button>
              <Button
                className={DIALOG_BUTTON_CLASS}
                disabled={!reason.trim() || busyId === rejecting?.id}
                type="submit"
                variant="destructive"
              >
                {copy.rejectDialog.confirm}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi bayar — mengubah role user menjadi creator */}
      <Dialog
        onOpenChange={(open) => {
          if (!open && busyId !== confirming?.id) setConfirming(null);
        }}
        open={Boolean(confirming)}
      >
        <DialogContent className="max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="flex size-12 items-center justify-center rounded-full border border-brand/20 bg-brand/10 text-brand">
              <CircleDollarSign aria-hidden="true" className="size-5" />
            </div>
            <DialogTitle>{copy.confirmDialog.title}</DialogTitle>
            <DialogDescription>
              {confirming
                ? copy.confirmDialog.description
                    .replace("{invoice}", `#${confirming.invoiceId.slice(0, 8)}`)
                    .replace(
                      "{amount}",
                      formatAmount(
                        confirming.invoiceAmount,
                        confirming.currency,
                        localeCode,
                      ),
                    )
                    .replace("{email}", confirming.email)
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="m-0 rounded-none border-0 bg-transparent p-0">
            <Button
              className={DIALOG_BUTTON_CLASS}
              disabled={busyId === confirming?.id}
              onClick={() => setConfirming(null)}
              variant="outline"
            >
              {copy.confirmDialog.cancel}
            </Button>
            <Button
              className={DIALOG_BUTTON_CLASS}
              disabled={busyId === confirming?.id}
              onClick={async () => {
                if (confirming && (await onConfirmPayment(confirming)))
                  setConfirming(null);
              }}
            >
              {copy.confirmDialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
