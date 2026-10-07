import { PRIEMMAN_API_VERSION } from "./config";
import { priemmanApiClient } from "./core/client";
import { encodeMessage } from "./core/protobuf";
import {
  encodeProjectInput,
  parseProjectDeleteResponse,
  parseProjectListResponse,
  parseProjectResponse,
  projectObjectIdMessage,
} from "./mappers/project";
import type {
  ListProjectsInput,
  ListProjectsResult,
  Project,
  ProjectInput,
  ProjectStatus,
} from "@/shared/lib/types/project";

// Alur Project mengikuti kontrak backend: list/get membaca data, create dan
// update mengirim ProjectInput melalui mapper, lalu delete membaca DeleteResponse.
// Ownership tetap divalidasi backend; helper ini hanya menjaga guard UI.
export function isProjectOwnedBy(project: Project, userId: string) {
  return project.ownerId === userId;
}

// PUT /v1/projects/{id} mengganti SELURUH ProjectInput (tags, media,
// collaborators ikut di-replace), jadi perubahan status saja (arsip/pulihkan)
// tetap harus mengirim ulang semua field project apa adanya.
export function projectInputFromProject(
  project: Project,
  overrides: Partial<ProjectInput> = {},
): ProjectInput {
  return {
    title: project.title,
    tags: project.tags,
    media: project.media,
    collaborators: project.collaborators,
    visibility: project.visibility,
    status: project.status,
    coverMediaId: project.coverMediaId,
    content: project.content,
    ...overrides,
  };
}

export const projectService = {
  // Langkah 1 — POST membuat project dari input yang sudah di-encode mapper.
  async create(input: ProjectInput) {
    const bytes = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/projects`,
      encodeMessage([
        { field: 1, type: "message", value: encodeProjectInput(input) },
      ]),
      { method: "POST" },
    );

    return parseProjectResponse(bytes);
  },

  async list(
    input: ListProjectsInput = {},
    anonymous = false,
  ): Promise<ListProjectsResult> {
    // Langkah 2 — GET daftar memakai cursor pagination; page_size dibatasi 1–50.
    const search = new URLSearchParams({
      page_size: String(Math.min(Math.max(input.pageSize ?? 20, 1), 50)),
    });

    if (input.pageToken) search.set("page_token", input.pageToken);
    if (input.status) search.set("status", input.status.toUpperCase());

    const bytes = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/projects/list?${search.toString()}`,
      undefined,
      { method: "GET", anonymous, cache: "no-store" },
    );

    return parseProjectListResponse(bytes);
  },

  // Semua project milik session aktif. Backend (ListByOwner) memfilter
  // `p.status = ?` apa adanya, jadi tanpa `status` hasilnya selalu kosong
  // walau proto menyebut UNSPECIFIED = semua. Karena itu tiap ProjectStatus
  // diminta terpisah, halaman diikuti lewat page_token, lalu digabung.
  async listOwned(
    statuses: ReadonlyArray<Exclude<ProjectStatus, "unspecified">> = [
      "draft",
      "published",
      "archived",
    ],
  ) {
    const MAX_PAGES = 20;
    const pages = await Promise.all(
      statuses.map(async (status) => {
        const projects: Project[] = [];
        let pageToken = "";
        for (let page = 0; page < MAX_PAGES; page++) {
          const result = await this.list({ status, pageSize: 50, pageToken });
          projects.push(...result.projects);
          if (!result.nextPageToken) break;
          pageToken = result.nextPageToken;
        }
        return projects;
      }),
    );
    return pages
      .flat()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  },

  async get(id: string, anonymous = false) {
    // Langkah 3 — GET detail dapat anonymous untuk project publik.
    const bytes = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/projects/${encodeURIComponent(id)}`,
      undefined,
      { method: "GET", anonymous, cache: "no-store" },
    );

    return parseProjectResponse(bytes);
  },

  async update(id: string, input: ProjectInput) {
    // Langkah 4 — PUT mengirim ObjectId dan ProjectInput untuk update ownership.
    const bytes = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/projects/${encodeURIComponent(id)}`,
      encodeMessage([
        { field: 1, type: "message", value: projectObjectIdMessage(id) },
        { field: 2, type: "message", value: encodeProjectInput(input) },
      ]),
      { method: "PUT" },
    );

    return parseProjectResponse(bytes);
  },

  async delete(id: string) {
    // Langkah 5 — DELETE menghapus berdasarkan id dan membaca DeleteResponse.
    const bytes = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/projects/${encodeURIComponent(id)}`,
      undefined,
      { method: "DELETE" },
    );

    return parseProjectDeleteResponse(bytes);
  },
};
