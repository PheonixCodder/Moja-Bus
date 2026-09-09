import type React from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export interface CardProps extends ViewProps {
  variant?: "default" | "elevated" | "outline" | "highlight";
  children?: React.ReactNode;
}

export function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-card border border-border",
    elevated: "bg-card-elevated border border-border",
    outline: "bg-transparent border border-border",
    highlight: "bg-card border border-primary/30",
  }[variant];

  return (
    <View
      className={cn("rounded-2xl p-4", variantStyles, className)}
      {...props}
    >
      {children}
    </View>
  );
}
