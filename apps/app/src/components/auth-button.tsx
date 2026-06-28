import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { Colors, Spacing } from "@/constants/theme";

type AuthButtonProps = {
  label: string;
  pendingLabel?: string;
  isPending?: boolean;
  onPress: () => void | Promise<void>;
  variant?: "primary" | "secondary";
  style?: ViewStyle;
};

export function AuthButton({
  label,
  pendingLabel,
  isPending = false,
  onPress,
  variant = "primary",
  style,
}: AuthButtonProps) {
  const isSecondary = variant === "secondary";

  return (
    <Pressable
      onPress={onPress}
      disabled={isPending}
      style={({ pressed }) => [
        styles.button,
        isSecondary ? styles.secondary : styles.primary,
        pressed && !isPending ? styles.pressed : null,
        isPending ? styles.disabled : null,
        style,
      ]}
    >
      {isPending ? (
        <>
          <ActivityIndicator color={isSecondary ? Colors.dark.text : Colors.dark.primaryForeground} />
          <Text style={[styles.label, isSecondary ? styles.secondaryLabel : styles.primaryLabel]}>
            {pendingLabel ?? label}
          </Text>
        </>
      ) : (
        <Text style={[styles.label, isSecondary ? styles.secondaryLabel : styles.primaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  primary: {
    backgroundColor: Colors.dark.primary,
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.7,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  primaryLabel: {
    color: Colors.dark.primaryForeground,
  },
  secondaryLabel: {
    color: Colors.dark.text,
  },
});
