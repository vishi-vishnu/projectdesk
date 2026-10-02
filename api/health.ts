import { healthReport } from './_lib/health.js'
import type { ApiRequest, ApiResponse } from './_lib/http.js'

/**
 * GET /api/health
 * Used by the uptime workflow and the post-deploy smoke test. Returns 200
 * when the server is fully configured and 503 when a setting is missing.
 */
export default function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const report = healthReport(process.env)
  return res.status(report.status === 'ok' ? 200 : 503).json(report)
}
