resource "cloudflare_workers_script" "api" {
	account_id = var.cloudflare_account_id

	script_name = local.api_worker_name

	content_file   = var.api_worker_file
	content_sha256 = filesha256(var.api_worker_file)

	main_module = basename(var.api_worker_file)

	compatibility_date = "2026-07-11"

	bindings = [
		{
			name        = "DB"
			type        = "d1"
			database_id = cloudflare_d1_database.api.id
		},

		{
			name        = "PROFILE_BUCKET"
			type        = "r2_bucket"
			bucket_name = cloudflare_r2_bucket.profile.name
		},

		{
			name         = "AUTH_RATE_LIMITER"
			type         = "ratelimit"
			namespace_id = 80085

			simple = {
				limit  = 10
				period = 60
			}
		},

		{
			name          = "LIFECYCLE_WORKFLOW"
			type          = "workflow"
			workflow_name = cloudflare_workflow.lifecycle.workflow_name
		},

		{
			name = "INSTANCE_NAME"
			type = "plain_text"
			text = var.instance_name
		},

		{
			name = "DASHBOARD_DOMAIN"
			type = "plain_text"
			text = var.dashboard_domain
		},

		{
			name = "RP_NAME"
			type = "plain_text"
			text = "Muljax ID"
		},

		{
			name = "RP_ID"
			type = "plain_text"
			text = local.dashboard_hostname
		},

		{
			name = "ORIGIN"
			type = "plain_text"
			text = var.api_url
		},

		{
			name = "OIDC_ISSUER"
			type = "plain_text"
			text = var.oidc_issuer
		},

		{
			name = "LOCALHOST"
			type = "plain_text"
			text = tostring(var.localhost)
		},

		{
			name = "ADMIN_BOOTSTRAP_SECRET"
			type = "secret_text"
			text = var.admin_bootstrap_secret
		},

		{
			name = "OIDC_PRIVATE_KEY"
			type = "secret_text"
			text = var.oidc_private_key
		},
	]
}

resource "cloudflare_workers_script" "dashboard" {
	account_id = var.cloudflare_account_id

	script_name = local.dashboard_worker_name

	content_file   = var.dashboard_worker_file
	content_sha256 = filesha256(var.dashboard_worker_file)

	main_module = basename(var.dashboard_worker_file)

	assets = {
		directory = var.dashboard_assets_directory

		config = {
			not_found_handling = "single-page-application"
		}
	}
}
