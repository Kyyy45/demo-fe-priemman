// Tag adalah teks bebas dari creator. Database menyimpannya dengan collation
// utf8mb4_unicode_ci (tidak peka huruf besar/kecil), jadi "Branding" dan
// "branding" diperlakukan sebagai tag yang sama di seluruh UI.
export function tagKey(tag: string) {
  return tag.trim().toLocaleLowerCase();
}

export function sameTag(left: string, right: string) {
  return tagKey(left) === tagKey(right);
}

// Daftar tag unik untuk filter: satu entri per tagKey, memakai penulisan
// yang paling sering dipakai creator (seri → yang muncul lebih dulu).
export function uniqueTags(tagLists: string[][]) {
  const spellings = new Map<string, Map<string, number>>();
  for (const tag of tagLists.flat()) {
    const label = tag.trim();
    if (!label) continue;
    const key = tagKey(label);
    const counts = spellings.get(key) ?? new Map<string, number>();
    counts.set(label, (counts.get(label) ?? 0) + 1);
    spellings.set(key, counts);
  }
  return Array.from(spellings.values(), (counts) =>
    Array.from(counts).reduce((best, entry) =>
      entry[1] > best[1] ? entry : best,
    )[0],
  ).sort((left, right) => left.localeCompare(right));
}
