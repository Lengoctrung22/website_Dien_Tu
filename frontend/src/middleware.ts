import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Subdomain Routing Middleware for TechGear
 * Automatically rewrites root URLs based on the incoming subdomain (Host header).
 * - admin.techgear.* -> /admin
 * - orders.techgear.* -> /admin/orders
 * - warehouse.techgear.* -> /admin/inventory
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Skip static assets, Next.js internals, and public files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. Admin Subdomain (e.g. admin.techgear.vn, admin.techgear.local, admin.localhost:3000)
  if (hostname.startsWith('admin.')) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // 2. Orders Staff Subdomain (e.g. orders.techgear.vn, orders.techgear.local)
  if (hostname.startsWith('orders.')) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin/orders', request.url));
    }
    return NextResponse.next();
  }

  // 3. Warehouse Staff Subdomain (e.g. warehouse.techgear.vn, warehouse.techgear.local)
  if (hostname.startsWith('warehouse.')) {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin/inventory', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
