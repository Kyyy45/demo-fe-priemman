import type {
  Collection,
  CollectionInput,
  CollectionVisibility,
} from "@/shared/lib/types/collection";

import {
  asBool,
  asBytes,
  asString,
  decodeMessage,
  encodeMessage,
} from "../core/protobuf";

type Fields = ReturnType<typeof decodeMessage>;

// Mapper mengikuti contract Collection: nested ObjectId dan Timestamp dibaca
// pada batas protobuf, sementara layer UI hanya menerima string dan enum aman.

function value(fields: Fields, field: number) {
  return fields.find((item) => item.field === field)?.value;
}

function nested(fields: Fields, field: number) {
  const item = value(fields, field);
  return item === undefined ? [] : decodeMessage(asBytes(item));
}

function string(fields: Fields, field: number) {
  const item = value(fields, field);
  return item === undefined ? "" : asString(item);
}

function objectId(fields: Fields, field: number) {
  return string(nested(fields, field), 1);
}

function timestamp(fields: Fields, field: number) {
  const seconds = Number(value(nested(fields, field), 1) ?? 0);
  return seconds > 0 ? new Date(seconds * 1000).toISOString() : "";
}

export function collectionObjectIdMessage(id: string) {
  return encodeMessage([{ field: 1, type: "string", value: id }]);
}

function visibilityFromProto(input: number): CollectionVisibility {
  return input === 1 ? "public" : input === 2 ? "private" : "unspecified";
}

function visibilityToProto(input: CollectionInput["visibility"]) {
  return input === "public" ? 1 : 2;
}

export function encodeCollectionInput(input: CollectionInput) {
  return encodeMessage([
    { field: 1, type: "string", value: input.title },
    { field: 2, type: "string", value: input.description },
    { field: 3, type: "int32", value: visibilityToProto(input.visibility) },
    {
      field: 4,
      type: "message",
      value: input.projectIds.map(collectionObjectIdMessage),
    },
  ]);
}

export function parseCollection(fields: Fields): Collection {
  return {
    id: objectId(fields, 1),
    ownerId: objectId(fields, 2),
    title: string(fields, 3),
    description: string(fields, 4),
    projectIds: fields
      .filter((item) => item.field === 5)
      .map((item) => string(decodeMessage(asBytes(item.value)), 1)),
    visibility: visibilityFromProto(Number(value(fields, 6) ?? 0)),
    createdAt: timestamp(fields, 7),
    updatedAt: timestamp(fields, 8),
  };
}

export function parseCollectionResponse(bytes: Uint8Array) {
  return parseCollection(nested(decodeMessage(bytes), 1));
}

export function parseCollectionListResponse(bytes: Uint8Array) {
  return decodeMessage(bytes)
    .filter((field) => field.field === 1)
    .map((field) => parseCollection(decodeMessage(asBytes(field.value))));
}

export function parseCollectionDeleteResponse(bytes: Uint8Array) {
  return { success: asBool(value(decodeMessage(bytes), 1) ?? 0) };
}
