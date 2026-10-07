import { projectService } from "./project";
import type { ProjectAuthor } from "@/shared/lib/types/project";

/** Info publik seorang creator (PublicInfo di common.proto). */
export type CreatorSummary = ProjectAuthor;

// SEMENTARA: backend belum punya endpoint pencarian user. Direktori dibangun
// dari `author` (PublicInfo) pada feed publik (PUBLISHED + PUBLIC), jadi yang
// bisa ditemukan hanya creator yang sudah punya proyek publik. Saat backend
// menambah mis. `GET /v1/users/search?q=`, cukup ganti isi `search` dan
// `findMany` di bawah — komponen pemakainya tidak perlu diubah.
const MAX_FEED_PAGES = 6;
const CACHE_MS = 5 * 60_000;

let cached: { at: number; promise: Promise<Map<string, CreatorSummary>> } | null =
  null;

async function loadDirectory() {
  const creators = new Map<string, CreatorSummary>();
  let pageToken = "";
  for (let page = 0; page < MAX_FEED_PAGES; page++) {
    const result = await projectService.list({ pageSize: 50, pageToken }, true);
    for (const { author } of result.projects) {
      if (author?.id && !creators.has(author.id)) creators.set(author.id, author);
    }
    if (!result.nextPageToken) break;
    pageToken = result.nextPageToken;
  }
  return creators;
}

function directory() {
  if (!cached || Date.now() - cached.at > CACHE_MS) {
    const promise = loadDirectory();
    cached = { at: Date.now(), promise };
    promise.catch(() => {
      cached = null;
    });
  }
  return cached.promise;
}

// Pencarian tidak peka huruf besar/kecil maupun aksen ("andre" = "André").
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim();

export function creatorDisplayName(creator: CreatorSummary) {
  return [creator.firstName, creator.lastName].filter(Boolean).join(" ").trim();
}

// User ID backend = UUID CHAR(36). Dipakai juga untuk link profil
// `/creator?id=<uuid>` yang ditempel creator ke kolom pencarian.
const USER_ID_IN_TEXT =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function extractUserId(text: string) {
  return text.match(USER_ID_IN_TEXT)?.[0].toLowerCase() ?? null;
}

export const creatorDirectory = {
  async search(query: string, limit = 8) {
    const needle = normalize(query);
    if (needle.length < 2) return [];
    const matches = Array.from((await directory()).values()).filter((creator) =>
      normalize(creatorDisplayName(creator)).includes(needle),
    );
    // Nama yang diawali kata kunci tampil lebih dulu, lalu alfabetis.
    return matches
      .sort((left, right) => {
        const leftName = normalize(creatorDisplayName(left));
        const rightName = normalize(creatorDisplayName(right));
        const leftStarts = leftName.startsWith(needle) ? 0 : 1;
        const rightStarts = rightName.startsWith(needle) ? 0 : 1;
        return leftStarts - rightStarts || leftName.localeCompare(rightName);
      })
      .slice(0, limit);
  },

  async findMany(ids: string[]) {
    const creators = await directory();
    return ids.flatMap((id) => {
      const creator = creators.get(id);
      return creator ? [creator] : [];
    });
  },
};
