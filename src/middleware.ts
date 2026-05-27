import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page through
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Check for session cookie
  const supabaseToken = request.cookies.get("sb-zpftaztdtlgkvaiuenqe-auth-token");
  
  if (!supabaseToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
