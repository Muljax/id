resource "cloudflare_r2_bucket" "profile" {
	account_id = var.cloudflare_account_id
	name       = local.profile_bucket_name
}
