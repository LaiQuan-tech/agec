# components/site — 公開站元件（移植自參考站）

參考站：`https://works.jensenimage.com/redesign/works/agec/`
規格書：`PORT-REPORT.md`（981 行，逐頁 A/B/C 分類與 246 個脆弱選擇器清單）

第一階段（地基 + 首頁）已完成。這份文件是其餘 7 頁的接手說明。

---

## 1. 你必須先知道的三件事

### (1) CSS 靠 route group 隔離，不要打破它

專案裡有**兩份獨立的 Tailwind v4 build**：

| 檔案 | 誰載入 | 內容 |
|---|---|---|
| `app/globals.css` | `app/(admin)/layout.tsx` | `@import "tailwindcss"` + 後台 token |
| `app/(site)/site.css` | `app/(site)/layout.tsx` | 參考站的完整產物（含它自己的 Tailwind 4.2.1 Preflight） |

兩份同時載入會疊出兩份 Preflight、兩份 `.container`、兩份 `@property --tw-*`，而且
`--ink` / `--muted` / `--cream` / `--green-deep` 四個 token **同名不同值且都掛在裸 `:root`**，
勝負純看 import 順序。site.css 還有一條裸 `footer{background:#052f21}` 會打到後台任何 `<footer>`。

所以：

- `app/layout.tsx`（root）**不 import 任何 CSS、不呼叫 `next/font`**
- 公開頁的 CSS 只能從 `app/(site)/layout.tsx` 進來
- 後台的 CSS 與字體只能從 `app/(admin)/layout.tsx` 進來
- **不要**在任何 `app/(site)/` 底下的檔案 import `globals.css`

已實測（dev，含 soft navigation 雙向）：`/login → / → 上一頁`，回到 `/login` 時
`--paper` 為空、`scroll-behavior` 回到 `auto`、裸 `footer{}` 不再生效 —— Next.js 會正確換掉 stylesheet。

### (2) 字體：參考站沒有載入任何 webfont

site.css 指名 `"Noto Serif TC"` / `"Noto Sans TC"`，但**它自己沒有載入這兩個字體**，
實際是掉到 `Songti TC` / `PingFang TC`。

`next/font/google` 註冊的 @font-face **family 名稱就是字面的 "Noto Sans TC" / "Noto Serif TC"**，
一旦在公開樹載入，就會把參考站原本的 fallback 悄悄換掉 —— 實測會讓所有拉丁字與數字的
寬度差 1〜10%（`.section-number` 78px vs 71px）。**所以字體已移到 `app/(admin)/layout.tsx`，公開頁不要加回來。**

### (3) 絕對不要加 `.motion-ready`

site.css 原本有一組 `opacity:0` 的 scroll-reveal 規則，但 `motion-ready` / `is-visible`
在參考站 8 個 HTML 出現 0 次、site.js 也沒有 IntersectionObserver —— 這個功能**從來沒開過**。

加了 `.motion-ready` 卻沒有 observer 去補 `.is-visible` → 所有 `.inner-section` 內容永久
`opacity:0`，而且 **build 通過、TypeScript 通過、SSR HTML 完整、DOM 檢查正常，只有肉眼看得出整站是白的**。

這三條規則**已從 site.css 移除**（見該檔開頭註解），所以現在就算加了 class 也不會出事。
但也**不要把它們加回來**。驗收一律要有實際截圖或 computed style，不能只看 DOM。

---

## ⚠️ `↗` 後面有一個看不見的字元，不要刪

全站的 `↗`（U+2197 NORTH EAST ARROW）後面都跟著 **U+FE0E VARIATION SELECTOR-15**，
也就是「文字呈現選擇器」。`©`（U+00A9）同理。

原因：這兩個字元在 Unicode 的 emoji 資料裡是 `Emoji=Yes`。雖然它們的預設呈現是
文字，iOS Safari 的字體回退鏈仍會走到 Apple Color Emoji，把「探索本系 ↗」的箭頭
畫成一顆藍底白箭頭的 emoji 方塊。桌機看不出來，只有實機才會發現。

VS15 強制走文字字體，是唯一在各家瀏覽器都可靠的做法（CSS 的
`font-variant-emoji: text` 到 2026 年仍只有較新的 Chrome 與 Safari 支援）。

實務上要注意：

- 這個字元**寬度為零、在編輯器裡看不見**。複製貼上 `↗` 到新的地方時很可能只複製到
  箭頭本身，於是那一處就會在 iPhone 上變成 emoji
- `→`（U+2192）、`←`（U+2190）**不需要**，它們沒有 emoji 屬性
- 註解裡的 `↗` 不用加（不會被渲染）
- 檢查方式：`grep -c $'\u2197\ufe0e'` 對 `grep -c $'\u2197'`，兩個數字應該一樣

## 2. 已建立的元件

### 外框（8 頁共用，不要改）

| 元件 | 說明 |
|---|---|
| `SiteShell` | `.site-loader` + `<main>` + skip link + header + `{children}` + footer。`variant="home" \| "interior"` 決定 `<main>` 的 class |
| `SiteLoader`（client） | 開場遮罩。等 `window.load`，6 秒硬超時 |
| `SiteHeader`（client） | `.institution-bar` + `header.site-header` + `.menu-overlay`。含 `.scrolled` 與選單開合＋body 捲動鎖 |
| `SiteFooter` | `footer#contact`，`#sitemap` 是導覽錨點目標 |

### 內頁 primitives（你要用的）

| 元件 | 對應區塊 |
|---|---|
| `InteriorHero` | `section.interior-hero#content`：hero 圖／影片、breadcrumb、英文小標、`<h1>`、`NN / 08`、導言 |
| `LocalNav` | `nav.local-nav` 頁內 sticky 導覽（4 個 `#section-N` 錨點） |
| `SectionTitle` | `header.inner-section-title`，**7 頁共 27 次，最高頻** |
| `NextRoute` | `section.next-route`，7 個內頁完全相同 |
| `FilterTabs`（client） | `.filter-tabs`。**預設只切 active 態、不篩選**（這是原站行為）；只有 faculty 傳 `onChange` |

### 其他

- `nav.ts` — 由 `lib/nav.ts` 導出 `DESKTOP_NAV`(7) / `MENU_ITEMS`(8) / `FOOTER_COLUMNS`(4+3) / `routeNumber()` / `padNo()` / `ROUTE_TOTAL`
- `format.ts` — `formatNewsDate()`，純字串切片避免時區 hydration 不一致
- `Home.tsx` / `HomeHero.tsx` — 首頁（已完成，可當範例）

---

## 3. 移植一頁的標準步驟

假設你負責 `/about`。

**1. 讀原始碼**
`scratchpad/ref/about.pretty.html`（攤開版）＋ `PORT-REPORT.md` §1.3 該頁那一列與 §2.3 的 A/B/C 分類。

**2. 建立元件** `components/site/About.tsx`

```tsx
import { SiteShell } from "./SiteShell";
import { InteriorHero } from "./InteriorHero";
import { LocalNav } from "./LocalNav";
import { SectionTitle } from "./SectionTitle";
import { NextRoute } from "./NextRoute";

export function About() {
  return (
    <SiteShell variant="interior">
      <InteriorHero
        slug="about"
        title="本系簡介"
        titleEn="About AGEC"
        routeNo="03"
        lead="承繼近百年農業經濟研究傳統，……"
        imageAlt="臺大農業經濟學系系名牌與校舍"
      />
      <LocalNav label="本系簡介" items={[
        { href: "#section-1", label: "系史沿革" },
        { href: "#section-2", label: "目標與使命" },
        { href: "#section-3", label: "系所榮譽" },
        { href: "#section-4", label: "環境與設備" },
      ]} />
      <div className="interior-content">
        <section className="inner-section" id="section-1">
          <div className="container">
            <SectionTitle no="01" eyebrow="OUR HISTORY" heading="從臺灣出發的農經學術傳承" />
            {/* …該節內容… */}
          </div>
        </section>
        {/* section-2 加 className="inner-section tint"、section-4 加 photo-band 等修飾 class */}
      </div>
      <NextRoute />
    </SiteShell>
  );
}
```

**3. 改 page.tsx**（檔案已在 `app/(site)/<route>/page.tsx`）
換掉 `components/classic/` 的 import，**保留 `export const revalidate = 300`、`export const metadata`、以及原本的資料抓取**。

**4. 逐區塊比對**，通過後才算完成（見 §5）。

**5. 刪掉對應的 `components/classic/` 舊檔**（見 §6）。

---

## 4. 寫 JSX 時最容易踩的雷

site.css 有 **246 個脆弱選擇器**，其中 **265 條是 `.class 裸元素` 形式，沒有一條靠子元素自己的 class**。
破壞模式一致：多包一層 `<div>`、或換 tag → 樣式靜默消失，退回瀏覽器預設。

**照抄 HTML 的標籤，不要「整理」結構。** 特別注意：

| 規則 | 為什麼 |
|---|---|
| 卡片一律用 `<article>` | 12 組格線把 `<article>` 當唯一卡片選擇器（border / min-height / padding 全在上面） |
| `.stat-row` / `.footer-links` 的欄位一律裸 `<div>` | 唯一命中方式就是 `.stat-row div` |
| `.timeline` 用 `<ol><li>` | `.timeline li{grid-template-columns:100px 1fr}` |
| `<figure>` / `<figcaption>` 不能換 | `.campus figure`、`.about-photo-grid figcaption` |
| `.visiting-profile-list` 用 `<dl><dt><dd>` | 同上 |
| `.news-item` 的 `<time>` 內要剛好有 `<strong>` + `<span>` | `.news-item time strong` 三層 tag 假設 |
| `SectionTitle` 必須輸出剛好兩個 `<div>` | `>div:last-child>p` 不中的話說明段落會變成大寫 eyebrow 樣式，整段爆掉 |
| `.closing>img` / `.inner-news-feature>img` / `.student-life-grid>img` 必須是直接子層 | 否則絕對定位背景圖變成 inline 圖，版面直接炸開 |
| `.legacy-group` 保留原生 `<details>/<summary>` | `.legacy-group[open]>.legacy-group-title i` 依賴三層結構；也免費拿到鍵盤與無障礙 |
| `.legacy-group` 之間不要各包一層 div | `.legacy-group+.legacy-group{margin-top:72px}` 是全檔唯一的相鄰兄弟選擇器 |
| alumni `#section-3` **沒有** `.inner-section-title` | `SectionTitle` 不是必填，不要硬加 |

**靠 `:nth-child` 補格線的 8 組網格**（principle / steps / program / archive /
association-branches / admission-card / honor-grid / stat-row）把「剛好 4 項」的假設寫死在
多個斷點的位置規則裡。**這些優先寫死成靜態文案，不要接 DB** —— 客戶多加一筆就會在
1180px 斷點破圖（桌機看起來還是對的，最容易漏驗）。判準見 `PORT-REPORT.md` §2.4 最後一段。

---

## 5. 驗收（不接受「應該沒問題」）

1. `npx tsc --noEmit`、`npx eslint`、`npm run build` 三者 exit 0
2. `grep -rn "motion-ready" app components` 零命中
3. **與參考站逐區塊比對**。最有效的方法不是純看截圖，而是在兩邊各跑一段
   computed-style + getBoundingClientRect 的 fingerprint 再 diff —— 首頁就是這樣驗到
   sub-pixel 相符的，字體那個 1〜10% 的差異也是這樣抓到的（截圖看不出來）。
   參考站可直接用 `preview_start` 開 `https://works.jensenimage.com/redesign/works/agec/<page>.html`。
4. 至少在 **1440 / 1180 / 860 / 600** 四個寬度各比一次（site.css 的斷點是
   1180 / 860 / 600，**都不對應任何 Tailwind 預設斷點**）
5. **後台不得被汙染**：`/login` 與 `/admin` 外觀必須與改動前一致

---

## 6. 現況與待辦

- **`/` 已完成**。其餘 7 頁的 `page.tsx` 已搬進 `app/(site)/`，但**內容元件仍是舊的
  `components/classic/`**。那些元件的視覺 90% 寫在 inline `style={{}}` 且引用
  `globals.css` 的 token（`--brand-gold` 等），而公開樹現在只載入 site.css ——
  **所以這 7 頁在被移植之前會呈現未套版狀態**。這是預期中的中間狀態，不是 bug。
  每頁移植完就把對應的 `components/classic/` 檔案刪掉；7 頁全部完成後整個資料夾
  （含 `classic.module.css`、`format.ts`、`Reveal.tsx`）都可以刪除。
- `public/images/*.png`（約 10MB）是舊版素材，還被 `components/classic/` 引用中。
  7 頁移植完後可一併清掉。
- 資料落差（DB 要補 29 筆師資、至少 4 個新欄位、3 個新 `links.section` 值）
  見 `PORT-REPORT.md` §2.4 與 §7 風險 6 —— **這些表在 repo 裡沒有 DDL，
  migration 要人工貼進 Supabase Dashboard 且必須 idempotent，動欄位前先查線上 schema。**

## 7. 已知會被誤判成「壞掉」的既有行為（不要修）

| 現象 | 真相 |
|---|---|
| courses / news 的 `.filter-tabs` 點了只亮不篩選 | site.js 通用段只切 active 態 |
| faculty section-2 的 10 張卡永遠不受篩選影響 | site.js `closest('.inner-section')` 限制範圍 |
| faculty section-2 與 section-1 後 10 張完全重複 | 原站 HTML 就是重複渲染同 10 人 |
| news 的 `01 02 03 下一頁` 點了沒反應 | 純視覺假頁碼，零實作 |
| `.local-nav` 不會 highlight 當前章節 | 沒有 scroll-spy |
| 楊子霆排第 13 位卻用 `23-` 檔名 | 原站編號錯位；**不要用 index 推導照片檔名** |
| 觸控裝置有黏著 hover | CSS 沒有用 `(hover: hover)` 包裹 |
