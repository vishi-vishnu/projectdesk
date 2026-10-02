output "project_id" {
  description = "Vercel project ID (Settings > General on vercel.com)."
  value       = vercel_project.this.id
}

output "environment_variables" {
  description = "Names of the environment variables Terraform manages."
  value       = sort(concat(keys(local.public_vars), keys(local.secret_vars)))
}
