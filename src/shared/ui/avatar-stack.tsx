import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarGroup,
  AvatarGroupCount,
} from "@/shared/ui/avatar";
import { cn } from "@/shared/lib/utils";

export interface AvatarStackItem {
  name: string;
  src?: string;
  fallback?: string;
}

export interface AvatarStackProps {
  avatars: AvatarStackItem[];
  max?: number;
  className?: string;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Menumpuk beberapa avatar dan menunjukkan sisanya sebagai badge "+N".
export function AvatarStack({ avatars, max = 4, className }: AvatarStackProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <AvatarGroup className={cn(className)}>
      {visible.map((avatar, i) => (
        <Avatar key={i} className="transition-transform hover:-translate-y-0.5">
          <AvatarImage src={avatar.src} alt={avatar.name} />
          <AvatarFallback>{avatar.fallback ?? getInitials(avatar.name)}</AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <AvatarGroupCount className="text-foreground font-medium">
          +{overflow}
        </AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}
