-- links.url — 2026-08-28
--
-- 這 18 列從第一版 seed 起就沒有目的地（`NULL` 或字面上的 `'#'`）。前台的
-- MaybeLink 兩者一視同仁：沒有 url 就不渲染成連結，也不畫箭頭。本檔把逐一
-- 查證過的網址填進去。
--
-- 查證方式：每一個都用 curl 跟到最終導向，記錄狀態碼**並讀取內文**。只驗
-- 狀態碼會被騙——`ord.ntu.edu.tw/RPA`（研發處計畫申請）回 200，內容卻是
-- 404 錯誤頁；`agec.ntu.edu.tw/zh_tw/honor/honor4`（獎學金專區）回 200，
-- 麵包屑後 0 字元。兩者都因此淘汰。
--
-- 網域陷阱（很可能就是現行官網死連結的成因）：`aca` 與 `cc` 必須帶 www，
-- `osa` 反而不能帶。少一個 www 是 000 連不上，不是 404。
--
-- ⚠️ 只有 12 列會顯示在網站上（admissions / courses / students）。alumni 與
-- journal 共 6 列沒有任何路由讀取——見 lib/data.ts 的 LinkItem 註解——所以
-- 那 6 列只把假的 `'#'` 清成 NULL，不填網址：在沒人渲染的列上放真網址，只會
-- 讓後台看起來像已經接好。

/* ---- 招生資訊（/admissions #section-4）------------------------------ */

-- recruit1 是滾動列表，115／114／113 學年度由新到舊排在同一頁，所以永遠指向
-- 當年度。`/zh_tw/recruit` 會導到這裡，系網沒有涵蓋五個學制的總覽頁。
UPDATE links SET url = 'https://www.agec.ntu.edu.tw/zh_tw/recruit/recruit1'
 WHERE id = 23;

-- ⚠️ 全站唯一有到期日的連結。這是「115學年度」的單篇公告，系網沒有對應的
-- 常設頁；明年三月出 116 版時，這個網址不會 404，只會安靜地變成去年的表格
-- ——比壞掉更糟。每年招生季請在 /admin/links 換掉。
UPDATE links SET url = 'https://www.agec.ntu.edu.tw/zh_tw/recruit/recruit1/-%E6%8B%9B%E7%94%9F-115%E5%AD%B8%E5%B9%B4%E5%BA%A6%E7%94%B3%E8%AB%8B%E5%85%A5%E5%AD%B8-%E6%9B%B8%E9%9D%A2%E8%B3%87%E6%96%99%E8%A1%A8%E6%A0%BC%E4%B8%8B%E8%BC%89-55855145'
 WHERE id = 24;

UPDATE links SET url = 'https://www.agec.ntu.edu.tw/zh_tw/link/link5'
 WHERE id = 25;

-- 頁尾 `footer#contact` 在每一頁都在（SiteShell 都會渲染），所以同頁錨點就夠。
-- 原本存 '/#contact'，會把讀者從 /admissions 送回首頁頁尾才捲到聯絡資訊。
UPDATE links SET url = '#contact' WHERE id = 26;

/* ---- 課程資訊（/courses #section-3）--------------------------------- */

-- 教務處「選課專區」。PageSN 的數字是建立時戳（2021-10-28），標題卻已是
-- 115-1——同一個網址每學期更新內容，不是每學期換頁，所以是常設頁。
UPDATE links SET url = 'https://www.aca.ntu.edu.tw/w/aca/UAADForms_21102811111810357'
 WHERE id = 19;

-- 研究生教務組「學位考試申請及離校」分類，內含學位考試流程、離校手續、
-- 圖書館論文繳交三份。系網 link4 也有系級表格，但那一頁 41 份表格全部擠在
-- 同一個沒有錨點的摺疊清單裡，四列會全部落在同一個地方。
UPDATE links SET url = 'https://www.aca.ntu.edu.tw/w/aca/GAADService?typeId=21072616220141107'
 WHERE id = 20;

UPDATE links SET url = 'https://www.aca.ntu.edu.tw/w/aca/GAADService_21071212125574207'
 WHERE id = 21;

-- id=22「研究計畫申請」刻意留 NULL：比對過系網完整 sitemap，沒有這個頁面。
-- 系網「常用表格」最上方那份「補助辦法／申請書」查麵包屑是「系友會提供學生
-- 出國參與學術研討會補助」，是出國研討會補助不是研究計畫。校級 ord.ntu.edu.tw
-- 那套是教師計畫，與同區其他三項（選課／學位考試／離校，都是學生流程）不同
-- 性質。需系辦確認這個標籤原本要指什麼。

/* ---- 學生專區（/students #section-4）-------------------------------- */
-- 四項全是校級服務，系網沒有對應頁面。MaybeLink 會自動判定為站外連結，
-- 加上 target="_blank" rel="noopener noreferrer"。

UPDATE links SET url = 'https://www.aca.ntu.edu.tw/w/aca/UAAD'       WHERE id = 15;
UPDATE links SET url = 'https://www.cc.ntu.edu.tw/'                  WHERE id = 16;
UPDATE links SET url = 'https://ssc.ntu.edu.tw/'                     WHERE id = 17;
UPDATE links SET url = 'https://advisory.ntu.edu.tw/CMS/Page/21'     WHERE id = 18;

/* ---- 沒有路由讀取的 6 列：只清掉假值 -------------------------------- */
-- 存著字面上的 '#' 和留空一樣死，但在後台的網址欄位看起來像有人填過。
UPDATE links SET url = NULL WHERE url = '#';
