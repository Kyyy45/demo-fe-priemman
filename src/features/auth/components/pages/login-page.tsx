"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/features/auth/components/layout/auth-shell";
import { InputField } from "@/features/auth/components/fields/input-field";
import { OtpInput } from "@/features/auth/components/fields/otp-input";
import { emailSchema, verifyOtpSchema } from "@/features/auth/schemas";
import {
  GitHubIcon,
  GoogleIcon,
} from "@/features/auth/components/shared/icons";
import { Button } from "@/shared/ui/button";
import { LanguageToggle } from "@/shared/ui/language-toggle";
import { ModeToggle } from "@/shared/ui/mode-toggle";
import { useT } from "@/shared/providers/language-provider";
import {
  ApiError,
  authService,
  getErrorMessage,
  userService,
} from "@/shared/api";
import type { UserRole } from "@/shared/lib/types/user";
import type { OAuthProvider } from "@/shared/lib/types/auth";

// 1. Dua langkah UI untuk flow email OTP: send-otp lalu verify-otp.
type Step = "email" | "verify";

// 1a. Fallback cooldown bila respons backend belum memberi nilai cooldown_seconds.
const RESEND_COOLDOWN = 30;

// Tombol Auth memakai tinggi yang sama dengan field input agar satu form
// memiliki rhythm visual konsisten, tanpa mengubah primitive Button global.
const authSubmitButtonClassName = "h-12 min-h-12 w-full";

// 2. Helper redirect setelah Auth berhasil; role berasal dari `GET /v1/users/me`.
function dashboardPathForRole(role: UserRole) {
  if (role === "admin") return "/dashboard-admin";
  if (role === "creator") return "/dashboard-creator";
  return "/dashboard";
}

function getRequestedRedirectPath() {
  if (typeof window === "undefined") return null;

  const nextPath = new URLSearchParams(window.location.search).get("next");
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null;
  }

  return nextPath;
}

async function getSafeRedirectPath() {
  const requestedPath = getRequestedRedirectPath();
  if (requestedPath) return requestedPath;

  try {
    // 2a. Cookie session dari verify OTP/OAuth dipakai untuk mengenali role user.
    const user = await userService.getMe();
    return dashboardPathForRole(user.role);
  } catch {
    return "/dashboard";
  }
}

export default function LoginPage() {
  // 3. State UI hanya menyimpan data form dan status request, bukan session token.
  const t = useT();
  const s = t.signInPage;

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const verifyingRef = useRef(false);

  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 4. Mengunci tombol resend sesuai `cooldown_seconds` dari SendOtpResponse.
  const startCooldown = (seconds = RESEND_COOLDOWN) => {
    setCooldown(seconds);
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  // 5. Membersihkan timer agar tidak ada interval tersisa saat halaman ditutup.
  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  // 6. Jika cookie session masih valid, lewati halaman login dan redirect user.
  useEffect(() => {
    let active = true;

    authService.hasActiveSession().then(async (hasSession) => {
      if (active && hasSession) {
        window.location.replace(await getSafeRedirectPath());
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // 7. Menerjemahkan code `common.proto: Result` ke pesan yang ramah untuk UI.
  const getAuthErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof ApiError) {
      const code = error.code?.toLowerCase();

      if (error.status === 429 || code === "rate_limited") {
        return s.errors.rateLimited;
      }

      if (code === "invalid_or_expired_otp") {
        return s.errors.otpExpired;
      }

      if (code === "invalid_otp_code") {
        return s.errors.invalidOtp;
      }

      if (code === "email_suspended" || code === "ip_suspended") {
        return s.errors.rateLimited;
      }
    }

    return getErrorMessage(error, fallback);
  };

  // 8. Handler UI email -> SendOtpRequest -> POST /v1/auth/send-otp.
  const onSubmitEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!email.trim()) {
      toast.error(s.errors.identifierRequired);
      return;
    }
    if (!emailSchema.safeParse({ email }).success) {
      toast.error(s.errors.invalidEmail);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    const toastId = toast.info(s.toasts.sendingCode);

    try {
      const result = await authService.sendOtp({ email: email.trim() });
      setStep("verify");
      startCooldown(result.cooldownSeconds || RESEND_COOLDOWN);
      toast.success(s.toasts.codeSentTitle, {
        id: toastId,
        description: s.toasts.codeSentDescription,
      });
    } catch (error) {
      const message = getAuthErrorMessage(error, s.errors.sendFailed);
      toast.error(s.toasts.sendFailedTitle, {
        id: toastId,
        description: message,
      });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // 9. Handler UI OTP -> VerifyOtpRequest -> POST /v1/auth/verify-otp.
  const onSubmitOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (verifyingRef.current) return;

    const cleanOtp = otp.replace(/\D/g, "");
    if (!verifyOtpSchema.safeParse({ email, otp: cleanOtp }).success) {
      toast.error(s.errors.otpRequired);
      return;
    }

    verifyingRef.current = true;
    setVerifying(true);
    const toastId = toast.info(s.toasts.verifying);

    try {
      // 9a. Browser menerima session cookie melalui header Set-Cookie respons ini.
      await authService.verifyOtp({ email: email.trim(), otp: cleanOtp });
      toast.success(s.toasts.verifiedTitle, {
        id: toastId,
        description: s.toasts.verifiedDescription,
      });
      window.location.replace(await getSafeRedirectPath());
    } catch (error) {
      const message = getAuthErrorMessage(error, s.errors.invalidOtp);
      toast.error(s.toasts.verificationFailedTitle, {
        id: toastId,
        description: message,
      });
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  };

  // 10. Resend memakai endpoint send OTP yang sama setelah cooldown selesai.
  const onResend = async () => {
    if (cooldown > 0 || submittingRef.current || verifyingRef.current) return;
    setOtp("");
    submittingRef.current = true;
    const toastId = toast.info(s.toasts.resendingCode);

    try {
      const result = await authService.sendOtp({ email: email.trim() });
      startCooldown(result.cooldownSeconds || RESEND_COOLDOWN);
      toast.success(s.toasts.codeResentTitle, {
        id: toastId,
        description: s.toasts.codeResentDescription,
      });
    } catch (error) {
      const message = getAuthErrorMessage(error, s.errors.rateLimited);
      toast.error(s.toasts.sendFailedTitle, {
        id: toastId,
        description: message,
      });
    } finally {
      submittingRef.current = false;
    }
  };

  // 11. Kembali ke langkah email dan membuang OTP/timer milik email sebelumnya.
  const onChangeEmail = () => {
    setStep("email");
    setOtp("");
    if (timerRef.current) clearInterval(timerRef.current);
    setCooldown(0);
  };

  // 12. OAuth memakai redirect browser ke GET /v1/auth/{provider}, bukan fetch.
  const onOAuth = (provider: OAuthProvider, providerLabel: string) => {
    toast.info(s.toasts.oauthRedirect.replace("{provider}", providerLabel));
    window.location.href = authService.getOAuthUrl(provider);
  };

  // 13. UI langkah verifikasi: field OTP, submit verify, resend, dan ganti email.
  if (step === "verify") {
    return (
      <div className="relative">
        <AuthShell
          heading={
            <>
              {s.verify.headingBefore}{" "}
              <span className="font-accent-serif text-brand">
                {s.verify.headingAccent}
              </span>
            </>
          }
          subtitle={`${s.verify.subtitle} ${email}`}
          actions={
            <>
              <LanguageToggle />
              <ModeToggle />
            </>
          }
        >
          <form
            className="flex flex-col gap-5 text-left"
            onSubmit={onSubmitOtp}
            noValidate
          >
            <p className="type-label text-center text-copy-secondary">
              {s.verify.subtitle}{" "}
              <span className="font-semibold text-copy break-all">{email}</span>
              <br />
              {s.verify.subtitleNote}
            </p>

            <div className="flex flex-col items-center gap-2">
              <OtpInput value={otp} onChange={setOtp} disabled={verifying} />
            </div>

            <Button
              className={authSubmitButtonClassName}
              disabled={verifying || otp.length < 6}
              type="submit"
            >
              {verifying ? s.verify.processing : s.verify.submit}
            </Button>

            <div className="flex flex-col items-center gap-1 type-label text-copy-secondary">
              <span>{s.verify.didntReceive}</span>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={onResend}
                  disabled={cooldown > 0}
                  className="min-h-12 rounded-[var(--radius-control)] px-2 font-medium text-brand underline-offset-4 transition-opacity hover:underline active:translate-y-px disabled:cursor-not-allowed disabled:text-copy-disabled disabled:no-underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                >
                  {cooldown > 0
                    ? `${s.verify.resendIn} ${cooldown}s`
                    : s.verify.resend}
                </button>
                <span className="text-copy-muted select-none">·</span>
                <button
                  type="button"
                  onClick={onChangeEmail}
                  className="min-h-12 rounded-[var(--radius-control)] px-2 font-medium text-copy underline-offset-4 transition-opacity hover:underline active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                >
                  {s.verify.changeEmail}
                </button>
              </div>
            </div>
          </form>
        </AuthShell>
      </div>
    );
  }

  // 14. UI langkah awal: OAuth redirect dan form email untuk send OTP.
  return (
    <div className="relative">
      <AuthShell
        heading={
          <>
            {s.headingBefore}{" "}
            <span className="font-accent-serif text-brand">
              {s.headingAccent}
            </span>
          </>
        }
        subtitle={s.subtitle}
        actions={
          <>
            <LanguageToggle />
            <ModeToggle />
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Button
            className={authSubmitButtonClassName}
            onClick={() => onOAuth("google", "Google")}
            type="button"
            variant="outline"
          >
            <span className="inline-flex size-4.5 items-center justify-center">
              <GoogleIcon />
            </span>
            <span>{s.google}</span>
          </Button>

          <Button
            className={authSubmitButtonClassName}
            onClick={() => onOAuth("github", "GitHub")}
            type="button"
            variant="outline"
          >
            <span className="inline-flex size-4.5 items-center justify-center">
              <GitHubIcon />
            </span>
            <span>{s.github}</span>
          </Button>

          <div className="flex items-center gap-4 type-metadata font-medium uppercase tracking-wider text-copy-secondary before:flex-1 before:border-t before:border-border-subtle after:flex-1 after:border-t after:border-border-subtle">
            {s.or}
          </div>

          <form
            className="flex flex-col gap-3 text-left"
            onSubmit={onSubmitEmail}
            noValidate
          >
            <InputField
              id="identifier"
              label={s.emailLabel}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={s.emailPlaceholder}
              required
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Button
              className={authSubmitButtonClassName}
              disabled={submitting}
              type="submit"
            >
              {submitting ? s.processing : s.submit}
            </Button>
          </form>
        </div>
      </AuthShell>
    </div>
  );
}
