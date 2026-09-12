import React from "react";
import { Text, TextInput, type TextInputProps, View } from "react-native";
import { PlaceholderColor } from "@/constants/ui-colors";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  error?: string | boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      className,
      containerClassName,
      error,
      leftIcon,
      rightIcon,
      placeholderTextColor = PlaceholderColor,
      editable,
      ...props
    },
    ref,
  ) => {
    const hasError = Boolean(error);

    return (
      <View className={cn("w-full flex-col gap-1.5", containerClassName)}>
        <View
          className={cn(
            "flex-row items-center w-full min-h-[48px] h-12 px-4 rounded-2xl border bg-card",
            hasError ? "border-destructive" : "border-border",
            editable === false && "opacity-50 bg-muted/40",
            className,
          )}
        >
          {leftIcon ? (
            <View className="mr-3 shrink-0 items-center justify-center">
              {leftIcon}
            </View>
          ) : null}

          <TextInput
            ref={ref}
            editable={editable}
            placeholderTextColor={placeholderTextColor}
            className="flex-1 text-base text-foreground font-sans p-0 m-0 leading-5"
            {...props}
          />

          {rightIcon ? (
            <View className="ml-3 shrink-0 items-center justify-center">
              {rightIcon}
            </View>
          ) : null}
        </View>

        {typeof error === "string" && error ? (
          <Text className="text-xs text-destructive font-medium px-1">
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = "Input";

export { Input };
