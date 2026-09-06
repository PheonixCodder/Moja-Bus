import React, { useState } from "react";
import { View, Image, Text } from "react-native";
import { cn } from "@/lib/utils";

export function getUserInitials(name?: string | null): string {
	if (!name?.trim()) return "D";
	const words = name.trim().split(/\s+/).filter(Boolean);
	const first = words[0];
	if (!first) return "D";
	if (words.length === 1) return first.slice(0, 2).toUpperCase();
	const last = words[words.length - 1];
	return ((first[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "D";
}

export function getDicebearGlassUrl(seed?: string | null, size = 128): string {
	const normalizedSeed = seed?.trim() || "driver";
	return `https://api.dicebear.com/10.x/glass/png?seed=${encodeURIComponent(normalizedSeed)}&size=${size}`;
}

export interface UserAvatarProps {
	name?: string | null;
	src?: string | null;
	seed?: string | null;
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
	imageClassName?: string;
	fallbackClassName?: string;
}

const SIZE_MAP = {
	sm: { container: "w-8 h-8 rounded-full", text: "text-xs font-bold" },
	md: { container: "w-10 h-10 rounded-full", text: "text-sm font-bold" },
	lg: { container: "w-12 h-12 rounded-full", text: "text-base font-bold" },
	xl: { container: "w-16 h-16 rounded-2xl", text: "text-xl font-black" },
};

export function UserAvatar({
	name,
	src,
	seed,
	size = "md",
	className,
	imageClassName,
	fallbackClassName,
}: UserAvatarProps) {
	const [hasPhotoError, setHasPhotoError] = useState(false);
	const [hasDicebearError, setHasDicebearError] = useState(false);

	const initials = getUserInitials(name);
	const config = SIZE_MAP[size] ?? SIZE_MAP.md;

	const hasCustomPhoto = Boolean(src?.trim()) && !hasPhotoError;
	const dicebearUrl = getDicebearGlassUrl(seed || name);

	const activeUri = hasCustomPhoto ? src : hasDicebearError ? null : dicebearUrl;

	return (
		<View
			className={cn(
				"items-center justify-center overflow-hidden bg-primary/10 border border-primary/20",
				config.container,
				className,
			)}
		>
			{activeUri ? (
				<Image
					source={{ uri: activeUri }}
					className={cn("w-full h-full", imageClassName)}
					resizeMode="cover"
					onError={() => {
						if (hasCustomPhoto) {
							setHasPhotoError(true);
						} else {
							setHasDicebearError(true);
						}
					}}
				/>
			) : (
				<Text
					className={cn(
						"text-primary uppercase tracking-tight select-none",
						config.text,
						fallbackClassName,
					)}
				>
					{initials}
				</Text>
			)}
		</View>
	);
}
