locals {
	api_hostname = replace(
		replace(var.api_url, "https://", ""),
		"http://",
		"",
	)

	dashboard_hostname = replace(
		replace(var.dashboard_domain, "https://", ""),
		"http://",
		"",
	)

	api_worker_name       = "${var.instance_name}-api"
	dashboard_worker_name = "${var.instance_name}-dashboard"

	profile_bucket_name = "${var.instance_name}-profiles"
	database_name       = "${var.instance_name}-api"
}
