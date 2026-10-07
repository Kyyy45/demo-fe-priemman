import { PRIEMMAN_API_VERSION } from "./config";
import { priemmanApiClient } from "./core/client";
import { encodeMessage } from "./core/protobuf";
import {
  parseAdminUsers,
  parseConfirmUpgradePaymentResponse,
  parseReviewUpgradeResponse,
  parseUpgradeRequests,
} from "./mappers/admin";
import type { UserRole } from "@/shared/lib/types/user";

export const MAX_REJECTION_REASON_LENGTH = 255;

function objectIdMessage(id: string) {
  return encodeMessage([{ field: 1, type: "string", value: id }]);
}

// 1. Endpoint `/admin/*` dipisahkan dari User agar batas domain tetap jelas.
export const adminService = {
  // Langkah 1 — GET daftar user memakai pagination backend dan filter role opsional.
  async listUsers(input: { limit?: number; offset?: number; role?: UserRole } = {}) {
    const search = new URLSearchParams({
      limit: String(Math.max(1, input.limit ?? 12)),
      offset: String(Math.max(0, input.offset ?? 0)),
    });
    if (input.role && input.role !== "unspecified") search.set("role", input.role);
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/admin/users?${search.toString()}`,
      undefined,
      { method: "GET" },
    );
    return parseAdminUsers(response);
  },

  async listUpgradeRequests(status = "pending") {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/admin/upgrades?${new URLSearchParams({ status }).toString()}`,
      undefined,
      { method: "GET" },
    );
    return parseUpgradeRequests(response);
  },

  async reviewUpgradeRequest(
    id: string,
    approve: boolean,
    rejectionReason = "",
  ) {
    const normalizedReason = rejectionReason.trim().slice(
      0,
      MAX_REJECTION_REASON_LENGTH,
    );
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/admin/upgrades/review`,
      encodeMessage([
        { field: 1, type: "message", value: objectIdMessage(id) },
        { field: 2, type: "bool", value: approve },
        { field: 3, type: "string", value: normalizedReason },
      ]),
      { method: "POST" },
    );
    return parseReviewUpgradeResponse(response);
  },

  async confirmUpgradePayment(id: string) {
    const response = await priemmanApiClient.requestProto(
      `${PRIEMMAN_API_VERSION}/admin/upgrades/confirm-payment`,
      encodeMessage([
        { field: 1, type: "message", value: objectIdMessage(id) },
      ]),
      { method: "POST" },
    );
    return parseConfirmUpgradePaymentResponse(response);
  },
};
