import { useState } from "react";

import { getUserAvatarUrl, type AdminUser } from "@/lib/api/admin";

export default function UserAvatar({ user }: { user: AdminUser }) {
	const [failed, setFailed] = useState(false);
	const name = user.displayName || user.email;

	if (!user.profileImageKey || failed) {
		return (
			<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-sm font-semibold text-zinc-300 shadow-sm">
				{name.charAt(0).toUpperCase()}
			</div>
		);
	}

	return (
		<img
			src={`${getUserAvatarUrl(user.id)}?v=${encodeURIComponent(user.profileImageKey)}`}
			alt=""
			className="h-10 w-10 shrink-0 rounded-full object-cover border border-white/10"
			onError={() => setFailed(true)}
		/>
	);
}
