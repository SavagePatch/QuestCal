import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

// Create a Proxy that maps prisma.session -> prisma.authSession
// so the Prisma adapter works with our renamed model.
const prismaWithSessionMapping = new Proxy(prisma, {
  get(target, prop) {
    if (prop === "session") {
      return target.authSession;
    }
    return (target as unknown as Record<string | symbol, unknown>)[prop];
  },
});

const providers = [];

// Only add Google provider if credentials are configured
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

providers.push(
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      try {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          console.log("[auth] No user found for email:", email);
          return null;
        }

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) {
          console.log("[auth] Invalid password for:", email);
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isGM: user.isGM,
          timezone: user.timezone,
        };
      } catch (error) {
        console.error("[auth] Authorize error:", error);
        return null;
      }
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prismaWithSessionMapping as typeof prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, user object is available
      if (user) {
        token.id = user.id;
        token.isGM = user.isGM ?? false;
        token.timezone = user.timezone ?? "America/New_York";
      }

      // Support session updates (e.g., after timezone setup)
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.timezone !== undefined) token.timezone = session.timezone;
        if (session.isGM !== undefined) token.isGM = session.isGM;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Prefer token.sub (standard JWT claim, always preserved) over custom token.id
        session.user.id = (token.sub ?? token.id) as string;
        session.user.isGM = (token.isGM as boolean) ?? false;
        session.user.timezone = (token.timezone as string) ?? "America/New_York";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // GM bootstrap for OAuth users: first user or GM_EMAIL match
      const gmEmail = process.env.GM_EMAIL;
      const userCount = await prisma.user.count();
      if (userCount === 1 || (gmEmail && user.email === gmEmail)) {
        await prisma.user.update({
          where: { id: user.id! },
          data: { isGM: true },
        });
      }
    },
  },
});
