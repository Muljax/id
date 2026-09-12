terraform {
	required_version = ">= 1.9.0"

	required_providers {
		cloudflare = {
			source  = "cloudflare/cloudflare"
			version = "~> 5.24"
		}
	}
}

provider "cloudflare" {}
