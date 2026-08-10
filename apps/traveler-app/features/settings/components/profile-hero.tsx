import { Camera03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { View } from "react-native";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { getInitials } from "@/lib/user-helpers";

type ProfileHeroProps = {
  name: string;
  image?: string | null;
};

export function ProfileHero({ name, image }: ProfileHeroProps) {
  const initials = getInitials(name);

  return (
    <View className="flex-row items-center gap-4">
      <View className="relative">
        <Avatar className="size-20" alt={name}>
          {image ? <AvatarImage source={{ uri: image }} /> : null}
          <AvatarFallback className="bg-pink-500/20">
            <Text className="text-xl font-bold text-pink-600">
              {initials}
            </Text>
          </AvatarFallback>
        </Avatar>
        <View className="absolute -bottom-0.5 -right-0.5 size-6.5 rounded-full bg-pink-600 items-center justify-center border-2 border-white">
          <HugeiconsIcon icon={Camera03Icon} size={12} color="#ffffff" />
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
    </View>
  );
}