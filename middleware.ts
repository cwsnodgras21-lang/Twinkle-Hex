import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/supabase/middleware";
import { isAdminRoute, isUserAdmin } from "@/lib/auth/admin-check";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  if (isAdminRoute(request.nextUrl.pathname) && !isUserAdmin(user)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
