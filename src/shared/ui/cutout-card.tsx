"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ComponentProps,
  type HTMLAttributes,
  type MouseEventHandler,
} from "react"
import Image from "next/image"
import { useControllableState } from "@radix-ui/react-use-controllable-state"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/shared/lib/utils"

// Shared Tokens

/** Border-only surface menjaga dashboard dan explore card tetap flat pada light serta dark mode. */
export const cutoutCardSurfaceShadowClassName = cn(
  "border border-border/80 dark:border-border/60",
  "shadow-none transition-[border-color] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-border hover:shadow-none"
)

export const cutoutCardSurfaceClassName = cn(
  "group/cutout relative isolate min-w-0 cursor-pointer overflow-hidden rounded-[28px] bg-card text-card-foreground [clip-path:inset(0_round_28px)]",
  cutoutCardSurfaceShadowClassName
)

/** Staggered text dan footer entrance digunakan di dalam `CutoutCardContent` bersama child `motion.div`. */
export function useCutoutContentStaggerVariants() {
  const reduceMotion = useReducedMotion()

  return useMemo(() => {
    if (reduceMotion) {
      return {
        container: {
          hidden: {},
          show: {
            transition: { staggerChildren: 0.03, delayChildren: 0 },
          },
        },
        item: {
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
          },
        },
      } as const
    }

    return {
      container: {
        hidden: {},
        show: {
          transition: { staggerChildren: 0.055, delayChildren: 0.06 },
        },
      },
      item: {
        hidden: { opacity: 0, y: 12, filter: "blur(5px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { type: "spring", duration: 0.48, bounce: 0.14 },
        },
      },
    } as const
  }, [reduceMotion])
}

const CORNER_PATH = "M0 200C155.996 199.961 200.029 156.308 200 0V200H0Z"

// Context menyediakan shared hover state bagi seluruh cutout primitive.

export interface CutoutCardContextValue {
  hovered: boolean
  setHovered: (next: boolean) => void
}

const CutoutCardContext = createContext<CutoutCardContextValue | null>(null)

export function useCutoutCard() {
  const ctx = useContext(CutoutCardContext)
  if (!ctx) {
    throw new Error("useCutoutCard must be used within <CutoutCard>")
  }
  return ctx
}

export function useOptionalCutoutCard() {
  return useContext(CutoutCardContext)
}

// Root mengelola semantic structure dan state ownership.

export type CutoutCardProps = Omit<
  ComponentProps<typeof motion.div>,
  "defaultValue"
> & {
  /** Jika ditetapkan, hover state dikendalikan oleh parent. */
  hovered?: boolean
  /** Initial hover state digunakan ketika component bersifat uncontrolled. */
  defaultHovered?: boolean
  /** Callback dipanggil setelah internal state berubah akibat pointer hover. */
  onHoveredChange?: (hovered: boolean) => void
  /**
   * Nilai true membuat pointer enter dan leave pada root memperbarui hover state.
   * Gunakan false ketika hover hanya dikendalikan secara programmatic atau melalui CSS.
   */
  trackPointerHover?: boolean
}

export function CutoutCard({
  className,
  hovered: hoveredProp,
  defaultHovered = false,
  onHoveredChange,
  trackPointerHover = true,
  onMouseEnter,
  onMouseLeave,
  children,
  ...props
}: CutoutCardProps) {
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = useControllableState({
    prop: hoveredProp,
    defaultProp: defaultHovered,
    onChange: onHoveredChange,
  })

  const setHoveredStable = useCallback(
    (next: boolean) => {
      setHovered(next)
    },
    [setHovered]
  )

  const ctx = useMemo<CutoutCardContextValue>(
    () => ({
      hovered: hovered ?? false,
      setHovered: setHoveredStable,
    }),
    [hovered, setHoveredStable]
  )

  const handleMouseEnter: MouseEventHandler<HTMLDivElement> = (e) => {
    onMouseEnter?.(e)
    if (e.defaultPrevented || !trackPointerHover) {
      return
    }
    setHoveredStable(true)
  }

  const handleMouseLeave: MouseEventHandler<HTMLDivElement> = (e) => {
    onMouseLeave?.(e)
    if (e.defaultPrevented || !trackPointerHover) {
      return
    }
    setHoveredStable(false)
  }

  return (
    <CutoutCardContext.Provider value={ctx}>
      <motion.div
        animate={{ opacity: 1 }}
        className={cn(className)}
        data-slot="cutout-card"
        data-state={ctx.hovered ? "hovered" : "idle"}
        initial={{ opacity: 0 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        transition={
          reduceMotion
            ? { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
            : { duration: 0.36, ease: [0.23, 1, 0.32, 1] }
        }
        {...props}
      >
        {children}
      </motion.div>
    </CutoutCardContext.Provider>
  )
}

// Layout primitive menyusun media, content, dan footer tanpa menetapkan data.

export type CutoutCardMediaProps = HTMLAttributes<HTMLDivElement>

export function CutoutCardMedia({ className, ...props }: CutoutCardMediaProps) {
  return (
    <div
      className={cn("relative isolate overflow-hidden [clip-path:inset(0)]", className)}
      data-slot="cutout-card-media"
      {...props}
    />
  )
}

export type CutoutCardImageProps = ComponentProps<typeof Image>

/** Mode `fill` digunakan secara default; parent `CutoutCardMedia` harus `relative` dan memiliki block size. */
export function CutoutCardImage({
  className,
  alt = "",
  fill = true,
  sizes = "(max-width: 768px) 100vw, 28rem",
  ...props
}: CutoutCardImageProps) {
  return (
    <Image
      alt={alt}
      className={cn(
        "scale-[1.002] object-cover [backface-visibility:hidden] [transform:translateZ(0)] transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/cutout:scale-105",
        fill && "h-full w-full",
        className
      )}
      data-slot="cutout-card-image"
      {...props}
      fill={fill}
      sizes={fill ? sizes : undefined}
    />
  )
}

export type CutoutCardOverlayProps = HTMLAttributes<HTMLDivElement>

export function CutoutCardOverlay({
  className,
  ...props
}: CutoutCardOverlayProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 bg-linear-to-t from-background/35 via-transparent to-transparent dark:from-background/50",
        className
      )}
      data-slot="cutout-card-overlay"
      {...props}
    />
  )
}

export type CutoutCardContentProps = HTMLAttributes<HTMLDivElement>

export function CutoutCardContent({
  className,
  ...props
}: CutoutCardContentProps) {
  return (
    <div
      className={cn("p-6", className)}
      data-slot="cutout-card-content"
      {...props}
    />
  )
}

export type CutoutCardFooterProps = HTMLAttributes<HTMLDivElement>

export function CutoutCardFooter({
  className,
  ...props
}: CutoutCardFooterProps) {
  return (
    <div
      className={cn("flex items-center justify-between", className)}
      data-slot="cutout-card-footer"
      {...props}
    />
  )
}

// Cutout geometry membentuk corner dan inset tanpa mengubah content flow.

export type CutoutCornerProps = ComponentProps<"svg"> & {
  /** Nilai pixel menentukan width dan height SVG viewBox berbentuk square. */
  size?: number
}

export function CutoutCorner({
  className,
  size = 32,
  viewBox = "0 0 200 200",
  ...props
}: CutoutCornerProps) {
  return (
    <>
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: corner mask bersifat decorative dan disembunyikan dari AT melalui aria-hidden */}
      <svg
        aria-hidden
        className={cn(className)}
        data-slot="cutout-corner"
        height={size}
        viewBox={viewBox}
        width={size}
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <path d={CORNER_PATH} fill="currentColor" />
      </svg>
    </>
  )
}

export type CutoutCardInsetLabelProps = HTMLAttributes<HTMLDivElement>

/** Strip berposisi absolute untuk label inset; corner ditempatkan sebagai sibling di dalamnya. */
export function CutoutCardInsetLabel({
  className,
  ...props
}: CutoutCardInsetLabelProps) {
  return (
    <div
      className={cn("absolute", className)}
      data-slot="cutout-card-inset-label"
      {...props}
    />
  )
}

export type CutoutCardPinProps = HTMLAttributes<HTMLDivElement>

/** Shell badge pada corner; elemen corner ditempatkan sebagai sibling di dalamnya. */
export function CutoutCardPin({ className, ...props }: CutoutCardPinProps) {
  return (
    <div
      className={cn("absolute", className)}
      data-slot="cutout-card-pin"
      {...props}
    />
  )
}

// Context menyediakan hover state yang sama bagi seluruh cutout primitive

export type CutoutCardActionProps = ComponentProps<typeof motion.div> & {
  /**
   * Nilai true membuat visibility mengikuti card hover dari context.
   * Gunakan false agar region selalu ditampilkan.
   */
  revealOnHover?: boolean
}

export function CutoutCardAction({
  className,
  revealOnHover = true,
  ...props
}: CutoutCardActionProps) {
  const { hovered } = useCutoutCard()
  const reduceMotion = useReducedMotion()
  const visible = !revealOnHover || hovered

  return (
    <motion.div
      animate={
        visible
          ? { opacity: 1, transform: "translateY(0px)" }
          : { opacity: 0, transform: "translateY(8px)" }
      }
      className={cn(
        "absolute",
        revealOnHover && !visible && "pointer-events-none",
        className
      )}
      data-reveal={revealOnHover ? "hover" : "always"}
      data-slot="cutout-card-action"
      transition={
        reduceMotion
          ? { duration: 0.15, ease: [0.23, 1, 0.32, 1] }
          : { duration: 0.24, ease: [0.23, 1, 0.32, 1] }
      }
      {...props}
    />
  )
}
