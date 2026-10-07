// 1. Kontrak endpoint `POST /v1/auth/send-otp` dari `proto/auth.proto`.
//    Type ini adalah data dari UI email sebelum mapper mengubahnya ke protobuf.
export interface SendOtpInput {
  email: string;
}

// 2. Respons sukses milik endpoint `POST /v1/auth/send-otp`.
export interface SendOtpResult {
  success: boolean;
  message: string;
  cooldownSeconds: number;
}

// 3. Kontrak endpoint `POST /v1/auth/verify-otp`.
//    UI wajib memastikan `otp` berisi tepat enam digit sebelum request dibuat.
export interface VerifyOtpInput {
  email: string;
  otp: string;
}

// 4. Respons sukses milik endpoint `POST /v1/auth/verify-otp`.
//    Session utama berada di cookie HttpOnly; jangan simpan token ini di storage.
export interface VerifyOtpResult {
  sessionToken: string;
  isNewUser: boolean;
}

// 5. Provider untuk endpoint redirect `GET /v1/auth/{provider}`.
export type OAuthProvider = "google" | "github";
