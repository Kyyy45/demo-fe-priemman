import { z } from "zod";

// 1. Schema Account Settings sebelum UI memanggil `PATCH /v1/users/me`.
export const profileUpdateSchema = z.object({
  firstName: z.string().trim().max(80),
  lastName: z.string().trim().max(80),
  headline: z.string().trim().max(160),
  company: z.string().trim().max(160),
  websiteUrl: z.union([z.literal(""), z.string().url()]),
  location: z.object({
    country: z.string().trim().max(80),
    city: z.string().trim().max(80),
  }),
  aboutMe: z.object({
    title: z.string().trim().max(160),
    description: z.string().trim().max(2_000),
  }),
});

// 2. Schema `POST /v1/users/me/work-experiences`; date input memakai `YYYY-MM`.
export const workExperienceSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(1).max(160),
    company: z.string().trim().min(1).max(160),
    isCurrent: z.boolean(),
    startDate: z.string().regex(/^\d{4}-\d{2}$/, "Tanggal mulai wajib diisi."),
    endDate: z.string(),
    description: z.string().trim().max(2_000),
  })
  .superRefine((value, context) => {
    if (!value.isCurrent && !/^\d{4}-\d{2}$/.test(value.endDate)) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Tanggal selesai wajib diisi.",
      });
    }
  });

// 3. Schema `POST /v1/users/me/connected-accounts`; platform mengikuti enum backend.
export const connectedAccountSchema = z.object({
  platform: z.enum(["instagram", "linkedin", "github"]),
  handleOrUrl: z.string().trim().min(1).max(255),
});
