# The Vercel project, connected to GitHub: every push to the production
# branch deploys to production, every pull request gets a preview link.
resource "vercel_project" "this" {
  name      = var.project_name
  framework = "vite"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = var.production_branch
  }

  install_command  = "npm ci"
  build_command    = "npm run build"
  output_directory = "dist"
  node_version     = "22.x"
}

locals {
  everywhere = ["production", "preview"]

  # Values the browser bundle needs (VITE_ prefix). Not secret.
  public_vars = {
    VITE_FIREBASE_API_KEY             = var.firebase.api_key
    VITE_FIREBASE_AUTH_DOMAIN         = var.firebase.auth_domain
    VITE_FIREBASE_PROJECT_ID          = var.firebase.project_id
    VITE_FIREBASE_STORAGE_BUCKET      = var.firebase.storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID = var.firebase.messaging_sender_id
    VITE_FIREBASE_APP_ID              = var.firebase.app_id
    VITE_STORAGE_PROVIDER             = "cloudinary"
    VITE_DEMO_ACCOUNTS                = tostring(var.show_demo_accounts)
    FIREBASE_PROJECT_ID               = var.firebase.project_id
    CLOUDINARY_CLOUD_NAME             = var.cloudinary_cloud_name
  }

  # Server-only values for the upload-signing function. Never VITE_.
  secret_vars = {
    CLOUDINARY_API_KEY    = var.cloudinary_api_key
    CLOUDINARY_API_SECRET = var.cloudinary_api_secret
  }
}

resource "vercel_project_environment_variables" "this" {
  project_id = vercel_project.this.id

  variables = concat(
    [for key, value in local.public_vars : {
      key       = key
      value     = value
      target    = local.everywhere
      sensitive = false
    }],
    [for key, value in local.secret_vars : {
      key       = key
      value     = value
      target    = local.everywhere
      sensitive = true
    }],
  )
}
