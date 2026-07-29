import { Camera03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { View } from "react-native";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { getInitials } from "@/lib/user-helpers";
import { primaryRGB } from "@/constants/theme";
import { Colors, Spacing } from "@moja/theme/tokens";

type ProfileHeroProps = {
  name: string;
  image?: string | null;
};

export function ProfileHero({ name, image }: ProfileHeroProps) {
  const initials = getInitials(name);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.four }}>
      <View style={{ position: "relative" }}>
        <Avatar className="size-20" alt={name}>
          {image ? (
            <AvatarImage source={{ uri: image }} />
          ) : null}
          <AvatarFallback
            style={{
              backgroundColor: `rgba(${primaryRGB}, 0.2)`,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: Colors.light.primary,
              }}
            >
              {initials}
            </Text>
          </AvatarFallback>
        </Avatar>
        <View
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: Colors.light.primary,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 3,
            borderColor: Colors.light.background,
          }}
        >
          <HugeiconsIcon icon={Camera03Icon} size={12} color={Colors.light.primaryForeground} />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: "#ffffff",
            maxWidth: "75%",
          }}
        >
          {name}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "400", color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
          Manage your account & travel preferences
        </Text>
      </View>
    </View>
  );
}