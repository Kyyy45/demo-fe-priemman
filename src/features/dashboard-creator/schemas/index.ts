import { z } from "zod";

export const projectInputSchema = z.object({
  title: z.string().trim().min(1, "Project title is required.").max(160),
  tags: z.array(z.string().trim().min(1).max(48)).max(20),
  content: z.string().max(100_000),
  visibility: z.enum(["public", "unlisted", "draft"]),
  status: z.enum(["draft", "published", "archived"]),
});

export const collectionInputSchema = z.object({
  title: z.string().trim().min(1, "Collection title is required.").max(120),
  description: z.string().trim().max(2_000),
  visibility: z.enum(["public", "private"]),
  projectIds: z.array(z.string().trim().min(1)).max(100),
});
