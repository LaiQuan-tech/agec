"use client";

import { useState } from "react";
import { Input, Select } from "@/components/admin/ui/Input";

/**
 * 從固定清單挑一個值的欄位，需要時可以自行輸入。
 *
 * ## 🔴 為什麼不用 `<datalist>`
 *
 * 後台原本四個這樣的欄位（消息分類、師資分類、課程學制、課程類別）都是
 * `<input list="…">` + `<datalist>`。那有一個很容易被忽略、但每天都在發生的
 * 問題：**datalist 會依欄位裡已有的文字過濾建議**。
 *
 * 新增時欄位是空的，點下去七個選項都在；但編輯一則既有資料時，欄位已經填著
 * 「招生」，於是下拉只剩「招生」一項 —— 使用者看到的是「這個選單少了東西」。
 * 而編輯正是後台最常做的事。
 *
 * 第二個問題是 datalist **只是建議，擋不住錯字**。而這四個欄位的值全都是
 * 比對鍵：
 *   - `news.category` 決定它出現在哪個分類頁（lib/news-categories.ts）
 *   - `faculty.category` 決定它在 /faculty 落到哪一區（Faculty.tsx）
 *   - `courses.program` 與 `programs.name` 做文字比對，決定排序與分頁籤
 * 打錯一個字不會有任何錯誤訊息，只會讓那一筆資料從它該在的地方消失。
 *
 * 換成 `<select>` 之後，選項永遠是全部，而且打不出錯字。
 *
 * ## 「其他」
 *
 * `allowOther` 為真時多一個「其他（自行輸入）」，選了才出現文字欄 —— 保留
 * 原本「清單沒有的值也能填」的彈性，但把它變成一個要刻意選擇的動作，而不是
 * 手滑就會發生的事。
 *
 * ⚠️ 既有資料的值若不在清單裡（例如舊資料、或別人手動改過資料庫），會自動
 * 落在「其他」並把原值填進文字欄 —— 不會被靜默改掉，也不會變成空白。
 */

const OTHER = "__other__";

export function ChoiceField({
  id,
  name,
  options,
  defaultValue = "",
  allowOther = false,
  required = false,
  placeholder = "請選擇",
  ariaInvalid,
}: {
  id: string;
  name: string;
  options: readonly string[];
  defaultValue?: string;
  /** 允許填清單以外的值。關掉時這一欄就是封閉的列舉。 */
  allowOther?: boolean;
  required?: boolean;
  placeholder?: string;
  ariaInvalid?: boolean;
}) {
  const known = defaultValue !== "" && options.includes(defaultValue);
  const [choice, setChoice] = useState(
    known ? defaultValue : defaultValue !== "" && allowOther ? OTHER : ""
  );
  const [custom, setCustom] = useState(known ? "" : defaultValue);

  const isOther = choice === OTHER;

  return (
    <div className="flex flex-col gap-2">
      <Select
        id={id}
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
        required={required}
        aria-invalid={ariaInvalid}
        /* ⚠️ select 本身沒有 name：真正送出的值由下面兩者之一負責，否則同一個
           欄位會被送出兩次，而 FormData.get() 只會拿到第一個。 */
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        {allowOther && <option value={OTHER}>其他（自行輸入）…</option>}
      </Select>

      {isOther ? (
        <Input
          name={name}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          required={required}
          placeholder="請輸入"
          aria-label={`${name} 自行輸入`}
        />
      ) : (
        /* 選了清單裡的值時，用 hidden 送出。這樣不論哪一種情況，表單裡永遠
           只有一個叫 `name` 的欄位。 */
        <input type="hidden" name={name} value={choice} />
      )}
    </div>
  );
}
