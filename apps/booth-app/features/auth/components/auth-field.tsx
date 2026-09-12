import { Text, TextInput, type TextInputProps, View } from "react-native";
import { PlaceholderColor } from "@/constants/ui-colors";
import { cn } from "@/lib/utils";

type AuthFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
};

export function AuthField({
  label,
  helperText,
  className,
  ...props
}: AuthFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-base font-semibold text-foreground">{label}</Text>
      <TextInput
        placeholderTextColor={PlaceholderColor}
        className={cn(
          "min-h-[52px] rounded-[18px] border px-4 py-3 text-lg text-foreground",
          "border-[rgba(238,35,124,0.3)] bg-[rgba(238,35,124,0.05)]",
          className,
        )}
        {...props}
      />
      {helperText ? (
        <Text className="text-xs leading-[18px] text-muted-foreground">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
