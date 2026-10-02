terraform {
  required_version = ">= 1.6"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 5.19"
    }
  }
}

# The API token is read from the VERCEL_API_TOKEN environment variable,
# so it never appears in these files.
provider "vercel" {
  team = var.vercel_team
}
