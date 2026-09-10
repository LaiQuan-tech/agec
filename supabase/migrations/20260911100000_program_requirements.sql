-- ============================================================
-- programs 加「修業規定」內文四欄，並種入四學制的現有規定
--
-- 來源是系辦提供的「四學制課程.docx」。那份文件裡大學部的兩張替代科目對照表
-- 原本是**內嵌圖片**，這裡已經逐格轉錄成真正的 HTML 表格 —— 圖片裡的表格
-- 選不起來、手機讀不了、搜尋引擎也讀不到。
--
-- 欄位形狀完全照 20260908170000_faculty_bio.sql（老師個人頁）：
--   requirements_html / _en    Tiptap 吐出、經 sanitize-html 過濾後的 HTML。
--                              這是**渲染來源**，前台只讀它。
--   requirements_json / _en    同一份內容的 Tiptap 文件。只給後台編輯器回填，
--                              前台永遠不讀 —— 兩者一起寫、一起清。
--
-- 為什麼要存 json：Tiptap 從 HTML 反解回文件會遺失它自己的節點屬性，來回幾次
-- 之後排版會慢慢走樣。json 是無損的那一份。
--
-- 🔴 **必須在推程式碼之前跑。** lib/data.ts 的 PROGRAM_COLUMNS 是逐一列欄位的
--    字串，欄位不存在時 getPrograms() 回空陣列 —— 而它的影響面比 faculty 更大：
--    首頁的招生卡、/admissions 的四張學制卡、/courses 的學制篩選籤全部會空掉，
--    而且沒有任何錯誤畫面。
--
-- RLS 與稽核 trigger 都不必動（policy 是整張表層級的，trigger 早就掛著）。
--
-- ⚠️ 種資料用 `where requirements_html is null`：這一支可重複執行，而且**不會
--    覆蓋系辦之後在後台改過的內容**。要重新種就先手動清那一欄。
--
-- 可重複執行。
-- ============================================================

alter table public.programs
  add column if not exists requirements_html    text,
  add column if not exists requirements_html_en text,
  add column if not exists requirements_json    jsonb,
  add column if not exists requirements_json_en jsonb;

comment on column public.programs.requirements_html    is
  '修業規定內文（已過濾的 HTML）。null = 這個學制沒有規定頁面。';
comment on column public.programs.requirements_json    is
  'Tiptap 文件，只給後台編輯器回填；前台永遠不讀。與 requirements_html 一起寫、一起清。';
comment on column public.programs.requirements_html_en is
  'null = 還沒翻，英文頁會顯示中文原文並加一行英文說明。';
comment on column public.programs.requirements_json_en is
  '同 requirements_json，英文那一份。';

-- ------------------------------------------------------------
-- 種入四學制的現有規定
-- ------------------------------------------------------------
update public.programs
   set requirements_html = '<h3>畢業應修學分</h3>
<p>大學部所有課程分為四學年開設供學生修習。畢業應修最低學分數為 <strong>128 學分</strong>，結構如下：</p>
<ul><li>共同必修 9 學分</li><li>通識教育 15 學分</li></ul>
<p>其餘學分依入學學年度分為兩種：</p>
<ul>
<li><strong>112（含）學年度入學前</strong>：系訂必修 72 學分 ＋ 系訂選修 9 學分 ＋ 一般選修 23 學分</li>
<li><strong>113（含）學年度入學後</strong>：系訂必修 65 學分 ＋ 系訂選修 15 學分 ＋ 一般選修 24 學分</li>
</ul>
<p>※ 系訂選修學分之認定，為課程識別碼開頭為 607、627 之課程。</p>
<h3>基礎必修課程同等級參考替代科目</h3>
<h4>112（含）學年度入學前</h4>
<table><thead><tr><th>112（含）學年度入學前必修科目</th><th>替代科目及學分數</th></tr></thead><tbody><tr><td>607 10201 經濟學原理上(3)</td><td>303 10110 個體經濟學原理與實習(4)</td></tr><tr><td>607 10202 經濟學原理下(3)</td><td>303 10120 總體經濟學原理與實習(4)</td></tr><tr><td>607 20011 統計學上(3)</td><td>700 20111 統計學一上(3)<br />607 20013 統計學導論(4)</td></tr><tr><td>607 20012 統計學下(3)</td><td>700 20112 統計學一下(3)<br />607 20014 應用計量經濟學導論(4)</td></tr><tr><td>607 263A1 個體經濟學甲上(3)</td><td>303 20011 個體經濟學上(3)</td></tr><tr><td>607 263A2 個體經濟學甲下(3)</td><td>303 20012 個體經濟學下(3)</td></tr><tr><td>607 264A1 總體經濟學甲上(3)</td><td>303 20021 總體經濟學上(3)<br />607 264A3 總體經濟學一(3)</td></tr><tr><td>607 264A2 總體經濟學甲下(3)</td><td>303 20022 總體經濟學下(3)</td></tr><tr><td>607 435A0 農業法規甲</td><td>限以本系開設之三學分以上選修課程補足學分數</td></tr></tbody></table>
<p>※ 112 學年度第 2 學期第 1 次系務會議訂定。<br />※ 因「農業法規甲」自 113 學年起停開，請同學自行尋找本系 3 學分以上選修課程（課程識別碼為 607、627 開頭）替代。</p>
<h4>113（含）學年度入學後</h4>
<table><thead><tr><th>必修科目</th><th>開課系所</th><th>參考替代科目</th><th>學分數（一學期）</th></tr></thead><tbody><tr><td>經濟學原理上</td><td>經濟系</td><td>個體經濟學原理與實習</td><td>4</td></tr><tr><td>經濟學原理下</td><td>經濟系</td><td>總體經濟學原理與實習</td><td>4</td></tr><tr><td>個體經濟學甲上、下</td><td>經濟系</td><td>個體經濟學上、下</td><td>3</td></tr><tr><td>總體經濟學一</td><td>經濟系</td><td>總體經濟學上</td><td>3</td></tr><tr><td>統計學導論</td><td>經濟系</td><td>統計學暨實習</td><td>4</td></tr><tr><td>應用計量經濟學導論</td><td>經濟系</td><td>計量經濟學導論暨實習</td><td>4</td></tr></tbody></table>'
 where name = '大學部'
   and requirements_html is null;
update public.programs
   set requirements_html = '<h3>修業要求</h3>
<p>本系碩士班課程分為二學年開設。除畢業論文外，須修畢 <strong>28 學分</strong>，其中包含基礎必修科目 17 學分，並須至少選修三門本所開授之專業選修課程（三學分）。</p>
<p>學生在修畢規定學分並完成碩士論文撰寫後，得申請參加碩士學位論文考試，及格後由學校授予農業經濟學碩士學位。</p>
<h3>課程資訊</h3>
<p>課程相關資訊請查閱 <a href="http://gra108.aca.ntu.edu.tw/graVoxCourse/index.php/gquery/index" target="_blank" rel="noopener noreferrer">臺大必修課程網</a>。</p>
<h3>基礎必修科目之同等級替代科目</h3>
<ul>
<li><strong>個體經濟理論一（627 M1650）</strong>：經濟系「個體經濟理論一 A＋B」（323 M0810＋323 M0820）</li>
<li><strong>個體經濟理論二（627 M1660）</strong>：經濟系「個體經濟理論二 A＋B」（323 M0830＋323 M0840）</li>
<li><strong>總體經濟理論（627 M1670）</strong>：經濟系「總體經濟理論一 A＋B」（323 M0850＋323 M0860），或「總體經濟理論二 A＋B」（323 M0870＋323 M0880）</li>
</ul>
<h3>非本系畢業學生的補修規定</h3>
<p>非本系畢業之學生進入本系碩士班就讀，畢業前應修畢至少 <strong>2 門</strong>本系大學部開設之農經必修專業課程：</p>
<ul><li>農業經濟概論、農企業管理學、農產運銷學、農產價格、農業金融、農業法規甲、環境與自然資源經濟學、農業發展、農業政策、農業經濟問題討論上、農業經濟問題討論下</li></ul>
<p>若非本系畢業之學生曾於本系大學部修畢前列必修專業課程，則予以免修。</p>
<h3>學分抵免</h3>
<p>曾於大學部時修習本所 M 字頭課程，申請碩士班學分抵免者，由任課老師認定是否抵免。</p>'
 where name = '碩士班'
   and requirements_html is null;
update public.programs
   set requirements_html = '<h3>修業要求（109 學年度以後入學適用）</h3>
<ul>
<li>除畢業論文外，至少需修畢 <strong>28 學分</strong>：必修科目 18 學分、選修課程至少 10 學分。</li>
<li>每學期修習學分上限為 10 學分。</li>
<li>每學年分 3 學期授課（暑學期、上學期、下學期），畢業前至少修習 6 學期。</li>
</ul>
<h3>必修課程</h3>
<table><thead><tr><th>學期</th><th>科目</th></tr></thead><tbody><tr><th>第一學期</th><td>總體經濟學（627 M4740）</td></tr><tr><th>第二學期</th><td>個體經濟學（627 M4700）、專題討論一（627 M0030）</td></tr><tr><th>第三學期</th><td>應用統計學（627 M5160）、專題討論二（627 M0040）</td></tr><tr><th>第四學期</th><td>農業政策與績效評估（627 M5150）</td></tr><tr><th>第五學期</th><td>產業經濟學與財務分析（627 M5170）、論文寫作（627 M5020）</td></tr><tr><th>第六學期</th><td>無</td></tr></tbody></table>
<h3>選修課程</h3>
<p>依教師授課安排彈性開設：</p>
<ul>
<li>成本效益決策分析（627 M5260）、農企業電子商務經營管理（627 M4970）、國際農業體驗一（627 M9590）、國際農業體驗二（627 M9600）、休閒產業經營管理（627 M4690）、產業經濟學與公平交易法（627 M5030）、企業管理專論與實務（627 M4870）、農業政策（627 M4960）、財務分析與管理（627 M4560）、農業法規（627 M4530）、國際農產貿易與行銷（627 M4790）、行銷管理（627 M4710）、農產貿易專論（627 M5110）、中國經濟（627 M9700）</li>
</ul>
<h3>上課時間</h3>
<p>每學期開授課時間以每隔一週（單數週）之週六及週日為原則；暑期班（第一及第四學期）則每週六及週日連續上課。</p>'
 where name = '碩士在職專班'
   and requirements_html is null;
update public.programs
   set requirements_html = '<h3>必修課程</h3>
<p>博士班必修課程請參閱 <a href="http://gra108.aca.ntu.edu.tw/graVoxCourse/index.php/gquery/index" target="_blank" rel="noopener noreferrer">臺大必修課程網</a>。</p>
<h3>畢業應修學分</h3>
<ul>
<li><strong>111 學年度後入學者</strong>：除畢業論文外，至少修畢 37 學分，包括基礎必修科目 19 學分，以及二個本所規劃之專業學門，每一專業學門至少完成三科必選科目。</li>
<li><strong>107–110 學年度入學者</strong>：除畢業論文外，至少修畢 36 學分，包括基礎必修科目 24 學分，由「運銷、貿易、發展與政策」、「生產、勞動、資源與環境」兩大專業學門中任選一學門，於學門內至少完成四科必選科目。</li>
</ul>
<p>107 學年度起入學者，需修習完成至少六小時學術倫理課程；學生經系、所確認修習通過或核准免修本課程者，始得申請學位考試。</p>
<p>就讀本所碩士班時修習之 M 字頭以上課程，於申請博士班學分抵免時，至多可抵 9 學分。</p>
<h3>基礎必修科目</h3>
<h4>111 學年度後入學者</h4>
<table><thead><tr><th>類別</th><th>科目</th></tr></thead><tbody><tr><th>1、經濟理論</th><td>經濟系「個體經濟理論一 AB、二 AB」（323 M0810、323 M0820、323 M0830、323 M0840）4 選 2；經濟系「總體經濟理論一 AB、二 AB」（323 M0850、323 M0860、323 M0870、323 M0880）4 選 2</td></tr><tr><th>2、數量方法</th><td>數學規劃專論（627 M3120）、計量經濟學專論一（627 D1860）、計量經濟學專論二（627 D1870）</td></tr><tr><th>3、專題討論</th><td>專題討論一、二（627 D0030、627 D0040）、專題演講一、二（627 M0050、627 D0100）</td></tr></tbody></table>
<p>※ 計量經濟學專論一（627 D1860）得以計量經濟專論（627 D1720）替代。<br />※ 計量經濟學專論二得以計量相關課程替代。</p>
<h4>107–110 學年度入學者</h4>
<table><thead><tr><th>類別</th><th>科目</th></tr></thead><tbody><tr><th>1、經濟理論</th><td>經濟系「個體經濟理論一、二」（323 M0610、323 M0630）、經濟系「總體經濟理論一、二」（323 M0620、323 M0640）</td></tr><tr><th>2、數學方法</th><td>數學規劃專論（627 M3120）、計量經濟學專論（627 D1720）</td></tr><tr><th>3、專題討論</th><td>專題討論一、二（627 D0030、627 D0040）、專題演講一、二（627 M0050、627 D0100）</td></tr></tbody></table>
<p>※ 總體經濟理論二得以經濟系「總體與貨幣」學門，或本系規劃「運銷、貿易、發展與政策」學門、「生產、勞動、資源與環境」學門任兩門科目替代。</p>
<h3>專業學門必選科目</h3>
<h4>適用 111 學年度後入學者</h4>
<table><thead><tr><th>學門</th><th>科目</th></tr></thead><tbody><tr><th>1、政策、制度與法規</th><td>組織經濟學、高等農業金融、制度經濟學、農業政策專論、競爭法的經濟分析、農業政策量化評估、農業法規與法律經濟學</td></tr><tr><th>2、運銷、貿易與消費</th><td>高級農產運銷學、農產貿易政策分析、高級消費經濟學、農產運銷專論、農產價格分析</td></tr><tr><th>3、生產與管理經濟</th><td>生產經濟學一、生產經濟學二、勞動經濟專論、產業經濟實證專題、農企業管理專論</td></tr><tr><th>4、資源與環境經濟</th><td>土地資源經濟專論、價值與效益評估之理論與應用、環境評估理論與模型、生物經濟學、福利經濟專論、土地經濟政策分析、高等環境經濟學</td></tr></tbody></table>
<h4>適用 107–110 學年度入學者</h4>
<table><thead><tr><th>學門</th><th>科目</th></tr></thead><tbody><tr><th>1、運銷、貿易、發展與政策</th><td>農產貿易政策分析、組織經濟學、農業經濟發展專論、國際貿易專論一、國際貿易專論二、高級消費經濟學、農業與經濟發展理論、中國經濟、高級農產運銷學、農業政策專論</td></tr><tr><th>2、生產、勞動、資源與環境</th><td>環境評估理論與模型、價值與效益評估之理論與應用、農業金融專論、勞動經濟專論、生物經濟學、土地資源經濟專論、福利經濟專論、生產經濟學一、生產經濟學二、高等農業金融</td></tr></tbody></table>
<h4>適用 106 學年度及之前入學者</h4>
<table><thead><tr><th>學門</th><th>科目</th></tr></thead><tbody><tr><th>1、政策、制度與法規</th><td>組織經濟學、高等農業金融、國際貿易專論、國際貿易專論二、農業金融專論、農業政策專論、中國經濟</td></tr><tr><th>2、運銷、貿易與消費</th><td>高級農產運銷學、農產貿易政策分析、高級消費經濟學</td></tr><tr><th>3、生產與管理經濟</th><td>生產經濟學一、生產經濟學二、勞動經濟專論、農業經濟發展專論、農業與經濟發展理論</td></tr><tr><th>4、資源與環境經濟</th><td>土地資源經濟專論、環境評估理論與模型、生物經濟學、福利經濟專論、價值與效益評估之理論與應用</td></tr></tbody></table>
<p>※ 106 學年度及之前入學者，可自由選用新學門或舊學門。</p>'
 where name = '博士班'
   and requirements_html is null;

-- ------------------------------------------------------------
-- 驗收（唯讀）
-- ------------------------------------------------------------
-- 1) 四欄都在：
--    select column_name, data_type, is_nullable
--      from information_schema.columns
--     where table_schema='public' and table_name='programs'
--       and column_name like 'requirements%'
--     order by column_name;
--    期望：四列，_html 是 text、_json 是 jsonb，全部 YES
--
-- 2) 四個學制都有內容，且英文欄仍是 null（尚未翻譯）：
--    select name, length(requirements_html) as 中文字元,
--           requirements_html_en is null as 英文未填
--      from public.programs order by sort_order;
--    期望：大學部 1792 / 碩士班 945 / 碩士在職專班 996 / 博士班 2756，英文全 true
--
-- 3) 重跑一次這支，長度不變（where … is null 擋住覆蓋）
