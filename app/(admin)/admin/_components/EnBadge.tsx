/**
 * Shared "how far along is the English version" marker for the admin list
 * pages.
 *
 * The English columns (`*_en`) are all nullable and all optional: lib/i18n's
 * pick() falls back to the Chinese value whenever the English one is blank, so
 * a half-translated table is a perfectly valid state. That is deliberate — the
 * office can translate a row at a time — but it means nothing on the public
 * site ever *looks* untranslated, and without a marker here the staff would
 * have no way to tell which rows they have already done.
 *
 * Lives in a private folder (`_components`): the underscore opts the whole
 * directory out of routing, so a stray page.tsx convention can never turn it
 * into a URL. See node_modules/next/dist/docs/01-app/01-getting-started/
 * 02-project-structure.md → "Private folders".
 */

/**
 * Counts the English columns that are done, over the ones worth doing.
 *
 * Each pair is `[chinese, english]`. A pair whose Chinese side is empty is left
 * out of the total entirely, because there is nothing to translate: 研究領域 is
 * null for every 名譽教授, 經歷 is null for every 專任師資, and counting those
 * would pin whole categories at a score they can never clear.
 *
 * Whitespace-only counts as empty on both sides, matching pick() in
 * lib/i18n/index.ts — it trims before deciding whether to use the English
 * value, so a field holding only spaces is "not translated" there too.
 */
export function enProgress(
  pairs: ReadonlyArray<readonly [zh: string | null | undefined, en: string | null | undefined]>
): { filled: number; total: number } {
  let filled = 0;
  let total = 0;

  for (const [zh, en] of pairs) {
    if (!zh?.trim()) continue;
    total += 1;
    if (en?.trim()) filled += 1;
  }

  return { filled, total };
}

/** Palettes are literal hex rather than the admin tokens on purpose: --muted on
 *  --hairline lands at 3.95:1, under the 4.5:1 AA floor for this 12px text.
 *  These three all clear 6.6:1. */
const DONE = { background: "#f0fdf4", color: "#166534" };
const PARTIAL = { background: "#fffbeb", color: "#92400e" };
const NONE = { background: "var(--hairline)", color: "var(--ink-soft)" };

export function EnBadge({ filled, total }: { filled: number; total: number }) {
  // No translatable Chinese content at all — a dash rather than "0/0", which
  // would read as "nothing done" instead of "nothing to do".
  if (total === 0) {
    return (
      <span className="text-[12px]" style={{ color: "var(--muted)" }}>
        —
      </span>
    );
  }

  const done = filled === total;
  const style = done ? DONE : filled === 0 ? NONE : PARTIAL;
  const label = done
    ? "英文已填完"
    : filled === 0
      ? `英文尚未填寫，共 ${total} 欄`
      : `英文已填 ${filled} 欄，共 ${total} 欄`;

  return (
    <span
      className="inline-block rounded px-1.5 py-0.5 text-[12px] tabular-nums"
      style={style}
      // The ratio is the at-a-glance signal; the sentence is what a screen
      // reader and a hover both get, since "2/3" on its own says nothing.
      title={label}
    >
      <span aria-hidden="true">
        {filled}/{total}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
