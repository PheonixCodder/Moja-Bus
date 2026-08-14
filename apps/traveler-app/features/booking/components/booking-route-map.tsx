import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

type BookingRouteMapProps = {
  origin: string;
  destination: string;
  stops?: Array<{
    stopOrder: number;
    terminalName: string;
    cityName: string;
  }>;
};

export function BookingRouteMap({
  origin,
  destination,
  stops,
}: BookingRouteMapProps) {
  const { t } = useTranslation("booking");

  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-200 gap-3">
      <Text className="text-sm font-bold text-muted-foreground tracking-wider uppercase">
        {t("route")}
      </Text>

      <View className="flex-row items-start gap-3">
        <View className="items-center w-8">
          <View className="w-4 h-4 rounded-full bg-emerald-500 items-center justify-center">
            <View className="w-1.5 h-1.5 rounded-full bg-white" />
          </View>
          <View className="w-0.5 flex-1 bg-slate-200 mt-1" />
          {stops && stops.length > 0 ? (
            stops.slice(0, -1).map((_, i) => (
              <View
                key={`stop-dot-${i}`}
                className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 ml-1"
              />
            ))
          ) : null}
          <View className="w-4 h-4 rounded-full bg-red-500 items-center justify-center mt-1">
            <View className="w-1.5 h-1.5 rounded-full bg-white" />
          </View>
        </View>

        <View className="flex-1 gap-2">
          <View>
            <Text className="text-sm font-bold text-foreground">
              {origin}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {t("pickup")}
            </Text>
          </View>

          {stops && stops.length > 0 ? (
            stops.map((stop) => (
              <View
                key={`stop-${stop.stopOrder}`}
                className="pl-2 border-l-2 border-slate-200"
              >
                <Text className="text-xs font-medium text-foreground">
                  {stop.terminalName}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {stop.cityName}
                </Text>
              </View>
            ))
          ) : null}

          <View>
            <Text className="text-sm font-bold text-foreground">
              {destination}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {t("dropOff")}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}