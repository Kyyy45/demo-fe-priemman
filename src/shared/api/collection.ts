import type { CollectionInput } from "@/shared/lib/types/collection";

import { PRIEMMAN_API_VERSION } from "./config";
import { priemmanApiClient } from "./core/client";
import { encodeMessage } from "./core/protobuf";
import {
  collectionObjectIdMessage,
  encodeCollectionInput,
  parseCollectionDeleteResponse,
  parseCollectionListResponse,
  parseCollectionResponse,
} from "./mappers/collection";

// Alur Collection mengikuti COLLECTION_CONTRACT.md: list/detail membaca data,
// create/update mengirim input protobuf, lalu delete membaca DeleteResponse.
// Ownership dan validasi project tetap diputuskan backend.
export const collectionService = {
  // Langkah 1 — GET seluruh collection milik session aktif.
  async list() {
    const bytes = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/collections`,
      undefined,
      { method: "GET" },
    );

    return parseCollectionListResponse(bytes);
  },

  async get(id: string) {
    // Langkah 2 — GET detail memakai query `id` pada route collection yang sama.
    const query = new URLSearchParams({ id });
    const bytes = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/collections?${query}`,
      undefined,
      { method: "GET" },
    );

    return parseCollectionResponse(bytes);
  },

  async create(input: CollectionInput) {
    // Langkah 3 — POST membuat collection baru dari CollectionInput.
    const bytes = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/collections`,
      encodeMessage([
        { field: 1, type: "message", value: encodeCollectionInput(input) },
      ]),
      { method: "POST" },
    );

    return parseCollectionResponse(bytes);
  },

  async update(id: string, input: CollectionInput) {
    // Langkah 4 — PUT mengirim ObjectId dan CollectionInput untuk update.
    const bytes = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/collections`,
      encodeMessage([
        { field: 1, type: "message", value: collectionObjectIdMessage(id) },
        { field: 2, type: "message", value: encodeCollectionInput(input) },
      ]),
      { method: "PUT" },
    );

    return parseCollectionResponse(bytes);
  },

  async delete(id: string) {
    // Langkah 5 — DELETE mengirim ObjectId dan membaca DeleteResponse.
    const bytes = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/collections`,
      encodeMessage([
        { field: 1, type: "message", value: collectionObjectIdMessage(id) },
      ]),
      { method: "DELETE" },
    );

    return parseCollectionDeleteResponse(bytes);
  },
};
