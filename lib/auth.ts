import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const ADMIN_EMAILS = (process.env.AUTH_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        const email = token.email as string | undefined;
        const name = (token.name as string) ?? "";
        if (email) {
          const defaultRole = ADMIN_EMAILS.includes(email.toLowerCase()) ? "Admin" : "Viewer";
          try {
            const existing = await db
              .select()
              .from(users)
              .where(eq(users.email, email))
              .limit(1);
            if (existing.length > 0) {
              token.role = existing[0].role;
              if (existing[0].name !== name) {
                await db
                  .update(users)
                  .set({ name, updatedAt: new Date() })
                  .where(eq(users.email, email));
              }
            } else {
              await db.insert(users).values({ email, name, role: defaultRole });
              token.role = defaultRole;
            }
          } catch {
            token.role = defaultRole;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.user.role = (token.role as string) ?? "Viewer";
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
