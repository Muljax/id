locals {
  protocol = var.localhost ? "http" : "https"

  api_hostname       = var.api_domain
  dashboard_hostname = var.dashboard_domain

  api_url       = "${local.protocol}://${local.api_hostname}"
  dashboard_url = "${local.protocol}://${local.dashboard_hostname}"
  oidc_issuer   = local.api_url

  _clean_instance_name     = trim(replace(replace(lower(var.instance_name), "/[^a-z0-9-]+/", "-"), "/-+/", "-"), "-")
  normalized_instance_name = can(regex("^[a-z]", local._clean_instance_name)) ? local._clean_instance_name : (local._clean_instance_name == "" ? "id" : "id-${local._clean_instance_name}")

  api_worker_name       = "${local.normalized_instance_name}-api"
  dashboard_worker_name = "${local.normalized_instance_name}-dashboard"

  profile_bucket_name = "${local.normalized_instance_name}-profiles"
  database_name       = "${local.normalized_instance_name}-api"
}
