import { type NextRequest } from "next/server";
import { updateSession } from "@/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Refresh Supabase auth session
  const response = await updateSession(request);

  // Future: Add route protection for /admin, /account
  // Future: Redirect unauthenticated users from protected routes

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
