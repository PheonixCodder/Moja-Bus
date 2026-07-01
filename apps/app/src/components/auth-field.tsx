import {
  type TextInputProps,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors, Spacing } from "@/constants/theme";

type AuthFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
};

export function AuthField({
  label,
  helperText,
  style,
  ...props
}: AuthFieldProps) {
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
    borderColor: "rgba(238, 35, 124, 0.3)",
    backgroundColor: "rgba(238, 35, 124, 0.05)",
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
