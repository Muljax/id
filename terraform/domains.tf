resource "cloudflare_workers_custom_domain" "api" {
  account_id = var.cloudflare_account_id
  zone_id    = var.cloudflare_zone_id
  hostname   = local.api_hostname
  service    = local.api_worker_name

  depends_on = [
    cloudflare_workers_script.api,
  ]
}

resource "cloudflare_workers_custom_domain" "dashboard" {
  account_id = var.cloudflare_account_id
  zone_id    = var.cloudflare_zone_id
  hostname   = local.dashboard_hostname
  service    = local.dashboard_worker_name

  depends_on = [
    cloudflare_workers_script.dashboard,
  ]
}
