const DEFAULT_BACKEND_URL = "https://api.priemman.my.id";

export const PRIEMMAN_API_BASE_URL = (
  process.env.NEXT_PUBLIC_PRIEMMAN_API_URL ?? DEFAULT_BACKEND_URL
).replace(/\/+$/, "");

export const PRIEMMAN_API_VERSION = "/v1";

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${PRIEMMAN_API_BASE_URL}${normalizedPath}`;
}
