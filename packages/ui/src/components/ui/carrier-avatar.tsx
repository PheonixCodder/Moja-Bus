"use client";

import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./avatar";
import { cn } from "#lib/utils";
import { getCompanyInitials } from "#lib/initials";

export interface CarrierAvatarProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Avatar>, "size"> {
  name: string | null | undefined;
  logoUrl?: string | null | undefined;
  shape?: "circle" | "rounded" | "square";
  size?: "sm" | "md" | "lg" | "xl";
  imageClassName?: string;
  fallbackClassName?: string;
}

const SIZE_CLASSES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-16 text-xl",
};

const SHAPE_CLASSES = {
  circle: "rounded-full after:rounded-full",
  rounded: "rounded-2xl after:rounded-2xl",
  square: "rounded-lg after:rounded-lg",
};

export function CarrierAvatar({
  name,
  logoUrl,
  shape = "circle",
  size = "md",
  className,
  imageClassName,
  fallbackClassName,
  ...props
}: CarrierAvatarProps) {
  const initials = getCompanyInitials(name);
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const shapeClass = SHAPE_CLASSES[shape] ?? SHAPE_CLASSES.circle;

  return (
    <Avatar
      className={cn(
        "shrink-0 font-bold tracking-tight bg-primary/10 border border-primary/20 text-primary shadow-xs",
        sizeClass,
        shapeClass,
        className,
      )}
      {...props}
    >
      {logoUrl ? (
        <AvatarImage
          src={logoUrl}
          alt={name ?? "Carrier logo"}
          className={cn("object-cover size-full", imageClassName)}
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "bg-primary/10 text-primary font-black flex size-full items-center justify-center select-none",
          fallbackClassName,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
