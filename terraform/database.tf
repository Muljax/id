resource "cloudflare_d1_database" "api" {
	account_id = var.cloudflare_account_id
	name       = local.database_name
}
