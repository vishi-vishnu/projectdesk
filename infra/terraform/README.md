# Vercel setup as code (Terraform)

These files describe the Vercel project: which GitHub repo it deploys, the
build settings and all 12 environment variables. With them, the whole hosting
setup can be rebuilt with one command instead of clicking through the
dashboard. CI checks the files with `terraform fmt` and `terraform validate`
on every push.

| File | What it holds |
| --- | --- |
| `versions.tf` | Terraform version and the Vercel provider. |
| `variables.tf` | Inputs, with defaults for everything except the two Cloudinary secrets. |
| `main.tf` | The `vercel_project` (GitHub link, build commands, Node version) and its environment variables. |
| `outputs.tf` | The project ID and the list of variables Terraform manages. |
| `terraform.tfvars.example` | Template for your secret values. |

Secrets never go in these files. The Vercel token comes from the
`VERCEL_API_TOKEN` environment variable and the Cloudinary values from
`terraform.tfvars`, which git ignores.

## One-time setup

1. Install Terraform: `winget install Hashicorp.Terraform` (Windows), then open a new terminal and check `terraform -version`.
2. Create a Vercel token at vercel.com > Account Settings > **Tokens** (scope: your team, expiry 30 days is fine).
3. In this folder, copy `terraform.tfvars.example` to `terraform.tfvars` and fill in the Cloudinary key and secret.

```powershell
cd infra/terraform
$env:VERCEL_API_TOKEN="paste-your-token"
terraform init
```

## Option A: build a separate copy (safe, good for learning)

This creates a second project, for example a staging site, without touching
the live one:

```powershell
terraform plan  -var project_name=projectdesk-staging
terraform apply -var project_name=projectdesk-staging
```

Vercel deploys it from GitHub straight away. Add its `.vercel.app` domain to
Firebase **Authentication > Settings > Authorized domains** so sign-in works.
Remove it again with `terraform destroy -var project_name=projectdesk-staging`.

## Option B: manage the live project with Terraform

The live project was made in the dashboard, so Terraform has to adopt it first:

1. Find the project ID on vercel.com > projectdesk > **Settings > General**.
2. `terraform import vercel_project.this prj_xxxxxxxxxxxxxxxx`
3. Delete the existing environment variables in **Settings > Environment Variables** (Terraform recreates the same ones in the next step).
4. `terraform plan` to review, then `terraform apply`.
5. Redeploy once from the Vercel dashboard so the build picks up the variables.

From then on, change settings in these files, run `terraform plan` to see the
difference, and `terraform apply` to make it so.

## Words to know

- **Provider:** the plugin that talks to a service's API (here, Vercel).
- **Plan:** a preview of what will change. Nothing changes until `apply`.
- **State:** Terraform's record of what it created (`terraform.tfstate`). It can contain secrets, so it is git-ignored. Teams keep it in a remote backend such as Terraform Cloud or an S3 bucket.
- **Import:** adopting something that already exists so Terraform can manage it.
- **Drift:** when someone changes a setting by hand; `terraform plan` shows it.
