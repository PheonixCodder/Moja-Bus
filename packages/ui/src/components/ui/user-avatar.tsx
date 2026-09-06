"use client";

import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./avatar";
import { cn } from "#lib/utils";
import { getDicebearGlassUrl, getUserInitials } from "#lib/initials";

export interface UserAvatarProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Avatar>, "size"> {
  name?: string | null | undefined;
  src?: string | null | undefined;
  seed?: string | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  imageClassName?: string;
  fallbackClassName?: string;
  badge?: React.ReactNode;
}

const SIZE_CLASSES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-16 text-xl",
};

export function UserAvatar({
  name,
  src,
  seed,
  size = "md",
  className,
  imageClassName,
  fallbackClassName,
  badge,
  ...props
}: UserAvatarProps) {
  const [hasPhotoError, setHasPhotoError] = React.useState(false);
  const initials = getUserInitials(name);

  // If custom photo is present and hasn't errored, use it.
  // Otherwise, use DiceBear Glassy avatar with user-specific seed.
  const hasCustomPhoto = Boolean(src?.trim()) && !hasPhotoError;
  const dicebearUrl = React.useMemo(() => {
    return getDicebearGlassUrl(seed || name);
  }, [seed, name]);

  const activeSrc = hasCustomPhoto ? (src as string) : dicebearUrl;
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return (
    <Avatar
      className={cn(
        "relative shrink-0 select-none overflow-hidden rounded-full border border-border/40 shadow-xs",
        sizeClass,
        className,
      )}
      {...props}
    >
      <AvatarImage
        src={activeSrc}
        alt={name ?? "User avatar"}
        onError={() => {
          if (hasCustomPhoto) {
            setHasPhotoError(true);
          }
        }}
        className={cn("aspect-square size-full object-cover", imageClassName)}
      />
      <AvatarFallback
        className={cn(
          "flex size-full items-center justify-center font-bold uppercase bg-primary/10 text-primary",
          fallbackClassName,
        )}
      >
        {initials}
      </AvatarFallback>
      {badge}
    </Avatar>
  );
}
