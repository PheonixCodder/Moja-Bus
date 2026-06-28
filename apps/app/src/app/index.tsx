import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { Colors } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";

export default function IndexScreen() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.dark.background,
        }}
      >
        <ActivityIndicator color={Colors.dark.text} />
      </View>
    );
  }

  return <Redirect href={session?.user ? "/dashboard" : "/login"} />;
}
