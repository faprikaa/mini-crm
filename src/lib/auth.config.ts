import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Edge-safe auth config — NO Prisma, NO Node.js-only modules.
 * Used by proxy.ts (Edge Runtime) for session/route checks.
 * The actual credential verification (authorize) lives in auth.ts.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // authorize is intentionally omitted here.
      // The full authorize with Prisma + bcryptjs is in auth.ts.
      // This config is only used by the proxy for session checking.
    }),
  ],
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPrefixes = [
        "/dashboard",
        "/customers",
        "/promo-ideas",
        "/ai-chat",
        "/users",
        "/tags",
        "/products",
        "/sales",
        "/charts",
      ];
      const isProtected = protectedPrefixes.some((prefix) =>
        nextUrl.pathname.startsWith(prefix)
      );
      const isOnLogin = nextUrl.pathname === "/login";

      if (isProtected && !isLoggedIn) {
        return false;
      }

      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/customers", nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
