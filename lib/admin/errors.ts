/**
 * Auth error types, kept in their own module with no imports.
 *
 * They're thrown by lib/admin/auth.ts (which is `server-only`) and matched by
 * lib/admin/action-result.ts, which Client Components import for the
 * ActionState type. Putting the classes in auth.ts would drag the server-only
 * marker into the client bundle graph and fail the build.
 */

export class NotAuthenticatedError extends Error {
  constructor() {
    super("UNAUTHENTICATED");
    this.name = "NotAuthenticatedError";
  }
}

export class NotAdminError extends Error {
  constructor() {
    super("NOT_ADMIN");
    this.name = "NotAdminError";
  }
}
