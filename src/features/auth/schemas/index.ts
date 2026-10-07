import { z } from "zod";

// 1. Schema form email sebelum UI memanggil `POST /v1/auth/send-otp`.
export const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

// 2. Schema form OTP sebelum UI memanggil `POST /v1/auth/verify-otp`.
export const verifyOtpSchema = emailSchema.extend({
  otp: z.string().regex(/^\d{6}$/, "Enter the six-digit verification code."),
});

// 3. Type form diturunkan dari schema agar validasi dan TypeScript selalu sinkron.
export type EmailInput = z.infer<typeof emailSchema>;
export type VerifyOtpFormInput = z.infer<typeof verifyOtpSchema>;
