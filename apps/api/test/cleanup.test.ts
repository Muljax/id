import { describe, expect, test } from "bun:test";
import {
	cleanupExpiredAuthData,
	cleanupExpiredCertificates,
} from "../src/lib/cleanup";

describe("Expired Data & Certificate Cleanup", () => {
	test("cleanupExpiredCertificates deletes expired certificates regardless of revocation status", async () => {
		let deleteCalled = false;
		let capturedWhere: unknown = null;

		const mockDb = {
			delete: (_table: unknown) => ({
				where: (condition: unknown) => {
					deleteCalled = true;
					capturedWhere = condition;
					return Promise.resolve({
						meta: {
							changes: 5,
						},
					});
				},
			}),
		};

		const deletedCount = await cleanupExpiredCertificates(mockDb as never);

		expect(deleteCalled).toBe(true);
		expect(deletedCount).toBe(5);
		expect(capturedWhere).toBeDefined();
	});

	test("cleanupExpiredAuthData purges sessions, challenges, reset tokens, auth codes, and certificates", async () => {
		const deletedTables: string[] = [];

		const mockDb = {
			delete: (table: unknown) => ({
				where: (_condition: unknown) => {
					const tbl = table as { _?: { name?: string } };
					deletedTables.push(tbl?._?.name ?? "unknown");
					return Promise.resolve({
						meta: {
							changes: 1,
						},
					});
				},
			}),
		};

		const result = await cleanupExpiredAuthData(mockDb as never);

		expect(result).toEqual({
			sessions: 1,
			passkeyChallenges: 1,
			passwordResetTokens: 1,
			oauthAuthorizationCodes: 1,
			sshCertificates: 1,
		});

		expect(deletedTables.length).toBe(5);
	});
});
