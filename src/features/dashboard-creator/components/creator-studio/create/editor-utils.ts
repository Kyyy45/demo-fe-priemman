import type { Project } from "@/shared/lib/types/project";
import type {
  EditorAsset,
  EditorBlock,
  StoredBlock,
  StoredContent,
  TextBlock,
} from "@/shared/lib/types/creator-editor";
import {
  FONT_OPTIONS,
  plainTextFromRichText as sharedPlainTextFromRichText,
  sanitizeRichText as sharedSanitizeRichText,
} from "@/shared/lib/sanitize-rich-text";

export const TEXT_SIZES = [
  9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64,
];
export { FONT_OPTIONS };

// Membuat ID lokal untuk block dan media yang belum disimpan
export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// Membuat snapshot sederhana untuk mengecek perubahan editor
export function editorFingerprint(value: {
  title: string;
  tags: string;
  visibility: string;
  collaborators: unknown[];
  blocks: EditorBlock[];
  assets: EditorAsset[];
  coverKey: string;
  backgroundColor: string;
  contentGap: number;
  selectedSocials: string[];
}) {
  return JSON.stringify({
    ...value,
    assets: value.assets.map((asset) => ({
      key: asset.key,
      mediaId: asset.media?.id ?? "",
      file: asset.file
        ? {
            name: asset.file.name,
            size: asset.file.size,
            type: asset.file.type,
          }
        : null,
    })),
  });
}

// Mengubah content API menjadi block yang bisa diedit
export function parseStoredContent(project: Project | null) {
  const fallback = {
    blocks: project?.content
      ? [
          {
            id: newId(),
            type: "text",
            style: "paragraph",
            text: project.content,
            contentAlign: "center",
          } as TextBlock,
        ]
      : [],
    backgroundColor: "#ffffff",
    contentGap: 60,
    socialLinks: {},
  };
  if (!project?.content) return fallback;
  try {
    const parsed = JSON.parse(project.content) as Partial<StoredContent>;
    if (
      parsed.editor !== "priemman-blocks" ||
      !Array.isArray(parsed.doc?.blocks)
    )
      return fallback;
    const blocks = parsed.doc.blocks.flatMap<EditorBlock>((block) => {
      if (block.type === "text")
        return [{ ...block, contentAlign: block.contentAlign ?? "center" }];
      if (block.type === "photoGrid")
        return [{ id: block.id, type: "grid", assetKeys: block.mediaIds }];
      if (block.type === "embed")
        return [
          {
            id: block.id,
            type: "embed",
            url: block.url,
            width: block.width ?? "inset",
          },
        ];
      return [
        {
          id: block.id,
          type: block.type,
          assetKey: block.mediaId,
          caption: block.caption ?? "",
          width: block.width ?? "full",
        },
      ];
    });
    return {
      blocks,
      backgroundColor: parsed.appearance?.backgroundColor ?? "#ffffff",
      contentGap: parsed.appearance?.contentGap ?? 60,
      socialLinks: parsed.socialLinks ?? {},
    };
  } catch {
    return fallback;
  }
}

// Satu sumber untuk "asset mana yang dipakai block ini" — dipakai saat upload,
// pemilihan cover, dan pembersihan object URL.
export function blockAssetKeys(block: EditorBlock): string[] {
  if (block.type === "image" || block.type === "video") return [block.assetKey];
  if (block.type === "grid") return block.assetKeys;
  return [];
}

// Mengubah block editor ke format yang disimpan. mediaIdFor dipisah supaya
// Save (memakai ID media hasil upload) dan Preview (memakai asset key lokal)
// lewat serialisasi yang sama persis — preview = hasil publish.
export function toStoredBlocks(
  blocks: EditorBlock[],
  mediaIdFor: (assetKey: string) => string,
): StoredBlock[] {
  return blocks.map((block) => {
    if (block.type === "text") return block;
    if (block.type === "embed")
      return {
        id: block.id,
        type: "embed",
        url: block.url,
        width: block.width === "full" ? "full" : "inset",
      };
    if (block.type === "grid")
      return {
        id: block.id,
        type: "photoGrid",
        layout: "auto",
        mediaIds: block.assetKeys.map(mediaIdFor),
      };
    return {
      id: block.id,
      type: block.type,
      mediaId: mediaIdFor(block.assetKey),
      caption: block.caption,
      width: block.width,
    };
  });
}

// Re-export dari shared/lib/sanitize-rich-text — satu sumber whitelist tag/atribut
// supaya aturan yang dipakai saat edit dan saat tampil ke publik tidak bisa diam-diam berbeda.
export const sanitizeRichText = sharedSanitizeRichText;
export const plainTextFromRichText = sharedPlainTextFromRichText;

// Memilih warna text yang tetap terbaca di background editor
export function readableTextColor(backgroundColor: string) {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(
    backgroundColor.trim(),
  );
  if (!match) return "#151515";
  const [red, green, blue] = match
    .slice(1)
    .map((value) => Number.parseInt(value, 16));
  return (red * 299 + green * 587 + blue * 114) / 1000 < 145
    ? "#ffffff"
    : "#151515";
}
