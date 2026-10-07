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

function parse(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function toEmbedSource(value: string): EmbedSource | null {
  const url = parse(value);
  if (!url) return null;
  const host = url.hostname.replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id =
      url.searchParams.get("v") ??
      (parts[0] === "shorts" || parts[0] === "embed" ? parts[1] : null);
    return id && ID.test(id)
      ? { src: `https://www.youtube-nocookie.com/embed/${id}`, kind: "video" }
      : null;
  }
  if (host === "youtu.be") {
    const id = parts[0];
    return id && ID.test(id)
      ? { src: `https://www.youtube-nocookie.com/embed/${id}`, kind: "video" }
      : null;
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
  if (host === "codepen.io" && parts[1] === "pen" && parts[2]) {
    const [user, , id] = parts;
    return ID.test(user) && ID.test(id)
      ? {
          src: `https://codepen.io/${user}/embed/${id}?default-tab=result`,
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
