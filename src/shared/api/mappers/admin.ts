import { asBool, asBytes, asString, decodeMessage } from "../core/protobuf";
import type {
  AdminUserEntry,
  AdminUsersResult,
  UpgradeRequestEntry,
} from "@/shared/lib/types/admin";
import type { UserRole } from "@/shared/lib/types/user";

type ProtoFields = ReturnType<typeof decodeMessage>;

// Alur mapper Admin: decode wrapper protobuf, normalisasi ObjectId/timestamp
// dan enum role, lalu expose tipe domain yang aman untuk dashboard.

function getField(fields: ProtoFields, fieldNumber: number) {
  return fields.find((field) => field.field === fieldNumber)?.value;
}

function stringField(fields: ProtoFields, fieldNumber: number) {
  const value = getField(fields, fieldNumber);
  return value === undefined ? "" : asString(value);
}

function numberField(fields: ProtoFields, fieldNumber: number) {
  return Number(getField(fields, fieldNumber) ?? 0);
}

function objectIdField(fields: ProtoFields, fieldNumber: number) {
  const value = getField(fields, fieldNumber);
  return value ? stringField(decodeMessage(asBytes(value)), 1) : "";
}

function timestampField(fields: ProtoFields, fieldNumber: number) {
  const value = getField(fields, fieldNumber);
  if (!value) return "";
  const timestamp = decodeMessage(asBytes(value));
  const seconds = numberField(timestamp, 1);
  return seconds > 0 ? new Date(seconds * 1000).toISOString() : "";
}

function roleFromProto(value: number): UserRole {
  if (value === 1) return "user";
  if (value === 2) return "creator";
  if (value === 3) return "admin";
  return "unspecified";
}

function repeatedMessages(fields: ProtoFields, fieldNumber: number) {
  return fields
    .filter((field) => field.field === fieldNumber)
    .map((field) => decodeMessage(asBytes(field.value)));
}

export function parseAdminUsers(bytes: Uint8Array): AdminUsersResult {
  // 1. Daftar user memakai repeated entry pada field pertama dan metadata
  // pagination pada field kedua sampai keempat.
  const fields = decodeMessage(bytes);
  const users: AdminUserEntry[] = repeatedMessages(fields, 1).map((entry) => ({
    id: objectIdField(entry, 1),
    email: stringField(entry, 2),
    firstName: stringField(entry, 3),
    lastName: stringField(entry, 4),
    role: roleFromProto(numberField(entry, 5)),
    createdAt: timestampField(entry, 6),
  }));
  return {
    users,
    total: numberField(fields, 2),
    limit: numberField(fields, 3),
    offset: numberField(fields, 4),
  };
}

export function parseUpgradeRequest(fields: ProtoFields): UpgradeRequestEntry {
  // 2. Upgrade request mempertahankan invoice dan alasan penolakan untuk
  // kebutuhan review serta konfirmasi pembayaran Admin.
  return {
    id: objectIdField(fields, 1),
    userId: objectIdField(fields, 2),
    email: stringField(fields, 3),
    status: stringField(fields, 4),
    invoiceId: stringField(fields, 5),
    invoiceAmount: numberField(fields, 6),
    currency: stringField(fields, 7),
    rejectionReason: stringField(fields, 8),
    requestedAt: timestampField(fields, 9),
  };
}

export function parseUpgradeRequests(bytes: Uint8Array) {
  return repeatedMessages(decodeMessage(bytes), 1).map(parseUpgradeRequest);
}

export function parseReviewUpgradeResponse(bytes: Uint8Array) {
  // 3. Review mengembalikan status mutasi dan request yang sudah diperbarui.
  const fields = decodeMessage(bytes);
  const request = decodeMessage(
    asBytes(getField(fields, 2) ?? new Uint8Array()),
  );
  return {
    success: asBool(getField(fields, 1) ?? 0),
    request: parseUpgradeRequest(request),
  };
}

export function parseConfirmUpgradePaymentResponse(bytes: Uint8Array) {
  // 4. Confirm payment mengembalikan status sukses dan user yang di-upgrade.
  const fields = decodeMessage(bytes);
  return {
    success: asBool(getField(fields, 1) ?? 0),
    userId: objectIdField(fields, 2),
  };
}
