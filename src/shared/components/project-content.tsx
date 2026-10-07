"use client";

import type { Project, ProjectMedia } from "@/shared/lib/types/project";
import { cn } from "@/shared/lib/utils";
import { sanitizeRichText } from "@/shared/lib/sanitize-rich-text";
import { EMBED_FRAME_CLASS, toEmbedSource } from "@/shared/lib/embed";

type StoredBlock = {
  id?: string;
  type?: "text" | "image" | "video" | "photoGrid" | "embed";
  text?: string;
  mediaId?: string;
  mediaIds?: string[];
  url?: string;
  caption?: string;
  width?: "inset" | "full";
  contentAlign?: "left" | "center" | "right";
};

type StoredContent = {
  appearance?: { backgroundColor?: string; contentGap?: number };
  doc?: { blocks?: StoredBlock[] };
};

// Kelas lebar media dipakai bersama dengan canvas editor supaya posisi
// "inset" (bermargin) dan "full" tampil sama persis setelah dipublikasikan.
export const MEDIA_INSET_CLASS =
  "w-[calc(100%-48px)] m3-medium:w-[calc(100%-96px)] m3-large:w-[calc(100%-176px)]";

// Proporsi Behance: kolom teks ±71% lebar gambar inset (1104px di canvas
// 1280px), jadi lebih sempit dari gambar dan tidak selebar canvas.
export const TEXT_COLUMN_CLASS = "w-full max-w-[780px]";

// Pola Behance: block "full-bleed" (gambar/video full-width, grid foto)
// menempel ke tepi canvas; block berbingkai (media inset, teks, embed)
// mendapat jarak atas/bawah saat berada di awal/akhir canvas.
export const CANVAS_TOP_PADDING_CLASS = "pt-[clamp(32px,6vw,88px)]";
export const CANVAS_BOTTOM_PADDING_CLASS = "pb-[clamp(32px,6vw,88px)]";

function isFullBleed(block: StoredBlock | undefined) {
  if (!block) return false;
  if (block.type === "photoGrid") return true;
  // Embed lama tanpa width = inset; gambar/video lama tanpa width = full.
  if (block.type === "embed") return block.width === "full";
  return (
    (block.type === "image" || block.type === "video") &&
    block.width !== "inset"
  );
}

// Tipografi rich text dipakai bersama editor dan halaman publik. Default-nya
// sama dengan nilai awal toolbar (Helvetica 20px); heading perlu ukuran
// eksplisit karena reset Tailwind membuat <h1>/<h2> seukuran teks biasa.
// Ukuran/font per-teks dari toolbar (inline style/<font>) tetap menang.
// h1/h2 wajib text-inherit: globals.css memberi semua heading warna tema
// (--text-heading, hampir putih di dark mode), yang akan menimpa warna
// kontras canvas dan membuat heading tak terbaca di canvas terang.
export const RICH_TEXT_CLASS =
  "break-words text-[20px] leading-[1.45] [font-family:Helvetica,Arial,sans-serif] [&_h1]:text-inherit [&_h2]:text-inherit [&_h1]:text-[2em] [&_h1]:font-bold [&_h1]:leading-tight [&_h2]:text-[1.4em] [&_h2]:font-semibold [&_h2]:leading-snug [&_p[data-style=caption]]:text-[0.7em] [&_p[data-style=caption]]:opacity-75 [&_a]:underline";

// Rasio ada di sel (bukan di <img>) supaya sel yang dibentang 2 kolom bisa
// memakai rasio 8:3 dan tingginya tetap sama dengan baris lain.
export const GRID_CELL_CLASS = "aspect-[4/3] overflow-hidden";

// Jumlah kolom grid foto berdasarkan banyaknya gambar. Pada layout 2 kolom,
// gambar terakhir yang ganjil dibentang selebar baris supaya tidak ada sel
// kosong; di layout 3 kolom (m3-medium) bentangan itu dikembalikan.
export function gridColumnsClass(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count === 2 || count === 4) return "grid-cols-2";
  return "grid-cols-2 m3-medium:grid-cols-3 [&>*:last-child:nth-child(odd)]:col-span-2 [&>*:last-child:nth-child(odd)]:aspect-[8/3] m3-medium:[&>*:last-child:nth-child(odd)]:col-span-1 m3-medium:[&>*:last-child:nth-child(odd)]:aspect-[4/3]";
}

function readableTextColor(backgroundColor: string) {
  const hex = backgroundColor.match(/^#([0-9a-f]{6})$/i)?.[1];
  if (!hex) return "#171717";
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150
    ? "#171717"
    : "#fafafa";
}

/** Merender isi rich-text/media project yang disimpan creator di Creator Studio. */
export function ProjectContent({
  project,
}: {
  project: Pick<Project, "content" | "media" | "title">;
}) {
  let stored: StoredContent = {};
  try {
    stored = JSON.parse(project.content) as StoredContent;
  } catch {
    stored = {};
  }
  const blocks = Array.isArray(stored.doc?.blocks) ? stored.doc.blocks : [];
  const backgroundColor = stored.appearance?.backgroundColor ?? "#ffffff";
  const contentGap = Math.min(
    150,
    Math.max(0, stored.appearance?.contentGap ?? 60),
  );
  const mediaById = new Map(project.media.map((media) => [media.id, media]));

  const mediaForBlock = (block: StoredBlock, index: number) => {
    const mediaBlockIndex =
      blocks
        .slice(0, index + 1)
        .filter((item) => item.type === "image" || item.type === "video")
        .length - 1;
    return (
      (block.mediaId ? mediaById.get(block.mediaId) : undefined) ??
      project.media[mediaBlockIndex]
    );
  };
  const gridMedia = (block: StoredBlock) =>
    (block.mediaIds ?? []).flatMap((id) => {
      const media = mediaById.get(id);
      return media?.url ? [media] : [];
    });
  const hasRenderableBlocks = blocks.some((block, index) => {
    if (block.type === "text")
      return Boolean((block.text ?? "").replace(/<[^>]*>/g, "").trim());
    if (block.type === "embed") return Boolean(toEmbedSource(block.url ?? ""));
    if (block.type === "photoGrid") return gridMedia(block).length > 0;
    return Boolean(mediaForBlock(block, index)?.url);
  });

  const renderMedia = (media: ProjectMedia, alt: string, className: string) =>
    media.type === 2 ? (
      <video
        className={cn(
          "block w-full [backface-visibility:hidden] [transform:translateZ(0)]",
          className,
        )}
        controls
        preload="metadata"
        src={media.url}
      />
    ) : (
      <img
        alt={alt}
        className={cn(
          "block w-full object-cover [backface-visibility:hidden] [transform:translateZ(0)]",
          className,
        )}
        loading="lazy"
        src={media.url}
      />
    );

  return (
    <article
      className={cn(
        "min-h-[60dvh] w-full overflow-hidden border-0 outline-none ring-0",
        hasRenderableBlocks &&
          !isFullBleed(blocks[0]) &&
          CANVAS_TOP_PADDING_CLASS,
        hasRenderableBlocks &&
          !isFullBleed(blocks.at(-1)) &&
          CANVAS_BOTTOM_PADDING_CLASS,
      )}
      style={{ backgroundColor, color: readableTextColor(backgroundColor) }}
    >
      {hasRenderableBlocks ? (
        blocks.map((block, index) => {
          const marginTop = index === 0 ? 0 : contentGap;
          const key = block.id ?? index;
          if (block.type === "text") {
            const alignment = block.contentAlign ?? "center";
            return (
              <div
                className="w-full px-6 m3-medium:px-12 m3-large:px-[88px]"
                key={key}
                style={{ marginTop }}
              >
                <div
                  className={cn(
                    TEXT_COLUMN_CLASS,
                    alignment === "left"
                      ? "mr-auto"
                      : alignment === "right"
                        ? "ml-auto"
                        : "mx-auto",
                  )}
                >
                  <div
                    className={RICH_TEXT_CLASS}
                    dangerouslySetInnerHTML={{
                      __html: sanitizeRichText(block.text ?? ""),
                    }}
                  />
                </div>
              </div>
            );
          }

          if (block.type === "embed") {
            const source = toEmbedSource(block.url ?? "");
            if (!source) return null;
            return (
              <div
                className={cn(
                  "mx-auto",
                  block.width === "full" ? "w-full" : MEDIA_INSET_CLASS,
                )}
                key={key}
                style={{ marginTop }}
              >
                <iframe
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  className={cn(
                    "block w-full border-0",
                    EMBED_FRAME_CLASS[source.kind],
                  )}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
                  src={source.src}
                  title={project.title}
                />
              </div>
            );
          }

          if (block.type === "photoGrid") {
            const items = gridMedia(block);
            if (!items.length) return null;
            return (
              <div
                className={cn("grid w-full gap-1", gridColumnsClass(items.length))}
                key={key}
                style={{ marginTop }}
              >
                {items.map((media) => (
                  <div className={GRID_CELL_CLASS} key={media.id}>
                    {renderMedia(media, project.title, "h-full")}
                  </div>
                ))}
              </div>
            );
          }

          // Memakai urutan project.media saat draft lama belum memiliki mediaId
          const media = mediaForBlock(block, index);
          if (!media?.url) return null;

          return (
            <figure
              className={cn(
                "isolate mx-auto overflow-hidden [clip-path:inset(0)]",
                block.width === "inset" ? MEDIA_INSET_CLASS : "w-full",
              )}
              key={key}
              style={{ marginTop }}
            >
              {renderMedia(
                { ...media, type: block.type === "video" ? 2 : 1 },
                block.caption || project.title,
                "",
              )}
              {block.caption ? (
                <figcaption className="px-4 py-3 text-center type-label opacity-70">
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        })
      ) : project.media.length > 0 ? (
        // Menampilkan project.media saat response lama belum memiliki block
        <div className="space-y-8 m3-medium:space-y-12">
          {[...project.media]
            .sort((left, right) => left.order - right.order)
            .map((media) => (
              <figure
                className="w-full isolate overflow-hidden [clip-path:inset(0)]"
                key={media.id || media.url}
              >
                {renderMedia(media, project.title, "")}
              </figure>
            ))}
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="whitespace-pre-wrap type-card-title leading-8">
            {project.content}
          </p>
        </div>
      )}
    </article>
  );
}
