import { define, is, schema } from "../schema";

export const HoldingCompany = define("holding_company", {
	roles: ["board_director", "global_ciso", "compliance_officer", "member"],
});

export const BusinessUnit = define("business_unit", (self) => ({
	relations: {
		parentCompany: HoldingCompany,
	},
	roles: ["unit_executive", "security_lead", "staff"],
	can: {
		audit: is("security_lead").or(
			self.parentCompany(HoldingCompany.compliance_officer),
			self.parentCompany(HoldingCompany.global_ciso),
		),
		manage: is("unit_executive").or(
			self.parentCompany(HoldingCompany.board_director),
		),
	},
}));

export const Department = define("department", (self) => ({
	relations: {
		businessUnit: BusinessUnit,
	},
	roles: ["manager", "lead", "engineer", "suspended"],
	can: {
		manage: is("manager").or(self.businessUnit(BusinessUnit.manage)),
		lead: is("lead").or("manage"),
		work: is("engineer").or("lead").or("manage").unless("suspended"),
		audit: is("manager").or(self.businessUnit(BusinessUnit.audit)),
	},
}));

export const CostCenter = define("cost_center", (self) => ({
	relations: {
		department: Department,
	},
	roles: ["approver", "budget_owner", "auditor"],
	can: {
		spend: is("budget_owner").or("approver"),
		audit: is("auditor").or("approver").or(self.department(Department.audit)),
	},
}));

export const CloudTenant = define("cloud_tenant", (self) => ({
	relations: {
		costCenter: CostCenter,
	},
	roles: ["cloud_architect", "operator", "finops_analyst", "quarantined"],
	can: {
		admin: is("cloud_architect").unless("quarantined"),
		operate: is("operator").or("admin").unless("quarantined"),
		view_billing: is("finops_analyst").or(self.costCenter(CostCenter.spend)),
		audit: self.costCenter(CostCenter.audit),
	},
}));

export const VpcNetwork = define("vpc_network", (self) => ({
	relations: {
		tenant: CloudTenant,
	},
	roles: ["netops_admin", "peering_admin"],
	can: {
		route: is("netops_admin").or(self.tenant(CloudTenant.admin)),
		peer: is("peering_admin").or(self.tenant(CloudTenant.admin)),
	},
}));

export const KubernetesCluster = define("k8s_cluster", (self) => ({
	relations: {
		vpc: VpcNetwork,
		tenant: CloudTenant,
	},
	roles: ["cluster_admin", "node_operator", "telemetry_viewer"],
	can: {
		cluster_admin: is("cluster_admin").or(self.tenant(CloudTenant.admin)),
		maintain_nodes: is("node_operator").or("cluster_admin"),
		view_metrics: is("telemetry_viewer").or("cluster_admin"),
	},
}));

export const WorkloadNamespace = define("workload_namespace", (self) => ({
	relations: {
		cluster: KubernetesCluster,
		owningDepartment: Department,
	},
	roles: ["namespace_admin", "developer", "viewer"],
	can: {
		admin: is("namespace_admin").or(
			self.cluster(KubernetesCluster.cluster_admin),
		),
		deploy: is("developer")
			.or("admin")
			.or(self.owningDepartment(Department.work)),
		view: is("viewer").or("deploy").or("admin"),
	},
}));

export const PodService = define("pod_service", (self) => ({
	relations: {
		namespace: WorkloadNamespace,
	},
	roles: ["service_maintainer"],
	can: {
		scale: is("service_maintainer").or(self.namespace(WorkloadNamespace.admin)),
		restart: is("service_maintainer").or(
			self.namespace(WorkloadNamespace.deploy),
		),
		debug: self.namespace(WorkloadNamespace.deploy),
	},
}));

export const DataDomain = define("data_domain", (self) => ({
	relations: {
		businessUnit: BusinessUnit,
	},
	roles: ["domain_steward", "data_officer"],
	can: {
		govern: is("domain_steward", "data_officer").or(
			self.businessUnit(BusinessUnit.manage),
		),
	},
}));

export const DataProduct = define("data_product", (self) => ({
	relations: {
		domain: DataDomain,
		owningDepartment: Department,
	},
	roles: ["product_owner", "data_engineer", "subscriber"],
	can: {
		publish: is("product_owner").or(self.domain(DataDomain.govern)),
		modify_schema: is("data_engineer").or("publish"),
		consume: is("subscriber").or("modify_schema"),
	},
}));

export const IcebergTable = define("iceberg_table", (self) => ({
	relations: {
		dataProduct: DataProduct,
	},
	roles: ["table_owner", "querier", "pii_reader", "masked_only"],
	can: {
		manage: is("table_owner").or(self.dataProduct(DataProduct.modify_schema)),
		query_raw: is("pii_reader").or("manage").unless("masked_only"),
		query_masked: is("querier")
			.or("query_raw")
			.or(self.dataProduct(DataProduct.consume)),
	},
}));

export const SecretVault = define("secret_vault", (self) => ({
	relations: {
		tenant: CloudTenant,
	},
	roles: ["security_officer", "vault_admin", "break_glass_responder"],
	can: {
		admin: is("vault_admin").or(self.tenant(CloudTenant.admin)),
		break_glass: is("break_glass_responder").or("security_officer"),
	},
}));

export const KmsKey = define("kms_key", (self) => ({
	relations: {
		vault: SecretVault,
	},
	roles: ["key_custodian", "encryptor", "decryptor", "revoked"],
	can: {
		manage: is("key_custodian").or(self.vault(SecretVault.admin)),
		encrypt: is("encryptor").or("manage").unless("revoked"),
		decrypt: is("decryptor").or("manage").unless("revoked"),
	},
}));

export const SshBastion = define("ssh_bastion", (self) => ({
	relations: {
		vpc: VpcNetwork,
		vault: SecretVault,
	},
	roles: ["bastion_admin", "authorized_user", "jit_elevated"],
	can: {
		connect: is("authorized_user").or("bastion_admin", "jit_elevated"),
		root_shell: is("bastion_admin").or(self.vault(SecretVault.break_glass)),
	},
}));

export const CodeRepository = define("code_repository", (self) => ({
	relations: {
		department: Department,
	},
	roles: ["maintainer", "committer", "triage", "security_scanner"],
	can: {
		admin: is("maintainer").or(self.department(Department.lead)),
		push: is("committer").or("admin").unless("triage"),
		scan: is("security_scanner").or("admin"),
	},
}));

export const BuildPipeline = define("build_pipeline", (self) => ({
	relations: {
		repo: CodeRepository,
	},
	roles: ["pipeline_admin", "trigger_runner"],
	can: {
		configure: is("pipeline_admin").or(self.repo(CodeRepository.admin)),
		trigger: is("trigger_runner")
			.or("configure")
			.or(self.repo(CodeRepository.push)),
	},
}));

export const ArtifactRegistry = define("artifact_registry", (self) => ({
	relations: {
		tenant: CloudTenant,
	},
	roles: ["registry_admin", "publisher", "consumer"],
	can: {
		admin: is("registry_admin").or(self.tenant(CloudTenant.admin)),
		publish: is("publisher").or("admin"),
		pull: is("consumer").or("publish"),
	},
}));

export const ReleaseGate = define("release_gate", (self) => ({
	relations: {
		pipeline: BuildPipeline,
		registry: ArtifactRegistry,
	},
	roles: ["qa_signoff", "ciso_signoff", "release_manager"],
	can: {
		deploy_production: is("release_manager")
			.and("qa_signoff", "ciso_signoff")
			.or(self.registry(ArtifactRegistry.admin)),
	},
}));

export const LegalHold = define("legal_hold", (self) => ({
	relations: {
		company: HoldingCompany,
	},
	roles: ["general_counsel", "forensic_investigator"],
	can: {
		impose: is("general_counsel").or(
			self.company(HoldingCompany.board_director),
		),
		investigate: is("forensic_investigator").or("impose"),
	},
}));

export const AuditLogSink = define("audit_log_sink", (self) => ({
	relations: {
		tenant: CloudTenant,
		legalHold: LegalHold,
	},
	roles: ["soc_analyst", "external_auditor"],
	can: {
		read_logs: is("soc_analyst", "external_auditor")
			.or(self.legalHold(LegalHold.investigate))
			.or(self.tenant(CloudTenant.audit)),
		purge_logs: self.legalHold(LegalHold.impose),
	},
}));

export const ENTERPRISE_REBAC_SCHEMA = schema({
	HoldingCompany,
	BusinessUnit,
	Department,
	CostCenter,
	CloudTenant,
	VpcNetwork,
	KubernetesCluster,
	WorkloadNamespace,
	PodService,
	DataDomain,
	DataProduct,
	IcebergTable,
	SecretVault,
	KmsKey,
	SshBastion,
	CodeRepository,
	BuildPipeline,
	ArtifactRegistry,
	ReleaseGate,
	LegalHold,
	AuditLogSink,
});
