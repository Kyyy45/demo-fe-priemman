// Dipakai editor (saat menempel tautan) dan renderer publik (saat menampilkan).
// Yang disimpan adalah URL asli dari user; src iframe SELALU diturunkan ulang
// lewat fungsi ini, jadi nilai content yang dimanipulasi tidak bisa menyisipkan
// iframe ke domain sembarang di halaman publik.

export type EmbedKind = "video" | "audio" | "design";

export interface EmbedSource {
  src: string;
  kind: EmbedKind;
}

const ID = /^[\w-]+$/;

// Tautan yang ditempel creator sering tanpa skema ("youtube.com/watch?v=…")
// atau masih http. Keduanya dinaikkan ke https; skema lain (javascript:,
// data:, dll.) tetap ditolak.
export function normalizeEmbedUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed.replace(/^http:\/\//i, "https://")
    : `https://${trimmed.replace(/^\/+/, "")}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function parse(value: string) {
  const normalized = normalizeEmbedUrl(value);
  return normalized ? new URL(normalized) : null;
}

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
]);
const YOUTUBE_PATH_PREFIXES = new Set(["shorts", "live", "embed", "v"]);

// `t`/`start` dari tautan YouTube ("90", "90s", "1m30s", "1h2m3s") →
// detik untuk parameter `start` di player embed.
function youtubeStartSeconds(url: URL) {
  const raw = url.searchParams.get("t") ?? url.searchParams.get("start");
  if (!raw) return 0;
  if (/^\d+$/.test(raw)) return Number(raw);
  const match = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return 0;
  const [, hours = "0", minutes = "0", seconds = "0"] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function youtubeSource(id: string, url: URL): EmbedSource {
  const start = youtubeStartSeconds(url);
  return {
    src: `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ""}`,
    kind: "video",
  };
}

export function toEmbedSource(value: string): EmbedSource | null {
  const url = parse(value);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (YOUTUBE_HOSTS.has(host)) {
    // watch?v=ID, /shorts/ID, /live/ID, /embed/ID, /v/ID
    const id =
      url.searchParams.get("v") ??
      (YOUTUBE_PATH_PREFIXES.has(parts[0] ?? "") ? parts[1] : null);
    return id && ID.test(id) ? youtubeSource(id, url) : null;
  }
  if (host === "youtu.be") {
    const id = parts[0];
    return id && ID.test(id) ? youtubeSource(id, url) : null;
  }
  if (host === "vimeo.com") {
    const id = parts.find((part) => /^\d+$/.test(part));
    return id
      ? { src: `https://player.vimeo.com/video/${id}`, kind: "video" }
      : null;
  }
  if (host === "open.spotify.com") {
    const [type, id] = parts.at(0)?.startsWith("intl-")
      ? parts.slice(1)
      : parts;
    return ["track", "album", "playlist", "episode", "show"].includes(
      type ?? "",
    ) &&
      id &&
      ID.test(id)
      ? { src: `https://open.spotify.com/embed/${type}/${id}`, kind: "audio" }
      : null;
  }
  if (host === "soundcloud.com" && parts.length >= 2) {
    return {
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        `https://soundcloud.com/${parts.join("/")}`,
      )}`,
      kind: "audio",
    };
  }
  if (
    host === "figma.com" &&
    ["file", "design", "proto", "board"].includes(parts[0] ?? "")
  ) {
    return {
      src: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(
        `https://www.figma.com${url.pathname}`,
      )}`,
      kind: "design",
    };
  }
  if (host === "codepen.io") {
    // Pen pribadi: /<user>/pen/<id>; pen tim: /team/<team>/pen/<id>.
    const team = parts[0] === "team";
    const [owner, marker, id] = team ? parts.slice(1) : parts;
    if (marker !== "pen" || !owner || !id) return null;
    return ID.test(owner) && ID.test(id)
      ? {
          src: `https://codepen.io/${team ? "team/" : ""}${owner}/embed/${id}?default-tab=result`,
          kind: "design",
        }
      : null;
  }
  return null;
}

// Rasio tinggi iframe per jenis embed supaya editor dan halaman publik sama.
export const EMBED_FRAME_CLASS: Record<EmbedKind, string> = {
  video: "aspect-video",
  audio: "h-[152px]",
  design: "aspect-[4/3]",
};
