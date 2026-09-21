import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { INSTANCE_LOGO, INSTANCE_NAME } from "@/lib/config";

export interface InstanceLogoProps {
	src?: string;
	alt?: string;
	className?: string;
}

export function InstanceLogo({
	src = INSTANCE_LOGO,
	alt = INSTANCE_NAME,
	className = "h-8 w-8 rounded-lg",
}: InstanceLogoProps) {
	const [error, setError] = useState(false);

	if (error || !src) {
		return (
			<div
				role="img"
				aria-label={alt}
				className={`flex items-center justify-center border border-violet-500/30 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 text-violet-300 shadow-inner ${className}`}
			>
				<ShieldCheck className="h-2/3 w-2/3" />
			</div>
		);
	}

	return (
		<img
			src={src}
			alt={alt}
			onError={() => setError(true)}
			className={`object-contain ${className}`}
		/>
	);
}
