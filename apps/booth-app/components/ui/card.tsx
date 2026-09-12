import React from "react";
import {
  type GestureResponderEvent,
  Pressable,
  type PressableProps,
  View,
  type ViewProps,
} from "react-native";
import { Text, TextClassContext } from "@/components/ui/text";
import { BoothFeedback } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export interface CardProps extends ViewProps {
  variant?: "default" | "elevated" | "muted" | "double-bezel";
  onPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
}

const Card = React.forwardRef<View, CardProps>(
  (
    { className, variant = "default", onPress, disabled, children, ...props },
    ref,
  ) => {
    const isDoubleBezel = variant === "double-bezel";

    const variantStyles = {
      default: "bg-card border-border",
      elevated: "bg-card border-border border shadow-xs",
      muted: "bg-muted/40 border-border/60",
      "double-bezel": "bg-transparent border-0 p-0",
    }[variant];

    const safeChildren = React.Children.map(children, (child) => {
      if (typeof child === "string" || typeof child === "number") {
        return <Text className="text-foreground">{child}</Text>;
      }
      return child;
    });

    const innerContent = (
      <TextClassContext.Provider value="text-card-foreground">
        {safeChildren}
      </TextClassContext.Provider>
    );

    if (isDoubleBezel) {
      const content = (
        <View className="rounded-[1.75rem] p-1.5 bg-muted/30 border border-border/60 shadow-xs">
          <View
            className={cn(
              "rounded-[1.375rem] p-4 bg-card border border-border/40 shadow-xs",
              className,
            )}
          >
            {innerContent}
          </View>
        </View>
      );

      if (onPress) {
        return (
          <Pressable
            ref={ref}
            onPress={(e) => {
              if (disabled) return;
              void BoothFeedback.tap();
              onPress(e);
            }}
            disabled={disabled}
            accessibilityRole="button"
            className="active:opacity-85"
            {...(props as PressableProps)}
          >
            {content}
          </Pressable>
        );
      }

      return (
        <View ref={ref} {...props}>
          {content}
        </View>
      );
    }

    if (onPress) {
      return (
        <Pressable
          ref={ref}
          onPress={(e) => {
            if (disabled) return;
            void BoothFeedback.tap();
            onPress(e);
          }}
          disabled={disabled}
          accessibilityRole="button"
          className={cn(
            "flex flex-col rounded-2xl border p-4 active:opacity-75",
            variantStyles,
            className,
          )}
          {...(props as PressableProps)}
        >
          {innerContent}
        </Pressable>
      );
    }

    return (
      <View
        ref={ref}
        className={cn(
          "flex flex-col rounded-2xl border p-4",
          variantStyles,
          className,
        )}
        {...props}
      >
        {innerContent}
      </View>
    );
  },
);

Card.displayName = "Card";

function CardHeader({ className, ...props }: ViewProps) {
  return (
    <View className={cn("flex flex-col gap-1 mb-2", className)} {...props} />
  );
}

function CardTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) {
  return (
    <Text
      className={cn(
        "font-heading text-lg font-bold text-foreground leading-snug",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Text>) {
  return (
    <Text
      className={cn("text-muted-foreground text-sm leading-normal", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn("flex flex-col", className)} {...props} />;
}

function CardFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        "flex flex-row items-center justify-between mt-3 pt-3 border-t border-border/60",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
