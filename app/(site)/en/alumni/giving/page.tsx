import type { Metadata } from "next";
import { GivingRoute } from "@/components/site/pages";
import { GIVING } from "@/lib/i18n/giving";
import { listingMetadata } from "@/lib/site-routes";

export const revalidate = 300;

export const metadata: Metadata = listingMetadata(
  "/alumni/giving",
  "en",
  GIVING.title.en
);

/** 匯款帳號資訊 (/alumni/giving) —— 英文版，路徑加 /en 前綴 */
export default function Page() {
  return <GivingRoute lang="en" />;
}
