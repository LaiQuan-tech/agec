-- ============================================================
-- faculty：2026 改版的 37 筆人員資料
--
-- 資料來源：參考站 faculty.html（逐筆從 DOM 抓，非人工重打）。
--
-- 為什麼是 37 筆而不是 23 筆：
--   #section-1  .faculty-grid            22 人（專任 12 + 合聘 1 + 兼任 9）
--   #section-2  .faculty-grid-secondary  0 人 ← 是 #section-1 第 13–22 張的
--                                        「重複渲染」，同 10 人再印一次，
--                                        不是新的人。不要當成 10 筆新資料。
--   #section-3  客座教師                  1 人
--   #section-3  名譽教授                  5 人
--   #section-3  退休師資                  6 人
--   #section-4  .admin-grid              3 人
--                                     ------
--                                        37 人
-- 頁面自己寫「顯示 22 位成員」，而照片檔有 23 張 —— 兩個數字都不是人數。
--
-- ⚠️ 照片檔名編號與排序「錯位」，絕對不可用 index 推導檔名：
--    楊子霆排在第 13 位，用的卻是 23-tzu-ting-yang.jpg；
--    13-jeffrey-begun.jpg 是客座教師柏靖峰的，排在第 23 筆。
--    沒有任何一張主卡用 13- 開頭的檔名。下面每一筆的檔名都是逐筆從
--    HTML 的 src 屬性抄來的，改動時請一併回頭核對來源，不要「順手排整齊」。
--
-- 缺漏（不是錯誤，是原站就沒有）：
--   無照片 14 人 —— 名譽 5 + 退休 6 + 行政 3（前台要有 has-photo fallback）
--   無 email  1 人 —— 客座教師柏靖峰
--
-- sort_order = 參考站的 source order（1–37），跨分類連續編號，
-- 讓 getFaculty() 一次拉回來就已經是正確的呈現順序。
--
-- 本檔可重複執行（idempotent）：以「中文姓名」為自然鍵，
-- 已存在就更新、不存在才新增，全程不刪除任何資料。
-- 執行方式：貼進 Supabase SQL Editor。
--
-- ⚠️ 依賴 20260814090400_faculty_extend.sql（name_en / experience 兩欄），
--    請先跑那一支。
-- ============================================================
begin;

with incoming (name, name_en, title, category, fields, email, experience, photo_url, sort_order) as (
  values
    -- ---------- #section-1 標準卡：專任師資（12） ----------
    ('陳郁蕙'::text, null::text, '特聘教授兼系主任'::text, '專任師資'::text, '政策、制度與發展'::text, 'yhc@ntu.edu.tw'::text, null::text, '/images/faculty/01-yu-hui-chen.jpg'::text, 1::int),
    ('雷立芬', null, '教授', '專任師資', '農業政策與農企業管理', 'lei@ntu.edu.tw', null, '/images/faculty/02-li-fen-lei.jpg', 2),
    ('張宏浩', null, '特聘教授兼生農學院副院長', '專任師資', '生產、管理與行為', 'hunghaochang@ntu.edu.tw', null, '/images/faculty/03-hung-hao-chang.jpg', 3),
    ('劉鋼', null, '教授', '專任師資', '運銷、貿易與消費', 'kangernestliu@ntu.edu.tw', null, '/images/faculty/04-kang-liu.jpg', 4),
    ('羅竹平', null, '教授', '專任師資', '土地、資源與環境', 'cplo@ntu.edu.tw', null, '/images/faculty/05-chu-ping-lo.jpg', 5),
    ('楊豐安', null, '副教授', '專任師資', '應用經濟與計量分析', 'fayang@ntu.edu.tw', null, '/images/faculty/06-feng-an-yang.jpg', 6),
    ('石曜合', null, '副教授', '專任師資', '環境與資源經濟', 'yhshr@ntu.edu.tw', null, '/images/faculty/07-yao-ho-shih.jpg', 7),
    ('何率慈', null, '副教授', '專任師資', '農業與發展經濟', 'shuaytsyrho@ntu.edu.tw', null, '/images/faculty/08-shuay-tsyr-ho.jpg', 8),
    ('陳暐', null, '助理教授', '專任師資', '國際貿易與產業', 'jamesweichen@ntu.edu.tw', null, '/images/faculty/09-wei-chen.jpg', 9),
    ('魏敏芳', null, '助理教授', '專任師資', '農企業與消費研究', 'mfwei@ntu.edu.tw', null, '/images/faculty/10-min-fang-wei.jpg', 10),
    ('巫凱琳', null, '助理教授', '專任師資', '政策與行為經濟', 'karinwu@ntu.edu.tw', null, '/images/faculty/11-kai-lin-wu.jpg', 11),
    ('林柏熊', null, '助理教授', '專任師資', '資源與環境經濟', 'pakhunglam@ntu.edu.tw', null, '/images/faculty/12-pak-hung-lam.jpg', 12),

    -- ---------- #section-1 標準卡：合聘師資（1） ----------
    -- ⚠️ 排第 13 位但照片是 23- 開頭，這是原站的實際狀態，不是筆誤。
    ('楊子霆', null, '合聘師資 · 中央研究院經濟研究所', '合聘師資', '勞動與發展經濟', 'ttyang@econ.sinica.edu.tw', null, '/images/faculty/23-tzu-ting-yang.jpg', 13),

    -- ---------- #section-1 標準卡：兼任師資（9） ----------
    -- title 內含服務單位（有的有、有的沒有），照原站原樣保留，不要自己補齊。
    ('楊之遠', null, '兼任師資', '兼任師資', '農業政策與永續治理', 'yzy3@ulive.pccu.edu.tw', null, '/images/faculty/14-chih-yuan-yang.jpg', 14),
    ('李栢浡', null, '兼任師資', '兼任師資', '農業經濟與產業實務', 'p.p.lee0929@gmail.com', null, '/images/faculty/15-po-po-lee.jpg', 15),
    ('李叢禎', null, '兼任師資 · 國立臺灣師範大學', '兼任師資', '環境與資源經濟', 'tsungchenlee@ntnu.edu.tw', null, '/images/faculty/16-tsung-chen-lee.jpg', 16),
    ('孫立群', null, '兼任師資', '兼任師資', '經濟政策與產業實務', 'sunlc@ntu.edu.tw', null, '/images/faculty/17-li-chun-sun.jpg', 17),
    ('林雅淇', null, '兼任師資 · 國立中山大學', '兼任師資', '國際金融、應用計量與資源經濟', 'yachilin@mail.nsysu.edu.tw', null, '/images/faculty/18-ya-chi-lin.jpg', 18),
    ('劉瑞文', null, '兼任師資', '兼任師資', '運輸政策與產業經濟', 'rwliou@motc.gov.tw', null, '/images/faculty/19-jui-wen-liu.jpg', 19),
    ('劉哲良', null, '兼任師資 · 中華經濟研究院', '兼任師資', '環境與資源經濟、政策評估', 'jlliou@gs.cier.edu.tw', null, '/images/faculty/20-che-liang-liu.jpg', 20),
    ('唐迎華', null, '兼任師資', '兼任師資', '農企業管理與產業實務', 'JerryTang@waltop.com', null, '/images/faculty/21-ying-hua-tang.jpg', 21),
    ('楊棟樑', null, '兼任師資 · 新北市農會', '兼任師資', '農產運銷實務', 'ydl1123@gmail.com', null, '/images/faculty/22-tung-liang-yang.jpg', 22),

    -- ---------- #section-3 客座教師（1）：figure + <dl> 版型 ----------
    -- 全站唯一一位有照片卻沒有 email 的人。
    ('柏靖峰', 'Jeffrey Begun', '客座教師 · 助理教授', '客座教師', '發展經濟學、農業發展、國際環境政策', null, null, '/images/faculty/13-jeffrey-begun.jpg', 23),

    -- ---------- #section-3 名譽教授（5）：無照片履歷列版型 ----------
    -- 原站這兩群人的卡片上沒有職稱欄位。title 仍填分類字串，一來 title 極
    -- 可能是 NOT NULL，二來後台列表以 title 當副標，留白會變成一排空行。
    -- 前台這兩類版型不要渲染 title。
    ('蕭清仁', 'Chiang-Ren Show', '名譽教授', '名譽教授', null, 'ren@ntu.edu.tw', '國立臺灣大學農業經濟學系教授、系主任。', null, 24),
    ('陳明健', 'Ming-Chien Chen', '名譽教授', '名譽教授', null, 'aechen@ntu.edu.tw', '國立臺灣大學農業經濟學系教授、系主任。', null, 25),
    ('李順成', 'Shun-Cheng Lee', '名譽教授', '名譽教授', null, 'shunlee@ntu.edu.tw', '國立臺灣大學農業經濟學系教授、系主任。', null, 26),
    ('林國慶', 'Kuo-Ching Lin', '名譽教授', '名譽教授', null, 'linkc@ntu.edu.tw', '行政院農業委員會副主任委員、行政院政務顧問、亞太糧食肥料技術中心主任；曾任臺大生物資源暨農學院副院長、臺大經濟學系教授。', null, 27),
    ('吳榮杰', 'Rhung-Jieh Woo', '名譽教授', '名譽教授', null, 'm417@ntu.edu.tw', '國立臺灣大學農業經濟學系教授、系主任；曾任全國農業金庫獨立董事、臺灣農村經濟學會理事長。', null, 28),

    -- ---------- #section-3 退休師資（6）：同上版型 ----------
    ('陸雲', 'Alan Yun Lu', '退休師資', '退休師資', null, 'ntuaylu@ntu.edu.tw', '國立臺灣大學農業經濟學系教授、系主任；中央研究院經濟研究所研究員、哈佛燕京學社訪問學者、臺灣農業與資源經濟學會理事長。', null, 29),
    ('官俊榮', 'Jerome Geaun', '退休師資', '退休師資', null, 'gjer@ntu.edu.tw', '國立臺灣大學農業經濟學系教授，長期投入農業經濟教學與研究。', null, 30),
    ('吳珮瑛', 'Pei-Ing Wu', '退休師資', '退休師資', null, 'piwu@ntu.edu.tw', '國立臺灣大學農業經濟學系教授、系主任；曾任《農業經濟叢刊》主編。', null, 31),
    ('陸怡蕙', 'Yir-Hueih Luh', '退休師資', '退休師資', null, 'yirhueihluh@ntu.edu.tw', '國立臺灣大學農業經濟學系教授，長期投入農業經濟教學與研究。', null, 32),
    ('陳政位', 'Cheng-Wei Chen', '退休師資', '退休師資', null, 'cwchen@ntu.edu.tw', '國立臺灣大學農業經濟學系副教授；曾任中華行銷學會理事長。', null, 33),
    ('黃芳玫', 'Fung-Mey Huang', '退休師資', '退休師資', null, 'fmhuang@ntu.edu.tw', '國立臺灣大學農業經濟學系副教授，長期投入經濟學教學與研究。', null, 34),

    -- ---------- #section-4 行政同仁（3）：深底行政卡版型 ----------
    -- title 是原站的「職稱 · 職務」合併字串，中間是全形間隔號加半形空白，
    -- 與兼任師資的「兼任師資 · 單位」同一個排版慣例。
    -- 第 37 筆不是自然人，是一個辦公室 —— 前台不要假設每筆都能加「老師」。
    ('魏郁庭', null, '幹事 · 學士班招生、學位審查與學生事務', '行政同仁', null, 'yuitingwei@ntu.edu.tw', null, null, 35),
    ('林展慶', null, '辦事員 · 課程、研究所招生與系友事務', '行政同仁', null, 'lcc79@ntu.edu.tw', null, null, 36),
    ('在職專班辦公室', null, '招生、教務與學生事務', '行政同仁', null, 'ntuagecmba@ntu.edu.tw', null, null, 37)
),

-- 以中文姓名為自然鍵做 upsert。faculty.name 上沒有 unique constraint
-- （表是在 Dashboard 開的，repo 沒有 DDL 可加），所以不能用 on conflict，
-- 改成「先 update、update 不到的才 insert」。兩段在同一個 statement 裡看
-- 到同一份快照，updated 回傳的姓名就是本次已更新的，insert 據此排除，
-- 不會重複寫入。重跑本檔只會把 37 筆刷成同樣的值。
updated as (
  update public.faculty f
     set name_en    = i.name_en,
         title      = i.title,
         category   = i.category,
         fields     = i.fields,
         email      = i.email,
         experience = i.experience,
         photo_url  = i.photo_url,
         sort_order = i.sort_order
    from incoming i
   where f.name = i.name
  returning f.name
)
insert into public.faculty
  (name, name_en, title, category, fields, email, experience, photo_url, sort_order)
select i.name, i.name_en, i.title, i.category, i.fields, i.email, i.experience, i.photo_url, i.sort_order
  from incoming i
 where not exists (select 1 from updated u where u.name = i.name);

commit;

-- ============================================================
-- 驗收（唯讀，跑完上面之後直接執行這段看結果）
--
-- 預期：
--   專任師資 12 / 兼任師資 9 / 退休師資 6 / 名譽教授 5 /
--   行政同仁 3 / 合聘師資 1 / 客座教師 1      合計 37
--   有照片 23 筆、有 email 36 筆
--
-- 如果總數 > 37，代表原本的 8 筆佔位假資料還在（它們的姓名對不上本檔的
-- 37 個名字，所以不會被覆蓋，會以多餘的列留在表上）→ 看最下面的清理區塊。
-- ============================================================
select category,
       count(*)                                    as 人數,
       count(photo_url)                            as 有照片,
       count(email)                                as 有email,
       min(sort_order) || '–' || max(sort_order)   as 排序區間
  from public.faculty
 group by category
 order by min(sort_order);

-- ============================================================
-- 【需要你決定，本檔不會自動執行】清掉原本的 8 筆佔位假資料
--
-- faculty 表原本有 8 筆早期的佔位資料。本檔是以姓名比對做 upsert，只會
-- 覆蓋「名字剛好對得上」的那幾筆；對不上的會原封不動留在表上，讓師資頁
-- 多出幾張沒有照片、分類也對不上篩選標籤的卡片。
--
-- 刪除是不可逆的，所以刻意不寫進上面的 migration。請先跑這一句看看到底
-- 有哪些是多餘的：
--
--   select id, name, title, category, sort_order
--     from public.faculty
--    where name not in (
--      '陳郁蕙','雷立芬','張宏浩','劉鋼','羅竹平','楊豐安','石曜合','何率慈',
--      '陳暐','魏敏芳','巫凱琳','林柏熊','楊子霆','楊之遠','李栢浡','李叢禎',
--      '孫立群','林雅淇','劉瑞文','劉哲良','唐迎華','楊棟樑','柏靖峰',
--      '蕭清仁','陳明健','李順成','林國慶','吳榮杰',
--      '陸雲','官俊榮','吳珮瑛','陸怡蕙','陳政位','黃芳玫',
--      '魏郁庭','林展慶','在職專班辦公室'
--    )
--    order by id;
--
-- 確認列出來的都是不要的佔位資料之後，再把上面那句的 select ... 換成
-- delete（where 條件一字不動）：
--
--   delete from public.faculty
--    where name not in ( ...上面那一整串姓名... );
--
-- ⚠️ 如果系辦已經自己在後台新增過真的師資，這條 where 會把他們一起刪掉。
--    務必先跑 select 版本確認清單，不要直接跑 delete。
-- ============================================================
