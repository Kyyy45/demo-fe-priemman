import type {
  OAuthProvider,
  SendOtpInput,
  VerifyOtpInput,
} from "@/shared/lib/types/auth";

import { PRIEMMAN_API_VERSION, buildApiUrl } from "./config";
import { priemmanApiClient } from "./core/client";
import {
  encodeLogoutInput,
  encodeSendOtpInput,
  encodeVerifyOtpInput,
  parseLogoutResponse,
  parseSendOtpResponse,
  parseVerifyOtpResponse,
} from "./mappers/auth";

// Alur Auth frontend: request OTP, verifikasi OTP, pertahankan session cookie,
// lalu gunakan redirect penuh untuk OAuth. Logout masih mengikuti kontrak
// backend saat ini yang meminta token protobuf; token tersebut hanya tersedia
// selama tab aktif, sedangkan session utama tetap cookie.
let runtimeSessionToken = "";
const LEGACY_SESSION_STORAGE_KEY = "priemman_session_token";

// Token tidak pernah ditulis ke localStorage. Helper ini hanya menjaga token
// runtime untuk kompatibilitas endpoint logout yang belum membaca cookie.
function persistSessionToken(token: string) {
  runtimeSessionToken = token;
}

function clearLegacyStoredToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
  }
}

function clearSessionToken() {
  runtimeSessionToken = "";
  clearLegacyStoredToken();
}

export const authService = {
  // Langkah 1 — `POST /v1/auth/send-otp`: encode email sesuai SendOtpRequest,
  // kirim protobuf, lalu kembalikan pesan dan cooldown dari SendOtpResponse.
  async sendOtp(input: SendOtpInput) {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/auth/send-otp`,
      encodeSendOtpInput(input),
      { method: "POST" },
    );

    return parseSendOtpResponse(response);
  },

  // Langkah 2 — `POST /v1/auth/verify-otp`: backend memverifikasi OTP, mengirim
  // VerifyOtpResponse, dan menetapkan cookie session melalui Set-Cookie.
  // sessionToken hanya disimpan di memori untuk kebutuhan logout legacy.
  async verifyOtp(input: VerifyOtpInput) {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/auth/verify-otp`,
      encodeVerifyOtpInput(input),
      { method: "POST" },
    );
    const result = parseVerifyOtpResponse(response);
    persistSessionToken(result.sessionToken);

    return result;
  },

  // Langkah 3 — `POST /v1/auth/logout`: cabut session menggunakan token runtime,
  // bersihkan state lokal setelah respons berhasil. Setelah backend membaca
  // cookie `session`, body token dan runtimeSessionToken dapat dihapus.
  async logout() {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/auth/logout`,
      encodeLogoutInput(runtimeSessionToken),
      { method: "POST" },
    );
    clearSessionToken();

    return parseLogoutResponse(response);
  },

  // Langkah 4 — `GET /v1/users/me` dipakai sebagai pemeriksaan session setelah
  // reload atau selesai OAuth; endpoint ini bukan bagian dari Auth route.
  async hasActiveSession() {
    try {
      clearLegacyStoredToken();
      await priemmanApiClient.requestProto(
        `${PRIEMMAN_API_VERSION}/users/me`,
        undefined,
        { method: "GET" },
      );

      return true;
    } catch {
      clearSessionToken();
      return false;
    }
  },

  // Langkah 5 — `GET /v1/auth/{provider}` memulai OAuth Google/GitHub.
  // Kembalikan URL untuk navigasi penuh agar browser menerima cookie state,
  // callback provider, session cookie, dan redirect role dari backend.
  getOAuthUrl(provider: OAuthProvider) {
    return buildApiUrl(`${PRIEMMAN_API_VERSION}/auth/${provider}`);
  },

  clearLocalSession() {
    clearSessionToken();
  },
};
