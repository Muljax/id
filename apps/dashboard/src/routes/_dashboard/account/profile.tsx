import { createFileRoute } from "@tanstack/react-router";
import {
	type ChangeEvent,
	type FormEvent,
	useEffect,
	useMemo,
	useState,
} from "react";

import { useToast } from "@/components/Toast";
import AvatarCropper from "@/components/ui/AvatarCropper";
import Button from "@/components/ui/Button";
import Card, { CardContent, CardFooter } from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import type Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import {
	deleteProfileAvatar,
	getProfileAvatarUrl,
	updateProfile,
	uploadProfileAvatar,
} from "@/lib/api";

export const Route = createFileRoute("/_dashboard/account/profile")({
	staticData: {
		navigation: {
			label: "Profile",
			order: 1,
		},
	},
	component: ProfilePage,
});

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type ProfileForm = {
	displayName: string;
	givenName: string;
	familyName: string;
	middleName: string;
	nickname: string;
	preferredUsername: string;
	profileUrl: string;
	website: string;
	gender: string;
	birthdate: string;
	zoneinfo: string;
	locale: string;
};

const EMPTY_PROFILE: ProfileForm = {
	displayName: "",
	givenName: "",
	familyName: "",
	middleName: "",
	nickname: "",
	preferredUsername: "",
	profileUrl: "",
	website: "",
	gender: "",
	birthdate: "",
	zoneinfo: "",
	locale: "",
};

type ProfileField = {
	name: keyof ProfileForm;
	label: string;
	description?: string;
} & Omit<React.ComponentProps<typeof Input>, "id" | "value" | "onChange">;

type ProfileSection = {
	title: string;
	fields: ProfileField[];
};

const PROFILE_SECTIONS: ProfileSection[] = [
	{
		title: "Personal information",
		fields: [
			{
				name: "displayName",
				label: "Display name",
				placeholder: "John Doe",
			},
			{
				name: "givenName",
				label: "Given name",
				placeholder: "John",
			},
			{
				name: "familyName",
				label: "Family name",
				placeholder: "Doe",
			},
			{
				name: "middleName",
				label: "Middle name",
			},
			{
				name: "nickname",
				label: "Nickname",
			},
			{
				name: "preferredUsername",
				label: "Preferred username",
			},
		],
	},
	{
		title: "Profile & Links",
		fields: [
			{
				name: "profileUrl",
				label: "Profile URL",
				type: "url",
				placeholder: "https://example.com/profile",
			},
			{
				name: "website",
				label: "Website",
				type: "url",
				placeholder: "https://example.com",
			},
			{
				name: "gender",
				label: "Gender",
			},
			{
				name: "birthdate",
				label: "Birthdate",
				type: "date",
			},
		],
	},
	{
		title: "Regional & Locale",
		fields: [
			{
				name: "zoneinfo",
				label: "Time zone",
				placeholder: "America/New_York",
			},
			{
				name: "locale",
				label: "Locale",
				placeholder: "en-US",
			},
		],
	},
];

function ProfileFields({
	fields,
	form,
	onChange,
}: {
	fields: ProfileField[];
	form: ProfileForm;
	onChange: (name: keyof ProfileForm, value: string) => void;
}) {
	return (
		<div className="grid gap-5 sm:grid-cols-2">
			{fields.map(({ name, ...field }) => (
				<Field
					key={name}
					{...field}
					id={name}
					value={form[name]}
					onChange={(value) => onChange(name, value)}
				/>
			))}
		</div>
	);
}

function ProfilePage() {
	const { user, loading, refresh } = useAuth();
	const toast = useToast();

	const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE);
	const [saving, setSaving] = useState(false);
	const [avatarSaving, setAvatarSaving] = useState(false);
	const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);

	useEffect(() => {
		if (!user) {
			return;
		}

		setForm({
			displayName: user.displayName ?? "",
			givenName: user.givenName ?? "",
			familyName: user.familyName ?? "",
			middleName: user.middleName ?? "",
			nickname: user.nickname ?? "",
			preferredUsername: user.preferredUsername ?? "",
			profileUrl: user.profileUrl ?? "",
			website: user.website ?? "",
			gender: user.gender ?? "",
			birthdate: user.birthdate ?? "",
			zoneinfo: user.zoneinfo ?? "",
			locale: user.locale ?? "",
		});
	}, [user]);

	const initials = useMemo(() => {
		if (!user) {
			return "";
		}

		const name = user.displayName?.trim();

		if (name) {
			const parts = name.split(/\s+/);

			if (parts.length >= 2) {
				return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
			}

			return name.slice(0, 2).toUpperCase();
		}

		return user.email.slice(0, 2).toUpperCase();
	}, [user]);

	if (loading || !user) {
		return (
			<div className="flex min-h-[50vh] items-center justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	function handleFieldChange(name: keyof ProfileForm, value: string) {
		setForm((current) => ({
			...current,
			[name]: value,
		}));
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);

		try {
			await updateProfile({
				displayName: form.displayName.trim(),
				givenName: form.givenName.trim(),
				familyName: form.familyName.trim(),
				middleName: form.middleName.trim(),
				nickname: form.nickname.trim(),
				preferredUsername: form.preferredUsername.trim(),
				profileUrl: form.profileUrl.trim(),
				website: form.website.trim(),
				gender: form.gender.trim(),
				birthdate: form.birthdate.trim(),
				zoneinfo: form.zoneinfo.trim(),
				locale: form.locale.trim(),
			});

			await refresh();
			toast.success("Profile updated.");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to update your profile.",
			);
		} finally {
			setSaving(false);
		}
	}

	function handleAvatarSelect(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		event.target.value = "";

		if (!file) {
			return;
		}

		if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
			toast.error("Profile pictures must be JPEG, PNG, or WebP.");
			return;
		}

		if (file.size > MAX_AVATAR_SIZE) {
			toast.error("Profile pictures must be smaller than 5 MB.");
			return;
		}

		setSelectedAvatar(file);
	}

	function handleAvatarCancel() {
		if (avatarSaving) {
			return;
		}

		setSelectedAvatar(null);
	}

	async function handleAvatarApply(file: File) {
		setSelectedAvatar(null);
		setAvatarSaving(true);

		try {
			await uploadProfileAvatar(file);
			await refresh();
			toast.success("Profile picture updated.");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to update your profile picture.",
			);
		} finally {
			setAvatarSaving(false);
		}
	}

	async function handleAvatarRemove() {
		setAvatarSaving(true);

		try {
			await deleteProfileAvatar();
			await refresh();
			toast.success("Profile picture removed.");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Unable to remove your profile picture.",
			);
		} finally {
			setAvatarSaving(false);
		}
	}

	return (
		<div className="space-y-8 max-w-4xl">
			<PageHeader
				title="Profile"
				description="Manage your identity claims and profile picture displayed across connected services."
			/>

			<Card>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-8">
						{/* Avatar Section */}
						<section>
							<h3 className="text-sm font-medium text-white">
								Profile picture
							</h3>

							<div className="mt-4 flex flex-wrap items-center gap-5">
								<div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-900 shadow-md">
									{user.profileImageKey ? (
										<img
											src={`${getProfileAvatarUrl()}?v=${encodeURIComponent(
												user.profileImageKey,
											)}`}
											alt=""
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center text-lg font-medium text-zinc-400">
											{initials}
										</div>
									)}
								</div>

								<div className="space-y-2">
									<div className="flex items-center gap-3">
										<label className="inline-flex cursor-pointer">
											<span className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10">
												{avatarSaving ? "Saving..." : "Change picture"}
											</span>

											<input
												type="file"
												accept="image/jpeg,image/png,image/webp"
												className="sr-only"
												onChange={handleAvatarSelect}
												disabled={avatarSaving}
											/>
										</label>

										{user.profileImageKey && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => void handleAvatarRemove()}
												disabled={avatarSaving}
											>
												Remove
											</Button>
										)}
									</div>

									<p className="text-xs text-zinc-500">
										JPEG, PNG, or WebP. Maximum file size is 5 MB.
									</p>
								</div>
							</div>
						</section>

						{/* Account Section */}
						<section className="border-t border-white/6 pt-6">
							<h3 className="text-sm font-medium text-white">
								Account identifier
							</h3>
							<div className="mt-4 max-w-md">
								<Field
									id="email"
									label="Email address"
									value={user.email ?? ""}
									onChange={() => {}}
									disabled
									description="Your email address is managed at sign-in."
								/>
							</div>
						</section>

						{/* Detail Form Sections */}
						{PROFILE_SECTIONS.map((section) => (
							<section
								key={section.title}
								className="border-t border-white/6 pt-6"
							>
								<h3 className="text-sm font-medium text-white mb-4">
									{section.title}
								</h3>
								<ProfileFields
									fields={section.fields}
									form={form}
									onChange={handleFieldChange}
								/>
							</section>
						))}
					</CardContent>

					<CardFooter>
						<Button type="submit" loading={saving}>
							Save changes
						</Button>
					</CardFooter>
				</form>
			</Card>

			<AvatarCropper
				file={selectedAvatar}
				open={selectedAvatar !== null}
				onCancel={handleAvatarCancel}
				onApply={(file) => void handleAvatarApply(file)}
			/>
		</div>
	);
}
