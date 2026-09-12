import { Slot } from "@rn-primitives/slot";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { Text, View } from "react-native";
import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "shrink-0 flex-row items-center justify-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-0.5",
  {
    variants: {
      variant: {
        default: "bg-primary/10 border-primary/20",
        secondary: "bg-secondary border-border",
        destructive: "bg-destructive/15 border-destructive/30",
        success: "bg-emerald-50 border-emerald-200",
        warning: "bg-amber-50 border-amber-200",
        info: "bg-blue-50 border-blue-200",
        outline: "bg-transparent border-border",
        // Booth Domain Specific Badges
        intercity: "bg-blue-50 border-blue-200",
        urban: "bg-amber-50 border-amber-200",
        cash: "bg-emerald-50 border-emerald-200",
        offline: "bg-amber-100 border-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const badgeTextVariants = cva("text-xs font-semibold tracking-tight", {
  variants: {
    variant: {
      default: "text-primary",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive",
      success: "text-emerald-700",
      warning: "text-amber-700",
      info: "text-blue-700",
      outline: "text-foreground",
      intercity: "text-blue-700",
      urban: "text-orange-700",
      cash: "text-emerald-700",
      offline: "text-amber-800",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.ComponentPropsWithoutRef<typeof View>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  label?: string;
  icon?: React.ReactNode;
}

function Badge({
  className,
  variant = "default",
  asChild,
  label,
  icon,
  children,
  ...props
}: BadgeProps) {
  const Component = asChild ? Slot : View;
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <Component
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      >
        {icon}
        {label ? (
          <Text className={badgeTextVariants({ variant })}>{label}</Text>
        ) : null}
        {React.Children.map(children, (child) => {
          if (typeof child === "string" || typeof child === "number") {
            return (
              <Text className={badgeTextVariants({ variant })}>{child}</Text>
            );
          }
          return child;
        })}
      </Component>
    </TextClassContext.Provider>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
