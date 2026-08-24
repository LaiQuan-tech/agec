-- =============================================================================
-- faculty 英文欄位填充（name_en / title_en / fields_en / experience_en）
-- 產出日期：2026-08-25　　目標：public.faculty 37 筆
-- =============================================================================
--
-- 【只寫 _en 欄位】本檔完全不碰 name / title / fields / experience / category /
-- photo_url / sort_order 等中文與結構欄位。以 id 為鍵，可重複執行。
--
-- -----------------------------------------------------------------------------
-- 資料來源（依優先序）
-- -----------------------------------------------------------------------------
-- (A) 系所官網英文版（權威）— 2026-08-25 重新抓取比對：
--       https://www.agec.ntu.edu.tw/en/teacher/teacher1               專任師資 12 人
--       https://www.agec.ntu.edu.tw/en/teacher/JointAppointmentFaculty 合聘師資 1 人
--       https://www.agec.ntu.edu.tw/en/teacher/teacher2               兼任師資 9 人
--       https://www.agec.ntu.edu.tw/en/teacher/VisitingFaculty        客座教師 1 人
--       https://www.agec.ntu.edu.tw/en/teacher/teacher3               名譽教授 5 人
--       https://www.agec.ntu.edu.tw/en/teacher/Retire                 退休師資 11 人（含名譽 5 人）
--       https://www.agec.ntu.edu.tw/en/teacher/staff                  行政同仁 4 人
--       另比對 12 位專任教師的個人詳細頁（/en/teacher/teacher1/<slug>）。
--     中英頁面逐列同序、且以聯絡電話交叉比對，人員對應為 1:1 確認，非猜測。
--
-- (B) photo_url 檔名拼音（該系提供的設計參考站）— 僅在官網英文頁查不到時使用。
--
-- (C) 忠實翻譯（僅用於 fields / experience / 職稱敘述部分；人名絕不自行拼音）。
--
-- -----------------------------------------------------------------------------
-- 官網七個分類的官方英文說法（title_en 前綴沿用，2026-08-25 於官網導覽列確認）
-- -----------------------------------------------------------------------------
--   專任師資 = Full-Time Professor        合聘師資 = Joint Appointment Faculty
--   兼任師資 = Part-Time Professor        客座教師 = Visiting Faculty
--       （導覽列選單寫 "Visiting Faculty and Scholar" = 客座與訪問教師；
--         頁內區塊標題寫 "Visiting Faculty" = 客座教師。DB category 是「客座教師」，
--         故採用頁內區塊標題 "Visiting Faculty"。）
--   名譽教授 = Honorary Professor         退休師資 = Retire Faculty
--   行政同仁 = Staff
--
-- =============================================================================
-- ⚠️ 需人工複查清單（共 12 項，逐項在對應 update 上方也有標記）
-- =============================================================================
-- [R1]  id 46 林展慶 name_en 留 NULL。官網英文 staff 頁該分機 (02)3366-2672 掛的是
--       "Jyun-Yi Syu"，中文頁同分機是「林展慶」——英文頁未更新，那是前任同仁的名字，
--       不是林展慶的拼音。無來源可依，依規定留空（前台會 fallback 顯示中文）。
-- [R2]  id 21 巫凱琳 = "Karin Wu"。官網英文頁寫 "KARIN WU"（個人頁 slug 亦為
--       KARIN-WU-38174358），但 photo_url 檔名是 11-kai-lin-wu.jpg。兩來源不同：
--       官網優先取 Karin Wu，請系辦確認她對外慣用哪一個。
-- [R3]  id 25 李栢浡 = "Pai-Po Lee"。官網寫 "Pai-po Lee"，photo_url 是
--       15-po-po-lee.jpg。取官網並把 po 改大寫以符欄位格式，請確認大小寫。
-- [R4]  id 13 張宏浩 title_en。官網英文原文為
--       "Distinguished Professor and College of Bioresources and Agriculture Vice Dean's"
--       （尾巴 Vice Dean's 是官網的文法錯誤）。此處改寫為文法正確、事實相同的
--       "Distinguished Professor and Vice Dean, College of Bioresources and Agriculture"。
--       若系辦堅持與官網完全一致，請改回官網原字串。
-- [R5]  退休師資 title_en 用官網原詞 "Retire Faculty"（官網導覽列就是這樣寫）。
--       文法正確寫法應為 "Retired Faculty"。沿用官方詞、不擅自更動，請系辦裁示。
-- [R6]  id 32 楊棟樑「新北市農會」→ "New Taipei City Farmers' Association"。查無該會
--       官方英文名（新北市政府農業局英文站只列各區農會，未見市級農會英文名）。
-- [R7]  id 45 「幹事」→ "Administrative Officer"、id 46「辦事員」→ "Clerk"。
--       官網英文 staff 頁完全沒有職稱欄，無官方對照可循，此為通用譯法。
-- [R8]  id 47 「在職專班辦公室」→ "In-Service Master's Program Office"。官網英文站
--       根本沒有碩士在職專班的頁面（中文站有 /zh_tw/recruit/recruit4），無官方英文名。
--       "in-service master's program" 取自臺大教務處英文用語。
--       （若要嚴格遵守「查不到就留 null」，把這句註解掉即可。）
-- [R9]  id 37 林國慶「行政院政務顧問」→ "Policy Advisor to the Executive Yuan"。
--       行政院無單一官方英譯（英文媒體另見 "political affairs consultant" /
--       "unpaid adviser"）。「亞太糧食肥料技術中心主任」的 Director 亦請一併確認。
-- [R10] id 39 陸雲「臺灣農業與資源經濟學會」→ "Taiwan Agricultural and Resource
--       Economics Society"。查無該學會官方英文名（與已確認的「臺灣農村經濟學會 =
--       Rural Economics Society of Taiwan」是不同組織，勿混用）。
-- [R11] id 43 陳政位 —— 資料本身有出入。DB experience 寫「中華行銷學會理事長」，
--       官網退休師資頁寫「中華運銷協會理事長」，兩者是不同組織，且皆查無官方英文名。
--       此處依 DB 中文（中華行銷學會）譯為 "Chinese Marketing Association"。
--       請先確認中文哪個才對，再定英文。
-- [R12] id 41 吳珮瑛《農業經濟叢刊》→ "Taiwanese Agricultural Economic Review"。
--       採該刊發行單位臺灣農村經濟學會官網刊物頁寫法（rest.org.tw/en/publications/TAER）；
--       同站另一頁寫成 "Taiwan Agricultural Economic Review"（少一個 -ese），
--       兩種寫法並存，請擇一。注意此刊 ≠ 本系自辦的《農業與經濟》(Agriculture and
--       Economics, ISSN 1011-520X)，勿混。
--
-- 已查證確認、不需複查的機構英文名：
--   中央研究院經濟研究所 = Institute of Economics, Academia Sinica
--   國立臺灣師範大學     = National Taiwan Normal University
--   國立中山大學         = National Sun Yat-sen University
--   中華經濟研究院       = Chung-Hua Institution for Economic Research（cier.edu.tw）
--   行政院農業委員會副主任委員 = Deputy Minister, Council of Agriculture, Executive Yuan
--                             （eng.coa.gov.tw）
--   亞太糧食肥料技術中心 = Food and Fertilizer Technology Center for the Asian and
--                          Pacific Region（fftc.org.tw）
--   全國農業金庫         = Agricultural Bank of Taiwan（agribank.com.tw）
--   臺灣農村經濟學會     = Rural Economics Society of Taiwan（rest.org.tw）
--   哈佛燕京學社         = Harvard-Yenching Institute
--   生農學院             = College of Bioresources and Agriculture（官網英文職稱用語）
--   學會理事長           = President（rest.org.tw 英文站用語）
--
-- =============================================================================
-- ⚠️ 另外發現：DB 的中文 fields 與官網英文頁的 research expertise 有實質出入
--     （本檔忠實翻譯 DB 中文，不擅自替換；但中文內容本身可能要修，請系辦確認）
-- =============================================================================
--   id 19 陳暐   DB「國際貿易與產業」 vs 官網 "Behavioral/Experimental Economics,
--                Neuroeconomics, Decision Theory" —— 差距最大，幾乎不是同一領域。
--   id 20 魏敏芳 DB「農企業與消費研究」 vs 官網 "Food Insecurity, Social Assistance
--                Program, Development Economics"
--   id 21 巫凱琳 DB「政策與行為經濟」   vs 官網 "Agricultural and Food Policy, Health
--                Economics, and Environmental Economics"（官網無「行為經濟」）
--   id 13 張宏浩 DB「生產、管理與行為」 vs 官網 "Evaluation of Agricultural and Public
--                Policy, Farm Household Economics, Food Consumption..."（部分重疊）
--   其餘 fields 與官網無明顯衝突。
--
-- 人員名冊比對結果：34 位師資 DB 與官網「完全一一對應」，無多人、無少人、
--   無官網已下架者。行政同仁官網有 4 位（江姿漪、何奇峰、林展慶、魏郁庭），
--   DB 只收 3 筆且以「在職專班辦公室」取代其中兩位 —— 屬新站的編輯取捨，非錯誤。
-- =============================================================================


begin;

-- =============================================================================
-- 一、專任師資 Full-Time Professor（id 11–22）
--     name_en 與 title_en 全部來自官網英文專任師資頁／個人詳細頁。
-- =============================================================================

-- 陳郁蕙｜官網 name＋title；photo_url 檔名亦相符
update public.faculty set
  name_en   = 'Yu-Hui Chen',
  title_en  = 'Distinguished Professor and Chair',
  fields_en = 'Policy, Institutions and Development'
where id = 11;

-- 雷立芬｜官網 name＋title；photo_url 檔名亦相符
update public.faculty set
  name_en   = 'Li-Fen Lei',
  title_en  = 'Professor',
  fields_en = 'Agricultural Policy and Agribusiness Management'
where id = 12;

-- 張宏浩｜官網 name；title 見 [R4]（官網原文尾巴為 "Vice Dean's"，此處修正文法）
update public.faculty set
  name_en   = 'Hung-Hao Chang',
  title_en  = 'Distinguished Professor and Vice Dean, College of Bioresources and Agriculture',
  fields_en = 'Production, Management and Behavior'
where id = 13;

-- 劉鋼｜官網作 "Kang Ernest Liu"（photo_url 檔名只有 kang-liu，官網多了中名 Ernest，取官網）
update public.faculty set
  name_en   = 'Kang Ernest Liu',
  title_en  = 'Professor',
  fields_en = 'Marketing, Trade and Consumption'
where id = 14;

-- 羅竹平｜官網 name＋title；photo_url 檔名亦相符
update public.faculty set
  name_en   = 'Chu-Ping Lo',
  title_en  = 'Professor',
  fields_en = 'Land, Resources and the Environment'
where id = 15;

-- 楊豐安｜官網 name＋title；photo_url 檔名亦相符
update public.faculty set
  name_en   = 'Feng-An Yang',
  title_en  = 'Associate Professor',
  fields_en = 'Applied Economics and Econometric Analysis'
where id = 16;

-- 石曜合｜官網作 "Yau-Huo (Jimmy) Shr"，與 photo_url 檔名 07-yao-ho-shih.jpg 不同。
--         取官網：其個人頁 slug 為 Yau-Huo-Jimmy-Shr、聯絡信箱 yhshr@iastate.edu，
--         兩處都印證姓氏拼作 Shr 而非 Shih。
-- 官網 research expertise: "Environmental Economics, Nonmarket valuation"（與 DB 中文相符）
update public.faculty set
  name_en   = 'Yau-Huo (Jimmy) Shr',
  title_en  = 'Associate Professor',
  fields_en = 'Environmental and Resource Economics'
where id = 17;

-- 何率慈｜官網 name＋title；photo_url 檔名亦相符
update public.faculty set
  name_en   = 'Shuay-Tsyr Ho',
  title_en  = 'Associate Professor',
  fields_en = 'Agricultural and Development Economics'
where id = 18;

-- 陳暐｜官網作 "Wei(James) Chen"，此處僅在括號前補一個半形空格
-- ⚠️ fields 中英內容差異見檔頭（官網研究專長為行為／實驗經濟、神經經濟、決策理論）
update public.faculty set
  name_en   = 'Wei (James) Chen',
  title_en  = 'Assistant Professor',
  fields_en = 'International Trade and Industry'
where id = 19;

-- 魏敏芳｜官網作全大寫 "MIN-FANG WEI"，此處統一為 Title-Case
-- ⚠️ fields 中英內容差異見檔頭
update public.faculty set
  name_en   = 'Min-Fang Wei',
  title_en  = 'Assistant Professor',
  fields_en = 'Agribusiness and Consumer Research'
where id = 20;

-- 巫凱琳｜⚠️ [R2] 官網 "KARIN WU" vs photo_url 檔名 kai-lin-wu，取官網並改 Title-Case
-- ⚠️ fields 中英內容差異見檔頭
update public.faculty set
  name_en   = 'Karin Wu',
  title_en  = 'Assistant Professor',
  fields_en = 'Policy and Behavioral Economics'
where id = 21;

-- 林柏熊｜官網作 "Pak Hung Lam"（無連字號），photo_url 檔名 pak-hung-lam 拼音一致，取官網寫法
update public.faculty set
  name_en   = 'Pak Hung Lam',
  title_en  = 'Assistant Professor',
  fields_en = 'Resource and Environmental Economics'
where id = 22;


-- =============================================================================
-- 二、合聘師資 Joint Appointment Faculty（id 23）
-- =============================================================================

-- 楊子霆｜官網合聘師資頁；photo_url 檔名亦相符。機構英文名為中研院官方名。
update public.faculty set
  name_en   = 'Tzu-Ting Yang',
  title_en  = 'Joint Appointment Faculty · Institute of Economics, Academia Sinica',
  fields_en = 'Labor and Development Economics'
where id = 23;


-- =============================================================================
-- 三、兼任師資 Part-Time Professor（id 24–32）
--     ⚠️ 本區多位的官網英文名與 photo_url 檔名拼音不同。依規定官網優先，
--        且中英頁逐列同序＋分機號碼交叉比對，人員對應無誤。
-- =============================================================================

-- 楊之遠｜官網英文頁「這一列仍是中文」，唯一來源是 photo_url 檔名 14-chih-yuan-yang.jpg
update public.faculty set
  name_en   = 'Chih-Yuan Yang',
  title_en  = 'Part-Time Professor',
  fields_en = 'Agricultural Policy and Sustainable Governance'
where id = 24;

-- 李栢浡｜⚠️ [R3] 官網 "Pai-po Lee" vs photo_url 檔名 po-po-lee，取官網（大小寫已統一）
update public.faculty set
  name_en   = 'Pai-Po Lee',
  title_en  = 'Part-Time Professor',
  fields_en = 'Agricultural Economics and Industry Practice'
where id = 25;

-- 李叢禎｜官網誤植為 "Tsung-Chen Lee Lee"（姓氏重複），去重後與 photo_url 檔名一致
update public.faculty set
  name_en   = 'Tsung-Chen Lee',
  title_en  = 'Part-Time Professor · National Taiwan Normal University',
  fields_en = 'Environmental and Resource Economics'
where id = 26;

-- 孫立群｜官網 "Lih-Chyun Sun" vs photo_url 檔名 li-chun-sun，取官網
update public.faculty set
  name_en   = 'Lih-Chyun Sun',
  title_en  = 'Part-Time Professor',
  fields_en = 'Economic Policy and Industry Practice'
where id = 27;

-- 林雅淇｜官網與 photo_url 檔名一致
update public.faculty set
  name_en   = 'Ya-Chi Lin',
  title_en  = 'Part-Time Professor · National Sun Yat-sen University',
  fields_en = 'International Finance, Applied Econometrics and Resource Economics'
where id = 28;

-- 劉瑞文｜官網 "Ruey-Wan Liou" vs photo_url 檔名 jui-wen-liu，取官網
update public.faculty set
  name_en   = 'Ruey-Wan Liou',
  title_en  = 'Part-Time Professor',
  fields_en = 'Transportation Policy and Industrial Economics'
where id = 29;

-- 劉哲良｜官網 "Je-Liang Liou" vs photo_url 檔名 che-liang-liu，取官網
update public.faculty set
  name_en   = 'Je-Liang Liou',
  title_en  = 'Part-Time Professor · Chung-Hua Institution for Economic Research',
  fields_en = 'Environmental and Resource Economics, Policy Evaluation'
where id = 30;

-- 唐迎華｜官網 "Ying-Hwa Tang" vs photo_url 檔名 ying-hua-tang（華 Hwa/Hua），取官網
update public.faculty set
  name_en   = 'Ying-Hwa Tang',
  title_en  = 'Part-Time Professor',
  fields_en = 'Agribusiness Management and Industry Practice'
where id = 31;

-- 楊棟樑｜官網全大寫 "DONG-LIARNG YANG"（已改 Title-Case）vs photo_url 檔名
--          tung-liang-yang，取官網。機構名見 ⚠️ [R6]。
update public.faculty set
  name_en   = 'Dong-Liarng Yang',
  title_en  = 'Part-Time Professor · New Taipei City Farmers'' Association',
  fields_en = 'Agricultural Marketing Practice'
where id = 32;


-- =============================================================================
-- 四、客座教師 Visiting Faculty（id 33）
--     name_en 已有值（Jeffrey Begun），不覆寫。
-- =============================================================================

update public.faculty set
  title_en  = 'Visiting Faculty · Assistant Professor',
  fields_en = 'Development Economics, Agricultural Development, International Environmental Policy'
where id = 33;


-- =============================================================================
-- 五、名譽教授 Honorary Professor（id 34–38）
--     name_en 已有值，不覆寫；只補 title_en / experience_en。
-- =============================================================================

-- 蕭清仁
update public.faculty set
  title_en      = 'Honorary Professor',
  experience_en = 'Professor and Chair, Department of Agricultural Economics, National Taiwan University.'
where id = 34;

-- 陳明健
update public.faculty set
  title_en      = 'Honorary Professor',
  experience_en = 'Professor and Chair, Department of Agricultural Economics, National Taiwan University.'
where id = 35;

-- 李順成
update public.faculty set
  title_en      = 'Honorary Professor',
  experience_en = 'Professor and Chair, Department of Agricultural Economics, National Taiwan University.'
where id = 36;

-- 林國慶｜⚠️ [R9]「行政院政務顧問」無單一官方英譯；FFTC 首長頭銜 Director 亦請確認。
--          已確認：行政院農業委員會副主任委員 = Deputy Minister, Council of Agriculture,
--          Executive Yuan；亞太糧食肥料技術中心全名取自 fftc.org.tw。
update public.faculty set
  title_en      = 'Honorary Professor',
  experience_en = 'Deputy Minister, Council of Agriculture, Executive Yuan; Policy Advisor to the Executive Yuan; Director, Food and Fertilizer Technology Center for the Asian and Pacific Region. Formerly Vice Dean, College of Bioresources and Agriculture, and Professor, Department of Economics, National Taiwan University.'
where id = 37;

-- 吳榮杰｜全國農業金庫 = Agricultural Bank of Taiwan（官網已確認）；
--          臺灣農村經濟學會 = Rural Economics Society of Taiwan（官網已確認）；
--          理事長 = President（該會英文站用語）
update public.faculty set
  title_en      = 'Honorary Professor',
  experience_en = 'Professor and Chair, Department of Agricultural Economics, National Taiwan University. Formerly Independent Director, Agricultural Bank of Taiwan, and President, Rural Economics Society of Taiwan.'
where id = 38;


-- =============================================================================
-- 六、退休師資 Retire Faculty（id 39–44）
--     title_en 用官網原詞，見 ⚠️ [R5]。name_en 已有值，不覆寫。
-- =============================================================================

-- 陸雲｜⚠️ [R10]「臺灣農業與資源經濟學會」查無官方英文名。
--        哈佛燕京學社 = Harvard-Yenching Institute（官方名）。
update public.faculty set
  title_en      = 'Retire Faculty',
  experience_en = 'Professor and Chair, Department of Agricultural Economics, National Taiwan University; Research Fellow, Institute of Economics, Academia Sinica; Visiting Scholar, Harvard-Yenching Institute; President, Taiwan Agricultural and Resource Economics Society.'
where id = 39;

-- 官俊榮
update public.faculty set
  title_en      = 'Retire Faculty',
  experience_en = 'Professor, Department of Agricultural Economics, National Taiwan University, with a long-standing commitment to teaching and research in agricultural economics.'
where id = 40;

-- 吳珮瑛｜⚠️ [R12]《農業經濟叢刊》英文刊名兩種寫法並存，此處採 TAER 刊物頁寫法
update public.faculty set
  title_en      = 'Retire Faculty',
  experience_en = 'Professor and Chair, Department of Agricultural Economics, National Taiwan University. Formerly Editor-in-Chief of the Taiwanese Agricultural Economic Review.'
where id = 41;

-- 陸怡蕙
update public.faculty set
  title_en      = 'Retire Faculty',
  experience_en = 'Professor, Department of Agricultural Economics, National Taiwan University, with a long-standing commitment to teaching and research in agricultural economics.'
where id = 42;

-- 陳政位｜⚠️ [R11] DB 中文「中華行銷學會」與官網中文「中華運銷協會」不一致，
--          且兩者皆查無官方英文名。此處依 DB 中文直譯，請先確認中文再定英文。
update public.faculty set
  title_en      = 'Retire Faculty',
  experience_en = 'Associate Professor, Department of Agricultural Economics, National Taiwan University. Formerly President of the Chinese Marketing Association.'
where id = 43;

-- 黃芳玫
update public.faculty set
  title_en      = 'Retire Faculty',
  experience_en = 'Associate Professor, Department of Agricultural Economics, National Taiwan University, with a long-standing commitment to teaching and research in economics.'
where id = 44;


-- =============================================================================
-- 七、行政同仁 Staff（id 45–47）
-- =============================================================================

-- 魏郁庭｜官網英文 staff 頁 "Yu-Ting Wei"，以分機 (02)3366-2676 與中文頁交叉確認為同一人。
--          職稱英文見 ⚠️ [R7]（官網 staff 頁無職稱欄，通用譯法）。
update public.faculty set
  name_en  = 'Yu-Ting Wei',
  title_en = 'Administrative Officer · Undergraduate Admissions, Degree Review and Student Affairs'
where id = 45;

-- 林展慶｜⚠️ [R1] name_en 刻意保持 NULL（官網英文頁該分機掛的是前任同仁的名字，
--          不能拿來當林展慶的拼音）。前台 i18n fallback 會顯示中文姓名，不會壞版。
--          職稱英文見 ⚠️ [R7]。
update public.faculty set
  title_en = 'Clerk · Curriculum, Graduate Admissions and Alumni Affairs'
where id = 46;

-- 在職專班辦公室｜⚠️ [R8] 非人名而是單位名，官網英文站無此單位頁面，
--                  此為依臺大教務處英文用語（in-service master's program）的翻譯。
--                  若要嚴格「查不到就留 null」，把 name_en 那行註解掉即可。
update public.faculty set
  name_en  = 'In-Service Master''s Program Office',
  title_en = 'Admissions, Academic and Student Affairs'
where id = 47;

commit;


-- =============================================================================
-- 驗收 SELECT：跑完之後執行，確認各欄剩餘 null 筆數符合預期
-- =============================================================================
--
-- 預期結果：
--   name_en_null       = 1   （僅 id 46 林展慶，見 [R1]）
--   title_en_null      = 0
--   fields_en_null     = 14  （= 37 − 23；本來就沒有中文 fields 的那 14 筆）
--   experience_en_null = 26  （= 37 − 11；本來就沒有中文 experience 的那 26 筆）
--   以及 fields/experience 的「中文有值但英文沒填」皆必須為 0。
--
select
  count(*)                                                              as total_rows,
  count(*) filter (where name_en       is null)                         as name_en_null,
  count(*) filter (where title_en      is null)                         as title_en_null,
  count(*) filter (where fields_en     is null)                         as fields_en_null,
  count(*) filter (where experience_en is null)                         as experience_en_null,
  count(*) filter (where fields     is not null and fields_en     is null) as fields_zh_but_no_en,
  count(*) filter (where experience is not null and experience_en is null) as experience_zh_but_no_en
from public.faculty;

-- 逐筆檢視（確認沒有動到中文欄位、英文欄位對得上人）
-- select id, name, name_en, title, title_en, fields, fields_en
-- from public.faculty order by sort_order, id;
