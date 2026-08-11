import { View, Text, Pressable, Image, ScrollView } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Book01Icon, Clock01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";

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
  if (!posts || posts.length === 0) return null;

  return (
    <View className="space-y-3 pt-2">
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
          Travel News & Guides 📰
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {posts.map((post) => (
          <Pressable
            key={post.id}
            onPress={() => router.push(`/article/${post.slug}` as any)}
            className="w-64 mr-3 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-3xs active:scale-[0.98] transition-all"
          >
            {/* Thumbnail */}
            {post.coverImage ? (
              <View className="h-32 w-full bg-slate-100 relative">
                <Image
                  source={{ uri: post.coverImage }}
                  className="w-full h-full object-cover"
                />
                {post.category && (
                  <View className="absolute top-2 left-2 bg-rose-500/90 px-2 py-0.5 rounded-full">
                    <Text className="text-[9px] font-black text-white uppercase">
                      {post.category.name}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="h-32 w-full bg-gradient-to-br from-rose-100 to-rose-50 items-center justify-center">
                <HugeiconsIcon icon={Book01Icon} size={28} color="#ee237c" />
              </View>
            )}

            {/* Content */}
            <View className="p-3 space-y-1">
              <Text
                className="text-xs font-bold text-slate-900 leading-snug"
                numberOfLines={2}
              >
                {post.title}
              </Text>
              
              <View className="flex-row items-center justify-between pt-1">
                <View className="flex-row items-center gap-1">
                  <HugeiconsIcon icon={Clock01Icon} size={11} color="#94a3b8" />
                  <Text className="text-[10px] text-slate-400 font-medium">
                    {post.readingTime || 3} min read
                  </Text>
                </View>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="#ee237c" />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
