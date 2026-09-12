variable "cloudflare_account_id" {
	description = "Cloudflare account ID."
	type        = string
}

variable "cloudflare_zone_id" {
	description = "Cloudflare zone ID for the application domain."
	type        = string
}

variable "instance_name" {
	description = "Application instance name."
	type        = string
	default     = "muljax-id"
}

variable "api_url" {
	description = "Public URL of the API."
	type        = string
}

variable "dashboard_domain" {
	description = "Public hostname of the dashboard."
	type        = string
}

variable "oidc_issuer" {
	description = "OIDC issuer URL."
	type        = string
}

variable "localhost" {
	description = "Whether the API is running in localhost mode."
	type        = bool
	default     = false
}

variable "admin_bootstrap_secret" {
	description = "Secret used to bootstrap the initial administrator."
	type        = string
	sensitive   = true
}

variable "oidc_private_key" {
	description = "OIDC ES256 private key as a JSON JWK."
	type        = string
	sensitive   = true
}

variable "api_worker_file" {
	description = "Built API Worker JavaScript module."
	type        = string
	default     = "../apps/api/dist/index.js"
}

variable "dashboard_worker_file" {
	description = "Built dashboard Worker JavaScript module."
	type        = string
	default     = "../apps/dashboard/dist/worker.js"
}

variable "dashboard_assets_directory" {
	description = "Built dashboard static assets."
	type        = string
	default     = "../apps/dashboard/dist"
}

variable "d1_migrations_directory" {
	description = "Drizzle D1 migrations directory."
	type        = string
	default     = "../apps/api/drizzle/migrations"
}
