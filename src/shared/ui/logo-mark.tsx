import Image from "next/image";

import { cn } from "@/shared/lib/utils";

// Dua <Image> terpisah (bukan satu + CSS filter) supaya logo gelap/terang tetap
// tajam di kedua tema; hanya satu yang visible lewat dark:hidden / dark:block.
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <>
      <Image
        src="/logo/logo-light.png"
        alt="Priemman"
        width={112}
        height={112}
        className={cn("dark:hidden", className)}
        priority
      />
      <Image
        src="/logo/logo-dark.png"
        alt=""
        aria-hidden="true"
        width={112}
        height={112}
        className={cn("hidden dark:block", className)}
        priority
      />
    </>
  );
}
