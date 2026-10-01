import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Vercel's Node runtime adds `body` to the request and `status()` / `json()`
 * to the response. These two types describe just the parts this API uses,
 * so the project doesn't need the full @vercel/node package.
 */
export interface ApiRequest extends IncomingMessage {
  body?: unknown
}

export interface ApiResponse extends ServerResponse {
  status(code: number): ApiResponse
  json(body: unknown): ApiResponse
}
