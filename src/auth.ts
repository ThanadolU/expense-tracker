import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * JWT / session lifetime in seconds.
 * Override with AUTH_SESSION_MAX_AGE (seconds), e.g.:
 *   3600          = 1 hour
 *   86400         = 1 day
 *   604800        = 7 days
 *   2592000       = 30 days (Auth.js default)
 */
const SESSION_MAX_AGE_SECONDS = (() => {
  const fromEnv = Number(process.env.AUTH_SESSION_MAX_AGE);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.floor(fromEnv);
  }
  return 30 * 24 * 60 * 60; // 30 days
})();

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    // How long the session stays valid without signing in again
    maxAge: SESSION_MAX_AGE_SECONDS,
    // How often an active session is refreshed (rolling). Default 24h.
    // updateAge: 24 * 60 * 60,
  },
  jwt: {
    // Should match session.maxAge for JWT strategy
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.toLowerCase().trim()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return null;
        }

        const valid = await compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
