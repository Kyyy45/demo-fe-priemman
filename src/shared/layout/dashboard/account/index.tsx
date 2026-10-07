"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Skeleton } from "@/shared/ui/skeleton";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  DeleteIcon,
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  PlusIcon,
  UploadIcon,
} from "@/shared/ui/icons";
import { useT } from "@/shared/providers/language-provider";
import { mediaService, userService } from "@/shared/api";
import type { UploadedMedia } from "@/shared/lib/types/media";
import type {
  CurrentUser,
  UpdateBasicInfoInput,
  UpsertWorkExperienceInput,
  WorkExperience,
} from "@/shared/lib/types/user";
import { getAvatarFallbackUrl } from "@/shared/lib/avatar";
import { SOCIAL_ACCOUNTS_AVAILABLE } from "@/shared/lib/features";
import {
  profileUpdateSchema,
  workExperienceSchema,
} from "@/shared/lib/schemas/account";

// 1. Batas ukuran avatar untuk mencegah upload yang tidak sesuai kebijakan UI.
const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

// Website boleh diketik tanpa skema ("rizky.dev"); disimpan sebagai https.
function normalizeWebsiteUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
}

type ExperienceForm = {
  localId: string;
  id: string;
  title: string;
  company: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  description: string;
};

type ProfileForm = {
  email: string;
  firstName: string;
  lastName: string;
  headline: string;
  company: string;
  country: string;
  city: string;
  websiteUrl: string;
  avatarUrl: string;
  instagram: string;
  linkedin: string;
  github: string;
  aboutTitle: string;
  aboutDescription: string;
};

// 2. Membuat nama lengkap user untuk heading dan fallback avatar.
function displayName(user?: CurrentUser) {
  return user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
    : "Priemman";
}

// 3. Membuat dua huruf inisial saat backend belum menyediakan avatar.
function initialsFor(user?: CurrentUser) {
  const source = displayName(user);
  const words = source.split(/[\s@._-]+/).filter(Boolean);

  return (words[0]?.[0] ?? "P").concat(words[1]?.[0] ?? "R").toUpperCase();
}

// 4. Mengubah ISO timestamp backend menjadi format `YYYY-MM` untuk input month.
function formatMonth(value: string) {
  if (!value) return "";

  return value.slice(0, 7);
}

// 5. Mengambil URL social account dari data `GET /v1/users/me`.
function accountUrl(
  user: CurrentUser | undefined,
  platform: "instagram" | "linkedin" | "github",
) {
  const account = user?.connectedAccounts.find(
    (item) => item.platform === platform,
  );

  return account?.handleOrUrl ?? "";
}

// 6. Mengubah respons User menjadi state form yang dapat diedit tanpa memutasi API state.
function toProfileForm(user?: CurrentUser): ProfileForm {
  return {
    email: user?.email ?? "",
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    headline: user?.headline ?? "",
    company: user?.company ?? "",
    country: user?.location.country ?? "",
    city: user?.location.city ?? "",
    websiteUrl: user?.websiteUrl ?? "",
    avatarUrl: user?.avatarUrl ?? "",
    instagram: accountUrl(user, "instagram"),
    linkedin: accountUrl(user, "linkedin"),
    github: accountUrl(user, "github"),
    aboutTitle: user?.aboutMe.title || "About Me",
    aboutDescription: user?.aboutMe.description ?? "",
  };
}

// 7. Membuat experience sementara; ID kosong akan dianggap entry baru oleh backend.
function emptyExperienceForm(): ExperienceForm {
  return {
    localId: crypto.randomUUID(),
    id: "",
    title: "",
    company: "",
    isCurrent: false,
    startDate: "",
    endDate: "",
    description: "",
  };
}

// 8. Mengubah respons WorkExperience menjadi format form yang memakai localId stabil.
function toExperienceForm(experience: WorkExperience): ExperienceForm {
  return {
    localId: experience.id || crypto.randomUUID(),
    id: experience.id,
    title: experience.title,
    company: experience.company,
    isCurrent: experience.isCurrent,
    startDate: formatMonth(experience.startDate),
    endDate: formatMonth(experience.endDate),
    description: experience.description,
  };
}

// 9. Menyiapkan daftar form dan menyisakan satu entry kosong untuk first-time user.
function toExperienceForms(user?: CurrentUser): ExperienceForm[] {
  if (!user?.workExperience.length) {
    return [emptyExperienceForm()];
  }

  return user.workExperience.map(toExperienceForm);
}

// 10. Mempertahankan country dari backend walau belum ada di daftar pilihan statis.
function countryOptions(user?: CurrentUser) {
  const options = ["Indonesia", "Singapore", "United States"];
  const country = user?.location.country;

  return country && !options.includes(country)
    ? [country, ...options]
    : options;
}

export function AccountSettings({
  user,
  onUserUpdate,
}: {
  user?: CurrentUser;
  onUserUpdate?: (user: CurrentUser) => void;
}) {
  return (
    <AccountSettingsForm
      key={user?.id ?? "empty-user"}
      user={user}
      onUserUpdate={onUserUpdate}
    />
  );
}

function AccountSettingsForm({
  user,
  onUserUpdate,
}: {
  user?: CurrentUser;
  onUserUpdate?: (user: CurrentUser) => void;
}) {
  // 11. Mengambil copy halaman sesuai bahasa aktif; seluruh label UI berasal dari provider.
  const t = useT();
  const s = t.dashboardCreator.accountSettings;
  const accountName = displayName(user);
  const fallbackAvatar = getAvatarFallbackUrl(accountName);

  // 12. Menyimpan state profile, experience, dan status request tanpa mengubah data API awal.
  const [profile, setProfile] = useState<ProfileForm>(() =>
    toProfileForm(user),
  );
  const [experiences, setExperiences] = useState<ExperienceForm[]>(() =>
    toExperienceForms(user),
  );
  const [deletedExperienceIds, setDeletedExperienceIds] = useState<string[]>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  // 13. Referensi input file dipakai tombol UI untuk membuka pemilih avatar native.
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 14. Memuat resource experience terpisah agar Account Settings selalu memakai data terbaru.
  useEffect(() => {
    let active = true;

    // Preview design memakai user lokal dan tidak memiliki session backend;
    // jangan memanggil endpoint terproteksi hanya untuk mengisi form preview.
    if (
      !user ||
      user.id === "development-preview" ||
      user.id === "local-preview-user"
    ) {
      setExperiences(toExperienceForms(user));
      setLoadingExperiences(false);
      return () => {
        active = false;
      };
    }

    // 15. Fallback ke data profil bila endpoint experience gagal, tanpa membuat halaman rusak.
    async function loadAccountDetails() {
      setLoadingExperiences(true);
      try {
        const experienceResult = await userService
          .listWorkExperiences()
          .then((value) => ({ status: "fulfilled" as const, value }))
          .catch(() => ({ status: "rejected" as const }));

        if (!active) return;

        if (experienceResult.status === "fulfilled") {
          const entries = experienceResult.value;
          setExperiences(
            entries.length
              ? entries.map(toExperienceForm)
              : [emptyExperienceForm()],
          );
          setDeletedExperienceIds([]);
        } else {
          setExperiences(toExperienceForms(user));
        }
      } catch {
        if (active) setExperiences(toExperienceForms(user));
      } finally {
        if (active) setLoadingExperiences(false);
      }
    }

    loadAccountDetails();

    return () => {
      active = false;
    };
  }, [user]);

  // 16. Melepas object URL preview agar memori browser tidak bocor.
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  // 17. Mengubah satu field profile tanpa menimpa field form lain.
  const updateProfile = (field: keyof ProfileForm, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  // 18. Menambahkan entry experience lokal; backend baru dipanggil saat Save.
  const addExperience = () => {
    setExperiences([...experiences, emptyExperienceForm()]);
  };

  // 19. Mengubah field entry experience berdasarkan localId, bukan index yang dapat berubah.
  const updateExperience = (
    localId: string,
    field: keyof Omit<ExperienceForm, "localId" | "id">,
    value: string | boolean,
  ) => {
    setExperiences((current) =>
      current.map((experience) =>
        experience.localId === localId
          ? { ...experience, [field]: value }
          : experience,
      ),
    );
  };

  // 20. Menandai entry server untuk delete; request dilakukan bersama aksi Save.
  const removeExperience = (experience: ExperienceForm) => {
    if (experience.id) {
      setDeletedExperienceIds((current) =>
        current.includes(experience.id) ? current : [...current, experience.id],
      );
    }

    setExperiences((current) => {
      const next = current.filter(
        (item) => item.localId !== experience.localId,
      );
      return next.length ? next : [emptyExperienceForm()];
    });
  };

  // 21. Memvalidasi MIME/ukuran avatar sebelum membuat preview lokal.
  const handleAvatarFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(s.alerts.errorTitle, {
        description: s.alerts.profileImageRequired,
      });
      event.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.warning(s.alerts.errorTitle, {
        description: s.alerts.profileImageTooLarge,
      });
      event.target.value = "";
      return;
    }

    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  // 22. Membatalkan avatar baru tanpa menghapus avatar yang sudah tersimpan di backend.
  const handleRemoveAvatar = () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarPreviewUrl(null);
    setSelectedAvatarFile(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  // 23. Discard memulihkan state dari User terakhir dan membatalkan semua perubahan lokal.
  const handleDiscardChanges = () => {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setProfile(toProfileForm(user));
    setExperiences(toExperienceForms(user));
    setDeletedExperienceIds([]);
    setSelectedAvatarFile(null);
    setAvatarPreviewUrl(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  // 24. Save mengoordinasikan endpoint profil, media, experience, dan social account.
  const handleApplyChanges = async () => {
    if (saving) return;

    const profileValidation = profileUpdateSchema.safeParse({
      firstName: profile.firstName,
      lastName: profile.lastName,
      headline: profile.headline,
      company: profile.company,
      websiteUrl: normalizeWebsiteUrl(profile.websiteUrl),
      location: { country: profile.country, city: profile.city },
      aboutMe: {
        title: profile.aboutTitle,
        description: profile.aboutDescription,
      },
    });
    if (!profileValidation.success) {
      const issue = profileValidation.error.issues[0];
      toast.error(
        issue?.path[0] === "websiteUrl"
          ? s.alerts.invalidWebsite
          : (issue?.message ?? s.alerts.applyFailed),
      );
      return;
    }

    // 24.1. Menghapus form experience kosong sebelum membuat payload endpoint terpisah.
    const workExperiencePayload: UpsertWorkExperienceInput[] = experiences
      .filter(
        (experience) =>
          experience.title.trim() ||
          experience.company.trim() ||
          experience.startDate,
      )
      .map((experience) => ({
        id: experience.id,
        title: experience.title.trim(),
        company: experience.company.trim(),
        isCurrent: experience.isCurrent,
        startDate: experience.startDate,
        endDate: experience.endDate,
        description: experience.description.trim(),
      }));

    // 24.2. Validasi setiap pengalaman kerja sebelum request apa pun dikirim.
    const invalidExperience = workExperiencePayload
      .map((experience) => workExperienceSchema.safeParse(experience))
      .find((result) => !result.success);
    if (invalidExperience && !invalidExperience.success) {
      toast.error(
        invalidExperience.error.issues[0]?.message ?? s.alerts.applyFailed,
      );
      return;
    }

    // 25. Akun sosial belum didukung backend (tidak ada route
    //     /v1/users/me/connected-accounts dan field-nya tidak ada di User proto),
    //     jadi tidak ikut dikirim. Lihat SOCIAL_ACCOUNTS_AVAILABLE.
    setSaving(true);
    const toastId = toast.info(s.alerts.saving);

    try {
      // 26. Upload avatar harus selesai sebelum PATCH profil mengirim message Media.
      let avatarReplaceMedia: UploadedMedia | undefined;
      if (selectedAvatarFile) {
        const uploaded = await mediaService.upload(selectedAvatarFile);
        const uploadedAvatar = uploaded[0];
        if (!uploadedAvatar?.url || !uploadedAvatar.publicId) {
          throw new Error(s.alerts.uploadIncomplete);
        }
        avatarReplaceMedia = uploadedAvatar;
      }

      // 27. Payload profil hanya memakai hasil schema Zod, bukan input mentah dari DOM.
      const input: UpdateBasicInfoInput = {
        ...profileValidation.data,
        avatarReplaceMedia,
      };

      await userService.updateMe(input);
      await Promise.all([
        ...deletedExperienceIds.map((id) =>
          userService.deleteWorkExperience(id),
        ),
        ...workExperiencePayload.map((experience) =>
          userService.upsertWorkExperience(experience),
        ),
      ]);

      // 28. Refetch profil menyatukan respons endpoint terpisah menjadi satu state kanonis.
      const refreshedUser = await userService.getMe();
      setProfile(toProfileForm(refreshedUser));
      setExperiences(toExperienceForms(refreshedUser));
      setDeletedExperienceIds([]);
      setSelectedAvatarFile(null);
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
        setAvatarPreviewUrl(null);
      }
      onUserUpdate?.(refreshedUser);
      toast.success(s.alerts.successTitle, {
        id: toastId,
        description: s.alerts.changesApplied,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : s.alerts.applyFailed;
      toast.error(s.alerts.errorTitle, {
        id: toastId,
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  // 29. Style field bersama menjaga ukuran control dashboard tetap konsisten.
  const fieldClassName = "min-h-12 px-4 type-body";

  // 30. Satu jenis surface dipakai seluruh endpoint Account agar form tetap
  //     terasa sebagai satu workspace, bukan kumpulan panel acak.
  const sectionClassName =
    "min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface-container-low text-copy";

  return (
    // pb-[var(--dashboard-section-gap)] TIDAK ditambahkan di sini — <main> di
    // DashboardLayout sudah menerapkan pb-[var(--dashboard-content-padding)]
    // ke semua halaman dashboard. Menambahkan padding bawah lagi di sini
    // (apalagi dengan token berbeda) membuat Account dapat jarak bawah yang
    // tidak konsisten dibanding halaman lain.
    <div className="dashboard-account-content @container/account flex w-full min-w-0 flex-col gap-[var(--dashboard-section-gap)] overflow-x-clip">
      {/* 31. Header Account adalah orientasi workspace, bukan card kosong di atas form. */}
      <header className="relative flex min-h-40 items-end overflow-hidden rounded-[var(--radius-card)] border border-brand/25 p-6 text-on-brand m3-medium:min-h-48">
        <Image alt="" className="object-cover" fill priority sizes="(max-width: 768px) 100vw, 1440px" src="/banner_card.png" />
        <div className="absolute inset-0 bg-heading/30 dark:bg-transparent" />
        <div className="relative max-w-2xl">
          <p className="dashboard-table-label !text-on-brand/70">{s.title}</p>
          <h2 className="dashboard-page-title mt-2 !text-on-brand">
            {s.basicInfo.title}
          </h2>
          <p className="dashboard-body mt-3 !text-on-brand/75">{s.subtitle}</p>
        </div>
      </header>

      {/* 32. UI `GET/PATCH /v1/users/me`: informasi profil dasar dan avatar. */}
      <section
        aria-labelledby="core-information-title"
        className={sectionClassName}
      >
        <div className="border-b border-border-subtle/60 bg-surface-container px-[var(--card-padding)] py-[var(--card-padding)]">
          <h3 className="type-card-title" id="core-information-title">
            {s.basicInfo.title}
          </h3>
          <p className="mt-2 type-body">{s.basicInfo.desc}</p>
        </div>

        <div className="space-y-[var(--card-padding)] p-[var(--card-padding)]">
          <div className="flex flex-col gap-[var(--card-padding)] rounded-[var(--radius-card)] bg-surface-container p-[var(--card-padding)] @min-[37.5rem]/account:flex-row @min-[37.5rem]/account:items-center">
            <button
              aria-label={s.basicInfo.btnUpload}
              className="group relative w-fit cursor-pointer rounded-full outline-none focus-visible:ring-3 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:grayscale"
              disabled={saving}
              onClick={() => avatarInputRef.current?.click()}
              type="button"
            >
              <Avatar className="size-20 border border-border-subtle bg-surface m3-medium:size-24">
                <AvatarImage
                  src={avatarPreviewUrl || profile.avatarUrl || fallbackAvatar}
                  alt={accountName}
                />
                <AvatarFallback className="type-component-title">
                  {initialsFor(user)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-surface/75 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <UploadIcon size={24} />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <h4 className="type-card-title">{s.basicInfo.profilePic}</h4>
              <p className="mt-2 type-body">{s.basicInfo.profileDesc}</p>
              <input
                ref={avatarInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
                type="file"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <UploadIcon size={16} />
                  {s.basicInfo.btnUpload}
                </Button>
                {selectedAvatarFile ? (
                  <Button
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                    variant="ghost"
                    disabled={saving}
                    onClick={handleRemoveAvatar}
                  >
                    <DeleteIcon size={16} />
                    {s.basicInfo.btnRemove}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[var(--card-padding)] @min-[52.5rem]/account:grid-cols-2">
            <div className="space-y-2 @min-[52.5rem]/account:col-span-2">
              <Label>Email</Label>
              <Input
                aria-readonly="true"
                className="min-h-12 cursor-not-allowed bg-surface-muted px-4 type-body text-copy-disabled opacity-100"
                value={profile.email}
                placeholder="name@example.com"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label>
                {s.basicInfo.firstName} <span className="text-danger">*</span>
              </Label>
              <Input
                className={fieldClassName}
                value={profile.firstName}
                onChange={(event) =>
                  updateProfile("firstName", event.target.value)
                }
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label>
                {s.basicInfo.lastName} <span className="text-danger">*</span>
              </Label>
              <Input
                className={fieldClassName}
                value={profile.lastName}
                onChange={(event) =>
                  updateProfile("lastName", event.target.value)
                }
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2 @min-[52.5rem]/account:col-span-2">
              <Label>
                {s.basicInfo.headline} <span className="text-danger">*</span>
              </Label>
              <Input
                className={fieldClassName}
                value={profile.headline}
                onChange={(event) =>
                  updateProfile("headline", event.target.value)
                }
                placeholder="e.g. UI/UX Designer | Jakarta"
              />
              <p className="type-metadata">{s.basicInfo.headlineDesc}</p>
            </div>
            <div className="space-y-2 @min-[52.5rem]/account:col-span-2">
              <Label>{s.basicInfo.company}</Label>
              <Input
                className={fieldClassName}
                value={profile.company}
                onChange={(event) =>
                  updateProfile("company", event.target.value)
                }
                placeholder="e.g. Studio Name"
              />
            </div>
            <div className="space-y-2">
              <Label>
                {s.basicInfo.location} <span className="text-danger">*</span>
              </Label>
              <Select
                value={profile.country}
                onValueChange={(value) => {
                  if (value) updateProfile("country", value);
                }}
              >
                <SelectTrigger className="min-h-12 px-4">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="dashboard-manrope">
                  {countryOptions(user).map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{s.basicInfo.city}</Label>
              <Input
                className={fieldClassName}
                value={profile.city}
                onChange={(event) => updateProfile("city", event.target.value)}
                placeholder="e.g. Jakarta"
              />
            </div>
            <div className="space-y-2 @min-[52.5rem]/account:col-span-2">
              <Label>{s.basicInfo.website}</Label>
              <Input
                className={fieldClassName}
                value={profile.websiteUrl}
                onChange={(event) =>
                  updateProfile("websiteUrl", event.target.value)
                }
                placeholder="https://yourwebsite.com"
                type="url"
              />
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] bg-surface-container p-[var(--card-padding)]">
            <div className="mb-[var(--card-padding)]">
              <h4 className="type-card-title">{s.aboutMe.title}</h4>
              <p className="mt-2 type-body">{s.aboutMe.desc}</p>
            </div>
            <div className="space-y-[var(--card-padding)]">
              <div className="space-y-2">
                <Label>{s.aboutMe.sectionTitle}</Label>
                <Input
                  className={fieldClassName}
                  value={profile.aboutTitle}
                  onChange={(event) =>
                    updateProfile("aboutTitle", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{s.aboutMe.descLabel}</Label>
                <Textarea
                  className="min-h-36 resize-y px-4 py-3 type-body"
                  value={profile.aboutDescription}
                  onChange={(event) =>
                    updateProfile("aboutDescription", event.target.value)
                  }
                  placeholder="I'm a multidisciplinary designer based in..."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 33. UI endpoint work experiences: tambah, edit, dan tandai hapus sebelum Save. */}
      <section
        aria-labelledby="work-experience-title"
        className={sectionClassName}
      >
        <div className="flex flex-col gap-[var(--grid-gap)] border-b border-border-subtle/60 bg-surface-container px-[var(--card-padding)] py-[var(--card-padding)] @min-[37.5rem]/account:flex-row @min-[37.5rem]/account:items-center @min-[37.5rem]/account:justify-between">
          <div className="min-w-0">
            <h3 className="type-card-title" id="work-experience-title">
              {s.workExperience.title}
            </h3>
            <p className="mt-2 type-body">{s.workExperience.desc}</p>
          </div>
          <Button
            onClick={addExperience}
            variant="outline"
            className="w-full @min-[37.5rem]/account:w-auto"
          >
            <PlusIcon size={16} />
            {s.workExperience.btnAdd}
          </Button>
        </div>

        <div className="space-y-[var(--grid-gap)] p-[var(--card-padding)]">
          {loadingExperiences ? (
            <div
              className="space-y-[var(--grid-gap)] rounded-[var(--radius-card)] bg-surface-container p-[var(--card-padding)]"
              aria-hidden="true"
            >
              <div className="flex items-center justify-between gap-[var(--grid-gap)]">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="size-10 rounded-[var(--radius-control)]" />
              </div>
              <Skeleton className="h-11 w-full rounded-[var(--radius-control)]" />
              <Skeleton className="h-11 w-full rounded-[var(--radius-control)]" />
              <Skeleton className="h-24 w-full rounded-[var(--radius-control)]" />
            </div>
          ) : null}
          {!loadingExperiences
            ? experiences.map((exp, index) => (
                <div
                  key={exp.localId}
                  className="min-w-0 rounded-[var(--radius-card)] bg-surface-container p-[var(--card-padding)]"
                >
                  <div className="mb-[var(--card-padding)] flex items-center justify-between gap-[var(--grid-gap)]">
                    <p className="truncate type-label">
                      {s.workExperience.title} {index + 1}
                    </p>
                    {experiences.length > 1 || exp.id ? (
                      <Button
                        aria-label={s.basicInfo.btnRemove}
                        variant="ghost"
                        size="icon"
                        className="text-danger hover:bg-danger/10 hover:text-danger"
                        onClick={() => removeExperience(exp)}
                      >
                        <DeleteIcon size={16} />
                      </Button>
                    ) : null}
                  </div>

                  <div className="space-y-[var(--card-padding)]">
                    <div className="space-y-2">
                      <Label>
                        {s.workExperience.position}{" "}
                        <span className="text-danger">*</span>
                      </Label>
                      <Input
                        className={fieldClassName}
                        value={exp.title}
                        onChange={(event) =>
                          updateExperience(
                            exp.localId,
                            "title",
                            event.target.value,
                          )
                        }
                        placeholder="e.g. Senior Designer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {s.workExperience.company}{" "}
                        <span className="text-danger">*</span>
                      </Label>
                      <Input
                        className={fieldClassName}
                        value={exp.company}
                        onChange={(event) =>
                          updateExperience(
                            exp.localId,
                            "company",
                            event.target.value,
                          )
                        }
                        placeholder="e.g. Google"
                      />
                    </div>
                    <div className="flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] border border-border-subtle bg-surface-muted px-4">
                      <Checkbox
                        id={`current-${exp.localId}`}
                        checked={exp.isCurrent}
                        onCheckedChange={(checked) =>
                          updateExperience(
                            exp.localId,
                            "isCurrent",
                            checked === true,
                          )
                        }
                      />
                      <Label
                        htmlFor={`current-${exp.localId}`}
                        className="cursor-pointer font-normal"
                      >
                        {s.workExperience.current}
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 gap-[var(--card-padding)] @min-[52.5rem]/account:grid-cols-2">
                      <div className="space-y-2">
                        <Label>
                          {s.workExperience.startDate}{" "}
                          <span className="text-danger">*</span>
                        </Label>
                        <Input
                          className={fieldClassName}
                          value={exp.startDate}
                          onChange={(event) =>
                            updateExperience(
                              exp.localId,
                              "startDate",
                              event.target.value,
                            )
                          }
                          type="month"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{s.workExperience.endDate}</Label>
                        <Input
                          className={fieldClassName}
                          value={exp.endDate}
                          onChange={(event) =>
                            updateExperience(
                              exp.localId,
                              "endDate",
                              event.target.value,
                            )
                          }
                          disabled={exp.isCurrent}
                          type="month"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{s.workExperience.descLabel}</Label>
                      <Textarea
                        className="min-h-28 resize-y px-4 py-3 type-body"
                        value={exp.description}
                        onChange={(event) =>
                          updateExperience(
                            exp.localId,
                            "description",
                            event.target.value,
                          )
                        }
                        placeholder="Describe your role and achievements..."
                      />
                    </div>
                  </div>
                </div>
              ))
            : null}
        </div>
      </section>

      {/* 34. UI endpoint connected accounts: satu URL/handle untuk setiap enum platform. */}
      <section
        aria-labelledby="external-integrations-title"
        className={sectionClassName}
      >
        <div className="border-b border-border-subtle/60 bg-surface-container px-[var(--card-padding)] py-[var(--card-padding)]">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="type-card-title" id="external-integrations-title">
              {s.onTheWeb.title}
            </h3>
            {!SOCIAL_ACCOUNTS_AVAILABLE ? (
              <span className="dashboard-status-label rounded-full bg-surface-container-high px-3 py-1 text-copy-secondary">
                {s.onTheWeb.comingSoon}
              </span>
            ) : null}
          </div>
          <p className="mt-2 type-body">
            {SOCIAL_ACCOUNTS_AVAILABLE ? s.onTheWeb.desc : s.onTheWeb.unavailable}
          </p>
        </div>

        <div className="grid gap-[var(--grid-gap)] p-[var(--card-padding)]">
          {[
            {
              platform: "instagram" as const,
              label: s.onTheWeb.ig,
              value: profile.instagram,
              placeholder: "https://instagram.com/username",
              icon: InstagramIcon,
            },
            {
              platform: "linkedin" as const,
              label: s.onTheWeb.linkedin,
              value: profile.linkedin,
              placeholder: "https://linkedin.com/in/username",
              icon: LinkedinIcon,
            },
            {
              platform: "github" as const,
              label: s.onTheWeb.github,
              value: profile.github,
              placeholder: "https://github.com/username",
              icon: GithubIcon,
            },
          ].map(
            ({ platform, label, value, placeholder, icon: PlatformIcon }) => (
              <div
                className="flex min-w-0 items-start gap-[var(--grid-gap)] rounded-[var(--radius-card)] bg-surface-container p-[var(--card-padding)] @min-[37.5rem]/account:items-center"
                key={platform}
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface-raised text-copy">
                  <PlatformIcon size={20} />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Label>{label}</Label>
                  <Input
                    className="min-h-12 min-w-0 px-4 type-body"
                    disabled={saving || !SOCIAL_ACCOUNTS_AVAILABLE}
                    inputMode="url"
                    onChange={(event) =>
                      updateProfile(platform, event.target.value)
                    }
                    placeholder={placeholder}
                    type="url"
                    value={value}
                  />
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      {/* 35. Aksi akhir hanya mengirim request setelah semua schema valid. */}
      <div>
        <div className="grid grid-cols-2 gap-[var(--grid-gap)] @min-[37.5rem]/account:flex @min-[37.5rem]/account:justify-end">
          <Button
            className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
            variant="outline"
            disabled={saving}
            onClick={handleDiscardChanges}
          >
            {s.btnCancel}
          </Button>
          <Button
            className="min-h-12 rounded-[var(--radius-control)] px-4 type-label"
            disabled={saving}
            onClick={handleApplyChanges}
          >
            {saving ? s.alerts.saving : s.btnSave}
          </Button>
        </div>
      </div>
    </div>
  );
}
