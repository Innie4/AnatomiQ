import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/manifest.json",
  "/sw.js",
  "/auth/social",
  "/admin",
  "/upload",
  "/api",
  "/api/auth",
  "/api/courses",
  "/api/health",
  "/api/topics",
  "/api/topic-question-types",
  "/_next",
  "/favicon.ico",
  "/anatomiQ.png",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth token on protected routes
  if (!publicRoutes.some((route) => pathname.startsWith(route))) {
    const token =
      request.cookies.get("anatomiq_auth_token")?.value ||
      request.cookies.get("anatomiq:auth-token")?.value;
    const hasToken =
      token ||
      request.headers.get("authorization") ||
      request.headers.get("x-admin-upload-key");

    // Redirect to signin if not authenticated
    if (!hasToken) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

// Default export for compatibility
export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
