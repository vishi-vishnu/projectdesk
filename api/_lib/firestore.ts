interface FirestoreArrayValue {
  arrayValue?: { values?: { stringValue?: string }[] }
}

interface FirestoreTeamDoc {
  fields?: { memberIds?: FirestoreArrayValue }
}

/**
 * Reads the team document through the Firestore REST API *as the calling user*
 * (their ID token is forwarded). Security rules therefore decide access, and the
 * function holds no privileged credentials.
 */
export async function fetchTeamMemberIds(projectId: string, teamId: string, idToken: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/teams/${encodeURIComponent(teamId)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } })
  if (res.status === 403 || res.status === 404) return null
  if (!res.ok) throw new Error(`Firestore responded with ${res.status}`)
  const doc = (await res.json()) as FirestoreTeamDoc
  return parseMemberIds(doc)
}

export function parseMemberIds(doc: FirestoreTeamDoc): string[] {
  return (doc.fields?.memberIds?.arrayValue?.values ?? [])
    .map((v) => v.stringValue)
    .filter((v): v is string => typeof v === 'string')
}
