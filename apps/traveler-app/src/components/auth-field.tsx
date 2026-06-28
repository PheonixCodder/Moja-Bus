import { type TextInputProps, StyleSheet, Text, TextInput, View } from "react-native";

import { Colors, Spacing } from "@/constants/theme";

type AuthFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
};

export function AuthField({ label, helperText, style, ...props }: AuthFieldProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors.dark.textSecondary}
        style={[styles.input, style]}
        {...props}
      />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
  },
  label: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(2, 8, 15, 0.8)",
    color: Colors.dark.text,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  helper: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
