import type {
  SendOtpInput,
  SendOtpResult,
  VerifyOtpInput,
  VerifyOtpResult,
} from "@/shared/lib/types/auth";

import {
  asBool,
  asString,
  decodeMessage,
  encodeMessage,
} from "../core/protobuf";

// Mapper Auth mengikuti urutan kontrak: encode request pada saat request keluar,
// lalu decode response pada saat response kembali. Semua field memakai nomor
// protobuf dari auth.proto; mapper tidak menambahkan business logic UI.
function value(bytes: Uint8Array, field: number) {
  return decodeMessage(bytes).find((item) => item.field === field)?.value;
}

// Langkah 1 — SendOtpRequest: field 1 adalah email.
export function encodeSendOtpInput({ email }: SendOtpInput) {
  return encodeMessage([{ field: 1, type: "string", value: email }]);
}

// Response langkah 1 — success, message, dan cooldown_seconds dipetakan ke
// camelCase agar langsung dipakai form OTP.
export function parseSendOtpResponse(bytes: Uint8Array): SendOtpResult {
  return {
    success: asBool(value(bytes, 1) ?? 0),
    message: asString(value(bytes, 2) ?? ""),
    cooldownSeconds: Number(value(bytes, 3) ?? 0),
  };
}

// Langkah 2 — VerifyOtpRequest: email pada field 1 dan OTP enam digit pada field 2.
export function encodeVerifyOtpInput({ email, otp }: VerifyOtpInput) {
  return encodeMessage([
    { field: 1, type: "string", value: email },
    { field: 2, type: "string", value: otp },
  ]);
}

// Response langkah 2 — session_token hanya dipakai runtime; session cookie
// diproses browser dari header Set-Cookie, bukan oleh mapper.
export function parseVerifyOtpResponse(bytes: Uint8Array): VerifyOtpResult {
  return {
    sessionToken: asString(value(bytes, 1) ?? ""),
    isNewUser: asBool(value(bytes, 2) ?? 0),
  };
}

// Langkah 3 — LogoutRequest legacy: session_token dikirim pada field 1.
export function encodeLogoutInput(sessionToken: string) {
  return encodeMessage([{ field: 1, type: "string", value: sessionToken }]);
}

// Response langkah 3 — backend mengembalikan success setelah session dicabut.
export function parseLogoutResponse(bytes: Uint8Array) {
  return { success: asBool(value(bytes, 1) ?? 0) };
}
