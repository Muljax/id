output "api_worker_name" {
  description = "API Worker name."
  value       = cloudflare_workers_script.api.script_name
}

output "dashboard_worker_name" {
  description = "Dashboard Worker name."
  value       = cloudflare_workers_script.dashboard.script_name
}

output "docs_worker_name" {
  description = "Docs Worker name."
  value       = cloudflare_workers_script.docs.script_name
}

output "database_name" {
  description = "D1 database name."
  value       = cloudflare_d1_database.api.name
}

output "database_id" {
  description = "D1 database ID."
  value       = cloudflare_d1_database.api.id
}

output "profile_bucket_name" {
  description = "R2 profile bucket name."
  value       = cloudflare_r2_bucket.profile.name
}

output "api_hostname" {
  description = "API hostname."
  value       = local.api_hostname
}

output "dashboard_hostname" {
  description = "Dashboard hostname."
  value       = local.dashboard_hostname
}

output "docs_hostname" {
  description = "Docs hostname."
  value       = local.docs_hostname
}

output "api_url" {
  description = "Public API URL."
  value       = local.api_url
}

output "dashboard_url" {
  description = "Public dashboard URL."
  value       = local.dashboard_url
}

output "docs_url" {
  description = "Public docs URL."
  value       = local.docs_url
}

output "oidc_issuer" {
  description = "OIDC issuer URL."
  value       = local.oidc_issuer
}

output "instance_name" {
  description = "Application instance name."
  value       = var.instance_name
}

output "cloudflare_account_id" {
  description = "Cloudflare account ID."
  value       = var.cloudflare_account_id
}

output "cloudflare_zone_id" {
  description = "Cloudflare zone ID."
  value       = var.cloudflare_zone_id
}
