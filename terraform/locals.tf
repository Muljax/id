locals {
  protocol = var.localhost ? "http" : "https"

  api_hostname       = var.api_domain
  dashboard_hostname = var.dashboard_domain

  api_url       = "${local.protocol}://${local.api_hostname}"
  dashboard_url = "${local.protocol}://${local.dashboard_hostname}"
  oidc_issuer   = local.api_url

  api_worker_name       = "${var.instance_name}-api"
  dashboard_worker_name = "${var.instance_name}-dashboard"

  profile_bucket_name = "${var.instance_name}-profiles"
  database_name       = "${var.instance_name}-api"
}
