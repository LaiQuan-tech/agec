-- ============================================================
-- 頁面文案格位 page_copy（第二頁：本系簡介 /about）
--
-- 客戶回饋：後台側欄看到「本系簡介：這一頁目前是固定文案，沒有可編輯的內容」，
-- 要求這一頁也要能改。整頁文字原本全部寫死在 lib/i18n/about.ts。
--
-- 接的是 20260914110000 建好的 page_copy 表（page / name / zh / en，unique
-- (page, name)），同一套機制：固定格位、只改文字。§1 時間軸 5 格、§2 四張卡、
-- §3 四格棋盤、§4 三張照片的格數都寫死在 site.css 的斷點規則裡（見
-- components/site/About.tsx 檔頭），所以開放的是每一格的**文字**，不是格數 ——
-- 42 個固定的 name，後台 /admin/about 一張表單存整批。
--
--   page   'about'
--   name   照 lib/i18n/about.ts 的路徑（history.milestones.3.title），清單在
--          lib/page-copy/about.ts —— 那個檔是唯一的格位清單，前台 resolver、
--          後台表單與 action 三方共用
--   zh/en  英文空白 = 英文站顯示中文。語言中立的格位（里程碑年份、榮譽徽章字
--          TOP 2%／AJAE／NSTC／IMPACT）zh 與 en 存同一個值
--
-- ## 只有種子，不建表、不改欄位
--
-- 表、RLS、grant、稽核 trigger 都在 20260914110000 裡建好了，這支只 insert
-- about 的 42 列（外加一行更新表的說明文字）。值逐字取自 lib/page-copy/about.ts 的 ABOUT_COPY_DEFAULTS
-- （由 scripts/page-copy-seed.ts about 產生，不是手打；改了字典要重產就再跑一次），所以上線那一刻前台一個字都不會變。
--
-- ## 可重複執行
--
-- on conflict (page, name) do nothing：重跑不報錯、列數不變，也不會蓋掉系辦
-- 已經在後台改過的字。
--
-- ## 沒有部署順序限制
--
-- 還沒跑這支時前台走 resolver 退回字典、後台表單顯示字典預設值；儲存會 upsert
-- 出這些列（第一次儲存會把 42 列全部寫進去，因為「沒有列」也算有變）。先跑
-- 這支再推程式碼比較乾淨，但反過來不會壞。
--
-- ⚠️ 這個專案沒有 Supabase CLI，migration 是人工貼進 Dashboard SQL Editor
--    （或 Management API）。跑完請回 supabase/README.md 勾記。
-- ============================================================

-- ------------------------------------------------------------
-- 種子：本系簡介 42 個格位（逐字取自 lib/page-copy/about.ts 的 ABOUT_COPY_DEFAULTS）
-- ------------------------------------------------------------
insert into public.page_copy (page, name, zh, en)
values
  ('about', 'lead',                         '承繼近百年農業經濟研究傳統，以經濟分析、資料與跨域協作，回應臺灣及全球的關鍵課題。', 'Building on nearly a century of agricultural economics research, we answer the questions that matter to Taiwan and the world through economic analysis, data and cross-disciplinary collaboration.'),
  ('about', 'history.heading',              '從臺灣出發的農經學術傳承', 'A scholarly tradition in agricultural economics, rooted in Taiwan'),
  ('about', 'history.description',          '本系歷史可追溯至 1928 年臺北帝國大學設立的農業經濟講座，逐步建立完整的學士、碩士與博士教育體系。', 'The department traces its origins to the chair of agricultural economics established at Taihoku Imperial University in 1928, and has since built a complete education system spanning the bachelor''s, master''s and doctoral levels.'),
  ('about', 'history.imageCaption',         'Knowledge rooted in place, passed forward across generations.', 'Knowledge rooted in place, passed forward across generations.'),
  ('about', 'history.milestones.1.year',    '1928', '1928'),
  ('about', 'history.milestones.1.title',   '農業經濟講座設立', 'Chair of agricultural economics established'),
  ('about', 'history.milestones.1.body',    '臺北帝國大學時期，開啟農業經濟教學與研究的學術源流。', 'Founded in the Taihoku Imperial University era, opening the line of agricultural economics teaching and research that continues here.'),
  ('about', 'history.milestones.2.year',    '1950', '1950'),
  ('about', 'history.milestones.2.title',   '農業經濟學系成立', 'Department of Agricultural Economics founded'),
  ('about', 'history.milestones.2.body',    '國立臺灣大學農學院成立農業經濟學系，奠定人才培育基礎。', 'The College of Agriculture at National Taiwan University founded the department, laying the groundwork for educating the field''s next generation.'),
  ('about', 'history.milestones.3.year',    '1960', '1960'),
  ('about', 'history.milestones.3.title',   '研究所教育展開', 'Graduate education begins'),
  ('about', 'history.milestones.3.body',    '成立農村社會經濟研究所，招收碩士班研究生。', 'The Graduate Institute of Rural Socio-Economics (農村社會經濟研究所) was established and began admitting master''s students.'),
  ('about', 'history.milestones.4.year',    '1987', '1987'),
  ('about', 'history.milestones.4.title',   '博士班成立', 'Doctoral program established'),
  ('about', 'history.milestones.4.body',    '建構完整高等教育與研究體系，深化國際學術交流。', 'Completing the department''s structure for advanced study and research, and deepening its international academic exchange.'),
  ('about', 'history.milestones.5.year',    'NOW', 'NOW'),
  ('about', 'history.milestones.5.title',   '面向全球挑戰', 'Facing global challenges'),
  ('about', 'history.milestones.5.body',    '串連 AI、資料科學、永續治理與糧食安全，持續引領農經研究。', 'Drawing together AI, data science, sustainable governance and food security to keep leading research in agricultural economics.'),
  ('about', 'mission.heading',              '以世界一流之教學與研究，提升農業經濟學術地位', 'Advancing the standing of agricultural economics through world-class teaching and research'),
  ('about', 'mission.quote',                '培育兼具農業專業知識、經濟分析能力、資料應用能力及國際視野之專業人才。', 'To educate professionals who combine agricultural expertise, economic analysis, command of data and an international outlook.'),
  ('about', 'mission.principles.1.title',   '扎實理論', 'Solid theory'),
  ('about', 'mission.principles.1.body',    '建立經濟學、統計學、計量分析與管理學基礎。', 'Building foundations in economics, statistics, econometrics and management.'),
  ('about', 'mission.principles.2.title',   '實證研究', 'Empirical research'),
  ('about', 'mission.principles.2.body',    '運用資料科學與嚴謹方法，回應真實世界問題。', 'Answering real-world questions with data science and rigorous method.'),
  ('about', 'mission.principles.3.title',   '跨域整合', 'Cross-disciplinary integration'),
  ('about', 'mission.principles.3.body',    '連結農業、環境、政策、產業與全球市場。', 'Connecting agriculture, the environment, policy, industry and global markets.'),
  ('about', 'mission.principles.4.title',   '國際影響', 'International impact'),
  ('about', 'mission.principles.4.body',    '拓展研究合作、交換學習與全球學術能見度。', 'Extending research collaboration, exchange study and global academic visibility.'),
  ('about', 'honors.heading',               '研究與人才，在世界舞臺持續被看見', 'Research and people that keep earning recognition worldwide'),
  ('about', 'honors.items.1.label',         'TOP 2%', 'TOP 2%'),
  ('about', 'honors.items.1.body',          '教師入選史丹佛大學全球前 2% 頂尖科學家', 'Faculty named in Stanford University''s list of the world''s top 2% of scientists'),
  ('about', 'honors.items.2.label',         'AJAE', 'AJAE'),
  ('about', 'honors.items.2.body',          '研究成果發表於國際農業經濟重要期刊', 'Research published in the leading international journals of agricultural economics'),
  ('about', 'honors.items.3.label',         'NSTC', 'NSTC'),
  ('about', 'honors.items.3.body',          '國科會傑出研究獎與吳大猷先生紀念獎', 'NSTC Outstanding Research Award and Ta-You Wu Memorial Award'),
  ('about', 'honors.items.4.label',         'IMPACT', 'IMPACT'),
  ('about', 'honors.items.4.body',          '系友遍布產、官、學、研及國際組織', 'Alumni across industry, government, academia, research institutes and international organizations'),
  ('about', 'environment.heading',          '讓學習、研究與交流自然發生', 'Where learning, research and exchange happen naturally'),
  ('about', 'environment.photos.1.caption', 'Department Corridor · 系辦外廊', 'Department Corridor'),
  ('about', 'environment.photos.2.caption', 'Architectural Detail · 建築細節', 'Architectural Detail'),
  ('about', 'environment.photos.3.caption', 'Courtyard · 中庭環境', 'Courtyard')
on conflict (page, name) do nothing;

-- 表的說明原本寫「目前只有 students」，順手更新（可重複執行）。
comment on table public.page_copy is '固定格位的頁面文案（students、about）。格數由程式決定，後台只能改字；清單在 lib/page-copy/<page>.ts。';

-- ------------------------------------------------------------
-- 驗收（唯讀）
-- ------------------------------------------------------------
-- 1) 42 列：
--    select count(*) from public.page_copy where page = 'about';
-- 2) 語言中立的 9 格 zh = en：
--    select name from public.page_copy where page = 'about'
--     and (name like '%.year' or name like '%.label') and zh <> en;   -- 應為 0 列
-- 3) 可重複執行：再跑一次不報錯、列數不變。
