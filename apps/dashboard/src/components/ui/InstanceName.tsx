import type { HTMLAttributes } from "react";

import { INSTANCE_NAME } from "@/lib/config";

export interface InstanceNameProps extends HTMLAttributes<HTMLSpanElement> {
	className?: string;
}

export default function InstanceName({
	className = "text-violet-400 font-medium",
	...props
}: InstanceNameProps) {
	return (
		<span className={className} {...props}>
			{INSTANCE_NAME}
		</span>
	);
}
