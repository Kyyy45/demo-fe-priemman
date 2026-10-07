import { loadPublicFeed } from "./public-feed";
import type { ProjectAuthor } from "@/shared/lib/types/project";

/** Info publik seorang creator (PublicInfo di common.proto). */
export type CreatorSummary = ProjectAuthor;

// SEMENTARA: backend belum punya endpoint pencarian user. Direktori dibangun
// dari `author` (PublicInfo) pada feed publik (PUBLISHED + PUBLIC), jadi yang
// bisa ditemukan hanya creator yang sudah punya proyek publik. Saat backend
// menambah mis. `GET /v1/users/search?q=`, cukup ganti isi `search` dan
// `findMany` di bawah — komponen pemakainya tidak perlu diubah.
async function directory() {
  const creators = new Map<string, CreatorSummary>();
  for (const { author } of await loadPublicFeed()) {
    if (author?.id && !creators.has(author.id)) creators.set(author.id, author);
  }
  return creators;
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
