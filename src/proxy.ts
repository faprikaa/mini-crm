import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/promo-ideas/:path*",
    "/ai-chat/:path*",
    "/login",
  ],
};
