import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";

import { db } from "@/lib/db";
import { generateUniqueReferralCode } from "@/lib/referral";

type SocialProvider = "google" | "facebook";

function getProviderIdentity(provider: SocialProvider, providerAccountId: string) {
  return provider === "google"
    ? { googleId: providerAccountId, facebookId: undefined }
    : { googleId: undefined, facebookId: providerAccountId };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || !account?.providerAccountId) {
        return false;
      }

      const provider = account.provider as SocialProvider;
      if (provider !== "google" && provider !== "facebook") {
        return false;
      }

      const providerIdentity = getProviderIdentity(provider, account.providerAccountId);
      const existingUser = await db.facultyUser.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        const fullName = user.name?.trim() || user.email.split("@")[0] || "AnatomiQ User";
        const referralCode = await generateUniqueReferralCode(fullName);

        const createdUser = await db.facultyUser.create({
          data: {
            email: user.email,
            fullName,
            department: "Human Anatomy",
            faculty: null,
            isActive: true,
            isGuest: false,
            emailVerified: true,
            avatarUrl: user.image || null,
            requiresProfileCompletion: true,
            referralCode,
            ...providerIdentity,
          },
        });

        user.id = createdUser.id;
        (user as typeof user & { requiresProfileCompletion: boolean }).requiresProfileCompletion = true;
        return true;
      }

      const updatedUser = await db.facultyUser.update({
        where: { id: existingUser.id },
        data: {
          fullName: user.name?.trim() || existingUser.fullName,
          avatarUrl: user.image || existingUser.avatarUrl,
          emailVerified: true,
          isActive: true,
          ...providerIdentity,
        },
      });

      user.id = updatedUser.id;
      (user as typeof user & { requiresProfileCompletion: boolean }).requiresProfileCompletion =
        updatedUser.requiresProfileCompletion;

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await db.facultyUser.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            fullName: true,
            department: true,
            faculty: true,
            avatarUrl: true,
            requiresProfileCompletion: true,
          },
        });

        if (dbUser) {
          token.appUserId = dbUser.id;
          token.fullName = dbUser.fullName;
          token.department = dbUser.department;
          token.faculty = dbUser.faculty ?? undefined;
          token.picture = dbUser.avatarUrl || token.picture;
          token.requiresProfileCompletion = dbUser.requiresProfileCompletion;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.appUserId === "string" ? token.appUserId : "";
        session.user.name = typeof token.fullName === "string" ? token.fullName : session.user.name;
        session.user.email = typeof token.email === "string" ? token.email : session.user.email;
        session.user.image =
          typeof token.picture === "string" ? token.picture : session.user.image;
        session.user.department =
          typeof token.department === "string" ? token.department : undefined;
        session.user.faculty = typeof token.faculty === "string" ? token.faculty : undefined;
        session.user.requiresProfileCompletion = Boolean(token.requiresProfileCompletion);
      }

      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
});
