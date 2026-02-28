import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const locales = ['ar', 'en'];
const defaultLocale = 'ar';

// Protected routes that require authentication
const protectedRoutes = ['/booking', '/profile', '/properties/new'];
// Admin-only routes
const adminRoutes = ['/admin'];
// Auth routes (redirect if already logged in)
const authRoutes = ['/auth/login', '/auth/register'];

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

// Edge-compatible JWT verification using jose
async function verifyTokenEdge(token: string) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload as { userId: number; email: string; role: string };
  } catch {
    return null;
  }
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/uploads/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract locale from pathname
  const pathnameLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  const locale = pathnameLocale || defaultLocale;

  // Get path without locale prefix
  const pathWithoutLocale = pathnameLocale
    ? pathname.slice(`/${locale}`.length) || '/'
    : pathname;

  // Get auth token from cookie
  const token = req.cookies.get('auth_token')?.value;
  let user = null;

  if (token) {
    user = await verifyTokenEdge(token);
  }

  // Check if route requires admin access
  const isAdminRoute = adminRoutes.some((route) =>
    pathWithoutLocale.startsWith(route)
  );

  if (isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/${locale}/auth/login?redirect=${pathname}`, req.url)
      );
    }
    if (user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathWithoutLocale.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/login?redirect=${pathname}`, req.url)
    );
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = authRoutes.some((route) =>
    pathWithoutLocale.startsWith(route)
  );

  if (isAuthRoute && user) {
    if (user.role === 'ADMIN') {
      return NextResponse.redirect(new URL(`/${locale}/admin`, req.url));
    }
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  // Apply i18n middleware
  const response = intlMiddleware(req);

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except static files
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|uploads).*)',
  ],
};
