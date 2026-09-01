import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || process.env.NEXT_PUBLIC_DEMO_MODE === "true") return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const authPath = pathname === "/login" || pathname === "/recuperar" || pathname === "/restablecer" || pathname.startsWith("/auth/callback");

  if (!user && pathname.startsWith("/api/")) return response;
  if (!user && !authPath) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/login";
    destination.searchParams.set("siguiente", pathname);
    return NextResponse.redirect(destination);
  }
  if (user && pathname === "/login") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/";
    destination.search = "";
    return NextResponse.redirect(destination);
  }
  return response;
}
