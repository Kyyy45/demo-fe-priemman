import { buildApiUrl } from "../config";
import { ApiError } from "./errors";
import { asBytes, asString, decodeMessage } from "./protobuf";
import type { RequestOptions } from "@/shared/lib/types/http";

const PROTOBUF_CONTENT_TYPE = "application/x-protobuf";

function parseJsonErrorPayload(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return { code: undefined, message: fallback };
  }

  const record = payload as {
    error?: unknown;
    message?: unknown;
    code?: unknown;
  };
  const code =
    typeof record.code === "string"
      ? record.code
      : typeof record.error === "string"
        ? record.error
        : undefined;
  const message =
    typeof record.message === "string"
      ? record.message
      : typeof record.error === "string"
        ? record.error
        : fallback;

  return { code, message };
}

function getStringField(
  fields: ReturnType<typeof decodeMessage>,
  fieldNumber: number,
) {
  const field = fields.find((item) => item.field === fieldNumber);
  if (!field || !(field.value instanceof Uint8Array)) return undefined;

  return asString(field.value);
}

async function parseError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);

    return parseJsonErrorPayload(payload, response.statusText);
  }

  const buffer = new Uint8Array(await response.arrayBuffer());
  if (buffer.length > 0 && contentType.includes("protobuf")) {
    // 1. Error protobuf backend memakai `common.proto: Result`; ErrorDetail ada
    //    pada field 5. Format ini dipakai, antara lain, oleh endpoint Auth.
    const fields = decodeMessage(buffer);
    const detail = fields.find((field) => field.field === 5);
    const detailFields = detail ? decodeMessage(asBytes(detail.value)) : [];
    const code = getStringField(detailFields, 1);
    const detailMessage = getStringField(detailFields, 2);
    const resultMessage = getStringField(fields, 3);
    const responseMessage = getStringField(fields, 2);

    return {
      code,
      message:
        detailMessage ??
        resultMessage ??
        responseMessage ??
        response.statusText,
    };
  }

  const text = new TextDecoder().decode(buffer);
  const parsedJson = (() => {
    try {
      return parseJsonErrorPayload(JSON.parse(text) as unknown, "");
    } catch {
      return { code: undefined, message: "" };
    }
  })();
  if (parsedJson.message) return parsedJson;

  return {
    code: undefined,
    message: text || response.statusText,
  };
}

export class PriemmanApiClient {
  async request(path: string, options: RequestOptions = {}) {
    const headers = new Headers(options.headers);

    const { anonymous, ...fetchOptions } = options;
    if (anonymous) headers.delete("Authorization");
    const response = await fetch(buildApiUrl(path), {
      ...fetchOptions,
      body: options.body,
      // 2. Session Priemman adalah cookie HttpOnly. Request Auth/User terproteksi
      //    harus menyertakan cookie ini, kecuali endpoint publik/anonymous.
      credentials: anonymous ? "omit" : (options.credentials ?? "include"),
      headers,
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new ApiError({
        code: error.code,
        message: error.message,
        status: response.status,
      });
    }

    return response;
  }

  async requestText(path: string, options?: RequestOptions) {
    const response = await this.request(path, options);

    return response.text();
  }

  async requestJson<T>(path: string, options?: RequestOptions) {
    const response = await this.request(path, options);

    return response.json() as Promise<T>;
  }

  async requestProto(
    path: string,
    body?: Uint8Array,
    options: RequestOptions = {},
  ) {
    const headers = new Headers(options.headers);
    if (body && !headers.has("Content-Type")) {
      headers.set("Content-Type", PROTOBUF_CONTENT_TYPE);
    }

    let arrayBufferBody: ArrayBuffer | undefined;
    if (body) {
      arrayBufferBody = new ArrayBuffer(body.byteLength);
      new Uint8Array(arrayBufferBody).set(body);
    }

    const response = await this.request(path, {
      ...options,
      body: arrayBufferBody,
      headers,
    });

    return new Uint8Array(await response.arrayBuffer());
  }
}

export const priemmanApiClient = new PriemmanApiClient();
