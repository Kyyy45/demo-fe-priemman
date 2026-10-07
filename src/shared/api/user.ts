import { PRIEMMAN_API_VERSION } from "./config";
import { priemmanApiClient } from "./core/client";
import { decodeMessage } from "./core/protobuf";
import {
  connectedAccountRequestMessage,
  deleteConnectedAccountRequestMessage,
  deleteWorkExperienceRequestMessage,
  parseConnectedAccount,
  parseConnectedAccounts,
  parseCreatorUpgradeResponse,
  parseCurrentUser,
  parseDeleteResponse,
  parseUpgradeLogs,
  parseUpgradeStatus,
  parsePublicUserProfile,
  parseWorkExperience,
  parseWorkExperiences,
  updateBasicInfoMessage,
  workExperienceRequestMessage,
} from "./mappers/user";
import { parseProjectListResponse } from "./mappers/project";
import type {
  ConnectedPlatform,
  UpdateBasicInfoInput,
  UpsertConnectedAccountInput,
  UpsertWorkExperienceInput,
} from "@/shared/lib/types/user";

// Alur User: ambil profil session, ubah profil secara partial, kelola
// experience dan akun sosial, lalu baca atau kirim pengajuan Creator.
// Service hanya mengatur transport; codec protobuf tetap berada di mapper
// agar urutan field kontrak terpusat.
export const userService = {
  // Langkah 1 — GET profil session aktif untuk navbar, account, dan dashboard.
  async getMe() {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/me`,
      undefined,
      // Role dapat berubah setelah admin mengonfirmasi pembayaran. Jangan
      // gunakan respons GET yang tersimpan browser saat dashboard di-reload.
      { method: "GET", cache: "no-store" },
    );
    return parseCurrentUser(response);
  },

  // Langkah public 1 — GET profil public memakai user_id dan auth opsional.
  async getPublicProfile(userId: string) {
    const query = new URLSearchParams({ user_id: userId });
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/public?${query.toString()}`,
      undefined,
      { method: "GET", anonymous: true, cache: "no-store" },
    );
    // Backend mengembalikan `Result` error dengan HTTP 200 bila profil gagal
    // dimuat (mis. user belum punya work experience). Body itu ter-decode
    // sebagai profil kosong, jadi profil tanpa id diperlakukan sebagai gagal.
    const profile = parsePublicUserProfile(response);
    if (!profile.id) throw new Error("Public profile is unavailable.");
    return profile;
  },

  // Langkah public 2 — daftar project published dengan offset pagination.
  async listPublicProjects(userId: string, limit = 20, offset = 0) {
    const query = new URLSearchParams({
      user_id: userId,
      limit: String(Math.max(0, limit)),
      offset: String(Math.max(0, offset)),
    });
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/public/projects?${query.toString()}`,
      undefined,
      { method: "GET", anonymous: true, cache: "no-store" },
    );
    return parseProjectListResponse(response);
  },

  // Langkah 2 — PATCH profil. Backend juga menerima PUT sebagai alias partial
  // update, tetapi frontend memakai PATCH secara konsisten.
  async updateMe(input: UpdateBasicInfoInput) {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/me`,
      updateBasicInfoMessage(input),
      { method: "PATCH" },
    );
    return parseCurrentUser(response);
  },

  // Langkah 3 — GET seluruh experience untuk Account Settings.
  async listWorkExperiences() {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/me/work-experiences`,
      undefined,
      { method: "GET" },
    );
    return parseWorkExperiences(response);
  },

  // Langkah 4 — POST experience: ID kosong membuat entry, ID terisi memperbarui.
  async upsertWorkExperience(input: UpsertWorkExperienceInput) {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/me/work-experiences`,
      workExperienceRequestMessage(input),
      { method: "POST" },
    );
    return parseWorkExperience(decodeMessage(response));
  },

  // Langkah 5 — DELETE experience berdasarkan ObjectId entry.
  async deleteWorkExperience(id: string) {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/me/work-experiences`,
      deleteWorkExperienceRequestMessage(id),
      { method: "DELETE" },
    );
    return parseDeleteResponse(response);
  },

  // Langkah 6 — GET akun sosial untuk state profil mandiri.
  async listConnectedAccounts() {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/me/connected-accounts`,
      undefined,
      { method: "GET" },
    );
    return parseConnectedAccounts(response);
  },

  // Langkah 7 — POST akun sosial melakukan upsert berdasarkan platform. UI dapat
  // refetch profil setelah sukses karena respons bukan record profil kanonis.
  async upsertConnectedAccount(input: UpsertConnectedAccountInput) {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/me/connected-accounts`,
      connectedAccountRequestMessage(input),
      { method: "POST" },
    );
    return parseConnectedAccount(decodeMessage(response));
  },

  // Langkah 8 — DELETE akun sosial menerima enum platform, bukan URL.
  async deleteConnectedAccount(platform: ConnectedPlatform) {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/me/connected-accounts`,
      deleteConnectedAccountRequestMessage(platform),
      { method: "DELETE" },
    );
    return parseDeleteResponse(response);
  },

  // Langkah 9 — GET status pengajuan Creator terbaru.
  async getUpgradeStatus() {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/me/upgrade`,
      undefined,
      { method: "GET" },
    );
    return parseUpgradeStatus(response);
  },

  // Langkah 10 — GET timeline pengajuan; clamp mencegah limit/offset negatif.
  async listUpgradeLogs(limit = 20, offset = 0) {
    const search = new URLSearchParams({
      limit: String(Math.max(0, limit)),
      offset: String(Math.max(0, offset)),
    });
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/upgrade-logs?${search.toString()}`,
      undefined,
      { method: "GET" },
    );
    return parseUpgradeLogs(response);
  },

  // Langkah 11 — POST pengajuan Creator tanpa body bisnis; session menentukan
  // pemohon dan respons membawa status pengajuan yang baru dibuat.
  async requestCreatorUpgrade() {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/users/me/upgrade`,
      undefined,
      { method: "POST" },
    );
    return parseCreatorUpgradeResponse(response);
  },
};
