import { View, Text, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon, Clock01Icon, User02Icon } from "@hugeicons/core-free-icons";

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
      <View className="flex-1 bg-white">
        {/* Navigation Header Bar */}
        <View
          style={{ paddingTop: insets.top + 8 }}
          className="flex-row items-center justify-between px-4 pb-3 border-b border-slate-100 bg-white"
        >
          <Pressable
            onPress={() => router.back()}
            className="size-9 rounded-full bg-slate-100 items-center justify-center"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#0f172a" />
          </Pressable>

          <Text className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
            {t("home:travelNewsHeader")}
          </Text>

          <View className="size-9" />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#ee237c" />
            <Text className="text-xs text-slate-500 mt-2 font-medium">
              {t("home:loadingArticle")}
            </Text>
          </View>
        ) : error || !post ? (
          <View className="flex-1 items-center justify-center p-6 text-center">
            <Text className="text-base font-bold text-slate-900 mb-1">
              {t("home:articleNotFound")}
            </Text>
            <Text className="text-xs text-slate-500 mb-4">
              {t("home:articleRemoved")}
            </Text>
            <Pressable
              onPress={() => router.back()}
              className="bg-slate-900 px-4 py-2 rounded-full"
            >
              <Text className="text-xs font-bold text-white">{t("common:goBack")}</Text>
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
              <View className="h-56 w-full bg-slate-100 relative">
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
                  <View className="bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                    <Text className="text-[10px] font-black text-rose-700 uppercase">
                      {post.category.name}
                    </Text>
                  </View>
                ) : <View />}

                <View className="flex-row items-center gap-1">
                  <HugeiconsIcon icon={Clock01Icon} size={12} color="#94a3b8" />
                  <Text className="text-xs text-slate-400 font-medium">
                    {t("home:minRead", { count: post.readingTime || 3 })}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {post.title}
              </Text>

              {/* Author Meta */}
              <View className="flex-row items-center gap-2.5 py-2 border-y border-slate-100">
                <View className="size-8 rounded-full bg-slate-200 overflow-hidden items-center justify-center">
                  {post.displayAuthorAvatar || post.author?.image ? (
                    <Image
                      source={{ uri: post.displayAuthorAvatar || post.author?.image }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <HugeiconsIcon icon={User02Icon} size={16} color="#64748b" />
                  )}
                </View>
                <View>
                  <Text className="text-xs font-bold text-slate-800">
                    {post.displayAuthorName || post.author?.fullName || "Moja Editorial"}
                  </Text>
                  <Text className="text-[10px] text-slate-400">
                    {t("home:publishedBy")}
                  </Text>
                </View>
              </View>

              {/* Excerpt */}
              {post.excerpt && (
                <Text className="text-sm font-semibold text-slate-700 italic bg-rose-50/50 p-3.5 rounded-xl border border-rose-100/60 leading-relaxed">
                  "{post.excerpt}"
                </Text>
              )}

              {/* Body Text */}
              <View className="pt-2">
                <Text className="text-sm text-slate-800 leading-relaxed font-normal">
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
