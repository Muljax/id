resource "cloudflare_workers_domain" "api" {
	account_id = var.cloudflare_account_id
	zone_id    = var.cloudflare_zone_id

	hostname = local.api_hostname
	service  = cloudflare_workers_script.api.script_name
}

resource "cloudflare_workers_domain" "dashboard" {
	account_id = var.cloudflare_account_id
	zone_id    = var.cloudflare_zone_id

	hostname = local.dashboard_hostname
	service  = cloudflare_workers_script.dashboard.script_name
}
