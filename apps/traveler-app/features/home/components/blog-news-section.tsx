import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Book01Icon,
  Clock01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Colors, Palette } from "@/constants/theme";
import { useHomePrefetch } from "../hooks/use-home-prefetch";

interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  readingTime?: number;
  category?: { name: string; slug: string } | null;
}

interface BlogNewsSectionProps {
  posts?: BlogPostItem[];
}

export function BlogNewsSection({ posts }: BlogNewsSectionProps) {
  const { t } = useTranslation("home");
  const { prefetchArticle } = useHomePrefetch();

  if (!posts || posts.length === 0) return null;

  return (
    <View className="gap-3">
      {/* Section label — no emoji */}
      <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        {t("newsBlogTitle", "Travel News & Guides")}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {posts.map((post) => (
          <Pressable
            key={post.id}
            onPressIn={() => prefetchArticle(post.slug)}
            onPress={() => router.push(`/article/${post.slug}` as any)}
            className="will-change-pressable w-64 bg-card rounded-2xl border border-border overflow-hidden shadow-sm active:opacity-80"
          >
            {/* Thumbnail */}
            {post.coverImage ? (
              <View className="h-36 w-full bg-muted">
                <Image
                  source={{ uri: post.coverImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                {post.category && (
                  <View className="absolute top-2 left-2 bg-primary/90 px-2 py-0.5 rounded-full">
                    <Text className="text-xs font-black text-primary-foreground uppercase tracking-wider">
                      {post.category.name}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="h-36 w-full bg-primary/10 items-center justify-center">
                <HugeiconsIcon icon={Book01Icon} size={28} color={Palette.rose[500]} />
              </View>
            )}

            {/* Content */}
            <View className="p-3 gap-2">
              <Text
                className="text-sm font-bold text-foreground leading-snug"
                numberOfLines={2}
              >
                {post.title}
              </Text>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1">
                  <HugeiconsIcon icon={Clock01Icon} size={11} color={Colors.light.textMuted} />
                  <Text className="text-sm text-muted-foreground font-medium">
                    {post.readingTime || 3} min
                  </Text>
                </View>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={14}
                  color={Palette.rose[500]}
                />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
