import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { pathnameToSiteRouteSlug } from "@/lib/site-route-slugs";

const NEWSLETTER_FOLLOW_PATH = "/api/public/newsletter-follow";

const newsletterFollowCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

export default async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === NEWSLETTER_FOLLOW_PATH &&
    request.method === "OPTIONS"
  ) {
    return new NextResponse(null, {
      status: 204,
      headers: newsletterFollowCorsHeaders,
    });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session so it doesn't expire. Do NOT remove this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const routeSlug = pathnameToSiteRouteSlug(pathname);
  if (routeSlug && !pathname.startsWith("/admin")) {
    let skipRedirect = false;
    if (user) {
      const { data: profRows } = await supabase.rpc("get_my_speu_profile");
      const prof = Array.isArray(profRows) ? profRows[0] : profRows;
      const showAll =
        prof &&
        typeof prof === "object" &&
        "admin_show_all_pages" in prof &&
        (prof as { admin_show_all_pages?: boolean }).admin_show_all_pages === true;
      skipRedirect = Boolean(
        prof && typeof prof === "object" && "is_admin" in prof && prof.is_admin && showAll
      );
    }
    if (!skipRedirect) {
      const { data: page } = await supabase
        .schema("speu")
        .from("content_pages")
        .select("id, slug, visible_on_site, is_home")
        .eq("slug", routeSlug)
        .eq("status", "published")
        .maybeSingle();
      const hidden =
        page &&
        !page.is_home &&
        page.visible_on_site === false;
      if (!page || hidden) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  if (request.nextUrl.pathname === NEWSLETTER_FOLLOW_PATH) {
    for (const [key, value] of Object.entries(newsletterFollowCorsHeaders)) {
      supabaseResponse.headers.set(key, value);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
