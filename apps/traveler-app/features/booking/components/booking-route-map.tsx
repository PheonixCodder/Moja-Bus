import { Colors, Spacing } from "@moja/theme/tokens";
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
  return (
    <View
      style={{
        backgroundColor: Colors.light.background,
        borderRadius: 16,
        padding: Spacing.four,
        borderWidth: 1,
        borderColor: Colors.light.backgroundSelected,
        gap: Spacing.three,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: Colors.light.textSecondary,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        Route
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: Spacing.three,
        }}
      >
        <View
          style={{
            alignItems: "center",
            width: 32,
          }}
        >
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#10b981",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#fff",
              }}
            />
          </View>
          <View
            style={{
              width: 2,
              flex: 1,
              backgroundColor: Colors.light.backgroundSelected,
              marginTop: 4,
            }}
          />
          {stops && stops.length > 0 ? (
            stops.slice(0, -1).map((_, i) => (
              <View
                key={`stop-dot-${i}`}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: Colors.light.backgroundSelected,
                  marginTop: 4,
                  marginLeft: 5,
                }}
              />
            ))
          ) : null}
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: "#ef4444",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 4,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#fff",
              }}
            />
          </View>
        </View>

        <View style={{ flex: 1, gap: Spacing.two }}>
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: Colors.light.text,
              }}
            >
              {origin}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: Colors.light.textSecondary,
                marginTop: 1,
              }}
            >
              Pickup
            </Text>
          </View>

          {stops && stops.length > 0 ? (
            stops.map((stop) => (
              <View
                key={`stop-${stop.stopOrder}`}
                style={{
                  paddingLeft: Spacing.two,
                  borderLeftWidth: 2,
                  borderLeftColor: Colors.light.backgroundSelected,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: Colors.light.text,
                  }}
                >
                  {stop.terminalName}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: Colors.light.textSecondary,
                  }}
                >
                  {stop.cityName}
                </Text>
              </View>
            ))
          ) : null}

          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: Colors.light.text,
              }}
            >
              {destination}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: Colors.light.textSecondary,
                marginTop: 1,
              }}
            >
              Drop-off
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}