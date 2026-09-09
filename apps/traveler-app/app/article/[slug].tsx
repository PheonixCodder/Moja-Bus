import { View, Text, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, Clock01Icon, User02Icon } from "@hugeicons/core-free-icons";
import { Colors, Palette } from "@/constants/theme";
import { IconColors } from "@/constants/ui-colors";

export default function ArticleDetailScreen() {
  const { t } = useTranslation(["home", "common"]);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const trpc = useTRPC() as any;

  const { data: postData, isLoading, error } = useQuery({
    ...trpc.blog.getPostBySlug.queryOptions({ slug: slug || "" }),
    enabled: !!slug,
  });

  const post = postData as any;

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: "modal" }} />
      <View className="flex-1 bg-background">
        {/* Navigation Header Bar */}
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="flex-row items-center justify-between px-4 pb-3 border-b border-border bg-card"
        >
          <Pressable
            onPress={() => router.back()}
            className="size-9 rounded-full bg-muted items-center justify-center"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={IconColors.default} />
          </Pressable>

          <Text className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
            {t("home:travelNewsHeader")}
          </Text>

          <View className="size-9" />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={Palette.rose[500]} />
            <Text className="text-xs text-muted-foreground mt-2 font-medium">
              {t("home:loadingArticle")}
            </Text>
          </View>
        ) : error || !post ? (
          <View className="flex-1 items-center justify-center p-6 text-center">
            <Text className="text-base font-bold text-foreground mb-1">
              {t("home:articleNotFound")}
            </Text>
            <Text className="text-xs text-muted-foreground mb-4">
              {t("home:articleRemoved")}
            </Text>
            <Pressable
              onPress={() => router.back()}
              className="bg-primary px-4 py-2 rounded-full"
            >
              <Text className="text-xs font-bold text-primary-foreground">{t("common:goBack")}</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Cover Image */}
            {post.coverImage && (
              <View className="h-56 w-full bg-muted relative">
                <Image
                  source={{ uri: post.coverImage }}
                  className="w-full h-full object-cover"
                />
              </View>
            )}

            <View className="p-5 space-y-4">
              {/* Category & Reading Time Meta */}
              <View className="flex-row items-center justify-between">
                {post.category ? (
                  <View className="bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                    <Text className="text-[10px] font-black text-primary uppercase">
                      {post.category.name}
                    </Text>
                  </View>
                ) : <View />}

                <View className="flex-row items-center gap-1">
                  <HugeiconsIcon icon={Clock01Icon} size={12} color={IconColors.muted} />
                  <Text className="text-xs text-muted-foreground font-medium">
                    {t("home:minRead", { count: post.readingTime || 3 })}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text className="text-2xl font-black text-foreground tracking-tight leading-tight">
                {post.title}
              </Text>

              {/* Author Meta */}
              <View className="flex-row items-center gap-2.5 py-2 border-y border-border">
                <View className="size-8 rounded-full bg-muted overflow-hidden items-center justify-center">
                  {post.displayAuthorAvatar || post.author?.image ? (
                    <Image
                      source={{ uri: post.displayAuthorAvatar || post.author?.image }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <HugeiconsIcon icon={User02Icon} size={16} color={IconColors.muted} />
                  )}
                </View>
                <View>
                  <Text className="text-xs font-bold text-foreground">
                    {post.displayAuthorName || post.author?.fullName || "Moja Editorial"}
                  </Text>
                  <Text className="text-[10px] text-muted-foreground">
                    {t("home:publishedBy")}
                  </Text>
                </View>
              </View>

              {/* Excerpt */}
              {post.excerpt && (
                <Text className="text-sm font-semibold text-muted-foreground italic bg-muted/40 p-3.5 rounded-xl border border-border leading-relaxed">
                  "{post.excerpt}"
                </Text>
              )}

              {/* Body Text */}
              <View className="pt-2">
                <Text className="text-sm text-foreground leading-relaxed font-normal">
                  {post.content}
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </>
  );
}
