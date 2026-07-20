"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@moja/ui/components/ui/avatar";
import { cn } from "@moja/ui/lib/utils";
import { getInitials, getAvatarColor } from "@/features/operator/lib/staff";

interface MemberAvatarProps {
  name: string | null | undefined;
  src?: string | null | undefined;
  size?: "sm" | "md" | "lg";
}

export function MemberAvatar({ name, src, size = "md" }: MemberAvatarProps) {
  const initials = getInitials(name);
  const color = getAvatarColor(name);
  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-[11px]"
      : size === "lg"
        ? "h-12 w-12 text-base"
        : "h-10 w-10 text-[13px]";
  return (
    <Avatar
      className={cn(
        "shrink-0 font-semibold text-white",
        sizeClass,
        color,
      )}
    >
      <AvatarImage src={src ?? undefined} alt={name ?? "Staff member"} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
