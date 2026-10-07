"use client";

import { useEffect, useState } from "react";
import {
  FolderOpen,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { collectionService, getErrorMessage } from "@/shared/api";
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

const EMPTY_FORM: CollectionFormState = {
  title: "",
  description: "",
  visibility: "private",
  projectIds: [],
};

export function CollectionsPanel({
  projects,
}: {
  projects: CollectionProjectOption[];
}) {
  const copy = useT().dashboardCreator.creatorStudio.collections;
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
        if (active) toast.error(getErrorMessage(error, copy.loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [copy.loadError]);

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
      toast.error(getErrorMessage(error, copy.saveError));
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
      toast.success(copy.deleted);
    } catch (error) {
      toast.error(getErrorMessage(error, copy.deleteError));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-extra-large:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton className="h-52 rounded-[var(--radius-card)]" key={index} />
        ))}
      </div>
    );
  }

  return (
    // Wrapper sama dengan ProjectLibrary/CreatorStudio — w-full min-w-0
    // overflow-x-clip. pb-[var(--dashboard-content-padding)] SENGAJA tidak
    // ditambahkan: <main> di DashboardLayout sudah menerapkannya ke semua
    // halaman dashboard, jadi menambahkannya lagi di sini jadi padding dobel.
    <div className="flex w-full min-w-0 flex-col gap-[var(--grid-gap)] overflow-x-clip">
      {/* Collection Header */}
      <div className="flex flex-col gap-[var(--grid-gap)] m3-medium:flex-row m3-medium:items-center m3-medium:justify-between">
        <div>
          <h3 className="m3-title-large font-medium text-heading">
            {copy.title}
          </h3>
          <p className="mt-1 type-label text-copy-secondary">
            {copy.description}
          </p>
        </div>
        <Button className="self-start" onClick={openCreateDialog}>
          <Plus aria-hidden="true" className="size-4" />
          {copy.create}
        </Button>
      </div>

      {/* Collection List */}
      {collections.length ? (
        <div className="grid grid-cols-1 gap-[var(--grid-gap)] m3-medium:grid-cols-2 m3-extra-large:grid-cols-3">
          {collections.map((collection) => {
            const selectedProjects = projects.filter((project) =>
              collection.projectIds.includes(project.id),
            );
            const VisibilityIcon =
              collection.visibility === "public" ? Globe2 : LockKeyhole;

            return (
              <article
                className="min-w-0 overflow-hidden rounded-[var(--radius-card)] bg-surface-container-low"
                key={collection.id}
              >
                <div
                  className={cn(
                    "grid h-28 gap-px bg-border-subtle",
                    selectedProjects.length === 1 && "grid-cols-1",
                    selectedProjects.length === 2 && "grid-cols-2",
                    selectedProjects.length !== 1 &&
                      selectedProjects.length !== 2 &&
                      "grid-cols-3",
                  )}
                >
                  {selectedProjects
                    .slice(0, 3)
                    .map((project) =>
                      project.cover ? (
                        <img
                          alt=""
                          className="size-full object-cover"
                          key={project.id}
                          src={project.cover}
                        />
                      ) : (
                        <div
                          aria-label={`${project.title} placeholder`}
                          className="size-full bg-surface-container-high"
                          key={project.id}
                          role="img"
                        />
                      ),
                    )}
                  {!selectedProjects.length ? (
                    <div className="col-span-3 flex items-center justify-center bg-surface-muted text-copy-muted">
                      <FolderOpen aria-hidden="true" className="size-8" />
                    </div>
                  ) : null}
                </div>
                <div className="space-y-[var(--grid-gap)] p-[var(--card-padding)]">
                  <div>
                    <div className="flex min-w-0 items-start justify-between gap-[var(--grid-gap)]">
                      <h4 className="m3-title-medium line-clamp-1 text-heading">
                        {collection.title}
                      </h4>
                      <span className="flex shrink-0 items-center gap-1 type-metadata text-copy-muted">
                        <VisibilityIcon
                          aria-hidden="true"
                          className="size-3.5"
                        />
                        {
                          copy.visibility[
                            collection.visibility === "public"
                              ? "public"
                              : "private"
                          ]
                        }
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 min-h-10 type-label text-copy-secondary">
                      {collection.description || copy.noDescription}
                    </p>
                    <p className="mt-2 type-metadata text-copy-muted">
                      {copy.projectCount.replace(
                        "{count}",
                        String(collection.projectIds.length),
                      )}
                    </p>
                  </div>
                  <div className="flex gap-[var(--grid-gap)] border-t border-border-subtle pt-[var(--grid-gap)]">
                    <Button
                      className="flex-1"
                      onClick={() => openEditDialog(collection)}
                      size="sm"
                      variant="outline"
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                      {copy.edit}
                    </Button>
                    <Button
                      aria-label={copy.delete}
                      onClick={() => setPendingDelete(collection)}
                      size="icon-sm"
                      variant="outline"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border-strong p-[var(--card-padding)] text-center">
          <FolderOpen
            aria-hidden="true"
            className="mb-4 size-9 text-copy-muted"
          />
          <h4 className="m3-title-medium text-heading">{copy.emptyTitle}</h4>
          <p className="mt-1 max-w-md type-label text-copy-secondary">
            {copy.emptyDescription}
          </p>
        </div>
      )}

      {/* Collection Editor */}
      <Dialog
        open={editorOpen}
        onOpenChange={(open) => !saving && setEditorOpen(open)}
      >
        <DialogContent className="m3-medium:max-w-xl">
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
                id="collection-title"
                maxLength={100}
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
                id="collection-description"
                maxLength={500}
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
              <Label>{copy.visibilityLabel}</Label>
              <Select
                onValueChange={(value: CollectionInput["visibility"] | null) => {
                  if (value) setForm((current) => ({ ...current, visibility: value }));
                }}
                value={form.visibility}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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
          <DialogFooter>
            <Button
              disabled={saving}
              onClick={() => setEditorOpen(false)}
              variant="outline"
            >
              {copy.cancel}
            </Button>
            <Button
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && !deleting && setPendingDelete(null)}
      >
        <DialogContent className="m3-medium:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{copy.deleteTitle}</DialogTitle>
            <DialogDescription>
              {copy.deleteDescription.replace(
                "{title}",
                pendingDelete?.title ?? "",
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              disabled={deleting}
              onClick={() => setPendingDelete(null)}
              variant="outline"
            >
              {copy.cancel}
            </Button>
            <Button
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
