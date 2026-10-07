"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

import { cn } from "@/shared/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  length?: number;
}

export function OtpInput({
  value,
  onChange,
  disabled,
  length = 6,
}: OtpInputProps) {
  // 1. Menyimpan setiap field agar fokus OTP berpindah otomatis.
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // 2. Mengubah value dari parent menjadi susunan digit untuk UI enam field.
  const digits = value.padEnd(length, "").slice(0, length).split("");

  // 3. Mengirim OTP terbaru ke LoginPage untuk validasi dan request verify.
  const update = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").trimEnd());
  };

  // 4. Helper navigasi fokus antar field OTP.
  const focusNext = (index: number) => {
    inputsRef.current[index + 1]?.focus();
  };

  const focusPrev = (index: number) => {
    inputsRef.current[index - 1]?.focus();
  };

  // 5. Mengatur Backspace dan tombol panah tanpa membiarkan fokus keluar field.
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        update(index, "");
      } else {
        focusPrev(index);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusPrev(index);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusNext(index);
    }
  };

  // 6. Menerima satu angka agar `VerifyOtpRequest.otp` selalu numerik.
  const handleInput = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    if (!char) return;
    update(index, char);
    if (index < length - 1) focusNext(index);
  };

  // 7. Mendukung paste kode enam digit dari email atau password manager.
  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    onChange(pasted);

    // 7a. Memindahkan fokus ke digit terakhir yang berhasil diisi.
    const nextFocus = Math.min(pasted.length, length - 1);
    inputsRef.current[nextFocus]?.focus();
  };

  return (
    <div
      aria-label="Verification code"
      className="flex max-w-full items-center justify-center gap-1 min-[390px]:gap-2 m3-medium:gap-3"
      role="group"
    >
      {/* 8. Enam field ini adalah UI untuk `VerifyOtpRequest.otp` (6 digit). */}
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="\d*"
          maxLength={1}
          value={digits[index] || ""}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          onChange={(event) => handleInput(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={cn(
            "size-12 text-center font-mono type-card-title tabular-nums",
            "rounded-[var(--radius-control)] border border-border-subtle bg-surface-raised text-heading",
            "caret-transparent outline-none transition-[border-color,background-color,box-shadow] duration-200 focus-visible:border-border-interactive focus-visible:ring-3 focus-visible:ring-brand/20",
            digits[index] && "border-brand/60 bg-brand/5",
            disabled &&
              "cursor-not-allowed border-border-subtle bg-surface-muted text-copy-disabled",
          )}
        />
      ))}
    </div>
  );
}
