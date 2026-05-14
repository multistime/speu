import { redirect } from "next/navigation";
import { ClassicSpeuLanding } from "@/components/ClassicSpeuLanding";
import { getHomePageSlug } from "@/lib/site-home";
import { SPEU_HUB_SLUG, homeSlugToPublicHref } from "@/lib/site-route-slugs";

export default async function HomePage() {
  const homeSlug = await getHomePageSlug();
  if (homeSlug === SPEU_HUB_SLUG) {
    redirect(homeSlugToPublicHref(SPEU_HUB_SLUG));
  }

  return <ClassicSpeuLanding contentSlug={homeSlug} />;
}
