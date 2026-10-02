# Deploy ProjectDesk for free

This guide puts your own copy of ProjectDesk online using free plans only:

| Service | Plan | Used for | Card needed? |
| --- | --- | --- | --- |
| Firebase | Spark (free) | Login and database | No |
| Cloudinary | Free | Uploaded files (PDF, PPT, images) | No |
| Vercel | Hobby (free) | Hosting the website and the upload function | No |
| GitHub | Free | Code and the CI pipeline | No |

It takes about 30 minutes. Do the steps in order.

---

## Step 1. Put the code on GitHub

1. On github.com, create a new **public** repository called `projectdesk`.
2. In a terminal inside the project folder, run:

   ```bash
   git remote add origin https://github.com/<your-username>/projectdesk.git
   git push -u origin main
   ```

If git signs in with the wrong GitHub account, add your username to the remote URL so it asks for the right one:

```bash
git remote set-url origin https://<your-username>@github.com/<your-username>/projectdesk.git
```

## Step 2. Create the Firebase project

1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. Click **Create a project**, name it `projectdesk`, and continue. You can turn off Google Analytics.
3. The project starts on the free **Spark** plan. Leave it that way.

### Turn on email and password login

1. In the left menu, open **Build > Authentication** and click **Get started**.
2. Under **Sign-in method**, choose **Email/Password**, switch on the first toggle and click **Save**.

### Create the database

1. Open **Build > Firestore Database** and click **Create database**.
2. Choose the **Standard** edition if you are asked.
3. Pick location **asia-south1 (Mumbai)**, or the region closest to your users. You cannot change this later.
4. Choose **Start in production mode** and click **Create**.

### Publish the security rules

1. In **Firestore Database**, open the **Rules** tab.
2. Delete everything there, paste the full contents of [`firestore.rules`](../firestore.rules) and click **Publish**.
3. Open the **Indexes** tab, then **Single field**, then **Add exemption**:
   - Collection ID: `submissions`
   - Field path: `cycleId`
   - Turn on **Ascending** for **Collection group** scope.

   The coordinator's progress matrix needs this index.

### Copy the web app keys

1. Click the gear icon next to **Project overview**, then **Project settings**.
2. Under **Your apps**, click the web icon `</>`, name the app `projectdesk-web` and click **Register app**. You don't need Firebase Hosting.
3. Firebase shows a `firebaseConfig` block. Keep it open; you need these six values in Step 4.

These values are safe to put in a website. Access is controlled by the security rules, not by keeping them secret.

## Step 3. Create the Cloudinary account

1. Sign up at <https://cloudinary.com/users/register_free>. The free plan needs no card.
2. Open the **Dashboard** (or **Settings > API Keys**) and note:
   - **Cloud name**
   - **API Key**
   - **API Secret**. Treat this like a password and never commit it.
3. Go to **Settings > Security** and turn on **Allow delivery of PDF and ZIP files**. Free accounts block PDF links until you do this.

The free plan allows files up to 10 MB, so the app rejects anything bigger.

## Step 4. Deploy on Vercel

1. Sign in at <https://vercel.com> with **the same GitHub account** that owns the repository.
2. Click **Add New > Project**, find `projectdesk` and click **Import**. If it isn't listed, click **Adjust GitHub App Permissions** and give Vercel access to the repository.
3. Vercel detects **Vite**. Leave the build settings as they are.
4. Open **Environment Variables** and add these. Tip: click in the first **Key** box and paste all the lines at once in `NAME=value` form; Vercel splits them into rows.

   | Name | Value |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | `apiKey` from firebaseConfig |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `VITE_FIREBASE_PROJECT_ID` | `projectId` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
   | `VITE_FIREBASE_APP_ID` | `appId` |
   | `VITE_STORAGE_PROVIDER` | `cloudinary` |
   | `VITE_DEMO_ACCOUNTS` | `true` (shows the demo login buttons) |
   | `FIREBASE_PROJECT_ID` | same as `projectId` |
   | `CLOUDINARY_CLOUD_NAME` | from Cloudinary |
   | `CLOUDINARY_API_KEY` | from Cloudinary |
   | `CLOUDINARY_API_SECRET` | from Cloudinary |

   Never start the Cloudinary secret's name with `VITE_`. Anything with that prefix is sent to the browser.

5. Click **Deploy**. After about a minute you get a link like `https://projectdesk-xxxx.vercel.app`.
6. Back in Firebase, open **Authentication > Settings > Authorized domains**, click **Add domain** and add your Vercel domain (without `https://`).

From now on, every push to `main` redeploys the site, and every pull request gets its own preview link.

## Step 5. Create the coordinator and the demo data

Nobody can sign up as a coordinator from the app. This is on purpose, and the security rules enforce it. Pick one option:

**Option A: quick, no demo data**

1. Open your site and register as **Faculty**.
2. In Firebase, open **Firestore Database > Data > users** and click your document.
3. Change `role` to `coordinator` and `status` to `active`.

**Option B: demo accounts and sample teams (best for a portfolio)**

1. In Firebase **Project settings > Service accounts**, click **Generate new private key**. Save the file **outside** the project folder, for example `C:\keys\projectdesk-sa.json`.
2. In the project folder, run:

   ```powershell
   # Windows PowerShell
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\keys\projectdesk-sa.json"
   $env:FIREBASE_PROJECT_ID="<your-project-id>"
   npm run seed -- --production
   ```

   ```bash
   # macOS / Linux
   GOOGLE_APPLICATION_CREDENTIALS=~/keys/projectdesk-sa.json FIREBASE_PROJECT_ID=<your-project-id> npm run seed -- --production
   ```

This creates the coordinator, guide and student demo accounts (password `Demo@1234`) and five sample teams. Running it again is safe.

## Step 6 (optional). Deploy the rules from CI

The CI pipeline can publish `firestore.rules` for you after all tests pass. In GitHub, open **Settings > Secrets and variables > Actions** and add:

- `FIREBASE_SERVICE_ACCOUNT`: the whole JSON of a service-account key
- `FIREBASE_PROJECT_ID`: your project ID

Without these secrets, the deploy step is skipped and everything else still runs.

## Step 7 (optional). Turn on the uptime check

1. In GitHub, open **Settings > Secrets and variables > Actions > Variables**.
2. Add a variable `LIVE_URL` with your site address, for example `https://projectdesk-three.vercel.app`.

The **Uptime check** workflow then calls `/api/health` every 6 hours and emails you if it fails. The **Post-deploy smoke test** workflow runs by itself after each production deploy and needs no setup.

## If something goes wrong

| What you see | How to fix it |
| --- | --- |
| "Missing or insufficient permissions" on every page | The rules were not published (Step 2), or the account's `status` is not `active`. |
| The coordinator overview shows an index error | Add the `submissions` / `cycleId` exemption from Step 2. |
| Upload fails with "not configured on the server" | Check the Cloudinary variables and `FIREBASE_PROJECT_ID` in Vercel, then redeploy. |
| A PDF opens as a blank page or a 401 error | Turn on PDF delivery in Cloudinary (Step 3). |
| `git push` says permission denied to another account | Use the `git remote set-url` command from Step 1. |
| `/api/health` returns 503 | Open the response: `checks` shows which server setting is missing in Vercel. |
