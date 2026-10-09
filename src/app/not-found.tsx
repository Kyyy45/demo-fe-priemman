import type { Metadata } from "next";

import { NotFoundScreen } from "@/shared/components/error-pages";

export const metadata: Metadata = {
  title: "Page not found | Priemman",
};

export default function NotFound() {
  return <NotFoundScreen />;
}
