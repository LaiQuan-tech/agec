/**
 * 把某一頁的 page_copy 種子印成 SQL（stdout），給 migration 貼用。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/page-copy-seed.ts about
 *
 * 值逐字取自 lib/page-copy/<page>.ts 的 *_COPY_DEFAULTS（也就是字典），所以
 * 種子跑下去那一刻前台一個字都不會變；單引號跳脫成 ''。只印 insert 區塊，
 * migration 的檔頭說明另外手寫（見 20260916100000_page_copy_about.sql）。
 *
 * 新增一頁：在 PAGES 加一筆就好。
 */
import { ABOUT_COPY_DEFAULTS, ABOUT_COPY_FIELDS, ABOUT_PAGE } from "@/lib/page-copy/about";
import {
  STUDENTS_COPY_DEFAULTS,
  STUDENTS_COPY_FIELDS,
  STUDENTS_PAGE,
} from "@/lib/page-copy/students";

type Seed = {
  page: string;
  fields: readonly { name: string }[];
  defaults: Record<string, { zh: string; en: string } | undefined>;
};

const PAGES: Record<string, Seed> = {
  [STUDENTS_PAGE]: { page: STUDENTS_PAGE, fields: STUDENTS_COPY_FIELDS, defaults: STUDENTS_COPY_DEFAULTS },
  [ABOUT_PAGE]: { page: ABOUT_PAGE, fields: ABOUT_COPY_FIELDS, defaults: ABOUT_COPY_DEFAULTS },
};

const key = process.argv[2];
const seed = key ? PAGES[key] : undefined;
if (!seed) {
  console.error(`用法：page-copy-seed.ts <${Object.keys(PAGES).join("|")}>`);
  process.exit(1);
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const width = Math.max(...seed.fields.map((f) => f.name.length)) + 2;
const rows = seed.fields.map((f) => {
  const d = seed.defaults[f.name];
  if (!d) throw new Error(`${seed.page}: ${f.name} 沒有預設值`);
  return `  (${q(seed.page)}, ${(q(f.name) + ",").padEnd(width + 1)} ${q(d.zh)}, ${q(d.en)})`;
});

process.stdout.write(
  `insert into public.page_copy (page, name, zh, en)\nvalues\n${rows.join(",\n")}\non conflict (page, name) do nothing;\n`
);
