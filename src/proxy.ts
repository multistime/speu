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
      const { data: profile } = await supabase
        .schema("speu")
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      skipRedirect = Boolean(profile?.is_admin);
    }
    if (!skipRedirect) {
      const { data: page } = await supabase
        .schema("speu")
        .from("content_pages")
        .select("id")
        .eq("slug", routeSlug)
        .eq("status", "published")
        .maybeSingle();
      if (!page) {
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
