"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FolderOpen,
  Globe2,
  LayoutGrid,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Trash2,
} from "lucide-react";
import { ArrowUpRight } from "@phosphor-icons/react";
import { toast } from "sonner";

import { collectionService } from "@/shared/api";
import { creatorStudioErrorMessage } from "./api-errors";
import { DashboardBanner } from "@/shared/layout/dashboard/dashboard-banner";
import { collectionInputSchema } from "@/features/dashboard-creator/schemas";
import type {
  Collection,
  CollectionInput,
} from "@/shared/lib/types/collection";
import { useT } from "@/shared/providers/language-provider";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  CutoutCard,
  CutoutCardAction,
  CutoutCardContent,
  CutoutCardFooter,
  CutoutCardImage,
  CutoutCardInsetLabel,
  CutoutCardMedia,
  CutoutCardOverlay,
  CutoutCardPin,
  CutoutCorner,
  cutoutCardSurfaceClassName,
} from "@/shared/ui/cutout-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";

export interface CollectionProjectOption {
  id: string;
  title: string;
  cover: string;
}

interface CollectionFormState {
  title: string;
  description: string;
  visibility: CollectionInput["visibility"];
  projectIds: string[];
}

// Ukuran kontrol sama dengan editor Creator Studio (tombol & field 48px).
const ACTION_BUTTON_CLASS =
  "min-h-12 rounded-[var(--radius-control)] px-4 type-label";
const FIELD_CLASS = "min-h-12 rounded-[var(--radius-control)] px-4 type-body";
// Grid kartu identik dengan halaman Projects.
const CARD_GRID_CLASS =
  "grid grid-cols-1 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-extra-large:grid-cols-3";

const EMPTY_FORM: CollectionFormState = {
  title: "",
  description: "",
  visibility: "private",
  projectIds: [],
};

// Tab mengikuti enum CollectionVisibility di project.proto, sejajar dengan
// tab status di halaman Projects.
type CollectionFilter = "all" | "public" | "private";

// Sampul koleksi: kolase sampai 3 sampul proyek (1 besar + 2 kecil), mengisi
// area media 4:3 yang sama dengan kartu proyek.
function CollectionMosaic({
  covers,
  title,
}: {
  covers: CollectionProjectOption[];
  title: string;
}) {
  const tiles = covers.slice(0, 3);
  if (!tiles.length) {
    return (
      <div
        aria-label={`${title} cover placeholder`}
        className="flex h-full w-full items-center justify-center bg-surface-container-high text-copy-muted"
        role="img"
      >
        <FolderOpen aria-hidden="true" className="size-9" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid h-full w-full gap-0.5 bg-surface-container",
        tiles.length === 2 && "grid-cols-2",
        tiles.length === 3 && "grid-cols-[2fr_1fr] grid-rows-2",
      )}
    >
      {tiles.map((project, index) => (
        <div
          className={cn(
            "relative overflow-hidden",
            tiles.length === 3 && index === 0 && "row-span-2",
          )}
          key={project.id}
        >
          {project.cover ? (
            <CutoutCardImage
              alt={`${project.title} cover`}
              sizes="(max-width: 768px) 100vw, 28rem"
              src={project.cover}
            />
          ) : (
            <div className="h-full w-full bg-surface-container-high" />
          )}
        </div>
      ))}
    </div>
  );
}

// Kartu koleksi — struktur & kelas sama dengan ProjectCard di halaman
// Projects: media 4:3, label sudut kiri bawah, pin panah kanan atas, judul,
// baris kedua, dan footer metrik.
function CollectionCard({
  collection,
  countLabel,
  covers,
  description,
  onOpen,
  visibilityLabel,
}: {
  collection: Collection;
  countLabel: string;
  covers: CollectionProjectOption[];
  description: string;
  onOpen: (collection: Collection) => void;
  visibilityLabel: string;
}) {
  const VisibilityIcon =
    collection.visibility === "public" ? Globe2 : LockKeyhole;
  return (
    <button
      className="block h-full w-full rounded-[var(--radius-feature)] text-left outline-none focus-visible:ring-3 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      onClick={() => onOpen(collection)}
      type="button"
    >
      <CutoutCard
        className={cn("group flex h-full flex-col", cutoutCardSurfaceClassName)}
      >
        <CutoutCardMedia className="aspect-[4/3]">
          <CollectionMosaic covers={covers} title={collection.title} />
          <CutoutCardOverlay />
          <CutoutCardInsetLabel className="bottom-0 left-0 rounded-tr-[20px] bg-surface-container px-4 py-2">
            <span className="flex items-center gap-1.5 m3-label-small uppercase text-copy-muted">
              <VisibilityIcon aria-hidden="true" className="size-3.5" />
              {visibilityLabel}
            </span>
            <CutoutCorner className="absolute -right-[31px] -bottom-px rotate-90 text-surface-container" />
            <CutoutCorner className="absolute -top-[31px] -left-px rotate-90 text-surface-container" />
          </CutoutCardInsetLabel>

          <CutoutCardPin className="top-0 right-0 rounded-bl-[20px] bg-surface-container p-1.5">
            <CutoutCardAction
              className="relative static transform-none opacity-100"
              revealOnHover={false}
            >
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full bg-action-ink text-on-dark shadow-[var(--shadow-control)]"
              >
                <ArrowUpRight
                  className="icon-motion-arrow-up-right size-4"
                  weight="bold"
                />
              </span>
            </CutoutCardAction>
            <CutoutCorner
              className="absolute top-0 -left-[31px] -rotate-90 text-surface-container"
              size={32}
            />
            <CutoutCorner
              className="absolute right-0 -bottom-[31px] -rotate-90 text-surface-container"
              size={32}
            />
          </CutoutCardPin>
        </CutoutCardMedia>

        <CutoutCardContent className="flex flex-1 flex-col p-[var(--card-padding)]">
          <h4 className="mb-1 line-clamp-1 type-card-title font-medium leading-snug text-copy">
            {collection.title}
          </h4>
          <p className="line-clamp-1 type-label text-copy-secondary">
            {description}
          </p>
          <CutoutCardFooter className="mt-auto border-t border-border-subtle/80 pt-[var(--grid-gap)]">
            <div className="flex items-center gap-3 type-metadata text-copy-muted">
              <span className="flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4" /> {countLabel}
              </span>
            </div>
          </CutoutCardFooter>
        </CutoutCardContent>
      </CutoutCard>
    </button>
  );
}

export function CollectionsPanel({
  projects,
}: {
  projects: CollectionProjectOption[];
}) {
  const studio = useT().dashboardCreator.creatorStudio;
  const copy = studio.collections;
  const errors = studio.errors;
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<Collection | null>(null);
  const [form, setForm] = useState<CollectionFormState>(EMPTY_FORM);

  // Memuat semua koleksi milik creator saat tab pertama kali dibuka
  useEffect(() => {
    let active = true;

    void collectionService
      .list()
      .then((items) => {
        if (active) setCollections(items);
      })
      .catch((error) => {
        if (active)
          toast.error(creatorStudioErrorMessage(error, errors, copy.loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [copy.loadError, errors]);

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  // Mengelompokkan koleksi berdasarkan tab visibility
  const collectionGroups = useMemo(
    () => ({
      all: collections,
      public: collections.filter((item) => item.visibility === "public"),
      private: collections.filter((item) => item.visibility !== "public"),
    }),
    [collections],
  );

  // Membuka form kosong untuk membuat koleksi baru
  const openCreateDialog = () => {
    setEditingCollection(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  // Mengisi form dengan data koleksi yang akan diedit
  const openEditDialog = (collection: Collection) => {
    setEditingCollection(collection);
    setForm({
      title: collection.title,
      description: collection.description,
      visibility: collection.visibility === "public" ? "public" : "private",
      projectIds: collection.projectIds,
    });
    setEditorOpen(true);
  };

  // Menambah atau menghapus project dari pilihan koleksi
  const toggleProject = (projectId: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      projectIds: checked
        ? Array.from(new Set([...current.projectIds, projectId]))
        : current.projectIds.filter((id) => id !== projectId),
    }));
  };

  // Menyimpan koleksi melalui endpoint create atau update sesuai mode form
  const saveCollection = async () => {
    const title = form.title.trim();
    if (!title || saving) return;

    const validation = collectionInputSchema.safeParse({
      title,
      description: form.description.trim(),
      visibility: form.visibility,
      projectIds: form.projectIds,
    });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? copy.saveError);
      return;
    }

    setSaving(true);
    try {
      const input: CollectionInput = validation.data;
      const saved = editingCollection
        ? await collectionService.update(editingCollection.id, input)
        : await collectionService.create(input);

      setCollections((items) => {
        const exists = items.some((item) => item.id === saved.id);
        return exists
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...items];
      });
      setEditorOpen(false);
      toast.success(editingCollection ? copy.updated : copy.created);
    } catch (error) {
      toast.error(creatorStudioErrorMessage(error, errors, copy.saveError));
    } finally {
      setSaving(false);
    }
  };

  // Menghapus koleksi setelah creator menyetujui dialog konfirmasi
  const deleteCollection = async () => {
    if (!pendingDelete || deleting) return;

    setDeleting(true);
    try {
      await collectionService.delete(pendingDelete.id);
      setCollections((items) =>
        items.filter((item) => item.id !== pendingDelete.id),
      );
      setPendingDelete(null);
      setEditorOpen(false);
      toast.success(copy.deleted);
    } catch (error) {
      toast.error(creatorStudioErrorMessage(error, errors, copy.deleteError));
    } finally {
      setDeleting(false);
    }
  };

  // Isi grid untuk loading, empty state, atau daftar koleksi — sama dengan
  // projectGrid di halaman Projects.
  const collectionGrid = (items: Collection[]) => {
    if (loading) {
      return Array.from({ length: 3 }, (_, index) => (
        <div
          aria-hidden="true"
          className="overflow-hidden rounded-[var(--radius-feature)] bg-surface-container-low"
          key={index}
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-4 p-[var(--card-padding)]">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        </div>
      ));
    }
    if (!items.length) {
      return (
        <div className="col-span-full rounded-[var(--radius-control)] border border-dashed p-[var(--card-padding)] text-center text-copy-secondary">
          {collections.length ? copy.emptySection : copy.emptyDescription}
        </div>
      );
    }
    return items.map((collection) => (
      <CollectionCard
        collection={collection}
        countLabel={
          collection.projectIds.length === 1
            ? copy.projectCountOne
            : copy.projectCount.replace(
                "{count}",
                String(collection.projectIds.length),
              )
        }
        covers={collection.projectIds.flatMap((id) => {
          const project = projectsById.get(id);
          return project ? [project] : [];
        })}
        description={collection.description || copy.noDescription}
        key={collection.id}
        onOpen={openEditDialog}
        visibilityLabel={
          copy.visibility[
            collection.visibility === "public" ? "public" : "private"
          ]
        }
      />
    ));
  };

  return (
    // Wrapper sama dengan ProjectLibrary/CreatorStudio — w-full min-w-0
    // overflow-x-clip. pb-[var(--dashboard-content-padding)] SENGAJA tidak
    // ditambahkan: <main> di DashboardLayout sudah menerapkannya ke semua
    // halaman dashboard, jadi menambahkannya lagi di sini jadi padding dobel.
    <div className="@container/creator-studio flex w-full min-w-0 flex-col gap-[var(--grid-gap)] overflow-x-clip">
      <DashboardBanner subtitle={copy.description} title={copy.title} />

      {/* Toolbar identik dengan halaman Projects: TabsList h-12 + tombol
          buat h-12 dalam satu baris (lihat komentar di creator-studio/index). */}
      <Tabs defaultValue="all" className="w-full gap-[var(--grid-gap)]">
        <div className="flex flex-col gap-[var(--grid-gap)] m3-medium:flex-row m3-medium:items-center m3-medium:justify-between">
          <TabsList className="h-12! max-w-full overflow-x-auto overflow-y-hidden">
            <TabsTrigger value="all">{studio.tabs.all}</TabsTrigger>
            <TabsTrigger value="public">{copy.visibility.public}</TabsTrigger>
            <TabsTrigger value="private">{copy.visibility.private}</TabsTrigger>
          </TabsList>
          <Button className="h-12 gap-2" onClick={openCreateDialog}>
            <Plus aria-hidden="true" className="size-4" />
            {copy.create}
          </Button>
        </div>
        {(["all", "public", "private"] as CollectionFilter[]).map((filter) => (
          <TabsContent className="mt-0 outline-none" key={filter} value={filter}>
            <div className={CARD_GRID_CLASS}>
              {collectionGrid(collectionGroups[filter])}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Collection Editor */}
      <Dialog
        open={editorOpen}
        onOpenChange={(open) => !saving && setEditorOpen(open)}
      >
        {/* sm:!max-w — sm:max-w-md bawaan DialogContent mengalahkan
            breakpoint m3-medium, jadi lebar harus dipaksa. */}
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:!max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingCollection ? copy.editTitle : copy.createTitle}
            </DialogTitle>
            <DialogDescription>{copy.formDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-[var(--grid-gap)]">
            <div className="space-y-2">
              <Label htmlFor="collection-title">{copy.name}</Label>
              <Input
                className={FIELD_CLASS}
                id="collection-title"
                maxLength={120}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder={copy.namePlaceholder}
                value={form.title}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-description">
                {copy.fieldDescription}
              </Label>
              <Textarea
                className="min-h-24 rounded-[var(--radius-control)] px-4 py-3 type-body"
                id="collection-description"
                maxLength={2000}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder={copy.descriptionPlaceholder}
                value={form.description}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-visibility">
                {copy.visibilityLabel}
              </Label>
              <Select
                onValueChange={(value: CollectionInput["visibility"] | null) => {
                  if (value) setForm((current) => ({ ...current, visibility: value }));
                }}
                value={form.visibility}
              >
                <SelectTrigger
                  className={cn(FIELD_CLASS, "w-full")}
                  id="collection-visibility"
                >
                  {/* SelectValue base-ui menampilkan value mentah ("private")
                      tanpa children function. */}
                  <SelectValue>
                    {(value: CollectionInput["visibility"]) =>
                      copy.visibility[value === "public" ? "public" : "private"]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    {copy.visibility.private}
                  </SelectItem>
                  <SelectItem value="public">
                    {copy.visibility.public}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <fieldset className="space-y-2">
              <legend className="type-label font-medium text-heading">
                {copy.projects}
              </legend>
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-[var(--radius-control)] border border-border-subtle p-2">
                {projects.length ? (
                  projects.map((project) => {
                    const checked = form.projectIds.includes(project.id);
                    return (
                      <label
                        className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-control)] p-2 hover:bg-surface-muted"
                        key={project.id}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            toggleProject(project.id, value === true)
                          }
                        />
                        {project.cover ? (
                          <img
                            alt=""
                            className="size-10 rounded-[var(--radius-control)] object-cover"
                            src={project.cover}
                          />
                        ) : (
                          <span
                            aria-label={`${project.title} placeholder`}
                            className="size-10 shrink-0 rounded-[var(--radius-control)] bg-surface-container-high"
                            role="img"
                          />
                        )}
                        <span className="line-clamp-1 type-label text-copy">
                          {project.title}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <p className="p-3 type-label text-copy-muted">
                    {copy.noProjects}
                  </p>
                )}
              </div>
            </fieldset>
          </div>
          {/* Hapus ada di dialog ini (bukan di kartu), sama seperti proyek
              yang aksi hapusnya ada di tampilan detail. */}
          <DialogFooter className="m3-medium:justify-between">
            {editingCollection ? (
              <Button
                className={ACTION_BUTTON_CLASS}
                disabled={saving}
                onClick={() => setPendingDelete(editingCollection)}
                variant="destructive"
              >
                <Trash2 aria-hidden="true" className="size-4" />
                {copy.delete}
              </Button>
            ) : (
              <span className="hidden m3-medium:block" />
            )}
            <div className="flex flex-col-reverse gap-2 m3-medium:flex-row">
              <Button
                className={ACTION_BUTTON_CLASS}
                disabled={saving}
                onClick={() => setEditorOpen(false)}
                variant="outline"
              >
                {copy.cancel}
              </Button>
              <Button
                className={ACTION_BUTTON_CLASS}
                disabled={saving || !form.title.trim()}
                onClick={() => void saveCollection()}
              >
                {saving ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : null}
                {saving ? copy.saving : copy.save}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation — sama dengan dialog hapus proyek */}
      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}
      >
        <DialogContent
          aria-describedby="delete-collection-description"
          className="max-w-md"
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="flex size-12 items-center justify-center rounded-full border border-danger/20 bg-danger/10 text-danger">
              <Trash2 aria-hidden="true" className="size-5" />
            </div>
            <DialogTitle>{copy.deleteTitle}</DialogTitle>
            <DialogDescription id="delete-collection-description">
              {copy.deleteDescription.replace(
                "{title}",
                pendingDelete?.title ?? "",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="m-0 rounded-none border-0 bg-transparent p-0">
            <Button
              className={ACTION_BUTTON_CLASS}
              disabled={deleting}
              onClick={() => setPendingDelete(null)}
              variant="outline"
            >
              {copy.cancel}
            </Button>
            <Button
              className={ACTION_BUTTON_CLASS}
              disabled={deleting}
              onClick={() => void deleteCollection()}
              variant="destructive"
            >
              {deleting ? copy.deleting : copy.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
