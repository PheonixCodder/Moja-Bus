"use client";

import { UserAvatar } from "@moja/ui/components/ui/user-avatar";

interface MemberAvatarProps {
  name: string | null | undefined;
  src?: string | null | undefined;
  size?: "sm" | "md" | "lg";
}

export function MemberAvatar({ name, src, size = "md" }: MemberAvatarProps) {
  return <UserAvatar name={name} src={src} seed={name} size={size} />;
}
