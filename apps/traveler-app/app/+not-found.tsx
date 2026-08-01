import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";

export default function NotFoundScreen() {
  const { t } = useTranslation("common");
  return (
    <>
      <Stack.Screen options={{ title: t("error") }} />
      <View>
        <Text>{t("error")} This screen doesn't exist.</Text>

        <Link href="/">
          <Text>{t("goBack")}</Text>
        </Link>
      </View>
    </>
  );
}
