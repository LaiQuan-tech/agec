"use client";

import type { ActionState } from "@/lib/admin/action-result";
import { FormShell } from "@/components/admin/ui/FormShell";
import { Field } from "@/components/admin/ui/Field";
import { Input, Select } from "@/components/admin/ui/Input";
import { ADMIN_ROLES, ROLE_HINT, ROLE_LABEL } from "./constants";

/**
 * 新增後台人員。
 *
 * 密碼欄位是空白的、由管理員自己輸入（系辦確認過的決定）—— 建好之後當面或用
 * 電話把密碼交給對方。這個站沒有接寄信服務，所以沒有邀請信這條路。
 *
 * ⚠️ 建立成功後**不重複顯示密碼**：那是你自己剛打進去的，你已經知道；
 * 把它再印在畫面上只是多一個會被截圖、被肩窺的地方。
 */
export function UserForm({
  action,
  submitLabel = "建立帳號",
  existing = false,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  submitLabel?: string;
  /** true = 加入一個已經存在的 auth 帳號（不建新帳號、不設密碼）。 */
  existing?: boolean;
}) {
  return (
    <FormShell action={action} submitLabel={submitLabel}>
      {(state: ActionState) => (
        <>
          {existing && (
            <Field
              htmlFor="existing_user_id"
              label="帳號編號（UUID）"
              required
              error={state.fieldErrors?.existing_user_id}
              hint="在 Supabase 的 Authentication → Users 裡複製那個人的 User UID。"
            >
              <Input id="existing_user_id" name="existing_user_id" required />
            </Field>
          )}

          <Field
            htmlFor="email"
            label="電子信箱"
            required
            error={state.fieldErrors?.email}
            hint={existing ? "要與該帳號的信箱一致，這一欄只是給人看的。" : "他之後就用這個信箱登入後台。"}
          >
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="off"
              aria-invalid={Boolean(state.fieldErrors?.email)}
            />
          </Field>

          {!existing && (
            <Field
              htmlFor="password"
              label="密碼"
              required
              error={state.fieldErrors?.password}
              hint="建好之後請自行把密碼交給對方。⚠️ 這個站沒有寄信服務，系統不會通知他。"
            >
              <Input
                id="password"
                name="password"
                type="text"
                required
                /* type="text" 不是 password：管理員是在幫別人設定，需要看得到
                   自己打了什麼才能正確轉達。遮起來只會讓他打錯而不自知。 */
                autoComplete="off"
                aria-invalid={Boolean(state.fieldErrors?.password)}
              />
            </Field>
          )}

          <Field
            htmlFor="role"
            label="層級"
            required
            error={state.fieldErrors?.role}
            hint={
              <>
                <strong>{ROLE_LABEL.admin}</strong>：{ROLE_HINT.admin}
                <br />
                <strong>{ROLE_LABEL.operator}</strong>：{ROLE_HINT.operator}
              </>
            }
          >
            <Select id="role" name="role" defaultValue="operator" required>
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>

          <Field htmlFor="note" label="備註" error={state.fieldErrors?.note}>
            <Input id="note" name="note" maxLength={100} placeholder="例如：系辦、在職專班" />
          </Field>
        </>
      )}
    </FormShell>
  );
}
