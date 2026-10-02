# DevOps guide

How ProjectDesk is built, tested, shipped and watched, in plain words. The last part is a runbook for common jobs.

## The pipeline at a glance

| When | What runs | Where to see it |
| --- | --- | --- |
| Every push and pull request | **CI**: dependency audit, lint, type check, unit tests, build, security-rules tests, Playwright E2E, Docker build and run | GitHub > Actions > CI |
| Every push and pull request | **CodeQL** security scan of the TypeScript code | GitHub > Security > Code scanning |
| Push to `main`, all green | Docker image pushed to GitHub Container Registry; Firestore rules deployed (if the secret is set) | GitHub > Packages |
| Every pull request | Vercel builds a **preview** site with its own link | The Vercel bot comment on the PR |
| Push to `main` | Vercel deploys **production** | vercel.com > projectdesk |
| After each production deploy | **Smoke test** of the live site | GitHub > Actions > Post-deploy smoke test |
| Every 6 hours | **Uptime check** of `/api/health` | GitHub > Actions > Uptime check |
| Every Monday | **Dependabot** opens grouped update PRs | GitHub > Pull requests |
| Push a tag like `v1.1.0` | **Release**: versioned Docker image + GitHub Release notes | GitHub > Releases |

## Words you will be asked about

- **CI (continuous integration):** every change is built and tested automatically, so problems show up within minutes, not at the end.
- **CD (continuous deployment):** once a change passes, it goes live automatically. Here Vercel deploys `main`.
- **Pipeline / workflow:** the list of steps CI runs. Ours live in `.github/workflows/*.yml`.
- **Job:** one group of steps on its own machine. Jobs without `needs:` run in parallel.
- **Artifact:** a file a job saves, like the test report kept when E2E fails.
- **Docker image:** a packaged app with everything it needs to run. **Container:** a running copy of an image.
- **Multi-stage build:** stage 1 has Node and builds the app; stage 2 copies only the built files into a small nginx image.
- **Registry:** a store for images. We use GitHub Container Registry (`ghcr.io`).
- **Preview deployment:** a temporary live copy of a pull request.
- **Smoke test:** a few quick checks that the live site is basically working.
- **Health check:** an endpoint that says whether the service is OK. Ours is `/api/health`.
- **Secret:** a password-like value (API secret, service-account key). Kept in Vercel or GitHub settings, never in the code.
- **Infrastructure as code:** settings kept as files in the repo (`firestore.rules`, `firestore.indexes.json`, `vercel.json`, `Dockerfile`), reviewed like code.
- **Rollback:** going back to the last good version.

## Runbook

### Roll back a bad deploy (30 seconds)

1. Open vercel.com > projectdesk > **Deployments**.
2. Find the last deployment that worked, open the menu (three dots) and choose **Promote to Production**.
3. Fix the bug on a branch, let CI pass, then merge.

### Run the production image on your computer

```bash
docker compose up --build        # then open http://localhost:8080
# or the exact image CI published:
docker run -p 8080:8080 ghcr.io/vishi-vishnu/projectdesk:latest
```

### Cut a release

```bash
git tag v1.1.0
git push origin v1.1.0
```

The Release workflow publishes `ghcr.io/vishi-vishnu/projectdesk:v1.1.0` and writes release notes from the commits.

### Rotate the Cloudinary secret

1. Cloudinary > Settings > API Keys > **Generate New API Key**.
2. Vercel > projectdesk > Settings > **Environment Variables**: update `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`.
3. Vercel > Deployments > latest > **Redeploy**.
4. Open `/api/health`. It should say `"status":"ok"`.
5. Delete the old key in Cloudinary.

### The uptime check failed

1. Open `https://projectdesk-three.vercel.app/api/health`.
2. `503` with `uploadSigning: false` means a Cloudinary variable is missing in Vercel. `firebaseConfig: false` means `FIREBASE_PROJECT_ID` is missing.
3. No answer at all: check vercel.com for a failed deployment or an outage, and roll back if needed.

### Handle Dependabot pull requests

1. Wait for the checks to turn green.
2. Read the title: a **patch** or **minor** update is usually safe to merge.
3. For a **major** update, read the package's release notes first, then merge if CI is green.

### Re-load the demo data

```bash
npm run seed:live
```

It finds the newest `*-firebase-adminsdk-*.json` key in your Downloads folder. Running it again resets the demo accounts and teams.
