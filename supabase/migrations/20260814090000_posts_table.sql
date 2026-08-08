-- ============================================================
-- posts：部落格文章
--
-- 與 news 刻意分離：news 是短公告（published_at 是 date、無 slug、
-- 無草稿狀態），posts 是長文。硬把長文塞進 news 的改造成本高於新建。
--
-- 本檔可重複執行（idempotent）。執行方式：貼進 Supabase SQL Editor。
-- ============================================================
begin;

create table if not exists public.posts (
  id            bigint generated always as identity primary key,
  slug          text        not null,
  title         text        not null,
  excerpt       text,
  cover_url     text,
  content_html  text        not null default '',
  content_json  jsonb,
  author        text,
  tags          text[]      not null default '{}'::text[],
  status        text        not null default 'draft',
  published_at  timestamptz,
  created_by    uuid        references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- constraints ----------
-- 全部先 drop 再 add，讓本檔可重跑。

alter table public.posts drop constraint if exists posts_slug_key;
alter table public.posts add  constraint posts_slug_key unique (slug);

-- slug 只允許小寫英數與連字號（不允許中文、空白、開頭或結尾的連字號）。
-- 後台表單留空時會自動產生 post-YYYYMMDD-xxxx，所以系辦不會被卡住。
alter table public.posts drop constraint if exists posts_slug_format;
alter table public.posts add  constraint posts_slug_format
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 1 and 120);

alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add  constraint posts_status_check
  check (status in ('draft', 'published'));

-- 已發佈的文章一定要有發佈時間：前台排序與 RLS 的 published_at <= now() 都靠它。
alter table public.posts drop constraint if exists posts_published_needs_date;
alter table public.posts add  constraint posts_published_needs_date
  check (status <> 'published' or published_at is not null);

alter table public.posts drop constraint if exists posts_title_not_blank;
alter table public.posts add  constraint posts_title_not_blank
  check (char_length(btrim(title)) > 0);

-- ---------- indexes ----------
-- 前台列表只查已發佈，用 partial index 讓草稿不進索引。
create index if not exists posts_published_idx
  on public.posts (published_at desc) where status = 'published';

-- 後台列表依狀態篩選 + 建立時間排序。
create index if not exists posts_status_created_idx
  on public.posts (status, created_at desc);

-- 標籤篩選頁這次不做，但欄位與索引先備好，之後 tags @> array['政策'] 直接可用。
create index if not exists posts_tags_gin_idx
  on public.posts using gin (tags);

-- ---------- updated_at 自動維護 ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------- 註解 ----------
comment on table  public.posts              is '部落格文章。與 news 分離：news 是短公告，posts 是長文。';
comment on column public.posts.content_html is 'TipTap 產出、並已於 Server Action 用 sanitize-html 清洗過的 HTML。前台渲染的唯一來源。';
comment on column public.posts.content_json is 'TipTap 的 ProseMirror JSON。僅供編輯器回載，不是渲染來源。';
comment on column public.posts.author       is '顯示用的作者名稱（可能是「農經系辦公室」或教授姓名）。與 created_by 用途不同，不要合併。';
comment on column public.posts.created_by   is '實際建立者的 auth.users id，供稽核用。';

commit;
