"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { idleState, type ActionState } from "@/lib/admin/action-result";
import { Button } from "@/components/admin/ui/Button";
import { Input, Select } from "@/components/admin/ui/Input";
import { deleteUser, resetPassword, revokeAccess, updateRole } from "./actions";
import { ADMIN_ROLES, ROLE_LABEL, type AdminRoleValue } from "./constants";

/**
 * 一列人員的四個操作：改層級／重設密碼／移除權限／刪除帳號。
 *
 * ⚠️ 四個動作分開而不是合成一顆「編輯」，因為它們的可逆性完全不同：
 *   改層級      可逆
 *   重設密碼    對方原本的密碼失效，但帳號還在
 *   移除權限    可逆（在「新增人員」填同一個信箱就會加回來，密碼不變）
 *   刪除帳號    **不可逆**
 * 藏在同一顆按鈕後面會讓人以為它們差不多。
 *
 * ⚠️ 自己那一列不渲染任何破壞性操作。應用層的 action 也會擋（見 actions.ts），
 * 這裡只是不要讓人先按下去才被拒絕 —— 但擋住的是 action，不是這裡。
 */

function Pending({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      {pending ? busy : label}
    </Button>
  );
}

export function RowActions({
  userId,
  email,
  role,
  isSelf,
}: {
  userId: string;
  email: string;
  role: AdminRoleValue;
  isSelf: boolean;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [pwState, pwAction] = useActionState(resetPassword, idleState);

  if (isSelf) {
    return (
      <span className="text-[12px]" style={{ color: "var(--muted)" }}>
        （你自己）
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        {/* 改層級：select + 更新，而不是選了就送出 —— 誤觸一個下拉選單就改掉
            別人的權限太容易了。 */}
        <form action={updateRole} className="flex items-center gap-1">
          <input type="hidden" name="user_id" value={userId} />
          <Select
            name="role"
            defaultValue={role}
            aria-label={`${email} 的層級`}
            className="h-8 py-0 text-[13px]"
          >
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
          <Pending label="更新" busy="…" />
        </form>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`${uid}-pw`}
        >
          重設密碼
        </Button>

        <form
          action={revokeAccess}
          onSubmit={(e) => {
            if (
              !confirm(
                `移除 ${email} 的後台權限？\n\n帳號會保留，之後在「新增人員」填同一個信箱就會加回來，密碼不變。`
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="user_id" value={userId} />
          <Pending label="移除權限" busy="…" />
        </form>

        <form
          action={deleteUser}
          onSubmit={(e) => {
            if (
              !confirm(
                `⚠️ 刪除 ${email} 的整個帳號？\n\n這個動作無法復原，之後要重新建立帳號與密碼。\n若只是暫時停權，請改用「移除權限」。`
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="user_id" value={userId} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50"
          >
            刪除帳號
          </Button>
        </form>
      </div>

      {open && (
        <form id={`${uid}-pw`} action={pwAction} className="flex items-center gap-1">
          <input type="hidden" name="user_id" value={userId} />
          <Input
            name="password"
            type="text"
            required
            placeholder="新密碼"
            aria-label={`${email} 的新密碼`}
            className="h-8 py-0 text-[13px]"
            /* type="text"：管理員是在幫別人設定，看不到自己打了什麼就沒辦法
               正確轉達。 */
            autoComplete="off"
          />
          <Pending label="送出" busy="…" />
          {pwState.message && (
            <span
              className="text-[12px]"
              style={{ color: pwState.ok ? "var(--brand-green)" : "#b3261e" }}
              role="status"
            >
              {pwState.message}
            </span>
          )}
        </form>
      )}
    </div>
  );
}
