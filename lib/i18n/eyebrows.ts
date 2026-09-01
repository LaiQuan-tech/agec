import type { Dict } from "./index";

/**
 * 各頁區塊的小標（`SectionTitle` 的 `eyebrow`、`LegacyGroup` 的 `eyebrow`）。
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
 * ## 🔴 八個「不直譯」的判斷，逐條說明
 *
 * 小標與大標在 `.inner-section-title` 的同一行上（28% 左欄放編號與小標、
 * 1fr 右欄放大標），中間隔約 400px。所以小標若直譯成與大標相同的字，畫面上
 * 就是同一行出現兩次一樣的詞 —— 英文時看不出來，因為它與中文大標是不同字集。
 *
 * 以下八個的直譯正好等於它右邊的大標，改用同義但不同層次的說法：
 *
 *   KEY DATES            大標「重要時程」    → 招生日程
 *   DEGREE REQUIREMENTS  大標「修業規定」    → 畢業條件
 *   FORMS                大標「常用表格」    → 表單下載
 *   FULL-TIME FACULTY    大標「專任師資」    → 師資陣容
 *   AFFILIATED FACULTY   大標「合聘與兼任師資」→ 跨域師資
 *   ADMINISTRATION       大標「行政同仁」    → 行政團隊
 *   TALKS & SEMINARS     大標「演講與研討會」→ 學術活動
 *   LEE TENG-HUI ARCHIVE 大標「李登輝系友專區」→ 典藏專區
 *
 * ⚠️ 這八條是我擬的，不是客戶給的字。要改回直譯（接受重複）或換別的說法，
 * 改這一個檔就好，元件不必動。
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
  ourHistory: { zh: "本系沿革", en: "OUR HISTORY" },
  missionVision: { zh: "使命與願景", en: "MISSION & VISION" },
  honors: { zh: "榮譽紀錄", en: "HONORS" },
  environment: { zh: "教學環境", en: "ENVIRONMENT" },

  /* --- /admissions ------------------------------------------------------ */
  programs: { zh: "學制與班別", en: "PROGRAMS" },
  /** 大標是「重要時程」，直譯會重複。 */
  keyDates: { zh: "招生日程", en: "KEY DATES" },
  whatYouWillBuild: { zh: "能力養成", en: "WHAT YOU WILL BUILD" },
  needHelp: { zh: "申請協助", en: "NEED HELP?" },

  /* --- /alumni ---------------------------------------------------------- */
  distinguishedAlumni: { zh: "傑出系友", en: "DISTINGUISHED ALUMNI" },
  alumniNews: { zh: "系友動態", en: "ALUMNI NEWS" },
  alumniEvents: { zh: "活動報名", en: "ALUMNI EVENTS" },
  supportAgec: { zh: "支持農經", en: "SUPPORT AGEC" },
  /** 大標是「李登輝系友專區」，直譯會重複。 */
  leeArchive: { zh: "典藏專區", en: "LEE TENG-HUI ARCHIVE" },

  /* --- /blog ------------------------------------------------------------ */
  writing: { zh: "專欄書寫", en: "WRITING" },

  /* --- /courses --------------------------------------------------------- */
  curriculum: { zh: "課程規劃", en: "CURRICULUM" },
  /** 大標是「修業規定」，直譯會重複。 */
  degreeRequirements: { zh: "畢業條件", en: "DEGREE REQUIREMENTS" },
  /** 大標是「常用表格」，直譯會重複。 */
  forms: { zh: "表單下載", en: "FORMS" },

  /* --- /faculty --------------------------------------------------------- */
  /** 大標是「專任師資」，直譯會重複。 */
  fullTimeFaculty: { zh: "師資陣容", en: "FULL-TIME FACULTY" },
  /** 大標是「合聘與兼任師資」，直譯會重複。 */
  affiliatedFaculty: { zh: "跨域師資", en: "AFFILIATED FACULTY" },
  legacyVisiting: { zh: "傳承與客座", en: "LEGACY & VISITING" },
  /** 大標是「行政同仁」，直譯會重複。 */
  administration: { zh: "行政團隊", en: "ADMINISTRATION" },

  /*
   * 手風琴的三個小標。這三個的「大標」就在同一列的右端（客座教師／名譽教授／
   * 退休師資），距離比區塊標題近得多，所以更不能直譯 —— 改用身分的另一種說法。
   */
  visitingFaculty: { zh: "國際交流", en: "VISITING FACULTY" },
  emeritusFaculty: { zh: "終身榮譽", en: "EMERITUS FACULTY" },
  retiredFaculty: { zh: "退休傳承", en: "RETIRED FACULTY" },

  /* --- /news ------------------------------------------------------------ */
  latestUpdates: { zh: "系上公告", en: "LATEST UPDATES" },
  /** 大標是「演講與研討會」，直譯會重複。 */
  talksSeminars: { zh: "學術活動", en: "TALKS & SEMINARS" },

  /* --- /students -------------------------------------------------------- */
  startHere: { zh: "從這裡開始", en: "START HERE" },
  campusLife: { zh: "校園生活", en: "CAMPUS LIFE" },
  studentAssociation: { zh: "系學會", en: "STUDENT ASSOCIATION" },
  quickAccess: { zh: "快速連結", en: "QUICK ACCESS" },
} satisfies Dict;
