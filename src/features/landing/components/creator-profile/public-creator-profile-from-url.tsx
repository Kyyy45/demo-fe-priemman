"use client";

import { useSearchParams } from "next/navigation";

import { PublicCreatorProfile } from "./public-creator-profile";

export function PublicCreatorProfileFromUrl() {
  const searchParams = useSearchParams();

  return <PublicCreatorProfile creatorId={searchParams.get("id") ?? ""} />;
}
