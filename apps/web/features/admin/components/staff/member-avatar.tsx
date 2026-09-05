"use client";

import { UserAvatar } from "@moja/ui/components/ui/user-avatar";

interface AdminMemberAvatarProps {
  name: string | null | undefined;
  src?: string | null | undefined;
  size?: "sm" | "md" | "lg";
}

export function AdminMemberAvatar({
  name,
  src,
  size = "md",
}: AdminMemberAvatarProps) {
  return <UserAvatar name={name} src={src} seed={name} size={size} />;
}
