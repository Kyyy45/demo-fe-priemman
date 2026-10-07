const GOOGLE_AVATAR_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
]);

// Merapikan URL avatar provider dan meminta ukuran yang cukup untuk UI
export function normalizeAvatarUrl(value?: string | null) {
  const source = value?.trim();
  if (!source) return "";

  try {
    const url = new URL(source);
    if (url.protocol === "http:") url.protocol = "https:";
    if (GOOGLE_AVATAR_HOSTS.has(url.hostname)) {
      url.search = "";
      url.pathname = url.pathname.replace(/=s\d+(?:-c)?$/, "");
      return `${url.toString()}=s256-c`;
    }
    return url.toString();
  } catch {
    return "";
  }
}

// Membuat avatar cadangan yang tetap berbeda untuk setiap user
export function getAvatarFallbackUrl(name: string) {
  const seed = name.trim() || "Priemman";
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e4e4e7`;
}
