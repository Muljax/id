import { z } from "@hono/zod-openapi";

export const UserSshKeySchema = z
	.object({
		id: z.string().openapi({ example: "key_uuid_1234" }),
		userId: z.string().optional().openapi({ example: "user_uuid_1234" }),
		name: z.string().openapi({ example: "MacBook Pro Ed25519" }),
		publicKey: z.string().openapi({
			example: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... alice@laptop",
		}),
		fingerprint: z.string().openapi({ example: "SHA256:u1xZ9Q67r.../D82lM" }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
		lastUsedAt: z.number().nullable().openapi({ example: 1773768100000 }),
	})
	.openapi("UserSshKey");

export const UserSshKeysResponseSchema = z
	.object({
		keys: z.array(UserSshKeySchema),
	})
	.openapi("UserSshKeysResponse");

export const RegisterSshKeyRequestSchema = z
	.object({
		name: z
			.string()
			.min(1, "Key name is required.")
			.max(100, "Key name must not exceed 100 characters.")
			.openapi({ example: "Work Laptop" }),
		publicKey: z.string().min(1, "Public key is required.").openapi({
			example: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... user@machine",
		}),
		userId: z.string().optional().openapi({
			example: "user_uuid_1234",
			description: "Target user ID (admin only)",
		}),
	})
	.openapi("RegisterSshKeyRequest");

export const RegisterSshKeyResponseSchema = z
	.object({
		key: UserSshKeySchema,
	})
	.openapi("RegisterSshKeyResponse");

export const SshPrincipalsResponseSchema = z
	.object({
		principals: z
			.array(z.string())
			.openapi({ example: ["alice", "admin", "deploy"] }),
		defaultPrincipal: z.string().nullable().openapi({ example: "alice" }),
	})
	.openapi("SshPrincipalsResponse");

export const SshCertificateSchema = z
	.object({
		id: z.string().openapi({ example: "cert_uuid_1234" }),
		userId: z.string().openapi({ example: "user_uuid_1234" }),
		serial: z.string().openapi({ example: "1004" }),
		keyId: z.string().openapi({ example: "alice@example.com" }),
		principals: z.array(z.string()).openapi({ example: ["alice", "ubuntu"] }),
		validAfter: z.number().openapi({ example: 1773767800 }),
		validBefore: z.number().openapi({ example: 1773796600 }),
		fingerprint: z.string().openapi({ example: "SHA256:u1xZ9Q67r.../D82lM" }),
		caFingerprint: z.string().openapi({ example: "SHA256:caFingerprintHash" }),
		clientIp: z.string().nullable().openapi({ example: "198.51.100.42" }),
		userAgent: z.string().nullable().openapi({ example: "ssh-id-cli/1.0" }),
		revokedAt: z.number().nullable().openapi({ example: null }),
		revokedBy: z.string().nullable().openapi({ example: null }),
		revokedReason: z.string().nullable().openapi({ example: null }),
		createdAt: z.number().openapi({ example: 1773767800000 }),
	})
	.openapi("SshCertificate");

export const SshCertificatesResponseSchema = z
	.object({
		certificates: z.array(SshCertificateSchema),
	})
	.openapi("SshCertificatesResponse");

export const IssueCertificateRequestSchema = z
	.object({
		publicKey: z.string().optional().openapi({
			example: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...",
			description: "Ad-hoc OpenSSH Ed25519 public key string",
		}),
		savedKeyId: z.string().optional().openapi({
			example: "key_uuid_1234",
			description: "ID of an enrolled SSH public key",
		}),
		keyId: z.string().optional().openapi({
			example: "alice@example.com",
			description:
				"Key identity string embedded in certificate (admin only for custom)",
		}),
		principals: z
			.array(z.string())
			.optional()
			.openapi({
				example: ["alice", "ubuntu"],
				description: "POSIX principals requested for the certificate",
			}),
		ttl: z.number().optional().openapi({
			example: 28800,
			description:
				"Certificate validity lifetime in seconds (default: 8 hours, max 30 days)",
		}),
		comment: z.string().optional().openapi({
			example: "Issued for session XYZ",
		}),
	})
	.openapi("IssueCertificateRequest");

export const IssuedCertificateResponseSchema = z
	.object({
		certificate: z.string().openapi({
			example:
				"ssh-ed25519-cert-v01@openssh.com AAAAIHNzaC1lZDI1NTE5LWNlcnQtdjAx...",
		}),
		serial: z.string().openapi({ example: "1004" }),
		keyId: z.string().openapi({ example: "alice@example.com" }),
		principals: z.array(z.string()).openapi({ example: ["alice"] }),
		validAfter: z.number().openapi({ example: 1773767800 }),
		validBefore: z.number().openapi({ example: 1773796600 }),
		fingerprint: z.string().openapi({ example: "SHA256:u1xZ9Q67r.../D82lM" }),
		caFingerprint: z.string().openapi({ example: "SHA256:caFingerprintHash" }),
	})
	.openapi("IssuedCertificateResponse");

export const RevokeCertificateRequestSchema = z
	.object({
		reason: z.string().optional().openapi({
			example: "Host compromised or credentials rotated",
		}),
	})
	.openapi("RevokeCertificateRequest");

export const CaPublicKeyResponseSchema = z
	.object({
		algorithm: z.string().openapi({ example: "ssh-ed25519" }),
		publicKey: z.string().openapi({
			example: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... Muljax-ID-CA",
		}),
		fingerprint: z.string().openapi({ example: "SHA256:caKeyFingerprint..." }),
	})
	.openapi("CaPublicKeyResponse");

export const RevokedKeysResponseSchema = z
	.object({
		revoked: z.array(
			z.object({
				serial: z.string().openapi({ example: "1004" }),
				revokedAt: z.number().openapi({ example: 1773767800000 }),
			}),
		),
	})
	.openapi("RevokedKeysResponse");

export type CaPublicKeyResponse = z.infer<typeof CaPublicKeyResponseSchema>;
export type SshPrincipalsResponse = z.infer<typeof SshPrincipalsResponseSchema>;
export type SshKey = z.infer<typeof UserSshKeySchema>;
export type SshKeysResponse = z.infer<typeof UserSshKeysResponseSchema>;
export type SshCertificate = z.infer<typeof SshCertificateSchema>;
export type SshCertificatesResponse = z.infer<
	typeof SshCertificatesResponseSchema
>;
export type IssueCertificateInput = z.infer<
	typeof IssueCertificateRequestSchema
>;
export type IssueCertificateResponse = z.infer<
	typeof IssuedCertificateResponseSchema
>;
export type RevokeCertificateRequest = z.infer<
	typeof RevokeCertificateRequestSchema
>;
export type RevokedKeysResponse = z.infer<typeof RevokedKeysResponseSchema>;
