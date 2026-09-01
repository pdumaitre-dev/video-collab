/**
 * Unauthenticated HTTP routes. New handlers must use auth middleware
 * unless listed here with a justification comment on the handler.
 */
export const PUBLIC_ROUTES = ["/api/loop/range"] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export function isPublicRoute(pathname: string): pathname is PublicRoute {
  return (PUBLIC_ROUTES as readonly string[]).includes(pathname);
}
