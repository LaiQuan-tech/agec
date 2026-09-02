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

/**
 * 登入了、也在白名單裡，但層級是「操作人員」而不是「管理員」。
 *
 * 與 NotAdminError 分開是刻意的：那是「你不該進後台」，這是「你可以用後台，
 * 但這一件事不歸你」。混在一起會讓操作人員看到一句要他去聯絡開發者的訊息，
 * 而正確的下一步是去找管理員。
 */
export class NotManagerError extends Error {
  constructor() {
    super("NOT_MANAGER");
    this.name = "NotManagerError";
  }
}
