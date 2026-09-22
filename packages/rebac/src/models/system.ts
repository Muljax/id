import { define, is, schema } from "../schema";

export const Organization = define("organization", {
	roles: ["owner", "admin", "security_officer", "billing_admin", "member"],
	can: {
		manage: is("owner", "admin"),
		audit: is("security_officer", "owner", "admin"),
		billing: is("billing_admin", "owner"),
		view: is("member").or("manage", "audit"),
	},
});

export const Team = define("team", (self) => ({
	relations: {
		org: Organization,
		parentTeam: self as any,
	},
	roles: ["lead", "senior_engineer", "engineer", "guest"],
	can: {
		manage: is("lead").or(self.org(Organization.manage)),
		member: is("engineer", "senior_engineer", "lead")
			.or(self.parentTeam("member"))
			.or(self.org(Organization.manage)),
		leadMember: is("lead", "senior_engineer").or(self.parentTeam("leadMember")),
	},
}));

export const Cluster = define("cluster", {
	relations: {
		org: Organization,
		ownerTeam: Team,
	},
	roles: ["cluster_admin", "operator", "quarantined"],
	can: (self) => ({
		admin: is("cluster_admin")
			.or(self.org(Organization.manage))
			.or(self.ownerTeam(Team.leadMember))
			.unless("quarantined"),
		operate: is("operator")
			.or("admin")
			.or(self.ownerTeam(Team.member))
			.unless("quarantined"),
		viewMetrics: is("operator", "admin")
			.or(self.ownerTeam(Team.member))
			.or(self.org(Organization.audit)),
	}),
});

export const SshHost = define("ssh_host", {
	relations: {
		cluster: Cluster,
		delegatedTeam: Team,
	},
	roles: ["host_owner", "break_glass_responder", "blocked"],
	can: (self) => ({
		connect: is("host_owner", "break_glass_responder")
			.or(self.cluster(Cluster.admin))
			.or(self.delegatedTeam(Team.member))
			.unless("blocked"),
		rotateHostKey: is("host_owner").or(self.cluster(Cluster.admin)),
	}),
});

export const SshPrincipal = define("ssh_principal", {
	relations: {
		authorizedTeam: Team,
		emergencyApproverTeam: Team,
	},
	roles: ["direct_signatory", "quarantined"],
	can: (self) => ({
		issueCertificate: is("direct_signatory")
			.or(self.authorizedTeam(Team.leadMember))
			.unless("quarantined"),
		breakGlassIssuance: self
			.emergencyApproverTeam(Team.leadMember)
			.unless("quarantined"),
	}),
});

export const DeploymentPipeline = define("pipeline", {
	relations: {
		targetCluster: Cluster,
		approverTeam: Team,
		notificationTeam: Team,
	},
	roles: ["pipeline_author", "release_manager", "frozen"],
	can: (self) => ({
		editConfig: is("pipeline_author", "release_manager")
			.or(self.targetCluster(Cluster.admin))
			.unless("frozen"),
		deployStaging: is("pipeline_author", "release_manager")
			.or(self.targetCluster(Cluster.operate))
			.unless("frozen"),
		deployProduction: is("release_manager")
			.or(self.approverTeam(Team.leadMember))
			.or(self.targetCluster(Cluster.admin))
			.unless("frozen"),
	}),
});

export const SecretVault = define("secret_vault", {
	relations: {
		org: Organization,
		linkedCluster: Cluster,
	},
	roles: ["vault_admin", "crypto_officer", "revoked"],
	can: (self) => ({
		manageKeys: is("vault_admin", "crypto_officer")
			.or(self.org(Organization.manage))
			.unless("revoked"),
		encryptDecrypt: is("vault_admin", "crypto_officer")
			.or(self.linkedCluster(Cluster.operate))
			.unless("revoked"),
		auditAccess: is("crypto_officer").or(self.org(Organization.audit)),
	}),
});

export const OAuthClient = define("oauth_client", {
	relations: {
		org: Organization,
		ownerTeam: Team,
	},
	roles: ["client_owner", "suspended"],
	can: (self) => ({
		rotateSecret: is("client_owner")
			.or(self.ownerTeam(Team.leadMember))
			.or(self.org(Organization.manage))
			.unless("suspended"),
		exchangeToken: is("client_owner")
			.or(self.ownerTeam(Team.member))
			.unless("suspended"),
	}),
});

export const System = define("system", {
	roles: ["admin", "auditor"],
	can: {
		manage: is("admin"),
		view: is("admin", "auditor"),
	},
});

export const SYSTEM_REBAC_SCHEMA = schema({
	Organization,
	Team,
	Cluster,
	SshHost,
	SshPrincipal,
	DeploymentPipeline,
	SecretVault,
	OAuthClient,
	System,
});
