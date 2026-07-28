import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useState, useEffect } from "react";

import { authClient } from "@/lib/auth-client";

export default function IndexScreen() {
    const { data: session } = authClient.useSession();

    if (session?.user) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/(auth)/login" />;
}
