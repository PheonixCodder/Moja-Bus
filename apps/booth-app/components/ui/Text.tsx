import type React from "react";
import { Text, type TextProps } from "react-native";
import { textStyles } from "@/constants/theme";
import { cn } from "@/lib/utils";

export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "bodyLg"
  | "bodyMd"
  | "bodySm"
  | "caption";

export interface BoothTextProps extends TextProps {
  variant?: TextVariant;
  children: React.ReactNode;
}

export function BoothText({
  variant = "bodyMd",
  children,
  className,
  ...props
}: BoothTextProps) {
  const variantClass = {
    h1: "text-h1",
    h2: "text-h2",
    h3: "text-h3",
    h4: "text-h4",
    bodyLg: "text-body-lg",
    bodyMd: "text-body-md",
    bodySm: "text-body-sm",
    caption: "text-caption",
  }[variant];

  return (
    <Text className={cn(variantClass, className)} {...props}>
      {children}
    </Text>
  );
}

export type { TextProps };
export { textStyles };
