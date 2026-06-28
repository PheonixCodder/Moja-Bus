import { type ReactNode } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors, Spacing } from "@/constants/theme";

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  badge,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={styles.card}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  glowOne: {
    position: "absolute",
    top: -120,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(13, 148, 136, 0.22)",
  },
  glowTwo: {
    position: "absolute",
    top: 180,
    right: -100,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(14, 165, 233, 0.18)",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
    justifyContent: "center",
    gap: Spacing.five,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  badgeText: {
    color: Colors.dark.text,
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  hero: {
    gap: Spacing.three,
    maxWidth: 520,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  description: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    borderRadius: 28,
    padding: Spacing.five,
    backgroundColor: "rgba(4, 10, 17, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 20 },
    elevation: 8,
  },
  footer: {
    paddingTop: Spacing.one,
  },
});
