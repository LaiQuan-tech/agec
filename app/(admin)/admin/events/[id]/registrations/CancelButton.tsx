"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/admin/ui/Button";
import { cancelRegistration } from "../../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" disabled={pending}>
      {pending ? "處理中…" : "取消報名"}
    </Button>
  );
}

/**
 * 取消一筆報名。
 *
 * 用 <form> 而不是連結：這是一個會改變資料的動作，做成連結就會被瀏覽器的
 * 預抓或爬蟲觸發（DeleteButton 的檔頭也記了同樣的理由）。
 *
 * 沒有像刪除那樣開 <dialog> 確認：取消是可以補救的（同一個人可以再報一次，
 * 唯一索引是 `where status = 'confirmed'` 的部分索引），而刪除不是。這裡用
 * onSubmit 的原生 confirm 擋一下誤觸就夠了。
 */
export function CancelButton({
  registrationId,
  eventId,
  slug,
  name,
}: {
  registrationId: string;
  eventId: number;
  slug: string;
  name: string;
}) {
  return (
    <form
      action={cancelRegistration}
      onSubmit={(e) => {
        if (!confirm(`確定要取消「${name}」的報名嗎？位子會還回名額。`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="registration_id" value={registrationId} />
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />
      <Submit />
    </form>
  );
}
