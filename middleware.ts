import { NextRequest, NextResponse } from "next/server";

// This is an early navigation hint only. Signed-session role checks in the
// admin layout, data-pulls page and each server action enforce authorization.
export function middleware(request: NextRequest) {
  if (!request.cookies.get("user_session")?.value) {
    const loginUrl = new URL("/admin-login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

// API handlers authenticate signed sessions or explicitly configured Basic
// credentials themselves, so a browser login also works for downloads.
export const config = { matcher: ["/admin/:path*", "/data-pulls/:path*"] };
