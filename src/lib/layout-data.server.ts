import "server-only";

import { unstable_cache } from "next/cache";
import { getFooterConfig } from "@/lib/speu/footer-config.server";
import { getPublicSiteNav } from "@/lib/site-nav";
import { getVisiblePublicHrefs } from "@/lib/site-visibility";

export const getCachedVisiblePublicHrefs = unstable_cache(
  async () => Array.from(await getVisiblePublicHrefs()),
  ["layout-visible-hrefs"],
  { revalidate: 120 },
);

export const getCachedPublicSiteNav = unstable_cache(
  () => getPublicSiteNav(),
  ["layout-public-nav"],
  { revalidate: 120 },
);

export const getCachedFooterConfig = unstable_cache(
  () => getFooterConfig(),
  ["layout-footer-config"],
  { revalidate: 300 },
);
