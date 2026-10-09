"use client";

import { ApiError } from "@/shared/api/core/errors";
import { ErrorScreen } from "@/shared/components/error-screen";
import { useT } from "@/shared/providers/language-provider";

/** Halaman 404 (app/not-found.tsx). */
export function NotFoundScreen() {
  const t = useT().errorPage;
  return (
    <ErrorScreen
      code="404"
      description={t.notFoundDescription}
      primaryAction={{ label: t.goHome, href: "/" }}
      title={t.notFoundTitle}
    />
  );
}

/** Error tak terduga yang tertangkap error boundary (app/error.tsx). */
export function AppErrorScreen({ onRetry }: { onRetry: () => void }) {
  const t = useT().errorPage;
  return (
    <ErrorScreen
      code={t.errorCode}
      description={t.errorDescription}
      primaryAction={{ label: t.retry, onClick: onRetry }}
      secondaryAction={{ label: t.goHome, href: "/" }}
      title={t.errorTitle}
    />
  );
}

/**
 * Dashboard gagal memuat profil (GET /v1/users/me). Pesan dipilih dari jenis
 * error, bukan teks mentah browser/backend ("Failed to fetch", dsb.):
 * - fetch gagal (TypeError) → koneksi/server tidak terjangkau
 * - HTTP 5xx → masalah server
 * - status lain → dashboard gagal dimuat
 * 400/401/403 tidak sampai ke sini karena dashboard mengarahkan ke /login.
 */
export function DashboardErrorScreen({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const t = useT().errorPage;
  const content =
    error instanceof ApiError
      ? error.status >= 500
        ? {
            code: String(error.status),
            title: t.serverTitle,
            description: t.serverDescription,
          }
        : {
            code: error.status ? String(error.status) : t.errorCode,
            title: t.dashboardTitle,
            description: t.dashboardDescription,
          }
      : error instanceof TypeError
        ? {
            code: t.offlineCode,
            title: t.offlineTitle,
            description: t.offlineDescription,
          }
        : {
            code: t.errorCode,
            title: t.dashboardTitle,
            description: t.dashboardDescription,
          };
  return (
    <ErrorScreen
      {...content}
      primaryAction={{ label: t.retry, onClick: onRetry }}
      secondaryAction={{ label: t.goHome, href: "/" }}
    />
  );
}
