# Deploying ProjectDesk for free

Everything here fits in free tiers: **Firebase Spark** (Auth and Firestore), **Cloudinary Free** (files), **Vercel Hobby** (hosting and the upload API) and **GitHub** (code and CI). No credit card is needed.

It takes about 20 minutes.

---

## 1. Push the code to GitHub

1. On github.com, create a new **public** repository called `projectdesk`. Don't add a README, .gitignore or licence.
2. In a terminal inside the project folder, run:

   ```bash
   git remote add origin https://github.com/<your-username>/projectdesk.git
   git push -u origin main
   ```

   If the folder isn't a git repository yet, run `git init -b main && git add . && git commit -m "Initial commit"` first.

Every push to `main` now runs the CI pipeline under the repository's **Actions** tab.

## 2. Create the Firebase project (Spark plan)

1. Go to <https://console.firebase.google.com>, choose **Create a project** and name it `projectdesk`. You can turn Google Analytics off.
2. **Authentication:** choose **Build → Authentication → Get started**, then enable **Email/Password** under **Sign-in method**.
3. **Firestore:** choose **Build → Firestore Database → Create database**, pick **production mode** and location **asia-south1 (Mumbai)**.
4. **Web app config:** open **Project settings** (gear icon) → **General** → **Your apps**, click the **</>** icon, register an app called `projectdesk-web`, and copy the `firebaseConfig` values. You'll paste these into Vercel in step 4.

### Publish the security rules

Choose either option.

- **Console (no tools needed)**
  1. Open **Firestore → Rules**, replace the contents with the contents of [`firestore.rules`](../firestore.rules) and click **Publish**.
  2. Open **Firestore → Indexes → Single field → Add exemption**. Set collection ID `submissions` and field `cycleId`, then enable **Ascending** for *Collection group* scope. The coordinator's progress matrix needs this.
- **CLI**

  ```bash
  npx firebase login
  npx firebase deploy --only firestore --project <your-project-id>
  ```

### Create the coordinator account

Nobody can register as a coordinator from the app. This is deliberate and enforced by the rules. Pick one of these:

- **Quick:** sign up in the app as *Faculty*. In **Firestore → Data → users → (your document)**, set `role` to `coordinator` and `status` to `active`.
- **With demo data (recommended for a portfolio):** open **Project settings → Service accounts → Generate new private key** and save the file outside the project folder. Then run:

  ```powershell
  # Windows PowerShell
  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\keys\projectdesk-sa.json"
  $env:FIREBASE_PROJECT_ID="<your-project-id>"
  npm run seed -- --production
  ```

  ```bash
  # macOS / Linux
  GOOGLE_APPLICATION_CREDENTIALS=~/keys/projectdesk-sa.json FIREBASE_PROJECT_ID=<id> npm run seed -- --production
  ```

  This creates the demo coordinator, faculty and student accounts (password `Demo@1234`) and five sample teams. **Never commit the key file.**

## 3. Create the Cloudinary account (file storage)

1. Sign up at <https://cloudinary.com/users/register_free>.
2. On the **Dashboard**, note the **Cloud name**, **API Key** and **API Secret**.
3. Go to **Settings → Security** and turn on **Allow delivery of PDF and ZIP files**. Free accounts block PDF delivery by default.

## 4. Deploy on Vercel

1. Sign in at <https://vercel.com> with your GitHub account, click **Add New → Project** and import `projectdesk`. The framework is detected as **Vite**.
2. Under **Environment Variables**, add:

   | Name | Value |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | from `firebaseConfig` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `<project-id>.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `<project-id>` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | from `firebaseConfig` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | from `firebaseConfig` |
   | `VITE_FIREBASE_APP_ID` | from `firebaseConfig` |
   | `VITE_STORAGE_PROVIDER` | `cloudinary` |
   | `VITE_DEMO_ACCOUNTS` | `true` if you seeded demo data |
   | `FIREBASE_PROJECT_ID` | `<project-id>` |
   | `CLOUDINARY_CLOUD_NAME` | from Cloudinary |
   | `CLOUDINARY_API_KEY` | from Cloudinary |
   | `CLOUDINARY_API_SECRET` | from Cloudinary (server-only, never prefix with `VITE_`) |

3. Click **Deploy**. Every push to `main` redeploys, and every pull request gets its own preview URL.
4. Back in Firebase, open **Authentication → Settings → Authorized domains** and add your `*.vercel.app` domain.

## 5. (Optional) Deploy rules automatically from CI

In GitHub, open **Settings → Secrets and variables → Actions** and add:

- `FIREBASE_SERVICE_ACCOUNT`: the full JSON of a service-account key with the *Firebase Rules Admin* and *Cloud Datastore Index Admin* roles
- `FIREBASE_PROJECT_ID`: your project ID

The `deploy-rules` job then publishes `firestore.rules` and indexes after all tests pass on `main`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Missing or insufficient permissions" everywhere | The rules weren't published (step 2), or the user's `status` isn't `active`. |
| Coordinator overview shows an index error | Add the `submissions.cycleId` collection-group exemption (step 2). |
| Uploads fail with "not configured on the server" | Check the Cloudinary and `FIREBASE_PROJECT_ID` environment variables in Vercel, then redeploy. |
| PDF preview shows a 401 | Turn on PDF delivery in Cloudinary (step 3). |
| Sign-in fails only on the live site | Add the Vercel domain to Firebase authorized domains. |
