-- =============================================================================
-- 20260825_content_en.sql — 英文欄位填充（news / courses / programs / links）
-- =============================================================================
-- 目標專案：Supabase amwiaanlvxupzfzaruwr
-- 產出日期：2026-08-25
-- 執行方式：純 UPDATE，以 id 為鍵，可重複執行（idempotent）。
--
-- 【只寫 _en 欄位】本檔完全不動任何中文欄位，也不動 programs.name_en
--                （name_en 已由系辦維護：Undergraduate / Master's Program /
--                  PhD Program / Executive Master's Program）。
--
-- -----------------------------------------------------------------------------
-- 資料來源（依權威性排序）
-- -----------------------------------------------------------------------------
-- [S1] 台大農經系官方英文站 https://www.agec.ntu.edu.tw/en/
--      以 URL 對齊 /en/ 與 /zh_tw/ 兩版導覽列，取得系上自己的英文說法。
--      重要對照（2026-08-25 實抓驗證）：
--        /news/news1   最新消息 = Latest news   （分類標籤 i-annc__category 顯示 "News"）
--        /news/new2    演講公告 = Speech        （分類標籤顯示 "Speech"）
--        /news/0       求職徵才 = Job Openings  （分類標籤顯示 "Recruit"）
--        /news/history1 活動剪影 = Event Gallery（英文站無此分類的文章，標籤未知）
--        /recruit/recruit1 招生資訊 = Admission
--        /course/course2/3/4 大學部/碩士班/博士班 = Undergraduate / Master Program / Doctorial
--        /AgricultureEconomicJournal/...
--            最新消息 = LatestNews
--            出版與徵稿簡則 = Publication and Submission Information
--            編輯委員會 = Editorial Committee
--            文稿規格說明 = （官網英文站原樣留中文「經濟論文文稿規格說明」，無英譯）
--        /teacher/teacher1 專任師資名冊：第 7 位 石曜合 副教授
--            = Yau-Huo (Jimmy) Shr, Associate Professor
--            （中英兩版同一列、同一 email yhshr@iastate.edu，位置一一對應）
--
-- [S2] 本專案已上線的前台英文字典（lib/i18n/*.ts）
--      這些字串是 DB 欄位為 null 時前台實際 render 的 fallback，
--      DB 值若與它們不同，同一頁會同時出現兩種英文 → 必須一致。
--        lib/i18n/courses.ts     formsFallback      → links.section='courses'
--        lib/i18n/admissions.ts  resourcesFallback  → links.section='admissions'
--        lib/i18n/alumni.ts      nav 系友動態 = Alumni news
--        lib/i18n/news.ts        NEWS_FILTER_TABS   → /news 的分類籤（見下方說明）
--
-- [S3] 台大課程地圖 coursemap.aca.ntu.edu.tw（code=6070 農經系，中英雙版）
--      「系核心課程」區塊中英兩版 33 筆完全一一對應，驗證通過的配對包含：
--        農業經濟概論 = Introduction to Agricultural Economics
--        個體經濟學甲上 = Microeconomics (a)(Ⅰ)
--        應用計量經濟學導論 = Introductory Applied Econometrics
--        農業政策 = Agricultural Policy
--      其他區塊另有：農業政策專論 = Special Topics in Agricultural Policy、
--        計量經濟學一/二 = Econometrics (Ⅰ)/(Ⅱ)、
--        個體經濟理論一/二 = Microeconomic Theory (Ⅰ)/(Ⅱ)、
--        研究方法論 = Research Methodoloogy [官網原文即有此拼字錯誤]
--
-- [S4] 官方機構／獎項英文名
--        國科會 = National Science and Technology Council (NSTC)
--        吳大猷先生紀念獎 = Ta-You Wu Memorial Award
--          （NSTC 官方英文名；台大研發處寫 "The NSTC Ta-You Wu Memorial Award"）
--        東華大學 = National Dong Hwa University（NDHU 官網雙語校名）
--        必修／選修 = Required／Elective（台大教務處英文版選課須知 selcou-eng.pdf 用語）
--
-- -----------------------------------------------------------------------------
-- 民國紀年換算（重要）
-- -----------------------------------------------------------------------------
-- 民國年 + 1911 = 西元年。
--   115學年度 → 2026 學年度（2026-08 至 2027-07）
--   115年05月30日 → 2026-05-30
--
-- 官網英文站怎麼寫「學年度」：直接用「西元起始年 + Academic Year」。
--   證據：英文站 2022-08/30 貼文
--     "Seminar of New Student and Parents' Orientation, 2022 Academic Year"
--     ＝中文站 111學年度新生暨家長座談會（111 + 1911 = 2022）✔
--   證據：英文站 2023-02/16 貼文
--     "[ 2023 Program Admission] Program Application for International Students
--      of 2023 Entry" ＝ 112學年度（112 + 1911 = 2023）✔
--   本檔沿用此慣例，但依本專案 i18n 的句首大寫（sentence case）文風寫成
--   "2026 academic year"（lib/i18n/admissions.ts 亦寫
--    "the current academic year's admission guidelines"，小寫）。
--
-- -----------------------------------------------------------------------------
-- 填充統計
-- -----------------------------------------------------------------------------
--   news.title_en             10 / 10  填滿，0 留 null
--   news.category_en          10 / 10  填滿，0 留 null（7 種中文分類 → 7 個唯一英文字串）
--   courses.name_en            6 / 6   填滿，0 留 null
--   courses.ctype_en           6 / 6   填滿，0 留 null（2 種中文 → 2 個唯一英文字串）
--   programs.description_en    4 / 4   填滿，0 留 null
--   links.label_en            18 / 18  填滿，0 留 null
--   →  沒有任何一筆留 null。
--
-- -----------------------------------------------------------------------------
-- ⚠️ 需人工複查的專有名詞／用語（共 8 項，逐條標於下方對應 UPDATE 旁）
-- -----------------------------------------------------------------------------
--   R1  news id=3   「農業數據與農業政策研討會」— 官網該篇內文只有一條 Facebook
--                   連結，查無官方英文活動名。目前為自譯。
--   R2  news id=7   「東華大學×臺大農經系 國際學生交流研討會」— 校名已查證
--                   (National Dong Hwa University)，但這場活動本身的官方英文
--                   名稱查無。目前為自譯。
--   R3  news id=10  「第三屆永續農業政策高峰圓桌會議」— 查無官方英文活動名。
--                   目前為自譯。
--   R4  news id=2   「畢業典禮」— 台大官方多用 "Commencement"；此處採較通用的
--                   "graduation ceremony"。若要對齊校方用語請改 Commencement。
--   R5  courses id=5「進階個體經濟理論」/ id=6「農業經濟研究方法」— 這兩門不是
--                   系上實際開課名稱（DB 課號 AE5001/AE6001 亦非真實課號
--                   607/627 開頭）。英文比照課程地圖的「個體經濟理論 =
--                   Microeconomic Theory」「研究方法論 = Research Methodology」
--                   推得，非官方課名。
--   R6  links id=4  「文稿規格說明」— 官網英文站此項原樣留中文，無英譯。自譯。
--   R7  links id=5  「系友捐贈」— 官網英文站只有「捐贈書目 = Donation Booklist」
--                   （書目捐贈，語意不同），查無「系友捐贈」的官方英文。自譯。
--   R8  links id=15..18（students 區塊四筆）— 官網 /zh_tw/link/* 系列頁面完全
--                   沒有英文版，查無系上官方說法。四筆皆為自譯。
--
-- =============================================================================


-- =============================================================================
-- 1. news.title_en / news.category_en
-- =============================================================================
--
-- ## category_en 的取捨（重要，請 reviewer 過目）
--
-- 同一個中文分類固定對到同一個英文字串，7 種分類 → 7 個唯一英文字串。
-- 採用的是「本專案前台已上線的英文」（lib/i18n/news.ts 的 NEWS_FILTER_TABS），
-- 不是官網英文站的分類名。理由：
--   components/site/News.tsx 第 63 行把 NEWS_FILTER_TABS 當作 /news 的分類籤，
--   第 105 行同一頁把每列的 item.category（＝ category_en）印出來。
--   若 category_en 用官網的 "Latest news"，前台就會出現「分類籤寫 Announcements
--   ／列表標籤寫 Latest news」的同一分類兩種寫法 —— 正是要避免的狀況。
--
-- 官網英文站的對應說法（若 reviewer 偏好官方用語，改成這組即可，
-- 但請同步改 lib/i18n/news.ts 的 NEWS_FILTER_TABS，否則兩者會打架）：
--   最新公告 → 'Latest News'   （官網分類標籤實際印 "News"）
--   演講公告 → 'Speech'
--   活動剪影 → 'Event Gallery'
--   招生     → 'Admission'
--   求職徵才 → 'Job Openings'  （官網分類標籤實際印 "Recruit"）
--   榮譽／活動 → 官網無此分類，無官方說法
--
-- 標題採 sentence case，對齊本專案已翻譯過的同系新聞標題文風
-- （lib/i18n/alumni.ts："Four alumni selected for the 8th Hundred Outstanding
--   Young Farmers program"）。
-- -----------------------------------------------------------------------------

-- id=1  115學年度「博士生獎學金」申請事宜（7/17 前送系辦彙整）／最新公告
--       115學年度 = 2026 academic year（115 + 1911）
update public.news set
  title_en    = 'Doctoral student scholarship applications, 2026 academic year (submit to the department office by 7/17)',
  category_en = 'Announcements'
where id = 1;

-- id=2  115年05月30日 農經系畢業典禮花絮／活動剪影
--       115年05月30日 = 2026-05-30（與 published_at 2026-06-03 相符）
--       ⚠️ R4：畢業典禮採 "graduation ceremony"，台大官方用語為 "Commencement"
update public.news set
  title_en    = 'Highlights from the AGEC graduation ceremony, May 30, 2026',
  category_en = 'Event highlights'
where id = 2;

-- id=3  農業數據與農業政策研討會／演講公告
--       ⚠️ R1：官網原文為【農經系演講公告】農業數據與農業政策研討會，
--            內文僅一條 Facebook 連結，查無官方英文活動名。以下為自譯。
update public.news set
  title_en    = 'Symposium on agricultural data and agricultural policy',
  category_en = 'Talks'
where id = 3;

-- id=4  115學年度申請入學第二階段口試時間公告／招生
--       申請入學 = Individual Application（本專案 lib/i18n/admissions.ts 既有用語）
update public.news set
  title_en    = 'Second-stage interview schedule for individual application admission, 2026 academic year',
  category_en = 'Admissions'
where id = 4;

-- id=5  研究團隊誠徵兼任學生研究助理數名／求職徵才
update public.news set
  title_en    = 'Research team seeking part-time student research assistants',
  category_en = 'Careers'
where id = 5;

-- id=6  恭賀本系石曜合副教授榮獲國科會「吳大猷先生紀念獎」！／榮譽
--       石曜合 = Yau-Huo (Jimmy) Shr（官網英文專任師資頁，同列 email yhshr@iastate.edu）
--       國科會 = National Science and Technology Council (NSTC)
--       吳大猷先生紀念獎 = Ta-You Wu Memorial Award（NSTC 官方英文名）
update public.news set
  title_en    = 'Congratulations to Associate Professor Yau-Huo (Jimmy) Shr on receiving the NSTC Ta-You Wu Memorial Award',
  category_en = 'Honors'
where id = 6;

-- id=7  東華大學×臺大農經系 國際學生交流研討會／活動剪影
--       東華大學 = National Dong Hwa University（NDHU 官網雙語校名）
--       ⚠️ R2：活動本身的官方英文名查無，以下為自譯
update public.news set
  title_en    = 'National Dong Hwa University × NTU AGEC international student exchange seminar',
  category_en = 'Event highlights'
where id = 7;

-- id=8  115學年度申請入學 書面資料表格下載／招生
--       書面資料 = application document（對齊 links id=24「書面資料格式」
--       在 lib/i18n/admissions.ts 的 "Application document formats"）
update public.news set
  title_en    = 'Individual application admission, 2026 academic year: application document forms',
  category_en = 'Admissions'
where id = 8;

-- id=9  115學年度博士班招生簡章公告／招生
--       招生簡章 = admission guidelines（lib/i18n/admissions.ts 既有用語）
update public.news set
  title_en    = 'Doctoral program admission guidelines for the 2026 academic year',
  category_en = 'Admissions'
where id = 9;

-- id=10 第三屆永續農業政策高峰圓桌會議／活動
--       ⚠️ R3：查無官方英文活動名，以下為自譯
update public.news set
  title_en    = 'The third sustainable agriculture policy summit roundtable',
  category_en = 'Events'
where id = 10;


-- =============================================================================
-- 2. courses.name_en / courses.ctype_en
-- =============================================================================
-- ctype_en：必修 = Required、選修 = Elective
--   （台大教務處英文版選課須知 selcou-eng.pdf 用 "required / elective courses"；
--     app/(admin)/admin/courses/constants.ts 也只有這兩種中文值）
-- name_en：優先比照台大課程地圖（code=6070）系上自己的英文課名，見檔頭 [S3]
-- -----------------------------------------------------------------------------

-- id=1  AE1001 農業經濟學（大學部・必修）
--       系名即 Department of Agricultural Economics；
--       課程地圖「農業經濟概論 = Introduction to Agricultural Economics」
update public.courses set
  name_en  = 'Agricultural Economics',
  ctype_en = 'Required'
where id = 1;

-- id=2  AE1002 個體經濟學（大學部・必修）
--       課程地圖「個體經濟學甲上 = Microeconomics (a)(Ⅰ)」
update public.courses set
  name_en  = 'Microeconomics',
  ctype_en = 'Required'
where id = 2;

-- id=3  AE2001 計量經濟學（大學部・必修）
--       課程地圖「計量經濟學一／二 = Econometrics (Ⅰ)/(Ⅱ)」
update public.courses set
  name_en  = 'Econometrics',
  ctype_en = 'Required'
where id = 3;

-- id=4  AE3001 農業政策專題（大學部・選修）
--       課程地圖「農業政策專論 = Special Topics in Agricultural Policy」
--       （中文 專題／專論 略有出入，英文沿用系上既有寫法）
update public.courses set
  name_en  = 'Special Topics in Agricultural Policy',
  ctype_en = 'Elective'
where id = 4;

-- id=5  AE5001 進階個體經濟理論（碩士班・必修）
--       ⚠️ R5：非系上實際課名。比照課程地圖
--            「個體經濟理論一／二 = Microeconomic Theory (Ⅰ)/(Ⅱ)」推得
update public.courses set
  name_en  = 'Advanced Microeconomic Theory',
  ctype_en = 'Required'
where id = 5;

-- id=6  AE6001 農業經濟研究方法（博士班・必修）
--       ⚠️ R5：非系上實際課名。比照課程地圖
--            「研究方法論 = Research Methodoloogy [官網拼字錯誤]」、
--            「研究方法與論文寫作 = Research Method and Thesis Writing」推得
update public.courses set
  name_en  = 'Research Methods in Agricultural Economics',
  ctype_en = 'Required'
where id = 6;


-- =============================================================================
-- 3. programs.description_en
-- =============================================================================
-- 這四段簡介是本站自撰內容（官網無對應英文段落），故為忠實翻譯。
-- ⛔ 不動 programs.name_en（Undergraduate / Master's Program / PhD Program /
--    Executive Master's Program），僅寫 description_en。
-- -----------------------------------------------------------------------------

-- id=1 大學部：培育具備經濟分析與農業政策素養的大學部人才。
update public.programs set
  description_en = 'Educating undergraduates who are fluent in economic analysis and well grounded in agricultural policy.'
where id = 1;

-- id=2 碩士班：深化農業經濟理論與實證研究方法訓練。
update public.programs set
  description_en = 'Deepening training in agricultural economics theory and empirical research methods.'
where id = 2;

-- id=3 博士班：培養獨立學術研究與政策分析能力之高階人才。
update public.programs set
  description_en = 'Developing advanced scholars capable of independent academic research and policy analysis.'
where id = 3;

-- id=4 碩士在職專班：為在職人士提供彈性修讀之進修管道。
update public.programs set
  description_en = 'A flexible route to further study for those already in professional practice.'
where id = 4;


-- =============================================================================
-- 4. links.label_en
-- =============================================================================
-- courses / admissions 兩區塊：直接沿用 lib/i18n 既有 fallback，一字不改。
--   DB 有值時前台顯示 DB 值，DB 為 null 時顯示 fallback；兩者必須相同，
--   否則同一列會因為有沒有寫 DB 而顯示不同英文。
--     lib/i18n/courses.ts    → formsFallback
--     lib/i18n/admissions.ts → resourcesFallback
-- alumni 區塊：系友動態沿用 lib/i18n/alumni.ts nav 的 "Alumni news"。
-- students / journal 區塊：見各筆註記。
-- -----------------------------------------------------------------------------

-- ---- section = 'courses' （對齊 lib/i18n/courses.ts formsFallback）----------
update public.links set label_en = 'Course registration forms'   where id = 19; -- 選課相關表格
update public.links set label_en = 'Degree examination application' where id = 20; -- 學位考試申請
update public.links set label_en = 'Departure clearance forms'   where id = 21; -- 離校程序表格
update public.links set label_en = 'Research project application' where id = 22; -- 研究計畫申請
-- 參考：官網「常用表格」頁（/zh_tw/link/link4）國際專班區塊中，系上自己給的英文為
--   離校 → "NTU school-leaving procedure"
--   學位考試 → "Master/Doctoral Degree Examination Withdrawal Application Form"
--              "Graduation Application - Process of Thesis Exam Application"
-- 與上面的 fallback 語意一致，故不改動 fallback 寫法。

-- ---- section = 'admissions' （對齊 lib/i18n/admissions.ts resourcesFallback）--
update public.links set label_en = 'Current admission guidelines'  where id = 23; -- 當年度招生簡章
update public.links set label_en = 'Application document formats'  where id = 24; -- 書面資料格式
update public.links set label_en = 'Past examination papers'       where id = 25; -- 考古題專區
update public.links set label_en = 'Contact the department office' where id = 26; -- 聯絡系辦

-- ---- section = 'students' ---------------------------------------------------
-- ⚠️ R8：官網 /zh_tw/link/* 系列頁面沒有英文版，這四筆查無系上官方說法，皆為自譯。
--        lib/i18n/students.ts 也沒有對應 fallback（section4 只有標題
--        「常用資源 = Frequently used resources」），所以無既有字串可對齊。
update public.links set label_en = 'Admission and registration' where id = 15; -- 入學與註冊
update public.links set label_en = 'Network and IT services'    where id = 16; -- 網路與資訊服務
update public.links set label_en = 'Campus safety information'  where id = 17; -- 校園安全須知
update public.links set label_en = 'Scholarships and financial aid' where id = 18; -- 獎學金與助學

-- ---- section = 'alumni' -----------------------------------------------------
-- ⚠️ R7：系友捐贈 —— 官網英文站只有「捐贈書目 = Donation Booklist」（書目捐贈，
--        語意不同），查無「系友捐贈」的官方英文。自譯，並對齊
--        lib/i18n/alumni.ts section3 的 "Alumni giving funds scholarships…" 用字。
update public.links set label_en = 'Alumni giving' where id = 5;  -- 系友捐贈
-- 系友動態 = Alumni news：lib/i18n/alumni.ts nav.items 既有字串，一字不改。
update public.links set label_en = 'Alumni news'   where id = 10; -- 系友動態

-- ---- section = 'journal' （前台已不使用，仍一併翻譯）------------------------
-- 官網英文站「農業與經濟期刊」子選單即為權威來源：
--   /en/AgricultureEconomicJournal/JournalLatestNews                 = LatestNews
--   /en/AgricultureEconomicJournal/PublicationandSubmissionInformation
--                                                = Publication and Submission Information
--   /en/AgricultureEconomicJournal/EditorialCommittee                = Editorial Committee
-- 「LatestNews」漏了空格，此處補為 "Latest news"（僅補空格，用字不變）。
update public.links set label_en = 'Latest news' where id = 1; -- 最新消息
update public.links set label_en = 'Publication and Submission Information' where id = 2; -- 出版與徵稿簡則
update public.links set label_en = 'Editorial Committee' where id = 3; -- 編輯委員會
-- ⚠️ R6：文稿規格說明 —— 官網英文站此項原樣留中文「經濟論文文稿規格說明」，
--        沒有英譯。以下為自譯。
update public.links set label_en = 'Manuscript format guidelines' where id = 4; -- 文稿規格說明


-- =============================================================================
-- 5. 驗收 SELECT（跑完上面之後執行，逐條核對）
-- =============================================================================

-- 5.1 每欄還剩幾筆 null（全部都應該是 0）
select
  count(*)                                       as news_total,
  count(*) filter (where title_en    is null)    as news_title_en_null,
  count(*) filter (where category_en is null)    as news_category_en_null
from public.news;

select
  count(*)                                    as courses_total,
  count(*) filter (where name_en  is null)    as courses_name_en_null,
  count(*) filter (where ctype_en is null)    as courses_ctype_en_null
from public.courses;

select
  count(*)                                          as programs_total,
  count(*) filter (where description_en is null)    as programs_description_en_null
from public.programs;

select
  count(*)                                    as links_total,
  count(*) filter (where label_en is null)    as links_label_en_null
from public.links;

-- 5.2 分類一對一：每個中文分類只能出現一列（7 列，category_en 皆非 null）
select category, category_en, count(*) as n
from public.news
group by category, category_en
order by category;

-- 5.3 課程類別一對一：必修/選修各一列（2 列）
select ctype, ctype_en, count(*) as n
from public.courses
group by ctype, ctype_en
order by ctype;

-- 5.4 反向檢查：同一個英文字串不得對到兩個不同中文分類
select category_en, count(distinct category) as distinct_zh
from public.news
group by category_en
having count(distinct category) > 1;   -- 應回傳 0 列

-- 5.5 確認 programs.name_en 未被本檔動到（應維持系辦既有值）
select id, name, name_en, description_en
from public.programs
order by sort_order;

-- 5.6 links 全表逐筆目視核對
select id, section, sort_order, label, label_en
from public.links
order by section, sort_order;
