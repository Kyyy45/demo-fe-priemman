import type { UploadedMedia } from "./media";

// 1. Enum `UserRole` berasal dari `proto/user.proto`; `unspecified` menjaga enum 0.
export type UserRole = "user" | "creator" | "admin" | "unspecified";

// 2. Enum akun sosial untuk endpoint `/v1/users/me/connected-accounts`.
export type ConnectedPlatform =
  "instagram" | "linkedin" | "github" | "unspecified";

// 3. Respons pengalaman kerja dari endpoint GET/POST work experiences.
export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  description: string;
}

// 4. Input UI sebelum mapper membuat `UpsertWorkExperienceRequest` protobuf.
export interface UpsertWorkExperienceInput {
  id?: string;
  title: string;
  company: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  description: string;
}

// 5. Respons akun sosial yang sudah tersimpan pada profil user.
export interface ConnectedAccount {
  platform: ConnectedPlatform;
  handleOrUrl: string;
  verified: boolean;
  connectedAt: string;
}

// 6. Input UI untuk request upsert akun sosial berdasarkan platform.
export interface UpsertConnectedAccountInput {
  platform: ConnectedPlatform;
  handleOrUrl: string;
  verified?: boolean;
  connectedAt?: string;
}

// 7. Nested message `AboutMe` pada kontrak profil User.
export interface AboutMe {
  title: string;
  description: string;
}

// 8. Respons lengkap `GET /v1/users/me`, sumber state user frontend.
export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  headline: string;
  company: string;
  websiteUrl: string;
  avatarUrl: string;
  isOnboarded: boolean;
  role: UserRole;
  location: { country: string; city: string };
  workExperience: WorkExperience[];
  connectedAccounts: ConnectedAccount[];
  aboutMe: AboutMe;
  createdAt: string;
  updatedAt: string;
}

// Profil publik dari `GET /v1/users/public`; tidak memuat email atau role internal.
export interface PublicUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  headline: string;
  company: string;
  city: string;
  country: string;
  websiteUrl: string;
  avatarUrl: string;
  isOnboarded: boolean;
  role: string;
  aboutTitle: string;
  aboutDescription: string;
  joinAt: string;
  workExperience: WorkExperience[];
}

// 9. Input Account Settings untuk `PATCH /v1/users/me`.
export interface UpdateBasicInfoInput {
  firstName: string;
  lastName: string;
  headline: string;
  company: string;
  location: { country: string; city: string };
  websiteUrl: string;
  aboutMe: AboutMe;
  avatarReplaceMedia?: UploadedMedia;
}

// 10. Status pengajuan Creator terbaru dari `GET /v1/users/me/upgrade`.
export interface UpgradeStatus {
  status: "none" | "pending" | "approved" | "rejected" | "paid" | string;
  requestId: string;
  invoiceId: string;
  invoiceAmount: number;
  currency: string;
  rejectionReason: string;
  requestedAt: string;
  reviewedAt: string;
  paidAt: string;
}

// 11. Item timeline dari `GET /v1/users/upgrade-logs`.
export interface UpgradeLog {
  id: string;
  status: string;
  rejectionReason: string;
  requestedAt: string;
  reviewedAt: string;
}
