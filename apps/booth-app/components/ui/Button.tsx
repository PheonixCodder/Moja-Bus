import type React from "react";
import {
  ActivityIndicator,
  type GestureResponderEvent,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
  View,
} from "react-native";
import { colors } from "@/constants/theme";
import { BoothFeedback } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export interface ButtonProps extends TouchableOpacityProps {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "success"
    | "warning";
  size?: "sm" | "md" | "lg";
  title?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children?: React.ReactNode;
  textClassName?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  title,
  loading = false,
  icon,
  iconPosition = "left",
  disabled,
  onPress,
  children,
  className,
  textClassName,
  ...props
}: ButtonProps) {
  const handlePress = (e: GestureResponderEvent) => {
    if (disabled || loading) return;
    BoothFeedback.tap();
    onPress?.(e);
  };

  const variantStyles = {
    primary: "bg-primary active:bg-primary-dark border-transparent",
    secondary: "bg-secondary active:bg-accent border-transparent",
    outline: "bg-transparent active:bg-card border-border",
    ghost: "bg-transparent active:bg-card border-transparent",
    destructive: "bg-destructive active:opacity-90 border-transparent",
    success: "bg-success active:opacity-90 border-transparent",
    warning: "bg-warning active:opacity-90 border-transparent",
  }[variant];

  const sizeStyles = {
    sm: "min-h-[44px] h-11 px-3.5 rounded-xl",
    md: "min-h-[48px] h-12 px-5 rounded-2xl",
    lg: "min-h-[56px] h-14 px-6 rounded-2xl",
  }[size];

  const textVariantStyles = {
    primary: "text-primary-foreground font-bold",
    secondary: "text-secondary-foreground font-semibold",
    outline: "text-foreground font-semibold",
    ghost: "text-muted-foreground font-medium",
    destructive: "text-destructive-foreground font-bold",
    success: "text-success-foreground font-bold",
    warning: "text-warning-foreground font-bold",
  }[variant];

  const textSizeStyles = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{
        disabled: Boolean(disabled || loading),
        busy: Boolean(loading),
      }}
      activeOpacity={0.8}
      className={cn(
        "flex-row items-center justify-center border",
        variantStyles,
        sizeStyles,
        disabled && "opacity-45",
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost"
              ? colors.neutral.textPrimary
              : variant === "warning"
                ? colors.neutral.background
                : colors.neutral.background
          }
          size="small"
        />
      ) : (
        <View className="flex-row items-center justify-center gap-2">
          {icon && iconPosition === "left" ? icon : null}
          {title ? (
            <Text
              className={cn(textVariantStyles, textSizeStyles, textClassName)}
            >
              {title}
            </Text>
          ) : null}
          {children}
          {icon && iconPosition === "right" ? icon : null}
        </View>
      )}
    </TouchableOpacity>
  );
}
