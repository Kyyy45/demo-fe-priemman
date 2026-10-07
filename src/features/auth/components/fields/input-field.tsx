"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

import { EyeIcon, EyeOffIcon } from "../shared/icons";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  rightElement?: ReactNode;
  labelRight?: ReactNode;
}

export function InputField({
  id,
  label,
  rightElement,
  labelRight,
  className,
  required,
  ...props
}: InputFieldProps) {
  // 1. UI generic: LoginPage menentukan endpoint/schema, komponen ini hanya render field.
  return (
    <div className="flex flex-col gap-1.5">
      {/* 2. Label terhubung ke input melalui id agar aksesibel. */}
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="type-label font-medium text-copy-secondary"
        >
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
        {labelRight}
      </div>

      {/* 3. Native input menerima type, autocomplete, dan value dari parent form. */}
      <div className="relative">
        <input
          id={id}
          required={required}
          className={cn(
            "min-h-12 w-full rounded-[var(--radius-control)] border px-3",
            "bg-surface-raised type-body text-copy placeholder:text-copy-muted",
            "border-border-subtle outline-none transition-[border-color,box-shadow] duration-200 focus-visible:border-border-interactive focus-visible:ring-3 focus-visible:ring-brand/20",
            "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-copy-disabled aria-invalid:border-danger aria-invalid:ring-danger/20",
            rightElement && "pr-10",
            className,
          )}
          {...props}
        />
        {rightElement ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type PasswordFieldProps = Omit<InputFieldProps, "rightElement" | "type">;

export function PasswordField({
  id,
  label,
  labelRight,
  ...props
}: PasswordFieldProps) {
  // 4. State lokal hanya untuk visibilitas password; tidak terkait endpoint OTP.
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <InputField
      id={id}
      label={label}
      labelRight={labelRight}
      type={isPasswordVisible ? "text" : "password"}
      rightElement={
        /* 5. Tombol mengubah visibilitas tanpa mengubah nilai field. */
        <button
          type="button"
          aria-label={
            isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"
          }
          onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
          className="flex size-12 cursor-pointer items-center justify-center rounded-[var(--radius-control)] border-0 bg-transparent text-copy-secondary transition-colors hover:bg-surface-muted hover:text-heading active:translate-y-px active:bg-surface-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
        >
          {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
      {...props}
    />
  );
}
