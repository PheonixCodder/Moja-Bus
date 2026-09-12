import type { LucideIcon, LucideProps } from "lucide-react-native";
import { styled } from "nativewind";
import * as React from "react";
import { TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export type IconProps = LucideProps & {
	as: LucideIcon;
	className?: string;
} & React.RefAttributes<LucideIcon>;

const StyledIcon = styled(function IconImpl({
	as: IconComponent,
	...props
}: {
	as: LucideIcon;
	className?: string;
} & LucideProps) {
	return <IconComponent {...props} />;
});

function Icon({
	as: IconComponent,
	className,
	size = 14,
	...props
}: IconProps) {
	const textClass = React.useContext(TextClassContext);
	return (
		<StyledIcon
			as={IconComponent}
			className={cn("text-foreground", textClass, className)}
			size={size}
			{...props}
		/>
	);
}

export { Icon };
