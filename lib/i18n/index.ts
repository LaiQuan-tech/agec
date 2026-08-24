/**
 * Bilingual (zh-Hant / en) plumbing for the public site.
 *
 * Chinese lives at the root (`/about`) and English under a prefix (`/en/about`)
 * — the Chinese URLs predate the English version and are already indexed, so
 * moving them behind `/zh` would break every inbound link for no gain.
 *
 * Two rules hold everywhere:
 *
 *  1. **English never blocks a page.** Every English field in the database is
 *     nullable and starts empty. `pick()` falls back to the Chinese value, so
 *     `/en` is complete from day one and gets better as the office fills rows
 *     in. A missing translation is a mixed-language page, never a blank one.
 *  2. **The dictionary is exhaustive by construction.** `Dict` is keyed off the
 *     Chinese object, so adding a Chinese string without its English twin is a
 *     type error, not something that ships and gets noticed in production.
 */

export type Lang = "zh" | "en";

export const LANGS: readonly Lang[] = ["zh", "en"] as const;

/** The URL segment English pages sit under. Chinese has no prefix. */
export const EN_PREFIX = "/en";

export function isLang(value: string): value is Lang {
  return value === "zh" || value === "en";
}

/**
 * A pair of translations for one string. Written `{ zh, en }` at every call
 * site so a reviewer can see both languages on one line.
 */
export type Msg = { zh: string; en: string };

/**
 * What `translate()` accepts: a `Msg` leaf, a plain literal it passes through
 * untouched (hrefs, section numbers, image paths), or any nesting of the two.
 *
 * The `zh?: never` on the second arm is what makes `satisfies Dict` load-
 * bearing rather than decorative: without it a half-written leaf like
 * `{ zh: "…" }` type-checks as an ordinary nested object and survives all
 * the way to render time, where `translate()` hands React a plain object and
 * the page prints `[object Object]`. With it, a leaf missing its English twin
 * is a compile error.
 */
export type Dict = {
  [key: string]: Msg | string | Dict | readonly (Msg | Dict)[];
} & { zh?: never };

/**
 * Turns a `{ zh, en }`-valued tree into the flat shape a component reads.
 * Nested objects recurse; arrays of Msg become arrays of string.
 */
export type Translated<T> = T extends Msg
  ? string
  : T extends readonly (infer U)[]
    ? Translated<U>[]
    : T extends object
      ? { [K in keyof T]: Translated<T[K]> }
      : T;

/** Walks a `{ zh, en }` tree and collapses it to one language. */
export function translate<T>(node: T, lang: Lang): Translated<T> {
  if (Array.isArray(node)) {
    return node.map((item) => translate(item, lang)) as Translated<T>;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    // A Msg is the leaf: exactly the two language keys, both strings.
    if (typeof obj.zh === "string" && typeof obj.en === "string") {
      return obj[lang] as Translated<T>;
    }
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) out[key] = translate(obj[key], lang);
    return out as Translated<T>;
  }
  return node as Translated<T>;
}

/**
 * Resolves one localized database column.
 *
 * `en` is trimmed before the emptiness test because the admin textareas submit
 * `""` for an untouched field and Postgres stores that as-is: without the trim
 * a row someone opened and saved without typing would render as a blank cell
 * on /en instead of falling back.
 */
export function pick(
  zh: string | null | undefined,
  en: string | null | undefined,
  lang: Lang
): string {
  if (lang === "en") {
    const trimmed = en?.trim();
    if (trimmed) return trimmed;
  }
  return zh ?? "";
}

/** Same as `pick`, but preserves null for genuinely optional columns. */
export function pickNullable(
  zh: string | null | undefined,
  en: string | null | undefined,
  lang: Lang
): string | null {
  if (lang === "en") {
    const trimmed = en?.trim();
    if (trimmed) return trimmed;
  }
  return zh ?? null;
}

/**
 * Prefixes a site-root path for the given language.
 * `/about` → `/en/about`, `/` → `/en`. Chinese passes through untouched.
 */
export function localizePath(href: string, lang: Lang): string {
  if (lang === "zh") return href;
  if (href === "/") return EN_PREFIX;
  return `${EN_PREFIX}${href}`;
}

/**
 * Splits a pathname into its language and its language-neutral path — the
 * inverse of `localizePath`, used by the header to point the language toggle
 * at the current page's counterpart.
 *
 * `/en` alone maps back to `/`, and a path merely *starting* with the letters
 * "en" (`/english-summary`) is not a match: only a whole segment counts.
 */
export function splitLang(pathname: string): { lang: Lang; path: string } {
  if (pathname === EN_PREFIX) return { lang: "en", path: "/" };
  if (pathname.startsWith(`${EN_PREFIX}/`)) {
    return { lang: "en", path: pathname.slice(EN_PREFIX.length) };
  }
  return { lang: "zh", path: pathname };
}

/** The `lang` attribute value for a subtree. */
export function htmlLang(lang: Lang): string {
  return lang === "en" ? "en" : "zh-Hant";
}
