import { Camera03Icon, Mail01Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Alert, Pressable, View } from "react-native";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { getInitials } from "@/lib/user-helpers";

type ProfileCardProps = {
  name: string;
  email: string;
  phoneNumber?: string | null;
  image?: string | null;
};

export function ProfileCard({ name, email, phoneNumber, image }: ProfileCardProps) {
  const initials = getInitials(name);

  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ position: "relative", marginBottom: 16 }}>
        <Avatar className="size-20" alt={name}>
          {image ? (
            <AvatarImage source={{ uri: image }} />
          ) : null}
          <AvatarFallback
            style={{
              backgroundColor: "rgba(238, 35, 124, 0.12)",
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: "#ee237c",
                letterSpacing: 0.5,
              }}
            >
              {initials}
            </Text>
          </AvatarFallback>
        </Avatar>
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: -2,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "#ee237c",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#ffffff",
          }}
        >
          <HugeiconsIcon icon={Camera03Icon} size={14} color="#ffffff" />
        </View>
      </View>

      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: "#1c1c1e",
          marginBottom: 16,
        }}
      >
        {name}
      </Text>

      <View style={{ width: "100%", gap: 10, marginBottom: 20, alignItems: "center" }}>
        {phoneNumber ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <HugeiconsIcon icon={SmartPhone01Icon} size={16} color="#ee237c" />
            <Text style={{ fontSize: 14, color: "#8e8e93" }}>{phoneNumber}</Text>
          </View>
        ) : null}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <HugeiconsIcon icon={Mail01Icon} size={16} color="#ee237c" />
          <Text style={{ fontSize: 14, color: "#8e8e93" }}>{email}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => Alert.alert("Edit Profile", "Coming soon")}
        style={({ pressed }) => ({
          borderWidth: 1.5,
          borderColor: "#ee237c",
          borderRadius: 999,
          paddingVertical: 10,
          paddingHorizontal: 32,
          backgroundColor: pressed ? "rgba(238, 35, 124, 0.05)" : "transparent",
        })}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#ee237c",
          }}
        >
          Edit Profile
        </Text>
      </Pressable>
    </View>
  );
}
