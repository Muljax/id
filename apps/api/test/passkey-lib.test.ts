import { describe, expect, test } from "bun:test";
import * as schema from "../src/db/schema";
import {
	arrayBufferToBase64,
	base64ToUint8Array,
	consumeChallenge,
	consumeChallengeById,
	createChallenge,
	getChallenge,
	getChallengeById,
} from "../src/lib/passkey";
import { createTestDb, createTestUser } from "./helpers";

describe("Passkey & WebAuthn Library Utilities", () => {
	test("arrayBufferToBase64 and base64ToUint8Array roundtrip byte buffers", () => {
		const bytes = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);
		const b64 = arrayBufferToBase64(bytes);
		const decoded = base64ToUint8Array(b64);
		expect(Array.from(decoded)).toEqual(Array.from(bytes));
	});

	test("createChallenge generates active challenge and cleans prior user challenges", async () => {
		const { db } = createTestDb();
		const { id: userId } = await createTestUser(db);

		const first = await createChallenge(db, userId, "challenge-one");
		expect(first.challenge).toBe("challenge-one");
		expect(first.expiresAt).toBeGreaterThan(Date.now());

		// Creating a second challenge for the same user should purge the first
		const second = await createChallenge(db, userId, "challenge-two");
		expect(second.challenge).toBe("challenge-two");

		const fetched = await getChallenge(db, userId);
		expect(fetched?.id).toBe(second.id);
		expect(fetched?.challenge).toBe("challenge-two");
	});

	test("createChallenge with null userId creates userless authentication challenge", async () => {
		const { db } = createTestDb();
		const challenge = await createChallenge(db, null, "userless-challenge-123");

		expect(challenge.id).toBeDefined();
		expect(challenge.challenge).toBe("userless-challenge-123");

		const fetched = await getChallengeById(db, challenge.id);
		expect(fetched).not.toBeNull();
		expect(fetched?.challenge).toBe("userless-challenge-123");
		expect(fetched?.userId).toBeNull();
	});

	test("consumeChallenge atomically retrieves and removes user registration challenge", async () => {
		const { db } = createTestDb();
		const { id: userId } = await createTestUser(db);

		await createChallenge(db, userId, "reg-challenge-abc");

		// First consumption succeeds
		const consumed = await consumeChallenge(db, userId);
		expect(consumed).not.toBeNull();
		expect(consumed?.challenge).toBe("reg-challenge-abc");

		// Second consumption returns null (prevents replay attacks)
		const replayed = await consumeChallenge(db, userId);
		expect(replayed).toBeNull();
	});

	test("consumeChallengeById atomically consumes userless authentication challenge", async () => {
		const { db } = createTestDb();
		const challenge = await createChallenge(db, null, "auth-challenge-xyz");

		const consumed = await consumeChallengeById(db, challenge.id);
		expect(consumed).not.toBeNull();
		expect(consumed?.challenge).toBe("auth-challenge-xyz");

		const replayed = await consumeChallengeById(db, challenge.id);
		expect(replayed).toBeNull();
	});

	test("getChallenge and getChallengeById return null for expired challenges", async () => {
		const { db } = createTestDb();
		const past = Date.now() - 10000;

		await db.insert(schema.passkeyChallenges).values({
			id: "expired-userless",
			userId: null,
			challenge: "expired-auth",
			expiresAt: past,
			createdAt: past - 60000,
		});

		expect(await getChallengeById(db, "expired-userless")).toBeNull();
		expect(await consumeChallengeById(db, "expired-userless")).toBeNull();
	});
});
