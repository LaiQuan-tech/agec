"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { idleState, type ActionState } from "@/lib/admin/action-result";
import { Button } from "@/components/admin/ui/Button";
import { PASSWORD_MIN_LENGTH, PASSWORD_RULE_HINT } from "@/lib/admin/validate";
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
    // whitespace-nowrap：這幾顆按鈕都在窄格子裡，沒有它「更新」會斷成直排的
    // 兩個字（Button 的 inline-flex 不會阻止換行）。
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      className="whitespace-nowrap"
    >
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
      {/* 改層級自成一列，三個破壞性動作另成一列。
          ⚠️ 不要把四個動作放回同一個 flex-wrap 列：共用的 Select 內建 w-full
          （components/admin/ui/Input.tsx 的 CONTROL），在一列裡會撐開到吃掉
          整格寬度，把「更新」擠成直排的兩個字、再把後面三顆按鈕推出表格外。
          cn() 只是字串串接、沒有 tailwind-merge，所以再加一個 w-auto 蓋不掉
          w-full（兩條都會輸出，誰贏看樣式表順序）—— 寬度只能用 inline style。 */}
      <div className="flex items-center gap-1">
        {/* 改層級：select + 更新，而不是選了就送出 —— 誤觸一個下拉選單就改掉
            別人的權限太容易了。 */}
        <form action={updateRole} className="flex items-center gap-1">
          <input type="hidden" name="user_id" value={userId} />
          <Select
            name="role"
            defaultValue={role}
            aria-label={`${email} 的層級`}
            className="text-[13px]"
            /* ⚠️ 尺寸只能用 inline style：cn() 是純字串串接，className 上再寫
               一次 w-* 或 py-* 蓋不掉 CONTROL 的 w-full / py-2。
               108px 放得下最長的「操作人員」四個字加下拉箭頭的 pr-8；
               padding 5px 讓高度對齊旁邊 size="sm" 的按鈕（32px）。
               不用 h-8 + py-0：固定高度配 CJK 字符會把字的下緣切掉。 */
            style={{ width: "108px", paddingTop: "5px", paddingBottom: "5px" }}
          >
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
          <Pending label="更新" busy="…" />
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-1">
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
        <form
          id={`${uid}-pw`}
          action={pwAction}
          className="flex flex-wrap items-center gap-1"
        >
          <input type="hidden" name="user_id" value={userId} />
          <Input
            name="password"
            type="text"
            required
            placeholder="新密碼"
            /* 瀏覽器先擋一次最短長度；英數字混合由 Server Action 用中文回報
               （見 lib/admin/validate.ts 的 password()）。 */
            minLength={PASSWORD_MIN_LENGTH}
            title={PASSWORD_RULE_HINT}
            aria-label={`${email} 的新密碼`}
            className="text-[13px]"
            /* 與上面的 Select 同一個理由：Input 也內建 w-full，不給寬度會撐開
               整格、把「送出」推掉。 */
            style={{ width: "150px", paddingTop: "5px", paddingBottom: "5px" }}
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
