import { PRIEMMAN_API_VERSION } from "./config";
import { priemmanApiClient } from "./core/client";
import { asBytes, asString, decodeMessage } from "./core/protobuf";
import type { UploadedMedia } from "@/shared/lib/types/media";

function getField(
  fields: ReturnType<typeof decodeMessage>,
  fieldNumber: number,
) {
  return fields.find((field) => field.field === fieldNumber)?.value;
}

function stringField(
  fields: ReturnType<typeof decodeMessage>,
  fieldNumber: number,
) {
  const value = getField(fields, fieldNumber);

  return value === undefined ? "" : asString(value);
}

function numberField(
  fields: ReturnType<typeof decodeMessage>,
  fieldNumber: number,
) {
  return Number(getField(fields, fieldNumber) ?? 0);
}

function objectIdField(
  fields: ReturnType<typeof decodeMessage>,
  fieldNumber: number,
) {
  const value = getField(fields, fieldNumber);
  if (!value) return "";

  return stringField(decodeMessage(asBytes(value)), 1);
}

function getRepeatedMessages(
  fields: ReturnType<typeof decodeMessage>,
  fieldNumber: number,
) {
  return fields
    .filter((field) => field.field === fieldNumber)
    .map((field) => decodeMessage(asBytes(field.value)));
}

function parseUploadedMedia(
  fields: ReturnType<typeof decodeMessage>,
): UploadedMedia {
  return {
    url: stringField(fields, 1),
    type: numberField(fields, 2),
    order: numberField(fields, 3),
    id: objectIdField(fields, 4),
    publicId: stringField(fields, 5),
    resourceType: stringField(fields, 6),
  };
}

export const mediaService = {
  // Alur Media mengikuti MEDIA_CONTRACT.md: kirim multipart,
  // decode protobuf, lalu pastikan metadata wajib tersedia sebelum caller
  // menyimpan relasi media pada User atau Project.
  async uploadMany(files: File[]) {
    if (files.length === 0) return [];

    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    const response = await priemmanApiClient.request(
      `${PRIEMMAN_API_VERSION}/media/upload`,
      {
        method: "POST",
        body: formData,
      },
    );
    const fields = decodeMessage(new Uint8Array(await response.arrayBuffer()));

    const uploaded = getRepeatedMessages(fields, 1).map(parseUploadedMedia);
    if (uploaded.some((media) => !media.url || !media.id || !media.publicId)) {
      throw new Error("Upload response is missing required media metadata.");
    }
    return uploaded;
  },

  async upload(file: File) {
    return this.uploadMany([file]);
  },
};
