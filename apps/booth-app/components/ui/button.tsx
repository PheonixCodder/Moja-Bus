import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import {
  ActivityIndicator,
  type GestureResponderEvent,
  Pressable,
  Text,
  View,
} from "react-native";
import { TextClassContext } from "@/components/ui/text";
import { colors } from "@/constants/theme";
import { BoothFeedback } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group shrink-0 flex-row items-center justify-center gap-2 rounded-2xl border border-transparent shadow-none active:opacity-85",
  {
    variants: {
      variant: {
        default: "bg-primary active:bg-primary/90 border-primary/20",
        primary: "bg-primary active:bg-primary/90 border-primary/20",
        destructive:
          "bg-destructive active:bg-destructive/90 border-destructive/20",
        outline: "border-border bg-card active:bg-muted/60",
        secondary: "bg-secondary active:bg-secondary/80 border-border",
        ghost: "bg-transparent active:bg-muted/50",
        link: "bg-transparent border-transparent",
        success: "bg-emerald-600 active:bg-emerald-700 border-emerald-700/20",
        warning: "bg-amber-500 active:bg-amber-600 border-amber-600/20",
      },
      size: {
        default: "min-h-[48px] h-12 px-5 py-2.5 rounded-2xl",
        md: "min-h-[48px] h-12 px-5 py-2.5 rounded-2xl",
        sm: "min-h-[44px] h-11 gap-1.5 rounded-xl px-3.5",
        lg: "min-h-[56px] h-14 rounded-2xl px-6",
        icon: "min-h-[48px] min-w-[48px] h-12 w-12 rounded-2xl p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonTextVariants = cva(
  "text-sm font-semibold text-center tracking-tight",
  {
    variants: {
      variant: {
        default: "text-white font-bold",
        primary: "text-white font-bold",
        destructive: "text-white font-bold",
        outline: "text-foreground font-semibold",
        secondary: "text-secondary-foreground font-semibold",
        ghost: "text-foreground font-medium",
        link: "text-primary font-semibold underline",
        success: "text-white font-bold",
        warning: "text-white font-bold",
      },
      size: {
        default: "text-base",
        md: "text-base",
        sm: "text-sm",
        lg: "text-lg",
        icon: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof Pressable>,
    VariantProps<typeof buttonVariants> {
  title?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  trailingIslandIcon?: React.ReactNode;
  textClassName?: string;
}

const Button = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ButtonProps
>(
  (
    {
      className,
      variant = "default",
      size = "default",
      title,
      loading = false,
      icon,
      iconPosition = "left",
      trailingIslandIcon,
      disabled,
      onPress,
      children,
      textClassName,
      ...props
    },
    ref,
  ) => {
    const handlePress = (e: GestureResponderEvent) => {
      if (disabled || loading) return;
      void BoothFeedback.tap();
      onPress?.(e);
    };

    const isWhiteText =
      variant === "default" ||
      variant === "primary" ||
      variant === "destructive" ||
      variant === "success" ||
      variant === "warning";

    const spinnerColor = isWhiteText ? "#ffffff" : colors.neutral.textPrimary;

    return (
      <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
        <Pressable
          ref={ref}
          onPress={handlePress}
          disabled={disabled || loading}
          accessibilityRole="button"
          accessibilityState={{
            disabled: Boolean(disabled || loading),
            busy: Boolean(loading),
          }}
          className={cn(
            buttonVariants({ variant, size }),
            (disabled || loading) && "opacity-50",
            className,
          )}
          {...props}
        >
          {loading ? (
            <ActivityIndicator size="small" color={spinnerColor} />
          ) : (
            <>
              {icon && iconPosition === "left" ? icon : null}
              {title ? (
                <Text
                  className={cn(
                    buttonTextVariants({ variant, size }),
                    textClassName,
                  )}
                >
                  {title}
                </Text>
              ) : null}
              {typeof children === "function"
                ? children
                : React.Children.map(children, (child) => {
                    if (
                      typeof child === "string" ||
                      typeof child === "number"
                    ) {
                      return (
                        <Text
                          className={cn(
                            buttonTextVariants({ variant, size }),
                            textClassName,
                          )}
                        >
                          {child}
                        </Text>
                      );
                    }
                    return child;
                  })}
              {icon && iconPosition === "right" ? icon : null}
              {trailingIslandIcon ? (
                <View
                  className={cn(
                    "w-7 h-7 rounded-full items-center justify-center -mr-1.5 ml-2",
                    isWhiteText ? "bg-white/20" : "bg-primary/10",
                  )}
                >
                  {trailingIslandIcon}
                </View>
              ) : null}
            </>
          )}
        </Pressable>
      </TextClassContext.Provider>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonTextVariants, buttonVariants };
