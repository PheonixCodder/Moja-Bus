import { Camera03Icon, Cancel01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Modal,
	Pressable,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { useTRPC } from "@/lib/trpc";
import { useUpdateAvatar } from "@/hooks/use-personal-info";

interface PresignInput {
	purpose: string;
	fileName: string;
	contentType: string;
	fileSize: number;
}

interface PresignResult {
	uploadUrl: string;
	fileUrl: string;
	objectKey: string;
}

type PersonalInfoAvatarProps = {
	image: string | null;
	name: string;
	onAvatarUpdated: (imageUrl: string) => void;
};

function getInitials(name: string) {
	const parts = name.trim().split(" ").filter(Boolean);
	if (parts.length >= 2) {
		return `${(parts[0]?.[0] ?? "").toUpperCase()}${(parts[1]?.[0] ?? "").toUpperCase()}`;
	}
	return name.slice(0, 2).toUpperCase();
}

export function PersonalInfoAvatar({ image, name, onAvatarUpdated }: PersonalInfoAvatarProps) {
	const insets = useSafeAreaInsets();
	const [uploading, setUploading] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const trpc = useTRPC();
	const updateAvatarMutation = useUpdateAvatar();

	const presignMutation = useMutation({
		mutationFn: async (input: PresignInput) => {
			return (trpc as any).storage.presignUpload.mutationOptions().mutationFn(input) as Promise<PresignResult>;
		},
	});

	const handlePickImage = async () => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) {
			Alert.alert("Permission needed", "Allow access to your photo library to upload a profile picture.");
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.9,
		});

		if (result.canceled || !result.assets[0]) return;
		await uploadImage(result.assets[0].uri);
	};

	const handleTakePhoto = async () => {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) {
			Alert.alert("Permission needed", "Allow access to your camera to take a profile picture.");
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.9,
		});

		if (result.canceled || !result.assets[0]) return;
		await uploadImage(result.assets[0].uri);
	};

	const uploadImage = async (uri: string) => {
		setUploading(true);
		try {
			const manipResult = await ImageManipulator.manipulateAsync(
				uri,
				[{ resize: { width: 256, height: 256 } }],
				{ compress: 0.9, format: ImageManipulator.SaveFormat.WEBP },
			);

			const imageFile = new File(manipResult.uri);
			if (!imageFile.exists) throw new Error("File not found");

			const fileSize = imageFile.size;
			if (fileSize > 2 * 1024 * 1024) {
				throw new Error("Image is too large (max 2MB)");
			}

			const fileName = `avatar-${Date.now()}.webp`;

			const presignResult = await presignMutation.mutateAsync({
				purpose: "passenger-avatar",
				fileName,
				contentType: "image/webp",
				fileSize,
			});

			const response = await fetch(manipResult.uri);
			const blob = await response.blob();

			const uploadResp = await fetch(presignResult.uploadUrl, {
				method: "PUT",
				headers: { "Content-Type": "image/webp" },
				body: blob,
			});

			if (!uploadResp.ok) throw new Error(`Upload failed with status ${uploadResp.status}`);

			await updateAvatarMutation.mutateAsync({ image: presignResult.fileUrl });
			onAvatarUpdated(presignResult.fileUrl);
			setPreviewOpen(false);
		} catch (err: any) {
			Alert.alert("Upload failed", err?.message ?? "Could not upload image. Please try again.");
		} finally {
			setUploading(false);
		}
	};

	const openEditOptions = () => {
		Alert.alert("Profile Photo", "Choose how to set your profile picture", [
			{ text: "Take Photo", onPress: handleTakePhoto },
			{ text: "Choose from Gallery", onPress: handlePickImage },
			{ text: "Cancel", style: "cancel" },
		]);
	};

	const handlePress = () => {
		if (image) {
			setPreviewOpen(true);
			return;
		}
		openEditOptions();
	};

	const initials = getInitials(name);

	return (
		<>
			<Pressable
				onPress={handlePress}
				disabled={uploading}
				className="items-center gap-2 py-3"
			>
				<View className="relative">
					<Avatar className="size-20" alt={name}>
						{image ? <AvatarImage source={{ uri: image }} /> : null}
						<AvatarFallback className="bg-pink-100">
							<Text className="text-[22px] font-bold text-pink-600">{initials}</Text>
						</AvatarFallback>
					</Avatar>

					{uploading ? (
						<View className="absolute inset-0 rounded-full bg-black/40 items-center justify-center">
							<ActivityIndicator size="small" color="#fff" />
						</View>
					) : (
						<View className="absolute -bottom-0.5 -right-0.5 w-[26px] h-[26px] rounded-full bg-pink-600 items-center justify-center border-[3px] border-white">
							<HugeiconsIcon icon={Camera03Icon} size={12} color="#ffffff" />
						</View>
					)}
				</View>

				<Text className="text-xs font-medium text-slate-500">
					{uploading ? "Uploading..." : image ? "Tap to view photo" : "Tap to add photo"}
				</Text>
			</Pressable>

			<Modal
				visible={previewOpen}
				transparent
				animationType="fade"
				onRequestClose={() => setPreviewOpen(false)}
			>
				<View className="flex-1 bg-black">
					<View
						className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between px-4"
						style={{ paddingTop: insets.top + 8 }}
					>
						<Pressable
							onPress={() => setPreviewOpen(false)}
							className="h-10 w-10 items-center justify-center rounded-full bg-white/15"
							hitSlop={8}
						>
							<HugeiconsIcon icon={Cancel01Icon} size={18} color="#ffffff" />
						</Pressable>
						<Pressable
							onPress={openEditOptions}
							disabled={uploading}
							className="h-10 flex-row items-center gap-2 rounded-full bg-white/15 px-4"
						>
							<HugeiconsIcon icon={PencilEdit02Icon} size={16} color="#ffffff" />
							<Text className="text-sm font-semibold text-white">Edit</Text>
						</Pressable>
					</View>

					<View className="flex-1 items-center justify-center px-4">
						{image ? (
							<Image
								source={{ uri: image }}
								style={{ width: "100%", aspectRatio: 1, borderRadius: 16 }}
								resizeMode="cover"
							/>
						) : null}
						{uploading ? (
							<View className="absolute inset-0 items-center justify-center bg-black/40">
								<ActivityIndicator size="large" color="#ee237c" />
							</View>
						) : null}
					</View>
				</View>
			</Modal>
		</>
	);
}
