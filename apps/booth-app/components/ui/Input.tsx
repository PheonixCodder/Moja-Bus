import type React from "react";
import { useState } from "react";
import { Text, TextInput, type TextInputProps, View } from "react-native";
import { colors } from "@/constants/theme";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  containerClassName,
  onFocus,
  onBlur,
  placeholderTextColor,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={cn("w-full gap-1.5", containerClassName)}>
      {label ? (
        <Text className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
          {label}
        </Text>
      ) : null}

      <View
        className={cn(
          "flex-row items-center bg-card border rounded-2xl px-4 h-14",
          isFocused
            ? "border-primary bg-card"
            : error
              ? "border-destructive"
              : "border-border",
          className,
        )}
      >
        {leftIcon ? <View className="mr-2.5">{leftIcon}</View> : null}

        <TextInput
          placeholderTextColor={
            placeholderTextColor ?? colors.neutral.textMuted
          }
          className="flex-1 text-foreground font-medium text-sm h-full"
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {rightIcon ? <View className="ml-2.5">{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text className="text-[11px] font-medium text-destructive mt-0.5">
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-[11px] text-muted-foreground mt-0.5">{hint}</Text>
      ) : null}
    </View>
  );
}
