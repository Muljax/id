resource "cloudflare_workflow" "lifecycle" {
  account_id = var.cloudflare_account_id

  workflow_name = "Lifecycle"
  class_name    = "LifecycleWorkflow"
  script_name   = local.api_worker_name
}
