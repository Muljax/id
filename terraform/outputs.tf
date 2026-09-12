output "api_worker_name" {
	description = "API Worker name."
	value       = cloudflare_workers_script.api.script_name
}

output "dashboard_worker_name" {
	description = "Dashboard Worker name."
	value       = cloudflare_workers_script.dashboard.script_name
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
