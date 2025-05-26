import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Protected routes that require authentication
    const protectedRoutes = [
      "/",
      "/debts",
      "/transactions",
      "/budget",
      "/profile",
    ];
    const isProtectedRoute = protectedRoutes.some((route) =>
      req.nextUrl.pathname.startsWith(route)
    );

    // Auth routes that should redirect if user is already authenticated
    const authRoutes = ["/auth/login", "/auth/signup", "/auth/forgot-password"];
    const isAuthRoute = authRoutes.some((route) =>
      req.nextUrl.pathname.startsWith(route)
    );

    // Allow reset password page even if not authenticated
    const isResetPasswordRoute = req.nextUrl.pathname.startsWith(
      "/auth/reset-password"
    );

    // If user is not authenticated and trying to access protected route
    if (!user && !error && isProtectedRoute) {
      const redirectUrl = new URL("/auth/login", req.url);
      redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If user is authenticated and trying to access auth routes (except reset password)
    if (user && isAuthRoute && !isResetPasswordRoute) {
      // Check if there's a redirectTo parameter
      const redirectTo = req.nextUrl.searchParams.get("redirectTo");
      const redirectUrl = new URL(
        redirectTo && redirectTo.startsWith("/") ? redirectTo : "/",
        req.url
      );
      return NextResponse.redirect(redirectUrl);
    }
  } catch (error) {
    console.error("Middleware auth error:", error);
    // If there's an error getting user and trying to access protected route, redirect to login
    const protectedRoutes = [
      "/",
      "/debts",
      "/transactions",
      "/budget",
      "/profile",
    ];
    const isProtectedRoute = protectedRoutes.some((route) =>
      req.nextUrl.pathname.startsWith(route)
    );

    if (isProtectedRoute) {
      const redirectUrl = new URL("/auth/login", req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
