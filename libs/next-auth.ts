import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { SupabaseAdapter } from "./supabase-adapter";
import supabase from "./supabase";
import config from "@/config";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || (() => { throw new Error("NEXTAUTH_SECRET is not defined"); })(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || (() => { throw new Error("GOOGLE_ID is not defined"); })(),
      clientSecret: process.env.GOOGLE_SECRET || (() => { throw new Error("GOOGLE_SECRET is not defined"); })(),
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.given_name ? profile.given_name : profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: config.mailgun.fromNoReply,
    }),
  ],
  adapter: SupabaseAdapter(),
  callbacks: {
    session: async ({ session, token }: { session: any; token: any }) => {
      if (session?.user) {
        if (UUID_RE.test(token.sub ?? "")) {
          // Normal post-migration login — token already has a Supabase UUID
          session.user.id = token.sub;
        } else if (token.email) {
          // Legacy JWT with old MongoDB ObjectId — resolve to Supabase UUID by email
          const { data } = await supabase
            .from("users")
            .select("id")
            .eq("email", token.email)
            .single();
          session.user.id = data?.id ?? token.sub;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  theme: {
    brandColor: config.colors.main,
    logo: `/TRANSPARENT_LOGO.png`,
  },
};

export default NextAuth(authOptions);
