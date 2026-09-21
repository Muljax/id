export async function getProfileAvatarResponse(
	bucket: R2Bucket,
	profileImageKey: string | null,
	visibility: "public" | "private",
) {
	if (!profileImageKey) {
		return null;
	}

	const object = await bucket.get(profileImageKey);

	if (!object) {
		return null;
	}

	const headers = new Headers();

	object.writeHttpMetadata(headers);
	headers.set("ETag", object.httpEtag);
	headers.set("Cache-Control", `${visibility}, max-age=3600`);

	return new Response(object.body, {
		headers,
	});
}
