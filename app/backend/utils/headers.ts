import type { FastifyRequest } from 'fastify';

/**
 * Extracted request context from Databricks Apps headers
 */
export interface RequestContext {
  /** User identifier provided by the IdP (X-Forwarded-User) */
  userId: string;
  /** User email provided by the IdP (X-Forwarded-Email) */
  userEmail: string;
  /** User name provided by the IdP (X-Forwarded-Preferred-Username) */
  userName?: string;
  /** UUID of the request (X-Request-Id) */
  requestId?: string;
  /** Access token for API calls (x-forwarded-access-token) */
  accessToken?: string;
}

/**
 * Extract user context from Databricks Apps forwarded headers
 * @param request - Fastify request object
 * @returns RequestContext with userId and userEmail (required), userName, requestId, accessToken (optional)
 * @throws Error if required headers (userId, userEmail) are missing
 */
export function extractRequestContext(request: FastifyRequest): RequestContext {
  const userId = request.headers['x-forwarded-user'] as string | undefined;
  const userEmail = request.headers['x-forwarded-email'] as string | undefined;
  const userName = request.headers['x-forwarded-preferred-username'] as
    | string
    | undefined;
  const requestId = request.headers['x-request-id'] as string | undefined;
  const accessToken = request.headers['x-forwarded-access-token'] as
    | string
    | undefined;

  if (!userId || !userEmail) {
    throw new Error(
      'User authentication required. Missing x-forwarded-user or x-forwarded-email headers.'
    );
  }

  return {
    userId,
    userEmail,
    userName,
    requestId,
    accessToken,
  };
}

/**
 * Extract user context from WebSocket request
 * WebSocket requests use the same header format as HTTP requests
 * @param headers - WebSocket request headers
 * @returns RequestContext with userId and userEmail (required), userName, requestId, accessToken (optional)
 * @throws Error if required headers (userId, userEmail) are missing
 */
export function extractRequestContextFromHeaders(headers: {
  [key: string]: string | string[] | undefined;
}): RequestContext {
  const userId = headers['x-forwarded-user'] as string | undefined;
  const userEmail = headers['x-forwarded-email'] as string | undefined;
  const userName = headers['x-forwarded-preferred-username'] as
    | string
    | undefined;
  const requestId = headers['x-request-id'] as string | undefined;
  const accessToken = headers['x-forwarded-access-token'] as string | undefined;

  if (!userId || !userEmail) {
    throw new Error(
      'User authentication required. Missing x-forwarded-user or x-forwarded-email headers.'
    );
  }

  return {
    userId,
    userEmail,
    userName,
    requestId,
    accessToken,
  };
}
