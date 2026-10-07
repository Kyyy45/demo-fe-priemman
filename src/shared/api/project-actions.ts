import { PRIEMMAN_API_VERSION } from "./config";
import { priemmanApiClient } from "./core/client";
import {
  asBytes,
  asString,
  decodeMessage,
  encodeMessage,
} from "./core/protobuf";
import type {
  ListProjectActionsInput,
  ProjectAction,
  ProjectSummary,
} from "@/shared/lib/types/project-actions";

function parseSummary(bytes: Uint8Array): ProjectSummary {
  const fields = decodeMessage(bytes);
  const get = (field: number) => {
    const item = fields.find((entry) => entry.field === field)?.value;
    return item === undefined ? "" : asString(item);
  };
  return {
    projectId: get(1),
    title: get(2),
    thumbnail: get(3) || undefined,
    firstName: get(4),
    lastName: get(5),
  };
}

async function list(
  action: ProjectAction,
  input: ListProjectActionsInput = {},
) {
  const query = new URLSearchParams({
    limit: String(Math.max(0, input.limit ?? 10)),
    offset: String(Math.max(0, input.offset ?? 0)),
  });
  const bytes = await priemmanApiClient.requestProto(
    `${PRIEMMAN_API_VERSION}/users/me/${action}?${query}`,
    undefined,
    { method: "GET" },
  );
  return decodeMessage(bytes)
    .filter((field) => field.field === 1)
    .map((field) => parseSummary(asBytes(field.value)));
}

async function mutate(
  action: ProjectAction,
  projectId: string,
  method: "POST" | "DELETE",
) {
  const headers = new Headers();

  // Backend belum menangani preflight OPTIONS. POST memakai content type CORS-safe
  // agar payload protobuf langsung mencapai endpoint like/save.
  if (method === "POST") {
    headers.set("Content-Type", "text/plain;charset=UTF-8");
  }

  await priemmanApiClient.requestProto(
    `${PRIEMMAN_API_VERSION}/users/me/${action}`,
    encodeMessage([{ field: 1, type: "string", value: projectId }]),
    { headers, method },
  );
  return { success: true };
}

export const projectActionService = {
  listLiked: (input?: ListProjectActionsInput) => list("liked", input),
  like: (projectId: string) => mutate("liked", projectId, "POST"),
  unlike: (projectId: string) => mutate("liked", projectId, "DELETE"),
  listSaved: (input?: ListProjectActionsInput) => list("saved", input),
  save: (projectId: string) => mutate("saved", projectId, "POST"),
  unsave: (projectId: string) => mutate("saved", projectId, "DELETE"),
};
