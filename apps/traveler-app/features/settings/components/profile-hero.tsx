import { Camera03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, View } from "react-native";
import { UserAvatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { Palette, Colors } from "@/constants/theme";

type ProfileHeroProps = {
  name: string;
  image?: string | null;
  onPress?: () => void;
};

export function ProfileHero({ name, image, onPress }: ProfileHeroProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `Edit profile for ${name}` : undefined}
      style={({ pressed }) => ({ opacity: pressed && onPress ? 0.85 : 1 })}
      className="flex-row items-center gap-4"
    >
      <View className="relative">
        <UserAvatar
          name={name}
          src={image}
          seed={name}
          size="xl"
          className="size-20"
        />
        <View className="absolute -bottom-0.5 -right-0.5 size-6.5 rounded-full bg-primary items-center justify-center border-2 border-card">
          <HugeiconsIcon icon={Camera03Icon} size={12} color={Palette.zinc[50]} />
        </View>
      </View>

      <View className="flex-1">
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-xl font-bold text-white max-w-[80%]"
        >
          {name}
        </Text>
        <Text className="text-sm font-normal text-white/60 mt-1">
          Manage your account & travel preferences
        </Text>
      </View>
    </Pressable>
  );
}
