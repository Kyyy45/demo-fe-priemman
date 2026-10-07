import { normalizeAvatarUrl } from "@/shared/lib/avatar";
import type { UploadedMedia } from "@/shared/lib/types/media";
import type {
  ListProjectsResult,
  Project,
  ProjectAuthor,
  ProjectCollaborator,
  ProjectInput,
  ProjectMedia,
  ProjectStatus,
  ProjectVisibility,
} from "@/shared/lib/types/project";

import {
  asBool,
  asBytes,
  asString,
  decodeMessage,
  encodeMessage,
} from "../core/protobuf";

type Fields = ReturnType<typeof decodeMessage>;

function value(fields: Fields, field: number) {
  return fields.find((item) => item.field === field)?.value;
}

function repeated(fields: Fields, field: number) {
  return fields.filter((item) => item.field === field);
}

function message(fields: Fields, field: number) {
  const item = value(fields, field);
  return decodeMessage(item === undefined ? new Uint8Array() : asBytes(item));
}

function string(fields: Fields, field: number) {
  const item = value(fields, field);
  return item === undefined ? "" : asString(item);
}

function number(fields: Fields, field: number) {
  return Number(value(fields, field) ?? 0);
}

function objectId(fields: Fields, field: number) {
  return string(message(fields, field), 1);
}

function timestamp(fields: Fields, field: number) {
  const seconds = number(message(fields, field), 1);
  return seconds > 0 ? new Date(seconds * 1000).toISOString() : "";
}

export function projectObjectIdMessage(id: string) {
  return encodeMessage([{ field: 1, type: "string", value: id }]);
}

function visibilityFromProto(value: number): ProjectVisibility {
  return value === 1
    ? "public"
    : value === 2
      ? "unlisted"
      : value === 3
        ? "draft"
        : "unspecified";
}

function visibilityToProto(value: ProjectVisibility) {
  return value === "public"
    ? 1
    : value === "unlisted"
      ? 2
      : value === "draft"
        ? 3
        : 0;
}

function statusFromProto(value: number): ProjectStatus {
  return value === 1
    ? "draft"
    : value === 2
      ? "published"
      : value === 3
        ? "archived"
        : "unspecified";
}

function statusToProto(value: ProjectStatus) {
  return value === "draft"
    ? 1
    : value === "published"
      ? 2
      : value === "archived"
        ? 3
        : 0;
}

function mediaMessage(media: ProjectMedia | UploadedMedia) {
  return encodeMessage([
    { field: 1, type: "string", value: media.url },
    { field: 2, type: "int32", value: media.type },
    { field: 3, type: "int32", value: media.order },
    { field: 4, type: "message", value: projectObjectIdMessage(media.id) },
    { field: 5, type: "string", value: media.publicId },
  ]);
}

function collaboratorMessage(item: ProjectCollaborator) {
  return encodeMessage([
    { field: 1, type: "message", value: projectObjectIdMessage(item.userId) },
    { field: 2, type: "string", value: item.role },
  ]);
}

export function encodeProjectInput(input: ProjectInput) {
  return encodeMessage([
    { field: 1, type: "string", value: input.title },
    { field: 2, type: "string", value: input.tags },
    { field: 3, type: "message", value: input.media.map(mediaMessage) },
    {
      field: 4,
      type: "message",
      value: input.collaborators.map(collaboratorMessage),
    },
    { field: 5, type: "int32", value: visibilityToProto(input.visibility) },
    { field: 6, type: "int32", value: statusToProto(input.status) },
    { field: 7, type: "string", value: input.coverMediaId ?? "" },
    { field: 8, type: "string", value: input.content },
  ]);
}

function parseMedia(fields: Fields): ProjectMedia {
  return {
    url: string(fields, 1),
    type: number(fields, 2),
    order: number(fields, 3),
    id: objectId(fields, 4),
    publicId: string(fields, 5),
  };
}

function parseCollaborator(fields: Fields): ProjectCollaborator {
  return { userId: objectId(fields, 1), role: string(fields, 2) };
}

function parseAuthor(fields: Fields): ProjectAuthor {
  return {
    id: objectId(fields, 1),
    firstName: string(fields, 2),
    lastName: string(fields, 3),
    avatarUrl: normalizeAvatarUrl(string(fields, 4)),
    headline: string(fields, 5),
  };
}

export function parseProject(fields: Fields): Project {
  const metrics = message(fields, 12);
  const authorFields = value(fields, 16);

  return {
    id: objectId(fields, 1),
    ownerId: objectId(fields, 2),
    title: string(fields, 3),
    slug: string(fields, 4),
    content: string(fields, 5),
    tags: repeated(fields, 6).map((item) => asString(item.value)),
    coverMediaId: string(fields, 7),
    media: repeated(fields, 8).map((item) =>
      parseMedia(decodeMessage(asBytes(item.value))),
    ),
    collaborators: repeated(fields, 9).map((item) =>
      parseCollaborator(decodeMessage(asBytes(item.value))),
    ),
    visibility: visibilityFromProto(number(fields, 10)),
    status: statusFromProto(number(fields, 11)),
    metrics: {
      views: number(metrics, 1),
      likes: number(metrics, 2),
      saves: number(metrics, 3),
    },
    createdAt: timestamp(fields, 13),
    updatedAt: timestamp(fields, 14),
    publishedAt: timestamp(fields, 15),
    author:
      authorFields === undefined
        ? null
        : parseAuthor(decodeMessage(asBytes(authorFields))),
  };
}

export function parseProjectResponse(bytes: Uint8Array) {
  return parseProject(message(decodeMessage(bytes), 1));
}

export function parseProjectListResponse(
  bytes: Uint8Array,
): ListProjectsResult {
  const fields = decodeMessage(bytes);

  return {
    projects: repeated(fields, 1).map((item) =>
      parseProject(decodeMessage(asBytes(item.value))),
    ),
    nextPageToken: string(fields, 2),
  };
}

export function parseProjectDeleteResponse(bytes: Uint8Array) {
  return { success: asBool(value(decodeMessage(bytes), 1) ?? 0) };
}
