resource "cloudflare_workflow" "lifecycle" {
	account_id = var.cloudflare_account_id

	workflow_name = "Lifecycle"
	class_name    = "LifecycleWorkflow"
	script_name   = cloudflare_workers_script.api.script_name
}
