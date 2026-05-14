import type { Metadata } from "next";
import { ClassicSpeuLanding } from "@/components/ClassicSpeuLanding";
import { CLASSIC_SITE_LANDING_PAGE_SLUG } from "@/lib/site-home";

export const metadata: Metadata = {
  title: "Галоўная",
  description:
    "Спеў — беларускі музычны лейбл: добрая музыка на беларускай мове, генератар тэкстаў і Радыё Мара.",
};

export default async function ClassicHomeRoutePage() {
  return <ClassicSpeuLanding contentSlug={CLASSIC_SITE_LANDING_PAGE_SLUG} />;
}
