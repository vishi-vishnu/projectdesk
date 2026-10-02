variable "vercel_team" {
  description = "Vercel team slug or ID that owns the project."
  type        = string
  default     = "vishnuuu"
}

variable "project_name" {
  description = "Name of the Vercel project. Use a new name (for example projectdesk-staging) to build a second copy."
  type        = string
  default     = "projectdesk"
}

variable "github_repo" {
  description = "GitHub repository Vercel deploys from, as owner/name."
  type        = string
  default     = "vishi-vishnu/projectdesk"
}

variable "production_branch" {
  description = "Pushes to this branch deploy to production; other branches get preview links."
  type        = string
  default     = "main"
}

# Firebase web config. Public by design: the security rules protect the data.
variable "firebase" {
  description = "Firebase web app config (from Project settings > Your apps)."
  type = object({
    api_key             = string
    auth_domain         = string
    project_id          = string
    storage_bucket      = string
    messaging_sender_id = string
    app_id              = string
  })
  default = {
    api_key             = "AIzaSyBMUtf4jbg1xHDmSGwMswozc1mP0seg5HQ"
    auth_domain         = "projectdesk-1de07.firebaseapp.com"
    project_id          = "projectdesk-1de07"
    storage_bucket      = "projectdesk-1de07.firebasestorage.app"
    messaging_sender_id = "86854104011"
    app_id              = "1:86854104011:web:0d52c2074fe2671624fc4e"
  }
}

variable "show_demo_accounts" {
  description = "Show the one-click demo logins on the sign-in page."
  type        = bool
  default     = true
}

variable "cloudinary_cloud_name" {
  description = "Cloudinary cloud name (Cloudinary dashboard)."
  type        = string
  default     = "ee8ixsbc"
}

# Secrets: no defaults. Pass them as TF_VAR_cloudinary_api_key and
# TF_VAR_cloudinary_api_secret environment variables, or in terraform.tfvars
# (which git ignores).
variable "cloudinary_api_key" {
  description = "Cloudinary API key."
  type        = string
  sensitive   = true
}

variable "cloudinary_api_secret" {
  description = "Cloudinary API secret. Only the server-side upload function sees it."
  type        = string
  sensitive   = true
}
