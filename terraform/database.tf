resource "cloudflare_d1_database" "api" {
  account_id = var.cloudflare_account_id

  name = local.database_name

  read_replication = {
    mode = "disabled"
  }
}

resource "local_file" "d1_migrations_config" {
  filename = "${path.module}/.wrangler-d1-migrations.toml"

  content = <<-EOT
		[[d1_databases]]
		binding = "DB"
		database_name = "${local.database_name}"
		database_id = "${cloudflare_d1_database.api.id}"
		migrations_dir = "${var.d1_migrations_directory}"
		migrations_pattern = "${var.d1_migrations_directory}/*/migration.sql"
	EOT
}

locals {
  d1_migrations_directory = "${path.module}/${var.d1_migrations_directory}"

  d1_migration_files = fileset(
    local.d1_migrations_directory,
    "*/migration.sql",
  )

  d1_migrations_hash = sha256(join("", [
    for migration in sort(local.d1_migration_files) :
    "${migration}:${filesha256("${local.d1_migrations_directory}/${migration}")}"
  ]))
}

resource "terraform_data" "d1_migrations" {
  triggers_replace = [
    cloudflare_d1_database.api.id,
    local.d1_migrations_hash,
  ]

  depends_on = [
    local_file.d1_migrations_config,
  ]

  provisioner "local-exec" {
    working_dir = path.module

    command = <<-EOT
      bunx wrangler d1 migrations apply ${local.database_name} --remote --config ${local_file.d1_migrations_config.filename}
      DATABASE_NAME="${local.database_name}" CONFIG_FILE="${local_file.d1_migrations_config.filename}" bun run ../scripts/seed-d1.ts
    EOT
  }
}
