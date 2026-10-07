"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  CodeXml,
  Eye,
  FoldHorizontal,
  UnfoldHorizontal,
  ImageIcon,
  ImagePlus,
  Italic,
  LayoutGrid,
  Link2,
  Palette,
  Pencil,
  Pilcrow,
  PlayCircle,
  Plus,
  RemoveFormatting,
  Settings2,
  TextCursorInput,
  Underline,
  Unlink,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { LanguageToggle } from "@/shared/ui/language-toggle";
import { ModeToggle } from "@/shared/ui/mode-toggle";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  AppleDock,
  AppleDockIcon,
} from "@/shared/ui/shadcn-space/apple-dock/apple-dock-01";
import {
  creatorDirectory,
  creatorDisplayName,
  mediaService,
  projectService,
  userService,
  type CreatorSummary,
} from "@/shared/api";
import {
  CollaboratorPicker,
  CreatorAvatar,
  type CollaboratorPick,
} from "./collaborator-picker";
import { creatorStudioErrorMessage } from "../api-errors";
import type {
  ProjectCollaborator,
  ProjectInput,
  ProjectMedia,
  ProjectVisibility,
} from "@/shared/lib/types/project";
import { projectInputSchema } from "@/features/dashboard-creator/schemas";
import { cn } from "@/shared/lib/utils";
import type { PublicCreatorProfile } from "@/shared/lib/types/public-creator-profile";
import { useT } from "@/shared/providers/language-provider";
import type {
  ContentAlign,
  CreateProjectRecovery,
  CreateProjectWizardProps,
  EditorAsset,
  EditorBlock,
  EmbedBlock,
  MediaBlock,
  StoredContent,
  SocialPlatform,
  TextBlock,
  TextStyle,
} from "@/shared/lib/types/creator-editor";
import {
  blockAssetKeys,
  editorFingerprint,
  FONT_OPTIONS,
  newId,
  parseStoredContent,
  plainTextFromRichText,
  readableTextColor,
  sanitizeRichText,
  TEXT_SIZES,
  toStoredBlocks,
} from "./editor-utils";
import { InsertContentSlot } from "./insert-content-slot";
import {
  EMBED_FRAME_CLASS,
  normalizeEmbedUrl,
  toEmbedSource,
} from "@/shared/lib/embed";
import {
  CANVAS_BOTTOM_PADDING_CLASS,
  CANVAS_TOP_PADDING_CLASS,
  GRID_CELL_CLASS,
  gridColumnsClass,
  MEDIA_INSET_CLASS,
  ProjectContent,
  RICH_TEXT_CLASS,
  TEXT_COLUMN_CLASS,
} from "@/shared/components/project-content";

type ContentKind = "image" | "text" | "grid" | "video" | "embed";

const BLOCK_SELECTOR = "h1, h2, p, div";

// Popup milik toolbar teks yang di-render lewat Portal (dropdown Select dan
// dialog tautan). Fokus/klik di dalamnya bukan berarti user keluar dari mode
// edit, meski secara DOM berada di luar block.
const EDITOR_PORTAL_SELECTOR =
  '[data-slot^="select-"], [data-slot^="alert-dialog"]';

const elementOf = (node: Node | null) =>
  node instanceof Element ? node : (node?.parentElement ?? null);

// Gaya teks dari block-nya; caption = <p data-style="caption">.
function styleOfBlock(block: Element | null | undefined): TextStyle {
  if (block?.tagName === "H1") return "heading";
  if (block?.tagName === "H2") return "subheading";
  if (block?.tagName === "P" && block.getAttribute("data-style") === "caption")
    return "caption";
  return "paragraph";
}

// Block yang menempel ke tepi canvas (tanpa jarak atas/bawah canvas) —
// aturan yang sama dengan isFullBleed di project-content.tsx.
function isFullBleed(block: EditorBlock | undefined) {
  if (!block) return false;
  if (block.type === "grid") return true;
  return (
    (block.type === "image" ||
      block.type === "video" ||
      block.type === "embed") &&
    block.width === "full"
  );
}

const CREATE_PROJECT_OPEN_KEY = "priemman:create-project:open";
const CREATE_PROJECT_RECOVERY_KEY = "priemman:create-project:recovery:v1";

// Batas dari backend: ProjectInput.content maksimal 1 MB (isExceeding1MB,
// dihitung dalam byte UTF-8).
const MAX_CONTENT_BYTES = 1024 * 1024;
// Sama dengan projectInputSchema (maks 20 tag, 48 karakter per tag).
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 48;

function ToolbarButton({
  action,
  icon,
  label,
}: {
  action: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center border-l border-on-dark/15 text-on-dark/60 hover:bg-on-dark/10 hover:text-on-dark focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
      onMouseDown={(event) => {
        event.preventDefault();
        action();
      }}
      title={label}
      type="button"
    >
      {icon}
    </button>
  );
}

function SidebarToolTile({
  active = false,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "group flex min-h-20 min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-[var(--radius-control)] px-1 py-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand",
        active ? "bg-brand/10" : "hover:bg-surface-muted",
      )}
      onClick={onClick}
      type="button"
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105",
          active
            ? "bg-brand text-on-brand"
            : "bg-brand/10 text-brand",
        )}
      >
        {icon}
      </span>
      <span className="line-clamp-1 w-full text-center type-metadata font-medium">
        {label}
      </span>
    </button>
  );
}

function SidebarGridTile({
  active = false,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 bg-surface-raised px-2 py-3 type-metadata font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-brand",
        active ? "bg-brand/10 text-brand" : "text-copy hover:bg-surface-muted",
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span className="line-clamp-1 w-full text-center">{label}</span>
    </button>
  );
}

// Kartu bagian di dialog Detail proyek — header bar & border sama dengan
// panel sidebar Creator Studio ("Tambah konten" / "Opsi proyek").
function SettingsSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: React.ReactNode;
}) {
  return (
    // Tanpa overflow-hidden: dropdown (mis. pencarian kolaborator) harus bisa
    // keluar dari kartu dan ikut menambah area scroll dialog. Sudut header
    // dibulatkan sendiri sebagai gantinya.
    <section className="rounded-[var(--radius-panel)] border border-border-subtle/60 bg-surface-raised">
      <h3 className="rounded-t-[calc(var(--radius-panel)-1px)] border-b border-border-subtle/60 bg-surface-muted/60 px-4 py-3 type-metadata font-semibold text-copy-muted">
        {title}
      </h3>
      <div className="space-y-5 p-4">{children}</div>
    </section>
  );
}

// Tinggi & radius field disamakan dengan tombol Creator Studio (48px) dan
// pola form halaman Account.
const SETTINGS_FIELD_CLASS =
  "min-h-12 rounded-[var(--radius-control)] px-4 type-body";

// Pil ↔ gelap di pojok kanan atas block media/embed (pola Behance) untuk
// berpindah antara inset (bermargin) dan full width.
function WidthToggle({
  full,
  label,
  onToggle,
}: {
  full: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div className={cn(BLOCK_CONTROLS_CLASS, "right-3 top-3")}>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              aria-label={label}
              className="flex h-8 items-center justify-center rounded-full border border-on-dark/70 bg-action-ink/85 px-3 text-on-dark shadow-[var(--shadow-control)] transition-colors hover:bg-action-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
              onClick={onToggle}
              type="button"
            />
          }
        >
          {full ? (
            <FoldHorizontal className="size-4" />
          ) : (
            <UnfoldHorizontal className="size-4" />
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// Pensil biru di pojok kiri atas block (pola Behance) dengan menu aksi.
function BlockActionsMenu({
  actions,
  label,
}: {
  actions: Array<{
    key: string;
    label: string;
    onClick: () => void;
    destructive?: boolean;
  }>;
  label: string;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <button
            aria-label={label}
            className="flex size-8 items-center justify-center rounded-full bg-brand text-on-brand shadow-[var(--shadow-control)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
            title={label}
            type="button"
          />
        }
      >
        <Pencil className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44 p-1" sideOffset={6}>
        {actions.map((action) => (
          <DropdownMenuItem
            className="h-9 px-3"
            key={action.key}
            onClick={action.onClick}
            variant={action.destructive ? "destructive" : "default"}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Kontrol hover block media: tampil saat hover/fokus, dan tetap tampil
// selama menu/tooltip di dalamnya terbuka (data-popup-open dari base-ui).
const BLOCK_CONTROLS_CLASS =
  "absolute z-10 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 has-[[data-popup-open]]:opacity-100";

// Garis biru saat hover di sekeliling block (overlay, karena ring pada
// elemen ber-overflow-hidden di dalam canvas akan terpotong).
const BLOCK_HOVER_OUTLINE_CLASS =
  "pointer-events-none absolute inset-0 border border-brand opacity-0 transition-opacity group-hover:opacity-100 group-has-[[data-popup-open]]:opacity-100";

// Pecah string tags "a, b, c" menjadi array unik tanpa entry kosong.
// project_tags memakai PRIMARY KEY (project_id, tag) dengan collation
// utf8mb4_unicode_ci (tidak peka huruf besar/kecil), jadi "UI" dan "ui"
// bentrok di database — duplikat dibuang tanpa membedakan kapitalisasi.
function parseTagList(value: string) {
  const seen = new Set<string>();
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => {
      const key = tag.toLocaleLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function TagsField({
  id,
  onChange,
  placeholder,
  value,
}: {
  id?: string;
  onChange: (next: string) => void;
  placeholder?: string;
  value: string;
}) {
  const copy = useT().dashboardCreator.creatorStudio.editor;
  const tags = parseTagList(value);
  const [draft, setDraft] = useState("");
  const full = tags.length >= MAX_TAGS;

  const commitDraft = () => {
    const next = draft.trim();
    setDraft("");
    if (!next || full) return;
    // Teks tempelan "a, b, c" dipecah dan dipotong di batas MAX_TAGS.
    onChange(
      parseTagList(`${value},${next}`).slice(0, MAX_TAGS).join(", "),
    );
  };
  const removeTag = (tag: string) =>
    onChange(tags.filter((item) => item !== tag).join(", "));
  // Tag pertama = kategori utama (label kartu & "proyek terkait" di Explore).
  const makePrimary = (tag: string) =>
    onChange([tag, ...tags.filter((item) => item !== tag)].join(", "));

  return (
    <div className="flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-[var(--radius-control)] border border-border-strong bg-surface-raised p-1.5 focus-within:ring-3 focus-within:ring-brand">
      {tags.map((tag, index) => (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-[var(--radius-pill)] py-1 pr-1.5 type-metadata font-medium",
            index === 0
              ? "bg-brand pl-1.5 text-on-brand"
              : "bg-brand/10 pl-3 text-brand",
          )}
          key={tag}
        >
          {index === 0 ? (
            <span className="rounded-[var(--radius-pill)] bg-on-brand/20 px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wider">
              {copy.primaryTag}
            </span>
          ) : null}
          {index === 0 ? (
            tag
          ) : (
            <button
              className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              onClick={() => makePrimary(tag)}
              title={copy.makePrimaryTag}
              type="button"
            >
              {tag}
            </button>
          )}
          <button
            aria-label={`${copy.removeTag} ${tag}`}
            className={cn(
              "flex size-5 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
              index === 0 ? "hover:bg-on-brand/20" : "hover:bg-brand/20",
            )}
            onClick={() => removeTag(tag)}
            type="button"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        className="min-w-24 flex-1 bg-transparent px-1.5 py-1 type-label outline-none placeholder:text-copy-muted disabled:cursor-not-allowed"
        disabled={full}
        id={id}
        maxLength={MAX_TAG_LENGTH}
        onBlur={commitDraft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commitDraft();
          } else if (event.key === "Backspace" && !draft && tags.length) {
            removeTag(tags[tags.length - 1]);
          }
        }}
        placeholder={
          full
            ? copy.tagLimit.replace("{count}", String(MAX_TAGS))
            : tags.length
              ? ""
              : placeholder
        }
        value={draft}
      />
    </div>
  );
}

function RichTextBlockEditor({
  backgroundColor,
  block,
  onChange,
  onContentAlign,
  onRemove,
}: {
  backgroundColor: string;
  block: TextBlock;
  onChange: (next: TextBlock) => void;
  onContentAlign: (alignment: ContentAlign) => void;
  onRemove: () => void;
}) {
  const copy = useT().dashboardCreator.creatorStudio.editor.toolbar;
  // SelectValue base-ui tidak otomatis membaca label dari children
  // SelectItem seperti Radix — tanpa map ini trigger menampilkan raw
  // value ("heading") bukan label yang sudah diterjemahkan.
  const styleLabels: Record<TextStyle, string> = {
    heading: copy.heading,
    subheading: copy.subheading,
    paragraph: copy.paragraph,
    caption: copy.caption,
  };

  // Menyimpan editor, selection, dan menu format text
  const editorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<Range | null>(null);
  // true selama dropdown Paragraf/Font/Ukuran terbuka (termasuk saat memilih
  // sebuah opsi). Dropdown itu render lewat Portal, jadi deteksi "klik/blur
  // keluar area edit" tidak bisa diandalkan dari posisi elemen di DOM saja —
  // popup-nya bisa sudah di-unmount React sebelum event click selesai
  // bubbling ke document. Reset-nya sengaja ditunda ke tick berikutnya
  // (bukan langsung saat onOpenChange(false)) supaya klik yang MENUTUP
  // dropdown (memilih opsi) masih tertangkap sebagai "masih berinteraksi".
  const selectInteractingRef = useRef(false);
  const handleSelectOpenChange = (open: boolean) => {
    if (open) {
      selectInteractingRef.current = true;
    } else {
      setTimeout(() => {
        selectInteractingRef.current = false;
      }, 0);
    }
  };
  const [isEditing, setIsEditing] = useState(true);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [font, setFont] = useState("Helvetica");
  const [size, setSize] = useState(20);
  const [textColor, setTextColor] = useState(() =>
    readableTextColor(backgroundColor),
  );
  const [selectedStyle, setSelectedStyle] = useState<TextStyle>(block.style);
  const [linkDialog, setLinkDialog] = useState<{
    url: string;
    invalid: boolean;
  } | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = sanitizeRichText(block.text);
    rangeRef.current = null;
  }, [block.id, block.text]);

  // Block teks baru (masih kosong) langsung mendapat kursor, seperti Behance —
  // tanpa ini user harus klik dulu ke kotak sebelum bisa mengetik.
  const focusOnMount = useRef(!block.text);
  useEffect(() => {
    if (focusOnMount.current) editorRef.current?.focus();
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTextColor(readableTextColor(backgroundColor));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [backgroundColor]);

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (
      !selection?.rangeCount ||
      !editorRef.current?.contains(selection.anchorNode)
    )
      return;
    const range = selection.getRangeAt(0);
    rangeRef.current = range.cloneRange();
    const startElement = elementOf(range.startContainer);
    const startStyle = styleOfBlock(startElement?.closest(BLOCK_SELECTOR));
    const endStyle = styleOfBlock(
      elementOf(range.endContainer)?.closest(BLOCK_SELECTOR),
    );
    // Selection yang membentang lintas beberapa gaya (mis. heading +
    // paragraph) tidak mewakili satu gaya tunggal — biarkan dropdown tetap
    // di nilai sebelumnya daripada salah menampilkan gaya dari satu ujung
    // saja seolah seluruh selection seragam.
    if (startStyle === endStyle) setSelectedStyle(startStyle);
    // Seperti Word: dropdown ukuran & font menampilkan format teks di posisi
    // kursor (hasil akhir CSS), bukan sekadar nilai yang terakhir dipilih.
    if (startElement) {
      const computed = getComputedStyle(startElement);
      const px = Math.round(Number.parseFloat(computed.fontSize));
      if (Number.isFinite(px)) setSize(px);
      const family = computed.fontFamily
        .split(",")[0]
        ?.trim()
        .replace(/^["']|["']$/g, "");
      if (family && FONT_OPTIONS.includes(family)) setFont(family);
    }
  };
  const restoreSelection = () => {
    if (!rangeRef.current) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(rangeRef.current);
  };
  const commit = () => {
    if (!editorRef.current) return;
    const safe = sanitizeRichText(editorRef.current.innerHTML);
    if (editorRef.current.innerHTML !== safe)
      editorRef.current.innerHTML = safe;
    onChange({ ...block, text: safe });
  };
  const finishOrRemoveEmpty = () => {
    if (!editorRef.current) return;
    const safe = sanitizeRichText(editorRef.current.innerHTML);
    if (!plainTextFromRichText(safe)) {
      onRemove();
      return;
    }
    if (editorRef.current.innerHTML !== safe)
      editorRef.current.innerHTML = safe;
    onChange({ ...block, text: safe });
  };
  const command = (name: string, value?: string) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(name, false, value);
    rememberSelection();
    commit();
  };
  const selectStyle = (style: TextStyle) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    document.execCommand(
      "formatBlock",
      false,
      style === "heading" ? "<h1>" : style === "subheading" ? "<h2>" : "<p>",
    );
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    if (range) {
      // Mengganti gaya me-reset ukuran font langsung di baris yang terkena,
      // supaya ukuran gaya (heading/subheading/caption) benar-benar berlaku —
      // dulu <font size> dari caption/ukuran manual tetap menimpa heading.
      editor.querySelectorAll<HTMLElement>("h1, h2, p").forEach((block) => {
        if (!range.intersectsNode(block)) return;
        [block, ...block.querySelectorAll<HTMLElement>("*")].forEach(
          (node) => {
            node.removeAttribute("size");
            node.style.removeProperty("font-size");
            if (!node.getAttribute("style")) node.removeAttribute("style");
          },
        );
        if (style === "caption" && block.tagName === "P")
          block.setAttribute("data-style", "caption");
        else block.removeAttribute("data-style");
      });
    }
    rememberSelection();
    commit();
  };
  const selectSize = (nextSize: number) => {
    setSize(nextSize);
    editorRef.current?.focus();
    restoreSelection();
    // execCommand("fontSize") cuma punya skala lama 1-7 (bukan pixel
    // bebas). Trik standarnya: pakai size="7" sebagai penanda supaya
    // browser membungkus SELEKSI (bukan seluruh blok) dalam <font
    // size="7">, lalu kita ganti atribut size itu dengan style pixel yang
    // presisi sesuai pilihan user. sanitizeRichText (dipanggil dari commit)
    // sudah di-update supaya style font-size ini tidak ikut ke-strip.
    document.execCommand("fontSize", false, "7");
    editorRef.current?.querySelectorAll('font[size="7"]').forEach((node) => {
      node.removeAttribute("size");
      (node as HTMLElement).style.fontSize = `${nextSize}px`;
    });
    rememberSelection();
    commit();
  };
  const addLink = () => {
    rememberSelection();
    // Kursor di dalam tautan yang sudah ada → dialog terisi URL-nya (edit).
    const existing = rangeRef.current
      ? elementOf(rangeRef.current.startContainer)?.closest("a")
      : null;
    setLinkDialog({ url: existing?.getAttribute("href") ?? "", invalid: false });
  };
  const applyLink = () => {
    if (!linkDialog) return;
    const raw = linkDialog.url.trim();
    // "contoh.com" tanpa skema dianggap alamat web.
    const href = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
    if (!raw || !/^(https?:|mailto:|tel:)/i.test(href)) {
      setLinkDialog({ ...linkDialog, invalid: true });
      return;
    }
    setLinkDialog(null);
    if (rangeRef.current && !rangeRef.current.collapsed) {
      command("createLink", href);
      return;
    }
    // Tanpa teks terpilih, createLink tidak melakukan apa-apa — sisipkan URL
    // itu sendiri sebagai teks tautan. Nilai di-escape; sanitizer tetap
    // memvalidasi ulang href saat commit.
    const escaped = href
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    command("insertHTML", `<a href="${escaped}">${escaped}</a>`);
  };
  const pastePlainText = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("insertText", false, text);
    rememberSelection();
    commit();
  };
  const startEditing = () => {
    setEditMenuOpen(false);
    setIsEditing(true);
    requestAnimationFrame(() => {
      editorRef.current?.focus();
      restoreSelection();
    });
  };
  const startEditingAt = (event: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = event;
    setEditMenuOpen(false);
    setIsEditing(true);
    requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus({ preventScroll: true });
      const selection = window.getSelection();
      const documentWithCaret = document as Document & {
        caretPositionFromPoint?: (
          x: number,
          y: number,
        ) => { offsetNode: Node; offset: number } | null;
        caretRangeFromPoint?: (x: number, y: number) => Range | null;
      };
      const position = documentWithCaret.caretPositionFromPoint?.(
        clientX,
        clientY,
      );
      const range = position
        ? document.createRange()
        : (documentWithCaret.caretRangeFromPoint?.(clientX, clientY) ?? null);
      if (position && range) {
        range.setStart(position.offsetNode, position.offset);
        range.collapse(true);
      }
      if (range && editor.contains(range.startContainer)) {
        selection?.removeAllRanges();
        selection?.addRange(range);
        rangeRef.current = range.cloneRange();
      }
    });
  };
  // Trackpad kadang memicu blur/klik-di-luar di tengah gesture drag-select
  // (terutama saat drag mundur/overshoot melewati batas blok) — kejadian
  // yang tidak selalu bisa direproduksi dengan mouse biasa. Selama masih
  // ada seleksi teks nyata di dalam editor, jangan pernah dianggap
  // "selesai edit", apa pun pemicu eventnya.
  const hasActiveEditorSelection = () => {
    const selection = window.getSelection();
    return Boolean(
      selection &&
        !selection.isCollapsed &&
        editorRef.current?.contains(selection.anchorNode),
    );
  };
  const finishEditing = (event: React.FocusEvent<HTMLDivElement>) => {
    // Dialog tautan bersifat modal: saat terbuka, base-ui menjadikan semua di
    // luarnya `inert`, sehingga editor ter-blur tanpa relatedTarget dan
    // selection bisa terhapus — itu bukan berarti user selesai mengedit.
    if (
      linkDialog !== null ||
      selectInteractingRef.current ||
      hasActiveEditorSelection()
    ) {
      commit();
      return;
    }
    const nextTarget = event.relatedTarget;
    // Dropdown Select (Paragraf/Font/Ukuran) membuka popup lewat React
    // Portal, jadi saat fokus pindah ke sana nextTarget bukan descendant
    // wrapperRef. Tanpa pengecualian ini, membuka dropdown langsung
    // dianggap "blur keluar" dan mematikan mode edit sebelum sempat memilih.
    if (
      nextTarget instanceof Node &&
      (wrapperRef.current?.contains(nextTarget) ||
        (nextTarget instanceof Element &&
          nextTarget.closest(EDITOR_PORTAL_SELECTOR)))
    ) {
      commit();
      return;
    }
    finishOrRemoveEmpty();
    setIsEditing(false);
  };

  useEffect(() => {
    if (!isEditing) return;
    // React menjalankan effect ini secara sinkron di tengah event klik yang
    // MENYALAKAN mode edit (mis. "Edit teks" di menu pensil), jadi listener
    // ini bisa menerima klik yang sama saat masih bubbling ke document dan
    // langsung menutup mode edit lagi. Klik yang dimulai sebelum listener
    // terpasang diabaikan.
    const attachedAt = performance.now();
    const finishOnOutsideClick = (event: MouseEvent) => {
      if (event.timeStamp <= attachedAt) return;
      if (
        linkDialog !== null ||
        selectInteractingRef.current ||
        hasActiveEditorSelection()
      )
        return;
      if (event.target instanceof Node) {
        if (wrapperRef.current?.contains(event.target)) return;
        // Dropdown Select (Paragraf/Font/Ukuran) di-render lewat React
        // Portal, jadi klik di dalamnya tidak terdeteksi wrapperRef.contains
        // di atas. Tanpa pengecualian ini, memilih opsi font/ukuran langsung
        // dianggap klik di luar dan mematikan mode edit.
        const target =
          event.target instanceof Element
            ? event.target
            : event.target.parentElement;
        if (target?.closest(EDITOR_PORTAL_SELECTOR)) return;
      }
      finishOrRemoveEmpty();
      setIsEditing(false);
    };
    document.addEventListener("click", finishOnOutsideClick);
    return () => document.removeEventListener("click", finishOnOutsideClick);
  });

  return (
    <div className="group relative w-full" ref={wrapperRef}>
      {isEditing ? (
        <div
          className="overflow-x-auto rounded-t-md bg-action-ink text-on-dark [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onPointerDownCapture={rememberSelection}
        >
          <div className="flex min-w-max items-stretch">
            <Select
              onOpenChange={handleSelectOpenChange}
              onValueChange={(value) => selectStyle(value as TextStyle)}
              value={selectedStyle}
            >
              <SelectTrigger
                aria-label={copy.textStyle}
                className="!h-10 w-32 shrink-0 !rounded-none border-0 border-r border-on-dark/15 !bg-action-ink px-3 type-label font-semibold !text-on-dark [&_svg]:text-on-dark/60"
              >
                <SelectValue>
                  {(value: TextStyle) => styleLabels[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="!bg-action-ink !text-on-dark ring-on-dark/15">
                <SelectItem className="focus:!bg-on-dark/10" value="heading">
                  {copy.heading}
                </SelectItem>
                <SelectItem
                  className="focus:!bg-on-dark/10"
                  value="subheading"
                >
                  {copy.subheading}
                </SelectItem>
                <SelectItem className="focus:!bg-on-dark/10" value="paragraph">
                  {copy.paragraph}
                </SelectItem>
                <SelectItem className="focus:!bg-on-dark/10" value="caption">
                  {copy.caption}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              onOpenChange={handleSelectOpenChange}
              onValueChange={(value) => {
                if (!value) return;
                setFont(value);
                command("fontName", value);
              }}
              value={font}
            >
              <SelectTrigger
                aria-label={copy.fontFamily}
                className="!h-10 w-28 shrink-0 !rounded-none border-0 border-r border-on-dark/15 !bg-action-ink px-3 type-label font-semibold !text-on-dark [&_svg]:text-on-dark/60"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!bg-action-ink !text-on-dark ring-on-dark/15">
                {FONT_OPTIONS.map((item) => (
                  <SelectItem
                    className="focus:!bg-on-dark/10"
                    key={item}
                    style={{ fontFamily: item }}
                    value={item}
                  >
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              onOpenChange={handleSelectOpenChange}
              onValueChange={(value) => selectSize(Number(value))}
              value={String(size)}
            >
              <SelectTrigger
                aria-label={copy.fontSize}
                className="!h-10 w-16 shrink-0 !rounded-none border-0 border-r border-on-dark/15 !bg-action-ink px-2 type-label font-semibold !text-on-dark [&_svg]:text-on-dark/60"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!bg-action-ink !text-on-dark ring-on-dark/15">
                {TEXT_SIZES.map((item) => (
                  <SelectItem
                    className="focus:!bg-on-dark/10"
                    key={item}
                    value={String(item)}
                  >
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label
              aria-label={copy.textColor}
              className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center border-l border-on-dark/15 text-on-dark/60 hover:bg-on-dark/10 hover:text-on-dark focus-within:ring-3 focus-within:ring-brand"
              onMouseDown={rememberSelection}
              title={copy.textColor}
            >
              <span className="flex flex-col items-center type-body leading-none">
                T
                <span
                  className="mt-1 h-0.5 w-5"
                  style={{ backgroundColor: textColor }}
                />
              </span>
              <input
                aria-label={copy.chooseTextColor}
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(event) => {
                  setTextColor(event.target.value);
                  command("foreColor", event.target.value);
                }}
                type="color"
                value={textColor}
              />
            </label>
            <ToolbarButton
              action={() => command("bold")}
              icon={<Bold className="size-4" />}
              label={copy.bold}
            />
            <ToolbarButton
              action={() => command("italic")}
              icon={<Italic className="size-4" />}
              label={copy.italic}
            />
            <ToolbarButton
              action={() => command("underline")}
              icon={<Underline className="size-4" />}
              label={copy.underline}
            />
            <ToolbarButton
              action={() => command("justifyLeft")}
              icon={<AlignLeft className="size-3.5" />}
              label={copy.alignLeft}
            />
            <ToolbarButton
              action={() => command("justifyCenter")}
              icon={<AlignCenter className="size-3.5" />}
              label={copy.alignCenter}
            />
            <ToolbarButton
              action={() => command("justifyRight")}
              icon={<AlignRight className="size-3.5" />}
              label={copy.alignRight}
            />
            <ToolbarButton
              action={addLink}
              icon={<Link2 className="size-4" />}
              label={copy.addLink}
            />
            <ToolbarButton
              action={() => command("unlink")}
              icon={<Unlink className="size-4" />}
              label={copy.removeLink}
            />
            <ToolbarButton
              action={() => command("removeFormat")}
              icon={<RemoveFormatting className="size-4" />}
              label={copy.clearFormatting}
            />
            <ToolbarButton
              action={() => command("dirRTL")}
              icon={<Pilcrow className="size-4" />}
              label={copy.paragraphDirection}
            />
          </div>
        </div>
      ) : null}
      <div
        aria-label={copy.projectText}
        className={cn(
          // Bukan type-body: kelas itu membawa max-inline-size 65ch yang
          // memotong lebar teks jauh di bawah lebar toolbar.
          RICH_TEXT_CLASS,
          "min-h-12 w-full px-2 py-1.5 outline-none empty:before:pointer-events-none empty:before:opacity-40 empty:before:content-[attr(data-placeholder)]",
          // border-current mengikuti warna teks canvas, jadi tetap terlihat
          // di canvas terang maupun gelap (dulu border-on-dark = putih).
          isEditing
            ? "rounded-b-md border border-t-0 border-current/40"
            : "cursor-text hover:ring-1 hover:ring-brand/50",
        )}
        contentEditable={isEditing}
        data-placeholder={copy.placeholder}
        onBlur={finishEditing}
        onClick={isEditing ? undefined : startEditingAt}
        onFocus={() => setIsEditing(true)}
        onInput={rememberSelection}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onPaste={pastePlainText}
        ref={editorRef}
        style={{
          backgroundColor,
          color: readableTextColor(backgroundColor),
        }}
        suppressContentEditableWarning
      />
      {!isEditing ? (
        <>
          <DropdownMenu onOpenChange={setEditMenuOpen} open={editMenuOpen}>
            <DropdownMenuTrigger
              render={
                <button
                  aria-label={copy.textActions}
                  className={cn(
                    "absolute -left-3 -top-3 z-30 flex size-8 items-center justify-center rounded-full bg-brand text-on-brand opacity-0 shadow-[var(--shadow-control)] transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand",
                    editMenuOpen && "opacity-100",
                  )}
                  title={copy.textActions}
                  type="button"
                />
              }
            >
              <Pencil className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="min-w-40 p-1"
              sideOffset={6}
            >
              <DropdownMenuItem className="h-9 px-3" onClick={startEditing}>
                {copy.editText}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="h-9 px-3"
                onClick={onRemove}
                variant="destructive"
              >
                {copy.deleteText}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="absolute -right-1 -top-1.5 z-10 flex overflow-hidden rounded-[var(--radius-control)] bg-brand text-on-brand opacity-0 shadow transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              aria-label={copy.alignLeft}
              className="flex size-8 items-center justify-center hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-on-brand"
              onMouseDown={(event) => {
                event.preventDefault();
                onContentAlign("left");
              }}
              title={copy.alignLeft}
              type="button"
            >
              <AlignLeft className="size-3.5" />
            </button>
            <button
              aria-label={copy.alignCenter}
              className="flex size-8 items-center justify-center hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-on-brand"
              onMouseDown={(event) => {
                event.preventDefault();
                onContentAlign("center");
              }}
              title={copy.alignCenter}
              type="button"
            >
              <AlignCenter className="size-3.5" />
            </button>
            <button
              aria-label={copy.alignRight}
              className="flex size-8 items-center justify-center hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-on-brand"
              onMouseDown={(event) => {
                event.preventDefault();
                onContentAlign("right");
              }}
              title={copy.alignRight}
              type="button"
            >
              <AlignRight className="size-3.5" />
            </button>
          </div>
        </>
      ) : null}
      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setLinkDialog(null);
        }}
        open={linkDialog !== null}
      >
        <AlertDialogContent finalFocus={editorRef}>
          <form
            className="grid gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              applyLink();
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{copy.addLink}</AlertDialogTitle>
              <AlertDialogDescription>
                {copy.linkDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-2">
              <Label htmlFor={`link-url-${block.id}`}>{copy.linkPrompt}</Label>
              <Input
                aria-invalid={linkDialog?.invalid}
                autoFocus
                id={`link-url-${block.id}`}
                onChange={(event) =>
                  setLinkDialog((current) =>
                    current
                      ? { url: event.target.value, invalid: false }
                      : current,
                  )
                }
                placeholder={copy.linkPlaceholder}
                value={linkDialog?.url ?? ""}
              />
              {linkDialog?.invalid ? (
                <p className="type-metadata text-danger" role="alert">
                  {copy.invalidLink}
                </p>
              ) : null}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
                type="button"
              >
                {copy.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
                disabled={!linkDialog?.url.trim()}
                type="submit"
              >
                {copy.applyLink}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
export function CreateProjectWizard({
  project = null,
  open: controlledOpen,
  onOpenChange,
  onSaved,
}: CreateProjectWizardProps) {
  const s = useT().dashboardCreator.creatorStudio;

  // Menyimpan isi project, panel editor, dan status penyimpanan
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const showTrigger = controlledOpen === undefined;
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<ProjectVisibility>("public");
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([]);
  // Nama/avatar kolaborator — backend hanya mengembalikan user_id + role.
  const [collaboratorProfiles, setCollaboratorProfiles] = useState<
    Record<string, CreatorSummary>
  >({});
  const [currentUserId, setCurrentUserId] = useState("");
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [assets, setAssets] = useState<EditorAsset[]>([]);
  const [coverKey, setCoverKey] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [contentGap, setContentGap] = useState(60);
  const [profileSocials, setProfileSocials] = useState<
    Partial<Record<SocialPlatform, string>>
  >({});
  const [authorProfile, setAuthorProfile] =
    useState<PublicCreatorProfile | null>(null);
  const [selectedSocials, setSelectedSocials] = useState<SocialPlatform[]>([]);
  const [panel, setPanel] = useState<"content" | "styles" | "settings">(
    "content",
  );
  const [mobileDockOpen, setMobileDockOpen] = useState(false);
  const [mobileContentOpen, setMobileContentOpen] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<"draft" | "publish" | null>(
    null,
  );
  const [editorReady, setEditorReady] = useState(false);
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [recoveryHadPendingMedia, setRecoveryHadPendingMedia] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [activeInsertIndex, setActiveInsertIndex] = useState<number | null>(
    null,
  );
  // Menyimpan posisi insert dan input file yang dibuka lewat tombol editor
  const pendingInsertIndex = useRef<number | null>(null);
  // Grid yang sedang ditambah gambarnya lewat "Tambah gambar ke grid"
  const pendingGridAppend = useRef<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const gridInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [embedDialog, setEmbedDialog] = useState<{
    insertAt: number | null;
    url: string;
    invalid: boolean;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [initialFingerprint, setInitialFingerprint] = useState("");
  const submitting = submitIntent !== null;

  // Membuka kembali editor yang masih aktif pada session ini
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (
        controlledOpen === undefined &&
        sessionStorage.getItem(CREATE_PROJECT_OPEN_KEY) === "true"
      ) {
        setInternalOpen(true);
      }
      setSessionReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [controlledOpen]);

  // Mengisi editor dari project atau recovery draft
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!open) {
        setEditorReady(false);
        return;
      }
      const stored = parseStoredContent(project);
      let recovered: CreateProjectRecovery | null = null;
      if (!project && typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem(CREATE_PROJECT_RECOVERY_KEY);
          recovered = raw ? (JSON.parse(raw) as CreateProjectRecovery) : null;
        } catch {
          sessionStorage.removeItem(CREATE_PROJECT_RECOVERY_KEY);
        }
      }
      setTitle(recovered?.title ?? project?.title ?? "");
      setTags(recovered?.tags ?? project?.tags.join(", ") ?? "");
      setVisibility(
        recovered?.visibility ??
          (project?.visibility === "unlisted" ? "unlisted" : "public"),
      );
      setCollaborators(
        recovered?.collaborators ?? project?.collaborators ?? [],
      );
      setBlocks(recovered?.blocks ?? stored.blocks);
      setBackgroundColor(recovered?.backgroundColor ?? stored.backgroundColor);
      setContentGap(recovered?.contentGap ?? stored.contentGap);
      setSelectedSocials(
        recovered?.selectedSocials ??
          (Object.keys(stored.socialLinks) as SocialPlatform[]),
      );
      setAssets(
        (project?.media ?? []).map((media) => ({
          key: media.id,
          url: media.url,
          media,
        })),
      );
      setCoverKey(project?.coverMediaId ?? "");
      setRecoveryHadPendingMedia(Boolean(recovered?.hadPendingMedia));
      setRecoveryDialogOpen(Boolean(recovered));
      setPanel("content");
      setActiveInsertIndex(null);
      pendingInsertIndex.current = null;
      setInitialFingerprint(
        editorFingerprint(
          project
            ? {
                title: project.title,
                tags: project.tags.join(", "),
                visibility:
                  project.visibility === "unlisted" ? "unlisted" : "public",
                collaborators: project.collaborators,
                blocks: stored.blocks,
                assets: project.media.map((media) => ({
                  key: media.id,
                  url: media.url,
                  media,
                })),
                coverKey: project.coverMediaId,
                backgroundColor: stored.backgroundColor,
                contentGap: stored.contentGap,
                selectedSocials: Object.keys(
                  stored.socialLinks,
                ) as SocialPlatform[],
              }
            : {
                title: "",
                tags: "",
                visibility: "public",
                collaborators: [],
                blocks: [],
                assets: [],
                coverKey: "",
                backgroundColor: "#ffffff",
                contentGap: 60,
                selectedSocials: [],
              },
        ),
      );
      setEditorReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, project]);

  // Membandingkan isi editor dengan data awal untuk mendeteksi perubahan
  const currentFingerprint = editorFingerprint({
    title,
    tags,
    visibility,
    collaborators,
    blocks,
    assets,
    coverKey,
    backgroundColor,
    contentGap,
    selectedSocials,
  });

  // Memuat social link creator yang bisa dipilih untuk project
  useEffect(() => {
    if (!open) return;
    let active = true;
    void userService
      .getMe()
      .then((currentUser) => {
        if (!active) return;
        setCurrentUserId(currentUser.id);
        setProfileSocials(
          Object.fromEntries(
            currentUser.connectedAccounts
              .filter(
                (account) =>
                  account.platform !== "unspecified" && account.handleOrUrl,
              )
              .map((account) => [account.platform, account.handleOrUrl]),
          ),
        );
        setAuthorProfile({
          aboutDescription: currentUser.aboutMe.description,
          aboutTitle: currentUser.aboutMe.title,
          company: currentUser.company,
          headline: currentUser.headline,
          location: currentUser.location,
          socialLinks: Object.fromEntries(
            currentUser.connectedAccounts
              .filter(
                (account) =>
                  account.platform !== "unspecified" && account.handleOrUrl,
              )
              .map((account) => [account.platform, account.handleOrUrl]),
          ),
          websiteUrl: currentUser.websiteUrl,
          workExperience: currentUser.workExperience.map((experience) => ({
            company: experience.company,
            description: experience.description,
            isCurrent: experience.isCurrent,
            title: experience.title,
          })),
        });
      })
      .catch(() => {
        if (active) {
          setProfileSocials({});
          setAuthorProfile(null);
        }
      });
    return () => {
      active = false;
    };
  }, [open]);
  const hasUnsavedChanges =
    editorReady && currentFingerprint !== initialFingerprint;

  // Kolaborator dari proyek tersimpan hanya berisi user_id; nama & avatar
  // dicari di direktori creator saat panel Detail proyek dibuka.
  useEffect(() => {
    if (panel !== "settings") return;
    const missing = collaborators
      .map((item) => item.userId)
      .filter((id) => !collaboratorProfiles[id]);
    if (!missing.length) return;
    let active = true;
    creatorDirectory.findMany(missing).then(
      (found) => {
        if (active && found.length)
          setCollaboratorProfiles((current) => ({
            ...current,
            ...Object.fromEntries(found.map((creator) => [creator.id, creator])),
          }));
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [collaboratorProfiles, collaborators, panel]);

  // Backend menolak user_id kembar; pemilik juga tidak dicantumkan sebagai
  // kolaborator proyeknya sendiri. Role diisi belakangan di baris kolaborator.
  const addCollaborator = ({ id, creator }: CollaboratorPick) => {
    if (id === currentUserId) {
      toast.error(s.editor.collaboratorSelf);
      return;
    }
    if (collaborators.some((item) => item.userId === id)) {
      toast.error(s.editor.collaboratorDuplicate);
      return;
    }
    setCollaborators((items) => [...items, { userId: id, role: "" }]);
    if (creator)
      setCollaboratorProfiles((current) => ({ ...current, [id]: creator }));
  };

  // Menyimpan status editor terbuka pada session browser
  useEffect(() => {
    if (
      !sessionReady ||
      controlledOpen !== undefined ||
      typeof window === "undefined"
    )
      return;
    if (open) sessionStorage.setItem(CREATE_PROJECT_OPEN_KEY, "true");
    else sessionStorage.removeItem(CREATE_PROJECT_OPEN_KEY);
  }, [controlledOpen, open, sessionReady]);

  // Menyimpan recovery draft saat project baru belum disimpan
  useEffect(() => {
    if (!open || project || !editorReady || typeof window === "undefined")
      return;
    if (!hasUnsavedChanges) {
      sessionStorage.removeItem(CREATE_PROJECT_RECOVERY_KEY);
      return;
    }
    const snapshot: CreateProjectRecovery = {
      title,
      tags,
      visibility,
      collaborators,
      // Hanya block tanpa file lokal yang bisa bertahan setelah reload
      blocks: blocks.filter(
        (block): block is TextBlock | EmbedBlock =>
          block.type === "text" || block.type === "embed",
      ),
      backgroundColor,
      contentGap,
      selectedSocials,
      hadPendingMedia: assets.some((asset) => Boolean(asset.file)),
    };
    sessionStorage.setItem(
      CREATE_PROJECT_RECOVERY_KEY,
      JSON.stringify(snapshot),
    );
  }, [
    assets,
    backgroundColor,
    blocks,
    collaborators,
    contentGap,
    editorReady,
    hasUnsavedChanges,
    open,
    project,
    selectedSocials,
    tags,
    title,
    visibility,
  ]);

  // Memperingatkan user saat menutup tab dengan perubahan yang belum disimpan
  useEffect(() => {
    if (!open || !hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges, open]);

  useEffect(() => {
    if (!previewOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewOpen]);

  // Membuka mobile dock saat area kosong canvas ditekan
  const toggleMobileDockFromCanvas = (event: React.MouseEvent<HTMLElement>) => {
    // Sama dengan breakpoint m3-laptop (62.5rem): di atas ini dock disembunyikan
    // CSS dan sidebar yang tampil, jadi klik canvas tidak boleh men-toggle dock.
    if (window.matchMedia("(min-width: 62.5rem)").matches) return;
    const target = event.target instanceof Element ? event.target : null;
    if (
      target?.closest(
        "button, input, select, textarea, a, [contenteditable='true'], [aria-label='Project text'], [role='dialog'], [data-slot='dropdown-menu-content']",
      )
    )
      return;
    setMobileDockOpen((open) => {
      if (open) setMobileContentOpen(false);
      return !open;
    });
  };

  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(value);
    onOpenChange?.(value);
  };

  // Menyiapkan asset canvas dan thumbnail project
  const assetMap = useMemo(
    () => new Map(assets.map((asset) => [asset.key, asset])),
    [assets],
  );
  const firstCanvasImage = blocks.find(
    (block): block is MediaBlock => block.type === "image",
  );
  const fallbackCoverAsset = firstCanvasImage
    ? assetMap.get(firstCanvasImage.assetKey)
    : undefined;
  const coverAsset = assetMap.get(coverKey) ?? fallbackCoverAsset;

  // Menambahkan text block pada posisi yang dipilih
  const addText = (
    style: TextBlock["style"] = "paragraph",
    insertAt?: number,
  ) => {
    const next: TextBlock = {
      id: newId(),
      type: "text",
      style,
      text: "",
      contentAlign: "center",
    };
    setBlocks((items) => {
      if (insertAt === undefined) return [...items, next];
      const copy = [...items];
      copy.splice(Math.max(0, Math.min(insertAt, copy.length)), 0, next);
      return copy;
    });
    setActiveInsertIndex(null);
  };

  const insertBlocks = (nextBlocks: EditorBlock[], insertAt: number | null) => {
    setActiveInsertIndex(null);
    setBlocks((items) => {
      if (insertAt === null) return [...items, ...nextBlocks];
      const copy = [...items];
      copy.splice(
        Math.max(0, Math.min(insertAt, copy.length)),
        0,
        ...nextBlocks,
      );
      return copy;
    });
  };

  // Menambahkan file yang lolos batas 10 MB sebagai asset dan media block baru
  const addFiles = (files: File[], kind: "image" | "video" | "grid") => {
    const insertAt = pendingInsertIndex.current;
    const appendToGrid = pendingGridAppend.current;
    pendingInsertIndex.current = null;
    pendingGridAppend.current = null;
    if (!files.length) return;
    const acceptedFiles = files.filter((file) => {
      if (file.size <= 10 * 1024 * 1024) return true;
      toast.error(s.editor.fileTooLarge.replace("{name}", file.name));
      return false;
    });
    if (!acceptedFiles.length) return;
    const nextAssets = acceptedFiles.map((file) => ({
      key: `pending:${newId()}`,
      file,
      url: URL.createObjectURL(file),
    }));
    setAssets((items) => [...items, ...nextAssets]);
    const keys = nextAssets.map((asset) => asset.key);
    if (kind === "grid") {
      if (appendToGrid) {
        updateBlock(appendToGrid, (block) =>
          block.type === "grid"
            ? { ...block, assetKeys: [...block.assetKeys, ...keys] }
            : block,
        );
        return;
      }
      insertBlocks([{ id: newId(), type: "grid", assetKeys: keys }], insertAt);
      return;
    }
    // Media baru memakai full width agar hasil editor sama dengan halaman public
    insertBlocks(
      keys.map(
        (assetKey): MediaBlock => ({
          id: newId(),
          type: kind,
          assetKey,
          caption: "",
          width: "full",
        }),
      ),
      insertAt,
    );
  };

  const chooseFileAt = (
    kind: "image" | "video" | "grid",
    index: number | null,
  ) => {
    pendingInsertIndex.current = index;
    const input =
      kind === "image" ? imageInput : kind === "video" ? videoInput : gridInput;
    input.current?.click();
  };

  const appendToGrid = (id: string) => {
    pendingGridAppend.current = id;
    gridInput.current?.click();
  };

  const openEmbedDialog = (insertAt: number | null) =>
    setEmbedDialog({ insertAt, url: "", invalid: false });

  const submitEmbed = () => {
    if (!embedDialog) return;
    // Disimpan dalam bentuk https lengkap supaya halaman publik tidak
    // bergantung pada normalisasi yang sama.
    const url = normalizeEmbedUrl(embedDialog.url);
    if (!url || !toEmbedSource(url)) {
      setEmbedDialog({ ...embedDialog, invalid: true });
      return;
    }
    insertBlocks(
      [{ id: newId(), type: "embed", url, width: "inset" }],
      embedDialog.insertAt,
    );
    setEmbedDialog(null);
  };

  // Menambahkan thumbnail tanpa memasukkannya ke dalam block canvas
  const addCoverFile = (file?: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(s.editor.fileTooLarge.replace("{name}", file.name));
      return;
    }
    const nextAsset = {
      key: `cover:${newId()}`,
      file,
      url: URL.createObjectURL(file),
    };
    setAssets((current) => {
      const previous = current.find((asset) => asset.key === coverKey);
      const previousIsUsedOnCanvas = previous
        ? blocks.some((block) => blockAssetKeys(block).includes(previous.key))
        : false;
      if (previous?.file && !previousIsUsedOnCanvas)
        URL.revokeObjectURL(previous.url);
      return [
        ...current.filter(
          (asset) => previousIsUsedOnCanvas || asset.key !== previous?.key,
        ),
        nextAsset,
      ];
    });
    setCoverKey(nextAsset.key);
  };

  const updateBlock = (
    id: string,
    updater: (block: EditorBlock) => EditorBlock,
  ) => {
    setBlocks((items) =>
      items.map((block) => (block.id === id ? updater(block) : block)),
    );
  };

  const toggleBlockWidth = (id: string) =>
    updateBlock(id, (item) =>
      item.type === "image" || item.type === "video" || item.type === "embed"
        ? { ...item, width: item.width === "full" ? "inset" : "full" }
        : item,
    );

  // Melepas asset (dan object URL-nya) yang tidak lagi dipakai block mana pun
  const releaseUnusedAssets = (keys: string[], remaining: EditorBlock[]) => {
    const stillUsed = new Set(remaining.flatMap(blockAssetKeys));
    const orphaned = new Set(
      keys.filter((key) => !stillUsed.has(key) && key !== coverKey),
    );
    if (!orphaned.size) return;
    setAssets((current) =>
      current.filter((asset) => {
        if (!orphaned.has(asset.key)) return true;
        if (asset.file) URL.revokeObjectURL(asset.url);
        return false;
      }),
    );
  };

  // Menghapus block beserta object URL yang sudah tidak dipakai
  const removeBlock = (id: string) =>
    setBlocks((items) => {
      const removed = items.find((block) => block.id === id);
      const next = items.filter((block) => block.id !== id);
      if (removed) releaseUnusedAssets(blockAssetKeys(removed), next);
      return next;
    });

  // Menghapus satu gambar dari grid; grid yang kosong ikut dihapus
  const removeGridImage = (id: string, assetKey: string) =>
    setBlocks((items) => {
      const next = items.flatMap((block) => {
        if (block.id !== id || block.type !== "grid") return [block];
        const assetKeys = block.assetKeys.filter((key) => key !== assetKey);
        return assetKeys.length ? [{ ...block, assetKeys }] : [];
      });
      releaseUnusedAssets([assetKey], next);
      return next;
    });

  // Menyiapkan summary dan asset yang akan dikirim ke API
  const summaryBlock = blocks.find(
    (block): block is TextBlock =>
      block.type === "text" && Boolean(plainTextFromRichText(block.text)),
  );
  const summary = summaryBlock ? plainTextFromRichText(summaryBlock.text) : "";
  const referencedAssetKeys = new Set(blocks.flatMap(blockAssetKeys));
  if (coverAsset) referencedAssetKeys.add(coverAsset.key);
  const hasRenderableContent = blocks.some((block) => {
    if (block.type === "text") return Boolean(plainTextFromRichText(block.text));
    if (block.type === "embed") return Boolean(toEmbedSource(block.url));
    return blockAssetKeys(block).some((key) => assetMap.has(key));
  });

  // Satu daftar jenis konten untuk empty state, sidebar, dock mobile, dan
  // slot sisip — supaya keempat pintu masuk itu tidak bisa berbeda isinya.
  // Daftarnya murni data; aksi lewat addContent (dipanggil dari event
  // handler) karena fungsinya menyentuh ref input file.
  const contentTypes: Array<{
    kind: ContentKind;
    label: string;
    Icon: typeof ImageIcon;
  }> = [
    { kind: "image", label: s.editor.image, Icon: ImageIcon },
    { kind: "text", label: s.editor.text, Icon: TextCursorInput },
    { kind: "grid", label: s.editor.photoGrid, Icon: LayoutGrid },
    { kind: "video", label: s.editor.videoAudio, Icon: PlayCircle },
    { kind: "embed", label: s.editor.embed, Icon: CodeXml },
  ];
  // `at` = posisi sisip (null = di akhir canvas).
  const addContent = (kind: ContentKind, at: number | null) => {
    if (kind === "text") addText("paragraph", at ?? undefined);
    else if (kind === "embed") openEmbedDialog(at);
    else chooseFileAt(kind, at);
  };

  // Preview merender komponen halaman publik yang sama (ProjectContent) dari
  // state editor saat ini, memakai asset key lokal sebagai media id — jadi
  // yang terlihat di preview = yang akan terlihat setelah dipublikasikan.
  const previewProject = previewOpen
    ? {
        title: title || s.editor.untitled,
        media: assets.map((asset, order) => ({
          id: asset.key,
          url: asset.url,
          type:
            asset.media?.type ??
            (asset.file?.type.startsWith("video/") ? 2 : 1),
          order,
          publicId: "",
        })),
        content: JSON.stringify({
          appearance: { backgroundColor, contentGap },
          doc: { blocks: toStoredBlocks(blocks, (key) => key) },
        }),
      }
    : null;

  // ProjectInput.content: JSON dokumen editor dengan media id dari
  // `mediaIdFor` (key asset lokal untuk cek awal, id media hasil upload
  // untuk payload final).
  const serializeContent = (mediaIdFor: (key: string) => string) => {
    const stored: StoredContent = {
      version: 1,
      editor: "priemman-blocks",
      summary,
      appearance: { backgroundColor, contentGap },
      authorProfile: authorProfile ?? undefined,
      socialLinks: Object.fromEntries(
        selectedSocials.flatMap((platform) =>
          profileSocials[platform]
            ? [[platform, profileSocials[platform]]]
            : [],
        ),
      ),
      doc: { type: "doc", blocks: toStoredBlocks(blocks, mediaIdFor) },
    };
    return JSON.stringify(stored);
  };
  const exceedsContentLimit = (content: string) =>
    new TextEncoder().encode(content).byteLength > MAX_CONTENT_BYTES;

  // Mengunggah media lalu menyimpan project sebagai draft atau published
  const save = async (publish: boolean) => {
    if (publish && !title.trim()) {
      const message = s.editor.titleRequired;
      toast.error(message);
      return;
    }
    if (publish && !hasRenderableContent) {
      const message = s.editor.contentRequired;
      toast.error(message);
      return;
    }

    // Visibility pilihan creator tetap dikirim saat menyimpan draf: backend
    // hanya menampilkan project yang status PUBLISHED + visibility PUBLIC,
    // jadi draf tetap privat, dan pilihan Unlisted tidak hilang saat draf
    // dibuka lagi (sebelumnya draf selalu dikirim sebagai DRAFT).
    const validation = projectInputSchema.safeParse({
      title: title.trim() || s.editor.untitled,
      tags: parseTagList(tags),
      content: summary,
      visibility,
      status: publish ? "published" : "draft",
    });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? s.editor.saveFailed);
      return;
    }
    // Dicek sebelum upload supaya media tidak terunggah sia-sia (key lokal
    // sedikit lebih panjang dari id media, jadi perkiraan ini aman).
    if (exceedsContentLimit(serializeContent((key) => key))) {
      toast.error(s.editor.contentTooLarge);
      return;
    }

    setSubmitIntent(publish ? "publish" : "draft");
    try {
      const referencedAssets = assets.filter((asset) =>
        referencedAssetKeys.has(asset.key),
      );
      const pending = referencedAssets.filter((asset) => asset.file);
      const uploadedBatches = await Promise.all(
        pending.map((asset) => mediaService.upload(asset.file!)),
      );
      const uploaded = uploadedBatches.map((batch, index) => {
        const media = batch[0];
        if (!media)
          throw new Error(
            s.editor.uploadFailed.replace(
              "{name}",
              pending[index].file?.name ?? "media",
            ),
          );
        return {
          key: pending[index].key,
          media: {
            ...media,
            order:
              index + referencedAssets.filter((asset) => asset.media).length,
          },
        };
      });
      if (uploaded.length) {
        const uploadedByKey = new Map(
          uploaded.map((item) => [item.key, item.media]),
        );
        setAssets((items) =>
          items.map((asset) => {
            const media = uploadedByKey.get(asset.key);
            if (!media) return asset;
            if (asset.file) URL.revokeObjectURL(asset.url);
            return { key: asset.key, url: media.url, media };
          }),
        );
      }
      const resolved = new Map<string, ProjectMedia>();
      referencedAssets.forEach((asset) => {
        if (asset.media) resolved.set(asset.key, asset.media);
      });
      uploaded.forEach((item) => resolved.set(item.key, item.media));
      const media = Array.from(resolved.values()).map((item, index) => ({
        ...item,
        order: index,
      }));
      const content = serializeContent((key) => resolved.get(key)?.id ?? "");
      if (exceedsContentLimit(content)) {
        toast.error(s.editor.contentTooLarge);
        return;
      }
      const input: ProjectInput = {
        title: title.trim() || s.editor.untitled,
        tags: parseTagList(tags),
        media,
        collaborators: collaborators.map((item) => ({
          ...item,
          role: item.role.trim(),
        })),
        visibility,
        status: publish ? "published" : "draft",
        coverMediaId:
          (coverAsset ? resolved.get(coverAsset.key)?.id : undefined) || "",
        content,
      };
      const saved = project
        ? await projectService.update(project.id, input)
        : await projectService.create(input);
      const persisted = await projectService.get(saved.id).catch(() => saved);
      toast.success(
        publish ? s.editor.publishedSuccess : s.editor.draftSuccess,
      );
      if (!project && typeof window !== "undefined")
        sessionStorage.removeItem(CREATE_PROJECT_RECOVERY_KEY);
      onSaved?.(persisted);
      setOpen(false);
    } catch (error) {
      toast.error(
        creatorStudioErrorMessage(error, s.errors, s.editor.saveFailed),
      );
    } finally {
      setSubmitIntent(null);
    }
  };

  // Untuk project yang sudah PUBLISHED, simpan sebagai draf mengubah status
  // menjadi DRAFT (project hilang dari publik), jadi labelnya dibuat eksplisit;
  // tombol utama menyimpan perubahan dengan status tetap PUBLISHED.
  const isPublished = project?.status === "published";
  const draftLabel =
    submitIntent === "draft"
      ? s.editor.saving
      : isPublished
        ? s.editor.moveToDraft
        : s.editor.saveDraft;
  const publishLabel =
    submitIntent === "publish"
      ? isPublished
        ? s.editor.updating
        : s.editor.publishing
      : isPublished
        ? s.editor.update
        : s.editor.publish;

  if (!open) {
    return showTrigger ? (
      <Button className="h-12 gap-2" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> {s.createProject}
      </Button>
    ) : null;
  }

  return (
    <div className="dashboard-manrope fixed inset-0 z-[100] flex flex-col bg-canvas text-copy">
      {/* Header editor disamakan dengan DashboardHeader: tinggi
          --dashboard-header-height, padding --dashboard-header-padding, gap
          --dashboard-header-action-gap, dan judul memakai role tipografi
          dashboard-card-title/dashboard-body (sama seperti pageTitle di
          dashboard-header.tsx), bukan ukuran m3-label-large/type-metadata
          yang berbeda skala. */}
      <header className="flex h-[var(--dashboard-header-height)] shrink-0 items-center justify-between gap-[var(--dashboard-header-action-gap)] border-b border-border-subtle bg-surface-raised px-[var(--dashboard-header-padding)]">
        <div className="flex min-w-0 items-center gap-[var(--dashboard-header-action-gap)]">
          <Button
            aria-label={s.editor.back}
            className="!size-10 !min-h-10 rounded-full"
            onClick={() => setOpen(false)}
            size="icon"
            variant="ghost"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0">
            <p className="dashboard-card-title truncate">
              {project ? s.editor.editProject : s.editor.newProject}
            </p>
            <p className="dashboard-body truncate">
              {title || s.editor.untitled}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasRenderableContent ? (
            <Button
              aria-label={s.editor.preview}
              className="min-h-12 rounded-[var(--radius-control)] px-3 type-label m3-medium:px-4"
              disabled={submitting}
              onClick={() => setPreviewOpen(true)}
              variant="ghost"
            >
              <Eye className="size-4" />
              <span className="hidden m3-medium:inline">
                {s.editor.preview}
              </span>
            </Button>
          ) : null}
          <Button
            className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
            disabled={submitting || !hasRenderableContent}
            onClick={() => void save(false)}
            variant="outline"
          >
            {draftLabel}
          </Button>
          <Button
            className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
            disabled={submitting}
            onClick={() => void save(true)}
          >
            {publishLabel}
          </Button>
        </div>
      </header>
      {/* mx-auto + max-w dihitung dari ukuran kontrak editor (canvas 1280px +
          aside 292px + grid-gap + page-gutter*2), bukan lebar viewport. Tanpa
          cap ini, di monitor besar kolom main (minmax(0,1fr)) jadi jauh lebih
          lebar dari canvas 1280px di dalamnya, dan sisa ruang itu numpuk jadi
          jarak kosong raksasa antara canvas dan panel aside. Dengan cap +
          mx-auto, kelebihan ruang didorong ke luar (kiri-kanan backdrop
          hitam), bukan nongkrong di antara canvas dan menu. */}
      <div className="mx-auto grid min-h-0 w-full max-w-[calc(1280px_+_292px_+_var(--grid-gap)_+_var(--page-gutter)*2)] flex-1 grid-rows-[minmax(0,1fr)] gap-[var(--grid-gap)] overflow-hidden bg-canvas p-[var(--page-gutter)] m3-laptop:grid-cols-[minmax(0,1fr)_292px]">
        <main
          className="min-h-0 min-w-0 overflow-auto overscroll-contain [scrollbar-gutter:stable] m3-laptop:p-0"
          onClick={toggleMobileDockFromCanvas}
        >
          {/* Canvas editor mengikuti lebar viewport device (fluid), dicap di
              1280px pada layar besar — selaras dengan halaman publik
              (ProjectContent) yang juga responsive, jadi tidak perlu scroll
              horizontal untuk melihat/mengedit canvas di layar sempit. */}
          <div
            className={cn(
              "min-h-full w-full max-w-[1280px] overflow-hidden",
              !blocks.length && "flex",
              blocks.length && !isFullBleed(blocks[0])
                ? CANVAS_TOP_PADDING_CLASS
                : "pt-0",
              blocks.length && !isFullBleed(blocks.at(-1))
                ? CANVAS_BOTTOM_PADDING_CLASS
                : "pb-0",
            )}
            style={{
              backgroundColor,
              color: readableTextColor(backgroundColor),
            }}
          >
            <div className="flex w-full flex-col">
              {!blocks.length ? (
                <div className="flex w-full flex-1 flex-col items-center justify-center px-5 py-8 text-center m3-medium:px-10">
                  <p className="type-card-title text-inherit">
                    {s.editor.startBuilding}
                  </p>
                  <div className="mt-7 flex w-full max-w-sm flex-wrap justify-center gap-x-1.5 gap-y-3 min-[390px]:gap-x-3 m3-medium:mt-9 m3-medium:max-w-none m3-medium:gap-6">
                    {contentTypes.map(({ kind, label, Icon }) => (
                      <button
                        className="flex min-h-24 w-[30%] min-w-0 flex-col items-center justify-center gap-2 px-0.5 type-metadata text-inherit font-semibold m3-medium:min-h-28 m3-medium:w-32 m3-medium:gap-3.5 m3-medium:px-0"
                        key={kind}
                        onClick={() => addContent(kind, null)}
                        type="button"
                      >
                        <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand min-[390px]:size-16 m3-medium:size-20">
                          <Icon className="size-5 m3-medium:size-6" />
                        </span>
                        <span className="text-center leading-tight">
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {blocks.map((block, index) => {
                const marginTop = index === 0 ? 0 : contentGap;

                if (block.type === "text") {
                  return (
                    <div
                      className="group relative w-full px-6 m3-medium:px-12 m3-large:px-[88px]"
                      key={block.id}
                      style={{ marginTop }}
                    >
                      <div
                        className={cn(
                          TEXT_COLUMN_CLASS,
                          "transition-[margin] duration-200",
                          block.contentAlign === "left"
                            ? "mr-auto"
                            : block.contentAlign === "right"
                              ? "ml-auto"
                              : "mx-auto",
                        )}
                      >
                        <RichTextBlockEditor
                          backgroundColor={backgroundColor}
                          block={block}
                          onChange={(next) =>
                            updateBlock(block.id, () => next)
                          }
                          onContentAlign={(contentAlign) =>
                            updateBlock(block.id, (current) =>
                              current.type === "text"
                                ? { ...current, contentAlign }
                                : current,
                            )
                          }
                          onRemove={() => removeBlock(block.id)}
                        />
                      </div>
                    </div>
                  );
                }

                // Gambar, video, dan embed sama-sama bisa inset ↔ full width.
                const isFull = "width" in block && block.width === "full";
                const widthLabel = isFull
                  ? s.editor.addMargin
                  : s.editor.fullWidth;

                const deleteAction = {
                  key: "delete",
                  label:
                    block.type === "embed"
                      ? s.editor.removeBlock
                      : s.editor.removeMedia,
                  onClick: () => removeBlock(block.id),
                  destructive: true,
                };

                if (block.type === "embed") {
                  const source = toEmbedSource(block.url);
                  return (
                    // Lebar sama dengan gambar: inset (bermargin) atau full.
                    <div
                      className={cn(
                        "group relative mx-auto transition-[width] duration-300",
                        isFull ? "w-full" : MEDIA_INSET_CLASS,
                      )}
                      key={block.id}
                      style={{ marginTop }}
                    >
                      {source ? (
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
                          title={s.editor.embed}
                        />
                      ) : null}
                      <div className={BLOCK_HOVER_OUTLINE_CLASS} />
                      <div className={cn(BLOCK_CONTROLS_CLASS, "left-3 top-3")}>
                        <BlockActionsMenu
                          actions={[deleteAction]}
                          label={s.editor.blockActions}
                        />
                      </div>
                      <WidthToggle
                        full={isFull}
                        label={widthLabel}
                        onToggle={() => toggleBlockWidth(block.id)}
                      />
                    </div>
                  );
                }

                if (block.type === "grid") {
                  return (
                    <div
                      className="group relative w-full"
                      key={block.id}
                      style={{ marginTop }}
                    >
                      <div
                        className={cn(
                          "grid w-full gap-1",
                          gridColumnsClass(block.assetKeys.length),
                        )}
                      >
                        {block.assetKeys.map((assetKey) => (
                          <div
                            className={cn(
                              GRID_CELL_CLASS,
                              "group/item relative",
                            )}
                            key={assetKey}
                          >
                            <img
                              alt={title || s.editor.projectVisual}
                              className="block h-full w-full object-cover"
                              src={assetMap.get(assetKey)?.url}
                            />
                            <button
                              aria-label={s.editor.removeGridImage}
                              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-action-ink/70 text-on-dark opacity-0 transition-opacity group-hover/item:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                              onClick={() =>
                                removeGridImage(block.id, assetKey)
                              }
                              type="button"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className={BLOCK_HOVER_OUTLINE_CLASS} />
                      <div className={cn(BLOCK_CONTROLS_CLASS, "left-3 top-3")}>
                        <BlockActionsMenu
                          actions={[
                            {
                              key: "add",
                              label: s.editor.addGridImages,
                              onClick: () => appendToGrid(block.id),
                            },
                            deleteAction,
                          ]}
                          label={s.editor.blockActions}
                        />
                      </div>
                    </div>
                  );
                }

                const asset = assetMap.get(block.assetKey);
                return (
                  <figure
                    className={cn(
                      "group relative mx-auto overflow-hidden transition-[width] duration-300",
                      block.width === "full" ? "w-full" : MEDIA_INSET_CLASS,
                    )}
                    key={block.id}
                    style={{ marginTop }}
                  >
                    {block.type === "video" ? (
                      <video
                        className="block w-full max-w-full [backface-visibility:hidden] [transform:translateZ(0)]"
                        controls
                        src={asset?.url}
                      />
                    ) : (
                      <img
                        alt={block.caption || title || s.editor.projectVisual}
                        className="block w-full max-w-full object-cover [backface-visibility:hidden] [transform:translateZ(0)]"
                        src={asset?.url}
                      />
                    )}
                    <div className={BLOCK_HOVER_OUTLINE_CLASS} />
                    <div className={cn(BLOCK_CONTROLS_CLASS, "left-3 top-3")}>
                      <BlockActionsMenu
                        actions={[deleteAction]}
                        label={s.editor.blockActions}
                      />
                    </div>
                    <WidthToggle
                      full={isFull}
                      label={widthLabel}
                      onToggle={() => toggleBlockWidth(block.id)}
                    />
                  </figure>
                );
              })}
              {blocks.length ? (
                // Ruang setelah block terakhir = jarak konten (tempat block
                // berikutnya akan muncul), dengan "+" di tengahnya — supaya
                // pengaturan "Jarak konten" langsung terlihat walau baru ada
                // satu block. Minimal 40px agar "+" tetap bisa diklik.
                <div
                  className="flex w-full items-center"
                  style={{ minHeight: Math.max(contentGap, 40) }}
                >
                  <InsertContentSlot
                    active={activeInsertIndex === blocks.length}
                    items={contentTypes}
                    onActivate={() => setActiveInsertIndex(blocks.length)}
                    onClose={() => setActiveInsertIndex(null)}
                    onSelect={(kind) => addContent(kind, blocks.length)}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </main>

        <aside className="hidden self-start overflow-hidden rounded-[var(--radius-panel)] border border-border-subtle/60 bg-surface-raised text-copy shadow-[var(--shadow-panel)] m3-laptop:block m3-laptop:max-h-[calc(100dvh-152px)] m3-laptop:overflow-y-auto">
            <section>
              <h2 className="border-b border-border-subtle/60 bg-surface-muted/60 px-4 py-3 type-metadata font-semibold text-copy-muted">
                {s.editor.addContent}
              </h2>
              {/* gap-px di atas latar warna border = garis 1px antar tile ala
                  Behance. Tile terakhir yang ganjil dibentang 2 kolom supaya
                  tidak menyisakan sel kosong. */}
              <div className="grid grid-cols-2 gap-px bg-border-subtle/60 [&>*:last-child:nth-child(odd)]:col-span-2">
                {contentTypes.map(({ kind, label, Icon }) => (
                  <SidebarGridTile
                    icon={<Icon className="size-5" />}
                    key={kind}
                    label={label}
                    onClick={() => addContent(kind, null)}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="border-y border-border-subtle/60 bg-surface-muted/60 px-4 py-3 type-metadata font-semibold text-copy-muted">
                {s.editor.editProjectPanel}
              </h2>
              <div className="grid grid-cols-2 gap-px bg-border-subtle/60">
                <SidebarGridTile
                  active={panel === "styles"}
                  icon={<Palette className="size-5" />}
                  label={s.editor.styles}
                  onClick={() =>
                    setPanel((value) =>
                      value === "styles" ? "content" : "styles",
                    )
                  }
                />
                <SidebarGridTile
                  active={panel === "settings"}
                  icon={<Settings2 className="size-5" />}
                  label={s.editor.settings}
                  onClick={() =>
                    setPanel((value) =>
                      value === "settings" ? "content" : "settings",
                    )
                  }
                />
              </div>
            </section>

            <Dialog
              onOpenChange={(open) => {
                if (!open) setPanel("content");
              }}
              open={panel === "styles"}
            >
              <DialogContent className="m3-medium:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{s.editor.stylesTitle}</DialogTitle>
                  <DialogDescription>
                    {s.editor.stylesDescription}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-[var(--card-padding)] py-2">
                  <div>
                    <Label htmlFor="project-background">
                      {s.editor.backgroundColor}
                    </Label>
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        aria-label={s.editor.backgroundColorPicker}
                        className="size-12 rounded-[var(--radius-control)] border border-border-strong"
                        id="project-background"
                        onChange={(event) =>
                          setBackgroundColor(event.target.value)
                        }
                        type="color"
                        value={backgroundColor}
                      />
                      <Input
                        onChange={(event) =>
                          setBackgroundColor(event.target.value)
                        }
                        value={backgroundColor}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="content-gap">
                        {s.editor.contentSpacing}
                      </Label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          aria-label={s.editor.contentSpacingPixels}
                          className="min-h-12 w-20 px-2 text-center"
                          max={150}
                          min={0}
                          onChange={(event) =>
                            setContentGap(
                              Math.min(
                                150,
                                Math.max(0, Number(event.target.value)),
                              ),
                            )
                          }
                          type="number"
                          value={contentGap}
                        />
                        <span className="type-label text-copy-secondary">
                          px
                        </span>
                      </div>
                    </div>
                    <input
                      aria-valuemax={150}
                      aria-valuemin={0}
                      aria-valuenow={contentGap}
                      className="mt-4 min-h-12 w-full accent-brand"
                      id="content-gap"
                      max="150"
                      min="0"
                      onChange={(event) =>
                        setContentGap(Number(event.target.value))
                      }
                      step="1"
                      type="range"
                      value={contentGap}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
                    onClick={() => setPanel("content")}
                  >
                    {s.editor.save}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              onOpenChange={(open) => {
                if (!open) setPanel("content");
              }}
              open={panel === "settings"}
            >
              {/* sm:!max-w — DialogContent bawaan punya sm:max-w-md (448px) yang
                  di CSS keluar SETELAH breakpoint m3-medium, jadi lebar lama
                  selalu kalah dan isi dialog terhimpit. */}
              <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:!max-w-[960px]">
                <DialogHeader className="pr-8">
                  <DialogTitle className="dashboard-card-title">
                    {s.editor.settingsTitle}
                  </DialogTitle>
                  <DialogDescription>
                    {s.editor.settingsDescription}
                  </DialogDescription>
                </DialogHeader>
                <div className="-mx-1 min-h-0 overflow-y-auto overscroll-contain px-1">
                  <div className="grid items-start gap-[var(--grid-gap)] m3-expanded:grid-cols-[300px_minmax(0,1fr)]">
                    <div className="m3-expanded:sticky m3-expanded:top-0">
                      <SettingsSection title={s.editor.projectCover}>
                        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-control)] border border-border-subtle bg-surface-muted">
                          {coverAsset ? (
                            <img
                              alt={s.editor.selectedCover}
                              className="h-full w-full object-cover"
                              src={coverAsset.url}
                            />
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-3 pb-12 text-copy-secondary">
                              <ImageIcon className="size-9" />
                              <span className="type-label">
                                {s.editor.noCover}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-action-ink/85 to-transparent px-4 pb-4 pt-10 text-on-dark">
                            <p className="line-clamp-2 break-words type-label font-semibold">
                              {title.trim() || s.editor.untitled}
                            </p>
                            <p className="mt-0.5 type-metadata text-on-dark/80">
                              {s.editor.coverPreview}
                            </p>
                          </div>
                        </div>
                        <Button
                          className="min-h-12 w-full rounded-[var(--radius-control)] px-4 type-label"
                          onClick={() => coverInput.current?.click()}
                          variant="outline"
                        >
                          <ImagePlus className="size-4" />
                          {coverAsset && coverKey
                            ? s.editor.changeCover
                            : s.editor.uploadCover}
                        </Button>
                        <p className="type-metadata leading-relaxed text-copy-secondary">
                          {s.editor.coverHelp}
                        </p>
                      </SettingsSection>
                    </div>

                    <div className="min-w-0 space-y-[var(--grid-gap)]">
                      <SettingsSection title={s.editor.projectInformation}>
                        <div className="space-y-2">
                          <Label htmlFor="project-title">
                            {s.editor.projectTitle}{" "}
                            <span className="font-normal text-copy-secondary">
                              ({s.editor.required})
                            </span>
                          </Label>
                          <Input
                            className={SETTINGS_FIELD_CLASS}
                            id="project-title"
                            maxLength={160}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder={s.editor.titlePlaceholder}
                            required
                            value={title}
                          />
                          <p className="type-metadata text-copy-secondary">
                            {s.editor.titleHelp}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-tags">{s.editor.tags}</Label>
                          <TagsField
                            id="project-tags"
                            onChange={setTags}
                            placeholder={s.editor.tagsPlaceholder}
                            value={tags}
                          />
                          <p className="type-metadata text-copy-secondary">
                            {s.editor.tagsHelp}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-visibility">
                            {s.editor.visibility}
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setVisibility(value as ProjectVisibility)
                            }
                            value={visibility}
                          >
                            <SelectTrigger
                              className={cn(SETTINGS_FIELD_CLASS, "w-full")}
                              id="project-visibility"
                            >
                              {/* SelectValue base-ui tidak membaca label dari
                                  SelectItem — tanpa ini tampil "public". */}
                              <SelectValue>
                                {(value: ProjectVisibility) =>
                                  value === "unlisted"
                                    ? s.editor.unlisted
                                    : s.editor.public
                                }
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">
                                {s.editor.public}
                              </SelectItem>
                              <SelectItem value="unlisted">
                                {s.editor.unlisted}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="type-metadata leading-relaxed text-copy-secondary">
                            {visibility === "unlisted"
                              ? s.editor.unlistedDescription
                              : s.editor.publicDescription}{" "}
                            {s.editor.draftNote}
                          </p>
                        </div>
                      </SettingsSection>

                      <SettingsSection title={s.editor.socialProfiles}>
                        <p className="type-metadata leading-relaxed text-copy-secondary">
                          {s.editor.socialProfilesHelp}
                        </p>
                        <div className="space-y-2">
                          {(["instagram", "linkedin", "github"] as const).map(
                            (platform) => {
                              const profileUrl = profileSocials[platform];
                              const checked =
                                selectedSocials.includes(platform);
                              return (
                                <label
                                  className={cn(
                                    "flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] border px-4 py-2.5 transition-colors",
                                    !profileUrl
                                      ? "cursor-not-allowed border-border-subtle bg-surface-muted text-copy-disabled"
                                      : checked
                                        ? "border-brand/60 bg-brand/5"
                                        : "border-border-subtle hover:bg-surface-muted",
                                  )}
                                  key={platform}
                                >
                                  <Checkbox
                                    checked={checked}
                                    disabled={!profileUrl}
                                    onCheckedChange={(value) =>
                                      setSelectedSocials((current) =>
                                        value
                                          ? [...new Set([...current, platform])]
                                          : current.filter(
                                              (item) => item !== platform,
                                            ),
                                      )
                                    }
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="block type-label font-medium capitalize">
                                      {platform}
                                    </span>
                                    <span className="block truncate type-metadata text-copy-secondary">
                                      {profileUrl ||
                                        s.editor.socialProfileMissing}
                                    </span>
                                  </span>
                                </label>
                              );
                            },
                          )}
                        </div>
                      </SettingsSection>

                      <SettingsSection
                        title={`${s.editor.collaborators} (${collaborators.length})`}
                      >
                        <p className="type-metadata leading-relaxed text-copy-secondary">
                          {s.editor.collaboratorsHelp}
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="collaborator-search">
                            {s.editor.collaboratorSearch}
                          </Label>
                          <CollaboratorPicker
                            copy={{
                              search: s.editor.collaboratorSearch,
                              placeholder: s.editor.collaboratorSearchPlaceholder,
                              help: s.editor.collaboratorSearchHelp,
                              searching: s.editor.collaboratorSearching,
                              noResults: s.editor.collaboratorNoResults,
                              addId: s.editor.collaboratorAddId,
                            }}
                            excludeIds={[
                              currentUserId,
                              ...collaborators.map((item) => item.userId),
                            ]}
                            inputId="collaborator-search"
                            onSelect={addCollaborator}
                          />
                        </div>
                        {collaborators.length ? (
                          <div className="space-y-2">
                            {collaborators.map((item) => {
                              const profile = collaboratorProfiles[item.userId];
                              const name = profile
                                ? creatorDisplayName(profile)
                                : s.editor.collaboratorUnknown;
                              return (
                                <div
                                  className="flex flex-col gap-3 rounded-[var(--radius-control)] border border-border-subtle p-3 m3-medium:flex-row m3-medium:items-center"
                                  key={item.userId}
                                >
                                  <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <CreatorAvatar creator={profile} />
                                    <span className="min-w-0">
                                      <span className="block truncate type-label font-semibold">
                                        {name}
                                      </span>
                                      <span className="block truncate type-metadata text-copy-secondary">
                                        {profile?.headline || item.userId}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      aria-label={`${s.editor.role}: ${name}`}
                                      className={cn(
                                        SETTINGS_FIELD_CLASS,
                                        "m3-medium:w-56",
                                      )}
                                      maxLength={255}
                                      onChange={(event) =>
                                        setCollaborators((items) =>
                                          items.map((entry) =>
                                            entry.userId === item.userId
                                              ? { ...entry, role: event.target.value }
                                              : entry,
                                          ),
                                        )
                                      }
                                      placeholder={s.editor.rolePlaceholder}
                                      value={item.role}
                                    />
                                    <button
                                      aria-label={`${s.editor.removeCollaborator}: ${name}`}
                                      className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                                      onClick={() =>
                                        setCollaborators((items) =>
                                          items.filter(
                                            (entry) =>
                                              entry.userId !== item.userId,
                                          ),
                                        )
                                      }
                                      type="button"
                                    >
                                      <X className="size-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </SettingsSection>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
                    onClick={() => setPanel("content")}
                    variant="outline"
                  >
                    {s.editor.cancel}
                  </Button>
                  <Button
                    className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
                    disabled={submitting}
                    onClick={() => void save(false)}
                    variant="outline"
                  >
                    {draftLabel}
                  </Button>
                  <Button
                    className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
                    disabled={submitting}
                    onClick={() => void save(true)}
                  >
                    {publishLabel}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </aside>

        <div className="pointer-events-none fixed inset-0 z-40 m3-laptop:hidden">
            {mobileDockOpen && mobileContentOpen ? (
              <div className="pointer-events-auto fixed inset-x-3 bottom-24 z-40 mx-auto max-w-sm overflow-hidden rounded-[var(--radius-panel)] border border-border-subtle bg-surface-overlay text-copy shadow-[var(--shadow-panel)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none">
                <div className="flex items-center justify-between border-b px-[var(--card-padding)] py-[var(--grid-gap)]">
                  <p className="dashboard-card-title">{s.editor.addContent}</p>
                  <button
                    aria-label={s.editor.closeAddContent}
                    className="flex size-12 items-center justify-center rounded-full hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                    onClick={() => setMobileContentOpen(false)}
                    type="button"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-3">
                  {contentTypes.map(({ kind, label, Icon }) => (
                    <SidebarToolTile
                      icon={<Icon className="size-5" />}
                      key={kind}
                      label={label}
                      onClick={() => {
                        addContent(kind, null);
                        setMobileContentOpen(false);
                        setMobileDockOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            {mobileDockOpen ? (
              <div className="pointer-events-auto fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200 motion-reduce:animate-none">
                <AppleDock
                  className="mt-0 border-border-subtle bg-surface-overlay shadow-[var(--shadow-panel)]"
                  direction="middle"
                  iconDistance={100}
                  iconMagnification={50}
                  iconSize={38}
                >
                  <AppleDockIcon
                    aria-label={s.editor.addContent}
                    className={cn(
                      "bg-surface-muted text-copy",
                      mobileContentOpen && "bg-brand text-on-brand",
                    )}
                    onClick={() => setMobileContentOpen((value) => !value)}
                    role="button"
                    tabIndex={0}
                  >
                    <Plus className="size-5" />
                  </AppleDockIcon>
                  <AppleDockIcon
                    aria-label={s.editor.stylesTitle}
                    className="bg-surface-muted text-copy"
                    onClick={() => {
                      setMobileContentOpen(false);
                      setMobileDockOpen(false);
                      setPanel("styles");
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <Palette className="size-5" />
                  </AppleDockIcon>
                  <AppleDockIcon
                    aria-label={s.editor.settingsTitle}
                    className="bg-surface-muted text-copy"
                    onClick={() => {
                      setMobileContentOpen(false);
                      setMobileDockOpen(false);
                      setPanel("settings");
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <Settings2 className="size-5" />
                  </AppleDockIcon>
                </AppleDock>
              </div>
            ) : null}
          </div>
        </div>

      <footer className="flex h-12 shrink-0 items-center gap-1 border-t border-border-subtle bg-surface-raised px-[var(--dashboard-header-padding)]">
        <LanguageToggle className="!size-10 [&>span]:!size-8" />
        <ModeToggle className="!size-10 [&>button]:!size-10 [&>button>span]:!size-8" />
      </footer>

      {/* Input file di root (bukan di dalam <aside>) karena aside display:none
          di bawah breakpoint laptop, sementara dock mobile juga memicunya —
          .click() pada input di dalam parent tersembunyi tidak andal di
          semua browser. value di-reset supaya file yang sama bisa dipilih lagi. */}
      <input
        accept="image/*"
        className="sr-only"
        multiple
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []), "image");
          event.target.value = "";
        }}
        ref={imageInput}
        tabIndex={-1}
        type="file"
      />
      <input
        accept="image/*"
        className="sr-only"
        multiple
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []), "grid");
          event.target.value = "";
        }}
        ref={gridInput}
        tabIndex={-1}
        type="file"
      />
      <input
        accept="video/*"
        className="sr-only"
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []), "video");
          event.target.value = "";
        }}
        ref={videoInput}
        tabIndex={-1}
        type="file"
      />
      <input
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          addCoverFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        ref={coverInput}
        tabIndex={-1}
        type="file"
      />

      <Dialog
        onOpenChange={(open) => {
          if (!open) setEmbedDialog(null);
        }}
        open={embedDialog !== null}
      >
        <DialogContent className="m3-medium:max-w-md">
          <DialogHeader>
            <DialogTitle>{s.editor.embedTitle}</DialogTitle>
            <DialogDescription>{s.editor.embedDescription}</DialogDescription>
          </DialogHeader>
          {/* noValidate + type="text": validasi bawaan type="url" menolak
              tautan tanpa "https://" secara diam-diam (tombol Embed terlihat
              tidak berfungsi). Validasi & normalisasi dilakukan submitEmbed. */}
          <form
            className="space-y-2"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              submitEmbed();
            }}
          >
            <Label htmlFor="embed-url">{s.editor.embedUrl}</Label>
            <Input
              aria-invalid={embedDialog?.invalid}
              autoCapitalize="none"
              autoComplete="off"
              autoFocus
              className="min-h-12 rounded-[var(--radius-control)] px-4 type-body"
              id="embed-url"
              inputMode="url"
              spellCheck={false}
              onChange={(event) =>
                setEmbedDialog((current) =>
                  current
                    ? { ...current, url: event.target.value, invalid: false }
                    : current,
                )
              }
              placeholder={s.editor.embedPlaceholder}
              type="text"
              value={embedDialog?.url ?? ""}
            />
            {embedDialog?.invalid ? (
              <p className="type-metadata text-danger" role="alert">
                {s.editor.embedInvalid}
              </p>
            ) : null}
            <DialogFooter className="gap-2 pt-2">
              <Button
                className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
                onClick={() => setEmbedDialog(null)}
                type="button"
                variant="outline"
              >
                {s.editor.cancel}
              </Button>
              <Button
                className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
                disabled={!embedDialog?.url.trim()}
                type="submit"
              >
                {s.editor.embedAdd}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {previewProject ? (
        <div
          aria-label={s.editor.preview}
          aria-modal="true"
          className="fixed inset-0 z-[110] flex flex-col bg-canvas"
          role="dialog"
        >
          <div className="flex h-[var(--dashboard-header-height)] shrink-0 items-center justify-between gap-[var(--dashboard-header-action-gap)] border-b border-border-subtle bg-surface-raised px-[var(--dashboard-header-padding)]">
            <p className="dashboard-card-title truncate">
              {previewProject.title}
            </p>
            <Button
              autoFocus
              className="min-h-12 shrink-0 rounded-[var(--radius-control)] px-4 type-label"
              onClick={() => setPreviewOpen(false)}
              variant="outline"
            >
              <ArrowLeft className="size-4" />
              {s.editor.closePreview}
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-[var(--page-gutter)]">
            <div className="mx-auto w-full max-w-[1280px]">
              <ProjectContent project={previewProject} />
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={recoveryDialogOpen} onOpenChange={setRecoveryDialogOpen}>
        <DialogContent className="m3-medium:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{s.editor.recoveryTitle}</DialogTitle>
            <DialogDescription>
              {s.editor.recoveryDescription}
              {recoveryHadPendingMedia ? s.editor.recoveryMedia : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 m3-medium:justify-between">
            <Button
              className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
              onClick={() => {
                sessionStorage.removeItem(CREATE_PROJECT_RECOVERY_KEY);
                sessionStorage.removeItem(CREATE_PROJECT_OPEN_KEY);
                setRecoveryDialogOpen(false);
                setOpen(false);
              }}
              variant="destructive"
            >
              {s.editor.discard}
            </Button>
            <div className="flex flex-col-reverse gap-2 m3-medium:flex-row">
              <Button
                className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
                onClick={() => setRecoveryDialogOpen(false)}
                variant="outline"
              >
                {s.editor.continueEditing}
              </Button>
              <Button
                className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
                disabled={submitting}
                onClick={() => void save(false)}
                variant="outline"
              >
                {submitIntent === "draft"
                  ? s.editor.saving
                  : s.editor.saveDraft}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
