/** Contracts derived from proto/project.proto collection messages. */
export type CollectionVisibility = "unspecified" | "public" | "private";

export interface Collection {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  projectIds: string[];
  visibility: CollectionVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionInput {
  title: string;
  description: string;
  visibility: Exclude<CollectionVisibility, "unspecified">;
  projectIds: string[];
}
