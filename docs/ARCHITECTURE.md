# Architecture

## Overview

ProjectDesk is a single-page React app that talks to Firebase directly. There is no custom API server for data. Firestore security rules are the authorization layer, and real-time listeners keep every open screen current. The one server-side piece is a Vercel function that signs file uploads, so the Cloudinary API secret never reaches the browser.

```
Browser (React SPA) ──onSnapshot / batched writes──► Cloud Firestore ◄── firestore.rules
       │                                                    ▲
       │── ID token ──► /api/upload-signature ──REST as user┘  (membership check)
       │                         │
       └──── signed upload ──────┴──────────────► Cloudinary (files)
```

## Data model (Firestore)

```
users/{uid}                     name, email, role (student|faculty|coordinator),
                                status (active|pending|rejected), department,
                                regNo | designation, teamId
cycles/{cycleId}                name, academicYear, department, isActive, maxTeamSize,
                                reviews: [{ id, title, description, dueDate, maxMarks }]
joinCodes/{CODE}                teamId, teamName, cycleId, leadName
teams/{teamId}                  cycleId, name, leadId, memberIds[], guideId, joinCode,
                                project { title, abstract, domain, techStack[] },
                                proposalStatus (draft|submitted|approved|changes_requested),
                                proposalRemarks, lastJoin { uid, code }
  submissions/{id}              reviewId, version, title, notes, files[], submittedBy,
                                status (submitted|changes_requested|accepted),
                                evaluation { marks, remarks, evaluatedBy, evaluatedAt }
    comments/{id}               authorId, authorName, authorRole, body, kind (comment|doubt), resolved
  discussion/{id}               same shape as comments, one team-wide thread
  activity/{id}                 type, actorId, actorName, message   (append-only)
```

Why it is shaped like this:

- **Review stages are embedded in the cycle.** There are never more than about eight, they are always read together, and editing the schedule is a single write.
- **Submissions are a subcollection of the team.** Access checks reduce to "can you access this team?", which costs one `get()` in the rules. The coordinator's cross-team view uses a collection-group query on `cycleId`.
- **Versions are separate documents,** not an array. Documents stay small, history is immutable, and "latest" is computed as the highest `version` per stage.
- **Names are denormalised** onto comments, submissions and activity. A comment shows its author without an extra read, and the rules check that the stored name matches the author's profile.
- **Join codes are their own collection.** A student can fetch `joinCodes/ABC123` if they know the code, but the collection cannot be listed. Knowing the code is what grants the right to join.

## Authorization highlights (`firestore.rules`)

| Rule | How it's enforced |
| --- | --- |
| No self-registration as coordinator; faculty start as `pending` | `users` create rule checks role/status pairs |
| A student is in at most one team | Team create and join require `me().teamId == null` **and** `getAfter(users/uid).teamId == teamId`, so the profile link must be written in the same batch |
| Joining needs the code | `lastJoin == {uid: request.auth.uid, code: resource.data.joinCode}`, so the proof can't be replayed by someone else |
| Team size limit | `memberIds.size() <= cycle.maxTeamSize` |
| Only the assigned guide grades | Submission update requires `team.guideId == uid` and an active faculty role (or coordinator); marks between 0 and 100 |
| Uploads only after topic approval | Submission create requires `team.proposalStatus == 'approved'` |
| No impersonation | `submittedBy`, `authorId`, `actorId`, `evaluatedBy` equal `request.auth.uid`; names and roles match the profile |
| Files come from trusted hosts | Each file entry is shape-checked; URL must be Firebase Storage, Cloudinary or bundled samples |
| Submissions and the activity log are immutable | No team-side update or delete on submissions; activity has no update or delete |
| Read isolation | Teams, submissions, comments and activity are readable only by members, the assigned guide and coordinators |

These rules are covered by `tests/rules/firestore.rules.test.ts` against the Firestore emulator in CI.

## File uploads

1. The student picks files. The client validates type (PDF, PPT/PPTX, DOC/DOCX, PNG, JPG, WEBP) and size (10 MB, the Cloudinary free plan limit).
2. `storageProvider.upload()`:
   - **Cloudinary (production):** POST `/api/upload-signature` with the Firebase ID token. The function verifies the token against Google's public keys using `jose`, so no service account is needed. It then reads the team document from the Firestore REST API *as that user*, so security rules decide membership. It returns a short-lived signature scoped to `projectdesk/teams/{teamId}`. The browser uploads directly to Cloudinary with progress events.
   - **Firebase Storage (emulator):** `uploadBytesResumable`, guarded by `storage.rules`.
3. Only after every file uploads is the submission document written, together with an activity entry, in one batch.

## Frontend structure

- **Routing:** role-aware guards (`RequireAuth`, `RequireRole`, `GuestOnly`). Routes are lazy-loaded so each role only downloads its own screens.
- **Data:** `useDocument` and `useCollection` wrap `onSnapshot` with a stable key and unsubscribe on unmount. Screens never hold stale snapshots.
- **Writes:** all writes are in `src/services/*`. Components never call Firestore directly.
- **UI:** a small in-house design system (`src/components/ui`) with tokens defined in `src/index.css`. Plex Sans, a single ink-blue accent and 1px borders give it an institutional, tool-like look.
- **Accessibility:** labelled form fields with described-by errors, visible focus rings, keyboard-reachable menus and dialogs (Radix), `prefers-reduced-motion` support, and no horizontal scroll at 390px (checked in the E2E suite).

## Testing strategy

| Layer | Tool | What it covers |
| --- | --- | --- |
| Unit | Vitest | Progress and deadline logic, file validation, CSV escaping (including formula injection), Cloudinary signature (checked against the documented example) |
| Component | Testing Library | File uploader accepts and rejects files; remove works |
| Security | rules-unit-testing + emulator | 33 tests, 64 allow and deny checks |
| End-to-end | Playwright | Full semester journey across three roles, resubmission flow, upload validation, approvals, schedule editing, mobile navigation and overflow |

The E2E suite runs against an in-browser fake of the Firebase SDK (`src/testing/fake`, enabled only in `--mode fake`). It is fast and deterministic, and CI needs no Java. Rules are tested separately against the real emulator.

## Known trade-offs and next steps

- If a file upload succeeds but the submission write then fails, the uploaded file is left orphaned. A scheduled cleanup job would handle this.
- Stage `maxMarks` is enforced in the UI; the rules only cap marks at 100 because rules can't loop over the stage list.
- Notifications (email when feedback arrives) would need Cloud Functions or a Vercel cron job.
- The `/api/upload-signature` route has no rate limiting beyond Vercel's defaults.
