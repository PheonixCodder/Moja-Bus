import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export const TripCardSkeleton = React.memo(function TripCardSkeleton() {
  return (
    <View className="gap-3 pt-1">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="bg-card rounded-2xl border border-border/70 p-4 gap-3 shadow-2xs"
        >
          <View className="flex-row justify-between items-center">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </View>
          <View className="flex-row items-center gap-2">
            <Skeleton className="h-5 w-28 rounded-md" />
            <Skeleton className="h-4 w-6 rounded-md" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </View>
          <View className="flex-row justify-between items-center pt-2 border-t border-border/40">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </View>
        </View>
      ))}
    </View>
  );
});
