"use client";

import { AppErrorScreen } from "@/shared/components/error-pages";

// Error boundary tingkat aplikasi: error saat render di halaman mana pun
// ditampilkan dengan desain Priemman, bukan layar error bawaan Next.js.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return <AppErrorScreen onRetry={reset} />;
}
