import type { ReactNode } from "react";
import {
  Image,
  type ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AuthShellProps = {
  badge?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  logoSource?: ImageSourcePropType;
};

export function AuthShell({
  badge,
  title,
  description,
  children,
  footer,
  logoSource,
}: AuthShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-start",
          paddingHorizontal: 24,
          paddingTop: insets.top + 56,
          paddingBottom: Math.max(insets.bottom, 24) + 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="w-full max-w-[420px] self-center gap-7">
          {logoSource ? (
            <View className="items-center mb-1">
              <Image
                source={logoSource}
                className="w-[170px] h-[62px]"
                resizeMode="contain"
              />
            </View>
          ) : (
            <View className="flex-row items-center gap-2 mb-1">
              <View className="w-2.5 h-2.5 rounded-full bg-primary" />
              <Text className="text-lg font-bold text-foreground">
                Moja Ride
              </Text>
            </View>
          )}

          {badge ? (
            <View className="self-start rounded-full border border-border bg-muted/60 px-4 py-2">
              <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                {badge}
              </Text>
            </View>
          ) : null}

          <View className="gap-3">
            <Text className="text-3xl font-extrabold leading-tight text-foreground">
              {title}
            </Text>
            <Text className="text-base leading-6 text-muted-foreground">
              {description}
            </Text>
          </View>

          {children}

          {footer ? <View className="pt-1">{footer}</View> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
