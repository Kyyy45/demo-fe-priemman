import type { UserRole } from "./user";

/** Kontrak endpoint `GET /v1/admin/users`. */
export interface AdminUserEntry {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
}

/** Respons paginasi endpoint `GET /v1/admin/users`. */
export interface AdminUsersResult {
  users: AdminUserEntry[];
  total: number;
  limit: number;
  offset: number;
}

/** Kontrak request Creator yang dipakai endpoint Admin upgrade. */
export interface UpgradeRequestEntry {
  id: string;
  userId: string;
  email: string;
  status: string;
  invoiceId: string;
  invoiceAmount: number;
  currency: string;
  rejectionReason: string;
  requestedAt: string;
}
