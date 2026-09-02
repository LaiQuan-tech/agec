/**
 * ⚠️ 與 migration 的 `check (role in ('admin','operator'))` 是同一份合約的兩半。
 */
export const ADMIN_ROLES = ["admin", "operator"] as const;
export type AdminRoleValue = (typeof ADMIN_ROLES)[number];

/**
 * ⚠️ 這裡的「管理員」指的是第二層，不是「後台使用者」。
 * 資料庫的 is_admin() 對操作人員也回 true（它的意思是「在白名單裡」），
 * 判斷層級一律看 role。
 */
export const ROLE_LABEL: Record<AdminRoleValue, string> = {
  admin: "管理員",
  operator: "操作人員",
};

export const ROLE_HINT: Record<AdminRoleValue, string> = {
  admin: "可以編輯所有內容，並且可以管理人員、查看操作日誌",
  operator: "可以編輯所有內容，但不能管理人員、看不到操作日誌",
};

export function toAdminRole(value: string | null | undefined): AdminRoleValue {
  return (ADMIN_ROLES as readonly string[]).includes(value ?? "")
    ? (value as AdminRoleValue)
    : "operator";
}
