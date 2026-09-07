import type { Dict } from "./index";

/**
 * 各頁區塊的小標（`SectionTitle` 的 `eyebrow`、`LegacyGroup` 的 `eyebrow`）。
 *
 * ⚠️ 英文小標維持全大寫，但字**跟著英文導覽標籤走**（HISTORY、FULL-TIME、
 * COURSE LISTINGS…），不再是另一套自己的說法。
 *
 * ## 為什麼從硬編碼改成字典
 *
 * 移植時這些一律寫死成英文大寫，元件註解也寫著「這是參考站的拉丁大寫裝置，
 * 不是文案，兩種語言相同」。那個判斷在中文站上不成立 —— 中文讀者看到的是一行
 * 讀不出所以然的英文。所以改成雙語：英文站維持原字串（零回歸），中文站給中文。
 *
 * ## 為什麼集中在一個檔而不是散在八份頁面字典裡
 *
 * 這是一整個家族的標籤，而且是**客戶的文案**。集中放讓系辦能一次看完、一次
 * 改完；散在八個檔案裡，要調整語氣就得跨檔比對。
 *
 * ## 🔴 小標一律等於頁內導覽上的那個詞
 *
 * `.local-nav` 的標籤、`SectionTitle` 的小標，兩者必須是同一個字串。讀者按下
 * 「系所榮譽」，落點區塊的小標就要寫著「系所榮譽」。
 *
 * ### 這一條推翻了先前的做法，理由記在這裡
 *
 * 小標與大標在 `.inner-section-title` 的同一行上（左欄 28% 放編號與小標、
 * 右欄 1fr 放大標），中間隔約 400px。所以原本有八個小標刻意**不**直譯，改用
 * 同義但不同層次的說法，避開同一行出現兩次一樣的詞：
 *
 *   師資陣容／跨域師資／行政團隊／招生日程／畢業條件／表單下載／
 *   學術活動／典藏專區
 *
 * 代價是同一個區塊出現了**三種**說法 —— 導覽一種、小標一種、大標一種。
 * 2026-09 客戶連續兩次回報「上方摘要與下方各部分主題文字不一致」，並在
 * 「小標重複大標」與「三個詞」之間選了前者。所以現在：
 *
 *   導覽「專任師資」 → 小標「專任師資」 → 大標「專任師資」
 *
 * ⚠️ 十三個區塊的小標因此會與同一行右側的大標重複，那是**已知且被接受的**
 *    取捨，不是漏改。要換回「換句話說」的版本，改這一個檔就好，元件不必動 ——
 *    但那會讓上面那條規則失效，請連同 components/site/LocalNav.tsx 的檔頭
 *    一起改。
 *
 * ### 唯一的例外
 *
 * `/faculty` §3 手風琴裡的三個小標（visitingFaculty / emeritusFaculty /
 * retiredFaculty）沒有對應的導覽項目 —— 它們是區塊**裡面**的分組。規則管不到
 * 它們，所以維持原本「換句話說」的寫法（國際交流／終身榮譽／退休傳承），
 * 而且它們與各自的大標距離比區塊標題近得多，重複會更明顯。
 *
 * ## 排版
 *
 * `.eyebrow` / `.inner-section-title p` 是 `letter-spacing:.18em` ＋
 * `text-transform:uppercase`。uppercase 對中文無作用；.18em 的字距套在中文上
 * 是常見的 CJK 標籤處理，而且首頁的小標（`LATEST · 最新動態`）本來就已經把
 * 中文放進同一個樣式裡，所以這個組合在這個站上是驗過的。
 */
export const EYEBROWS = {
  /* --- /about ----------------------------------------------------------- */
  ourHistory: { zh: "系史沿革", en: "HISTORY" },
  missionVision: { zh: "使命與願景", en: "MISSION & VISION" },
  honors: { zh: "系所榮譽", en: "HONORS" },
  environment: { zh: "環境與設備", en: "ENVIRONMENT" },

  /* --- /admissions ------------------------------------------------------ */
  programs: { zh: "學制與班別", en: "PROGRAMS" },
  keyDates: { zh: "重要時程", en: "KEY DATES" },
  whatYouWillBuild: { zh: "核心能力", en: "CORE COMPETENCIES" },
  needHelp: { zh: "申請協助", en: "NEED HELP?" },

  /* --- /alumni ---------------------------------------------------------- */
  distinguishedAlumni: { zh: "傑出系友", en: "DISTINGUISHED ALUMNI" },
  alumniNews: { zh: "系友動態", en: "ALUMNI NEWS" },
  alumniEvents: { zh: "系友回娘家", en: "HOMECOMING" },
  supportAgec: { zh: "支持農經", en: "SUPPORT AGEC" },
  leeArchive: { zh: "李登輝系友專區", en: "LEE TENG-HUI ARCHIVE" },

  /* --- /courses --------------------------------------------------------- */
  curriculum: { zh: "各學制課程表", en: "COURSE LISTINGS" },
  degreeRequirements: { zh: "修業規定", en: "REQUIREMENTS" },
  forms: { zh: "常用表格", en: "FORMS" },

  /* --- /faculty --------------------------------------------------------- */
  fullTimeFaculty: { zh: "專任師資", en: "FULL-TIME" },
  affiliatedFaculty: { zh: "合聘與兼任", en: "JOINTLY APPOINTED & ADJUNCT" },
  legacyVisiting: { zh: "客座、名譽與退休", en: "VISITING, EMERITUS & RETIRED" },
  administration: { zh: "行政同仁", en: "ADMINISTRATION" },

  /*
   * 手風琴的三個小標。這三個的「大標」就在同一列的右端（客座教師／名譽教授／
   * 退休師資），距離比區塊標題近得多，所以更不能直譯 —— 改用身分的另一種說法。
   */
  visitingFaculty: { zh: "國際交流", en: "VISITING FACULTY" },
  emeritusFaculty: { zh: "終身榮譽", en: "EMERITUS FACULTY" },
  retiredFaculty: { zh: "退休傳承", en: "RETIRED FACULTY" },

  /* --- /news ------------------------------------------------------------ */
  latestUpdates: { zh: "全部消息", en: "ALL NEWS" },
  talksSeminars: { zh: "演講與研討會", en: "TALKS AND SEMINARS" },

  /* --- /students -------------------------------------------------------- */
  startHere: { zh: "新生攻略", en: "NEW STUDENTS" },
  campusLife: { zh: "校園生活", en: "CAMPUS LIFE" },
  studentAssociation: { zh: "系學會", en: "STUDENT ASSOCIATION" },
  quickAccess: { zh: "常用資源", en: "RESOURCES" },
} satisfies Dict;
