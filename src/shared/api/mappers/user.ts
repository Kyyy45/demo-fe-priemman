import {
  asBool,
  asBytes,
  asString,
  decodeMessage,
  encodeMessage,
} from "../core/protobuf";
import { normalizeAvatarUrl } from "@/shared/lib/avatar";
import type { UploadedMedia } from "@/shared/lib/types/media";
import type {
  AboutMe,
  ConnectedAccount,
  ConnectedPlatform,
  CurrentUser,
  PublicUserProfile,
  UpdateBasicInfoInput,
  UpgradeLog,
  UpgradeStatus,
  UpsertConnectedAccountInput,
  UpsertWorkExperienceInput,
  UserRole,
  WorkExperience,
} from "@/shared/lib/types/user";

type ProtoFields = ReturnType<typeof decodeMessage>;

// 1. Helper protobuf bersama untuk membaca field kontrak `user.proto`.
function getField(fields: ProtoFields, fieldNumber: number) {
  return fields.find((field) => field.field === fieldNumber)?.value;
}

// 2. Mengambil semua nested message berulang seperti experience dan social account.
function getRepeatedMessages(fields: ProtoFields, fieldNumber: number) {
  return fields
    .filter((field) => field.field === fieldNumber)
    .map((field) => decodeMessage(asBytes(field.value)));
}

// 3. Normalisasi scalar string agar field protobuf yang tidak ada menjadi string kosong.
function stringField(fields: ProtoFields, fieldNumber: number) {
  const value = getField(fields, fieldNumber);
  return value === undefined ? "" : asString(value);
}

// 4. Normalisasi scalar number untuk enum, timestamp, serta nominal upgrade.
function numberField(fields: ProtoFields, fieldNumber: number) {
  return Number(getField(fields, fieldNumber) ?? 0);
}

// 5. ObjectId backend adalah nested protobuf dengan nilai string pada field pertama.
function objectIdField(fields: ProtoFields, fieldNumber: number) {
  const value = getField(fields, fieldNumber);
  return value ? stringField(decodeMessage(asBytes(value)), 1) : "";
}

// 6. Timestamp protobuf dipetakan ke ISO string agar mudah dipakai UI dan input form.
function timestampField(fields: ProtoFields, fieldNumber: number) {
  const value = getField(fields, fieldNumber);
  if (!value) return "";

  const timestamp = decodeMessage(asBytes(value));
  const seconds = numberField(timestamp, 1);
  return seconds > 0 ? new Date(seconds * 1000).toISOString() : "";
}

// 7. Nilai tanggal form (`YYYY-MM` atau ISO) diubah menjadi Timestamp protobuf.
function timestampMessage(value: string) {
  if (!value) return undefined;
  const date =
    value.length === 7
      ? new Date(`${value}-01T00:00:00.000Z`)
      : new Date(value);
  const seconds = Math.floor(date.getTime() / 1000);
  return Number.isFinite(seconds) && seconds > 0
    ? encodeMessage([{ field: 1, type: "int64", value: seconds }])
    : undefined;
}

// 8. Semua request yang membutuhkan ObjectId memakai nested message yang konsisten.
function objectIdMessage(id: string) {
  return encodeMessage([{ field: 1, type: "string", value: id }]);
}

// 9. Enum role hanya diterjemahkan pada layer transport, bukan di komponen UI.
function roleFromProto(value: number): UserRole {
  if (value === 1) return "user";
  if (value === 2) return "creator";
  if (value === 3) return "admin";
  return "unspecified";
}

// 10. Enum platform selalu diubah pada batas transport, bukan di UI.
export function connectedPlatformFromProto(value: number): ConnectedPlatform {
  if (value === 1) return "instagram";
  if (value === 2) return "linkedin";
  if (value === 3) return "github";
  return "unspecified";
}

// 11. Encoder platform untuk POST/DELETE connected account.
export function connectedPlatformToProto(platform: ConnectedPlatform) {
  if (platform === "instagram") return 1;
  if (platform === "linkedin") return 2;
  if (platform === "github") return 3;
  return 0;
}

// 12. Encoder nested Location untuk `UpdateBasicInfoRequest`.
function locationMessage(location: UpdateBasicInfoInput["location"]) {
  return encodeMessage([
    { field: 1, type: "string", value: location.country },
    { field: 2, type: "string", value: location.city },
  ]);
}

// 13. Encoder nested AboutMe untuk `UpdateBasicInfoRequest`.
function aboutMeMessage(aboutMe: AboutMe) {
  return encodeMessage([
    { field: 1, type: "string", value: aboutMe.title },
    { field: 2, type: "string", value: aboutMe.description },
  ]);
}

// 14. Encoder Media hasil upload; backend memeriksa kepemilikan dan tipe gambarnya.
function mediaMessage(media: UploadedMedia) {
  return encodeMessage([
    { field: 1, type: "string", value: media.url },
    { field: 2, type: "int32", value: media.type },
    { field: 3, type: "int32", value: media.order },
    { field: 4, type: "message", value: objectIdMessage(media.id) },
    { field: 5, type: "string", value: media.publicId },
  ]);
}

// 15. Encoder request `PATCH /v1/users/me` mengikuti urutan field user.proto.
export function updateBasicInfoMessage(input: UpdateBasicInfoInput) {
  return encodeMessage([
    { field: 1, type: "string", value: input.firstName },
    { field: 2, type: "string", value: input.lastName },
    { field: 3, type: "string", value: input.headline },
    { field: 4, type: "string", value: input.company },
    { field: 5, type: "message", value: locationMessage(input.location) },
    { field: 6, type: "string", value: input.websiteUrl },
    { field: 7, type: "message", value: aboutMeMessage(input.aboutMe) },
    {
      field: 8,
      type: "message",
      value: input.avatarReplaceMedia
        ? mediaMessage(input.avatarReplaceMedia)
        : undefined,
    },
  ]);
}

// 16. Encoder `UpsertWorkExperienceRequest`; ID kosong berarti membuat entry baru.
export function workExperienceRequestMessage(input: UpsertWorkExperienceInput) {
  const entry = encodeMessage([
    { field: 1, type: "message", value: objectIdMessage(input.id ?? "") },
    { field: 2, type: "string", value: input.title },
    { field: 3, type: "string", value: input.company },
    { field: 4, type: "bool", value: input.isCurrent },
    { field: 5, type: "message", value: timestampMessage(input.startDate) },
    {
      field: 6,
      type: "message",
      value: input.isCurrent ? undefined : timestampMessage(input.endDate),
    },
    { field: 7, type: "string", value: input.description },
  ]);
  return encodeMessage([{ field: 1, type: "message", value: entry }]);
}

// 17. Encoder `DeleteWorkExperienceRequest` berdasarkan ObjectId entry.
export function deleteWorkExperienceRequestMessage(id: string) {
  return encodeMessage([
    { field: 1, type: "message", value: objectIdMessage(id) },
  ]);
}

// 18. Encoder `UpsertConnectedAccountRequest` untuk Instagram, LinkedIn, atau GitHub.
export function connectedAccountRequestMessage(
  input: UpsertConnectedAccountInput,
) {
  return encodeMessage([
    {
      field: 1,
      type: "int32",
      value: connectedPlatformToProto(input.platform),
    },
    { field: 2, type: "string", value: input.handleOrUrl },
    { field: 3, type: "bool", value: input.verified ?? false },
    {
      field: 4,
      type: "message",
      value: timestampMessage(input.connectedAt ?? ""),
    },
  ]);
}

// 19. Encoder delete account; backend menghapus data berdasarkan platform, bukan URL.
export function deleteConnectedAccountRequestMessage(
  platform: ConnectedPlatform,
) {
  return encodeMessage([
    { field: 1, type: "int32", value: connectedPlatformToProto(platform) },
  ]);
}

// 20. Decoder satu `WorkExperience` dari GET/POST endpoint experience.
export function parseWorkExperience(fields: ProtoFields): WorkExperience {
  return {
    id: objectIdField(fields, 1),
    title: stringField(fields, 2),
    company: stringField(fields, 3),
    isCurrent: asBool(getField(fields, 4) ?? 0),
    startDate: timestampField(fields, 5),
    endDate: timestampField(fields, 6),
    description: stringField(fields, 7),
  };
}

// 21. Decoder satu `ConnectedAccount` dari response endpoint social account.
export function parseConnectedAccount(fields: ProtoFields): ConnectedAccount {
  return {
    platform: connectedPlatformFromProto(numberField(fields, 1)),
    handleOrUrl: stringField(fields, 2),
    verified: asBool(getField(fields, 3) ?? 0),
    connectedAt: timestampField(fields, 4),
  };
}

// 22. Decoder nested AboutMe yang berada pada field 13 message User.
function parseAboutMe(fields: ProtoFields): AboutMe {
  return { title: stringField(fields, 1), description: stringField(fields, 2) };
}

// 23. Decoder `User` untuk respons `GET/PATCH /v1/users/me`.
export function parseCurrentUser(bytes: Uint8Array): CurrentUser {
  const fields = decodeMessage(bytes);
  const location = decodeMessage(
    asBytes(getField(fields, 7) ?? new Uint8Array()),
  );
  const aboutMe = decodeMessage(
    asBytes(getField(fields, 13) ?? new Uint8Array()),
  );
  return {
    id: objectIdField(fields, 1),
    email: stringField(fields, 2),
    firstName: stringField(fields, 3),
    lastName: stringField(fields, 4),
    headline: stringField(fields, 5),
    company: stringField(fields, 6),
    location: {
      country: stringField(location, 1),
      city: stringField(location, 2),
    },
    websiteUrl: stringField(fields, 8),
    avatarUrl: normalizeAvatarUrl(stringField(fields, 9)),
    isOnboarded: asBool(getField(fields, 10) ?? 0),
    workExperience: getRepeatedMessages(fields, 11).map(parseWorkExperience),
    connectedAccounts: getRepeatedMessages(fields, 12).map(
      parseConnectedAccount,
    ),
    aboutMe: parseAboutMe(aboutMe),
    createdAt: timestampField(fields, 14),
    updatedAt: timestampField(fields, 15),
    role: roleFromProto(numberField(fields, 16)),
  };
}

// Decoder `UserProfile` (user.proto) untuk profil public. Handler backend
// mengembalikan message ini langsung — field datar 1–15 dan work experience
// berulang di field 16 — bukan dibungkus di field 1 seperti asumsi lama.
export function parsePublicUserProfile(bytes: Uint8Array): PublicUserProfile {
  const profile = decodeMessage(bytes);
  return {
    id: objectIdField(profile, 1),
    email: stringField(profile, 2),
    firstName: stringField(profile, 3),
    lastName: stringField(profile, 4),
    headline: stringField(profile, 5),
    company: stringField(profile, 6),
    city: stringField(profile, 7),
    country: stringField(profile, 8),
    websiteUrl: stringField(profile, 9),
    avatarUrl: normalizeAvatarUrl(stringField(profile, 10)),
    isOnboarded: asBool(getField(profile, 11) ?? 0),
    role: stringField(profile, 12),
    aboutTitle: stringField(profile, 13),
    aboutDescription: stringField(profile, 14),
    joinAt: stringField(profile, 15),
    workExperience: getRepeatedMessages(profile, 16).map(parseWorkExperience),
  };
}

// 24. Decoder daftar experience dari `ListWorkExperienceResponse`.
export function parseWorkExperiences(bytes: Uint8Array) {
  return getRepeatedMessages(decodeMessage(bytes), 1).map(parseWorkExperience);
}

// 25. Decoder daftar social account dari `ListConnectedAccountsResponse`.
export function parseConnectedAccounts(bytes: Uint8Array) {
  return getRepeatedMessages(decodeMessage(bytes), 1).map(
    parseConnectedAccount,
  );
}

// 26. Decoder `DeleteResponse` yang dipakai endpoint delete experience/account.
export function parseDeleteResponse(bytes: Uint8Array) {
  return { success: asBool(getField(decodeMessage(bytes), 1) ?? 0) };
}

// 27. Decoder `UpgradeStatus` untuk status terbaru maupun nested response create request.
export function parseUpgradeStatusFields(fields: ProtoFields): UpgradeStatus {
  return {
    status: stringField(fields, 1),
    requestId: objectIdField(fields, 2),
    invoiceId: stringField(fields, 3),
    invoiceAmount: numberField(fields, 4),
    currency: stringField(fields, 5),
    rejectionReason: stringField(fields, 6),
    requestedAt: timestampField(fields, 7),
    reviewedAt: timestampField(fields, 8),
    paidAt: timestampField(fields, 9),
  };
}

// 28. Decoder respons `GET /v1/users/me/upgrade`.
export function parseUpgradeStatus(bytes: Uint8Array) {
  return parseUpgradeStatusFields(decodeMessage(bytes));
}

// 29. Decoder timeline `GET /v1/users/upgrade-logs`.
export function parseUpgradeLogs(bytes: Uint8Array): UpgradeLog[] {
  return getRepeatedMessages(decodeMessage(bytes), 1).map((fields) => ({
    id: objectIdField(fields, 1),
    status: stringField(fields, 2),
    rejectionReason: stringField(fields, 3),
    requestedAt: timestampField(fields, 4),
    reviewedAt: timestampField(fields, 5),
  }));
}

// 30. Decoder `CreateUpgradeRequestResponse` setelah POST request Creator berhasil.
export function parseCreatorUpgradeResponse(bytes: Uint8Array) {
  const fields = decodeMessage(bytes);
  const status = decodeMessage(
    asBytes(getField(fields, 2) ?? new Uint8Array()),
  );
  return {
    success: asBool(getField(fields, 1) ?? 0),
    status: parseUpgradeStatusFields(status),
  };
}
