import type { Lang } from "@/lib/i18n";
import { STUDENTS } from "@/lib/i18n/students";
import { pickCopy, type CopyField as CopyFieldOf, type CopyRow } from "./fields";

/**
 * 學生專區（/students）後台可編輯的文案格位。
 *
 * ## 為什麼是「格位」而不是「卡片列表」
 *
 * §1 的四個步驟與 §3 的五個部門是**格數寫死**的網格：site.css 靠 `:nth-child`
 * 在 1180px／860px 斷點補格線（見 components/site/README.md §4 與 Students.tsx
 * 檔頭）。多一格就在平板寬度破圖，而且桌機看起來還是對的。所以這裡開放的是
 * 「每一格的文字」，不是「格子的數量」—— 後台沒有新增／刪除，只有 24 個固定
 * 欄位。
 *
 * ## 一份清單，三個地方共用
 *
 * `STUDENTS_COPY_FIELDS` 同時是：後台表單要印的欄位、Server Action 要驗的欄位、
 * 前台 resolver 要讀的 key。三處各抄一份的話，改一個 key 就會漂移。key 的字串
 * 也是資料庫 `page_copy.name` 的值（migration 20260914110000 的種子用同一組）。
 *
 * ## 退回字典
 *
 * `lib/i18n/students.ts` 的值仍然留著：資料表還沒建、或某個 key 沒有列時，
 * 就印字典（與 capabilities 的做法一致）。種子資料逐字取自字典，所以上線那
 * 一刻前台一個字都不會變。
 *
 * 格位的型別與「挑語言、退回字典」的規則在 ./fields.ts（本系簡介 about.ts 也
 * 用同一份）；這裡只列學生專區自己的格位。
 */

export const STUDENTS_PAGE = "students" as const;

/** 學生專區的格位：三組 fieldset。型別本體在 ./fields.ts。 */
export type CopyField = CopyFieldOf<"steps" | "campus" | "club">;
export type { CopyRow };

const steps: CopyField[] = [1, 2, 3, 4].flatMap((n) => [
  {
    name: `section1.steps.${n}.title`,
    group: "steps" as const,
    label: `步驟 ${n}：標題`,
    kind: "text" as const,
    max: 40,
    bilingual: true,
  },
  {
    name: `section1.steps.${n}.body`,
    group: "steps" as const,
    label: `步驟 ${n}：說明`,
    kind: "textarea" as const,
    max: 200,
    bilingual: true,
  },
]);

const campus: CopyField[] = [
  { name: "section2.heading", group: "campus", label: "標題", kind: "text", max: 60, bilingual: true },
  { name: "section2.body", group: "campus", label: "內文", kind: "textarea", max: 400, bilingual: true },
  { name: "section2.cta", group: "campus", label: "按鈕文字", kind: "text", max: 30, bilingual: true },
  { name: "section2.url", group: "campus", label: "按鈕網址", kind: "url", max: 500, bilingual: false },
];

const club: CopyField[] = [
  { name: "section3.leader.title", group: "club", label: "會長方塊：職稱", kind: "text", max: 40, bilingual: true },
  { name: "section3.leader.body", group: "club", label: "會長方塊：說明", kind: "text", max: 120, bilingual: true },
  ...[1, 2, 3, 4, 5].flatMap((n) => [
    {
      name: `section3.branches.${n}.name`,
      group: "club" as const,
      label: `部門 ${n}：名稱`,
      kind: "text" as const,
      max: 40,
      bilingual: true,
    },
    {
      name: `section3.branches.${n}.body`,
      group: "club" as const,
      label: `部門 ${n}：職掌`,
      kind: "text" as const,
      max: 120,
      bilingual: true,
    },
  ]),
];

/** 24 個格位，順序 = 後台表單的順序。 */
export const STUDENTS_COPY_FIELDS: readonly CopyField[] = [...steps, ...campus, ...club];

/**
 * 每個 key 的字典預設值。這也是 migration 種子的來源 —— 種子是從這張表逐字
 * 抄的，改字典之前先想清楚：改了字典不會改到資料庫裡已經有的值。
 */
export const STUDENTS_COPY_DEFAULTS: Record<string, { zh: string; en: string }> = {
  ...Object.fromEntries(
    STUDENTS.section1.steps.flatMap((step, i) => [
      [`section1.steps.${i + 1}.title`, step.title],
      [`section1.steps.${i + 1}.body`, step.body],
    ])
  ),
  "section2.heading": STUDENTS.section2.heading,
  "section2.body": STUDENTS.section2.body,
  "section2.cta": STUDENTS.section2.cta,
  "section2.url": { zh: STUDENTS.section2.url, en: "" },
  "section3.leader.title": STUDENTS.section3.leader.title,
  "section3.leader.body": STUDENTS.section3.leader.body,
  ...Object.fromEntries(
    STUDENTS.section3.branches.flatMap((branch, i) => [
      [`section3.branches.${i + 1}.name`, branch.name],
      [`section3.branches.${i + 1}.body`, branch.body],
    ])
  ),
};

export type StudentsCopy = {
  steps: { title: string; body: string }[];
  campus: { heading: string; body: string; cta: string; url: string | null };
  leader: { title: string; body: string };
  branches: { name: string; body: string }[];
};

/**
 * 把 page_copy 的列解析成前台要的形狀。缺什麼就退回字典，所以永遠不會是空的。
 * 挑字規則（該語言有值 → 英文空白退中文 → 沒有列退字典）在 fields.ts 的 pickCopy。
 */
export function resolveStudentsCopy(rows: CopyRow[], lang: Lang): StudentsCopy {
  const byName = new Map(rows.map((row) => [row.name, row]));
  const pick = (name: string) => pickCopy(STUDENTS_COPY_DEFAULTS, byName, name, lang);

  // 網址不分語言，而且「系辦清空了」與「還沒有這一列」要分開：清空了就沒有
  // 按鈕可以去的地方（MaybeLink 不給 href），沒有列才退回字典。
  const urlRow = byName.get("section2.url");
  const url = urlRow ? urlRow.zh.trim() || null : STUDENTS_COPY_DEFAULTS["section2.url"].zh;

  return {
    steps: [1, 2, 3, 4].map((n) => ({
      title: pick(`section1.steps.${n}.title`),
      body: pick(`section1.steps.${n}.body`),
    })),
    campus: {
      heading: pick("section2.heading"),
      body: pick("section2.body"),
      cta: pick("section2.cta"),
      url,
    },
    leader: {
      title: pick("section3.leader.title"),
      body: pick("section3.leader.body"),
    },
    branches: [1, 2, 3, 4, 5].map((n) => ({
      name: pick(`section3.branches.${n}.name`),
      body: pick(`section3.branches.${n}.body`),
    })),
  };
}
