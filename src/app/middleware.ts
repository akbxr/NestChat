import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Halaman yang tidak memerlukan autentikasi
const publicRoutes = ["/", "/signin", "/signup", "/reset-password"];

export function middleware(request: NextRequest) {
  const token = localStorage.get("token")?.value;
  const { pathname } = request.nextUrl;

  // // Jika mengakses halaman public dan sudah login, redirect ke /chat
  // if (token && publicRoutes.includes(pathname)) {
  //   return NextResponse.redirect(new URL("/chat", request.url));
  // }

  // Jika mengakses halaman private dan belum login, redirect ke /login
  if (!token && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

// Konfigurasi path yang akan dihandle middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
