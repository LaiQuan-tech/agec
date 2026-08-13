import type { LinkItem } from "@/lib/data";

/**
 * The sections a link card may be assigned to.
 *
 * A closed <select> rather than the free-text <datalist> the news categories
 * use: LinkItem["section"] is a TypeScript union and only /students and
 * /alumni read the table, so a section typed by hand would be a row no page
 * can ever render.
 *
 * Lives outside actions.ts because a `"use server"` file may only export async
 * functions; exporting these from there is a build error.
 */
export const LINK_SECTIONS = ["students", "alumni"] as const;

export type EditableSection = (typeof LINK_SECTIONS)[number];

/**
 * 'journal' is retired — 農經期刊 became 學生專區 in the 2026 IA revision and no
 * route reads those rows any more. They still exist in the table, so the admin
 * has to be able to show and delete them even though they can't be created.
 */
const SECTION_LABELS: Record<LinkItem["section"], string> = {
  students: "學生專區",
  alumni: "系友專區",
  journal: "農經期刊（未使用）",
};

export function isEditableSection(value: string): value is EditableSection {
  return (LINK_SECTIONS as readonly string[]).includes(value);
}

/** Falls back to marking anything unrecognised as unused, same as 'journal'. */
export function sectionLabel(section: string): string {
  return SECTION_LABELS[section as LinkItem["section"]] ?? `${section}（未使用）`;
}

const SECTION_PATHS: Record<EditableSection, string> = {
  students: "/students",
  alumni: "/alumni",
};

/** The public route a section's cards appear on; null for retired sections. */
export function sectionPath(section: string): string | null {
  return isEditableSection(section) ? SECTION_PATHS[section] : null;
}
