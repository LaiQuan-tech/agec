import type { Lang } from "@/lib/i18n";
import { ABOUT } from "@/lib/i18n/about";
import { pickCopy, type CopyField as CopyFieldOf, type CopyRow } from "./fields";

/**
 * 本系簡介（/about）後台可編輯的文案格位 —— 與學生專區同一套機制
 * （page_copy 表、固定格位、只改文字；為什麼不是可增刪的清單見 students.ts 檔頭
 * 與 components/site/About.tsx 檔頭：四組網格的格數都寫死在 site.css 的斷點規則裡）。
 *
 * ## 開放哪些字
 *
 *   頁首        導言（lead）
 *   §1 系史沿革  標題、說明、照片下那行斜體、5 個里程碑的年份／標題／內文
 *   §2 使命願景  標題、引言、4 張卡的標題／說明（卡上的 01–04 是版面，固定）
 *   §3 系所榮譽  標題、4 張卡的徽章字（TOP 2% 那類）／說明
 *   §4 環境設備  標題、3 張照片各自的圖說
 *
 * 不開放：頁面標題（是選單名）、各區大寫的 eyebrow（OUR HISTORY…，是排版
 * 元素）、圖片本身與 alt、頁內導覽的四個標籤（/sitemap 也讀它們）。
 *
 * ## 雙語欄位（曾經是「語言中立」）
 *
 * 里程碑的年份（1928…／NOW）與榮譽的徽章字（TOP 2%／AJAE…）以前兩邊語言印
 * 同一個字，是 `bilingual: false`：後台只有一個輸入框，存的時候 zh 與 en 存
 * 同一個值（見 fields.ts）。
 *
 * 🔴 2026-09-28 客戶要求中文站只能出現中文，其中兩格不能再兩邊印同一個字了
 * （里程碑 5 的「NOW」要變成「現在」、榮譽 4 的「IMPACT」要變成「影響力」），
 * 所以兩組欄位都改成 `bilingual: true`（後台兩個輸入框，zh／en 分開存、分開
 * 改）。其餘的年份（數字）與徽章（TOP 2%／AJAE／NSTC）目前 zh 與 en 剛好還是
 * 同一個值，但那只是值本身相同，不再是型別上的保證——系辦現在可以個別修改
 * 任何一格的中英文。年份的 `kind` 維持 `"neutral"`（視覺意圖不變：仍是短的
 * 標籤格），徽章字改成 `kind: "text"`；兩者在 AboutCopyForm.tsx 的
 * `Control()` 渲染上其實沒有差別（只有 `kind === "textarea"` 會被特別處理），
 * 真正決定「一格或兩格輸入框」的只有 `bilingual`。
 *
 * ## key 的命名
 *
 * 照 lib/i18n/about.ts 的路徑、清單用 1 起算的序號（`history.milestones.3.title`），
 * 與學生專區的 `section1.steps.1.title` 同一個規則。這些字串也是
 * `page_copy.name` 的值（migration 20260916100000 的種子用同一組）。
 *
 * ## 退回字典
 *
 * `lib/i18n/about.ts` 的值仍然留著：某個 key 沒有列時就印字典。種子逐字取自
 * 字典，所以上線那一刻前台一個字都不會變。
 */

export const ABOUT_PAGE = "about" as const;

export type AboutCopyGroup = "hero" | "history" | "mission" | "honors" | "environment";

/** 本系簡介的格位：五組 fieldset（頁首 + 四個區塊）。型別本體在 ./fields.ts。 */
export type CopyField = CopyFieldOf<AboutCopyGroup>;
export type { CopyRow };

const hero: CopyField[] = [
  { name: "lead", group: "hero", label: "導言", kind: "textarea", max: 200, bilingual: true },
];

const history: CopyField[] = [
  { name: "history.heading", group: "history", label: "標題", kind: "text", max: 60, bilingual: true },
  { name: "history.description", group: "history", label: "說明", kind: "textarea", max: 300, bilingual: true },
  {
    name: "history.imageCaption",
    group: "history",
    label: "照片下的一行字",
    kind: "text",
    max: 120,
    bilingual: true,
  },
  ...ABOUT.history.milestones.flatMap((_, i): CopyField[] => {
    const n = i + 1;
    return [
      {
        name: `history.milestones.${n}.year`,
        group: "history",
        label: `里程碑 ${n} · 年份`,
        // kind 維持 "neutral"（視覺意圖：短的標籤格），但 2026-09-28 起
        // bilingual: true —— 第 5 格「NOW」中文頁要印「現在」，不能再與
        // 英文共用一個值。見上面檔頭「雙語欄位」那一段。
        kind: "neutral",
        max: 10,
        bilingual: true,
      },
      {
        name: `history.milestones.${n}.title`,
        group: "history",
        label: `里程碑 ${n} · 標題`,
        kind: "text",
        max: 40,
        bilingual: true,
      },
      {
        name: `history.milestones.${n}.body`,
        group: "history",
        label: `里程碑 ${n} · 內文`,
        kind: "textarea",
        max: 200,
        bilingual: true,
      },
    ];
  }),
];

const mission: CopyField[] = [
  { name: "mission.heading", group: "mission", label: "標題", kind: "text", max: 60, bilingual: true },
  { name: "mission.quote", group: "mission", label: "引言", kind: "textarea", max: 200, bilingual: true },
  ...ABOUT.mission.principles.flatMap((principle, i): CopyField[] => {
    // 卡片左上角印的 01–04 是版面的一部分（固定），標籤用它讓系辦對得到前台。
    const n = i + 1;
    return [
      {
        name: `mission.principles.${n}.title`,
        group: "mission",
        label: `卡片 ${principle.no} · 標題`,
        kind: "text",
        max: 40,
        bilingual: true,
      },
      {
        name: `mission.principles.${n}.body`,
        group: "mission",
        label: `卡片 ${principle.no} · 說明`,
        kind: "text",
        max: 120,
        bilingual: true,
      },
    ];
  }),
];

const honors: CopyField[] = [
  { name: "honors.heading", group: "honors", label: "標題", kind: "text", max: 60, bilingual: true },
  ...ABOUT.honors.items.flatMap((_, i): CopyField[] => {
    const n = i + 1;
    return [
      {
        name: `honors.items.${n}.label`,
        group: "honors",
        label: `榮譽 ${n} · 徽章字`,
        // 2026-09-28 起 bilingual: true —— 第 4 格「IMPACT」中文頁要印
        // 「影響力」，不能再與英文共用一個值。kind 改成 "text"（不再是
        // "neutral"）：見上面檔頭「雙語欄位」那一段。
        kind: "text",
        max: 12,
        bilingual: true,
      },
      {
        name: `honors.items.${n}.body`,
        group: "honors",
        label: `榮譽 ${n} · 說明`,
        kind: "text",
        max: 120,
        bilingual: true,
      },
    ];
  }),
];

const environment: CopyField[] = [
  { name: "environment.heading", group: "environment", label: "標題", kind: "text", max: 60, bilingual: true },
  ...ABOUT.environment.photos.map((photo, i): CopyField => ({
    name: `environment.photos.${i + 1}.caption`,
    group: "environment",
    label: `照片 ${i + 1}${photo.wide ? "（橫幅大圖）" : ""} · 圖說`,
    kind: "text",
    max: 60,
    bilingual: true,
  })),
];

/** 42 個格位，順序 = 後台表單的順序。 */
export const ABOUT_COPY_FIELDS: readonly CopyField[] = [
  ...hero,
  ...history,
  ...mission,
  ...honors,
  ...environment,
];

/**
 * 每個 key 的字典預設值。這也是 migration 種子的來源 —— 種子是從這張表逐字
 * 抄的（scripts 用它產 SQL，不是手打），改字典之前先想清楚：改了字典不會改到
 * 資料庫裡已經有的值。年份與徽章字目前多數 zh 與 en 仍是同一個值，但兩格
 * （里程碑 5 的「NOW」→「現在」、榮譽 4 的「IMPACT」→「影響力」）2026-09-28
 * 起 zh／en 不同——兩組欄位都已經是 `bilingual: true`，`item.year` /
 * `item.label` 本身就是 `{ zh, en }`（見 lib/i18n/about.ts 的 Milestone /
 * Honor 型別），這裡直接引用，不再手動拼一個「兩邊存同一個字」的物件。
 */
export const ABOUT_COPY_DEFAULTS: Record<string, { zh: string; en: string }> = {
  lead: ABOUT.lead,
  "history.heading": ABOUT.history.heading,
  "history.description": ABOUT.history.description,
  "history.imageCaption": ABOUT.history.imageCaption,
  ...Object.fromEntries(
    ABOUT.history.milestones.flatMap((item, i) => [
      [`history.milestones.${i + 1}.year`, item.year],
      [`history.milestones.${i + 1}.title`, item.title],
      [`history.milestones.${i + 1}.body`, item.body],
    ])
  ),
  "mission.heading": ABOUT.mission.heading,
  "mission.quote": ABOUT.mission.quote,
  ...Object.fromEntries(
    ABOUT.mission.principles.flatMap((item, i) => [
      [`mission.principles.${i + 1}.title`, item.title],
      [`mission.principles.${i + 1}.body`, item.body],
    ])
  ),
  "honors.heading": ABOUT.honors.heading,
  ...Object.fromEntries(
    ABOUT.honors.items.flatMap((item, i) => [
      [`honors.items.${i + 1}.label`, item.label],
      [`honors.items.${i + 1}.body`, item.body],
    ])
  ),
  "environment.heading": ABOUT.environment.heading,
  ...Object.fromEntries(
    ABOUT.environment.photos.map((photo, i) => [`environment.photos.${i + 1}.caption`, photo.caption])
  ),
};

/**
 * 前台要的形狀。每一列連同它固定的非文字欄位一起回（卡片的 `no`、照片的
 * `src`／`wide`／`alt`；這些不開放編輯，直接從字典帶出來），About.tsx 才不必
 * 拿字典與 copy 兩個陣列用索引對齊 —— 那正是 lib/i18n/about.ts 檔頭說不要做的事。
 */
export type AboutCopy = {
  lead: string;
  history: {
    heading: string;
    description: string;
    imageCaption: string;
    milestones: { year: string; title: string; body: string }[];
  };
  mission: {
    heading: string;
    quote: string;
    principles: { no: string; title: string; body: string }[];
  };
  honors: {
    heading: string;
    items: { label: string; body: string }[];
  };
  environment: {
    heading: string;
    photos: { src: string; wide: boolean; alt: string; caption: string }[];
  };
};

/**
 * 把 page_copy 的列解析成前台要的形狀。缺什麼就退回字典，所以永遠不會是空的；
 * 清單的長度來自字典（5／4／4／3），與格位清單同一個來源。
 * 挑字規則（該語言有值 → 英文空白退中文 → 沒有列退字典）在 fields.ts 的 pickCopy。
 */
export function resolveAboutCopy(rows: CopyRow[], lang: Lang): AboutCopy {
  const byName = new Map(rows.map((row) => [row.name, row]));
  const pick = (name: string) => pickCopy(ABOUT_COPY_DEFAULTS, byName, name, lang);

  return {
    lead: pick("lead"),
    history: {
      heading: pick("history.heading"),
      description: pick("history.description"),
      imageCaption: pick("history.imageCaption"),
      milestones: ABOUT.history.milestones.map((_, i) => ({
        year: pick(`history.milestones.${i + 1}.year`),
        title: pick(`history.milestones.${i + 1}.title`),
        body: pick(`history.milestones.${i + 1}.body`),
      })),
    },
    mission: {
      heading: pick("mission.heading"),
      quote: pick("mission.quote"),
      principles: ABOUT.mission.principles.map((item, i) => ({
        no: item.no,
        title: pick(`mission.principles.${i + 1}.title`),
        body: pick(`mission.principles.${i + 1}.body`),
      })),
    },
    honors: {
      heading: pick("honors.heading"),
      items: ABOUT.honors.items.map((_, i) => ({
        label: pick(`honors.items.${i + 1}.label`),
        body: pick(`honors.items.${i + 1}.body`),
      })),
    },
    environment: {
      heading: pick("environment.heading"),
      photos: ABOUT.environment.photos.map((photo, i) => ({
        src: photo.src,
        wide: photo.wide,
        alt: photo.alt[lang],
        caption: pick(`environment.photos.${i + 1}.caption`),
      })),
    },
  };
}
