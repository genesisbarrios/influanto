import type { Adapter, AdapterAccount } from "next-auth/adapters";
import supabase from "./supabase";

function mapAdapterUser(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image,
    emailVerified: row.email_verified ? new Date(row.email_verified) : null,
  };
}

export function SupabaseAdapter(): Adapter {
  return {
    async createUser(user) {
      const { data, error } = await supabase
        .from("users")
        .insert({
          name: user.name,
          email: user.email,
          image: user.image,
          email_verified: user.emailVerified?.toISOString() ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return mapAdapterUser(data);
    },

    async getUser(id) {
      const { data } = await supabase.from("users").select().eq("id", id).single();
      return data ? mapAdapterUser(data) : null;
    },

    async getUserByEmail(email) {
      const { data } = await supabase.from("users").select().eq("email", email).single();
      return data ? mapAdapterUser(data) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const { data } = await supabase
        .from("accounts")
        .select("user_id, users(*)")
        .eq("provider", provider)
        .eq("provider_account_id", providerAccountId)
        .single();
      return data?.users ? mapAdapterUser(data.users) : null;
    },

    async updateUser(user) {
      const { data, error } = await supabase
        .from("users")
        .update({
          name: user.name,
          email: user.email,
          image: user.image,
          email_verified: user.emailVerified?.toISOString() ?? null,
        })
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      return mapAdapterUser(data);
    },

    async deleteUser(userId) {
      await supabase.from("users").delete().eq("id", userId);
    },

    async linkAccount(account: AdapterAccount) {
      const { error } = await supabase.from("accounts").insert({
        user_id: account.userId,
        type: account.type,
        provider: account.provider,
        provider_account_id: account.providerAccountId,
        refresh_token: account.refresh_token ?? null,
        access_token: account.access_token ?? null,
        expires_at: account.expires_at ?? null,
        token_type: account.token_type ?? null,
        scope: account.scope ?? null,
        id_token: account.id_token ?? null,
        session_state: account.session_state ?? null,
      });
      if (error) throw error;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await supabase
        .from("accounts")
        .delete()
        .eq("provider", provider)
        .eq("provider_account_id", providerAccountId);
    },

    async createSession({ sessionToken, userId, expires }) {
      const { data, error } = await supabase
        .from("sessions")
        .insert({ session_token: sessionToken, user_id: userId, expires: expires.toISOString() })
        .select()
        .single();
      if (error) throw error;
      return { sessionToken: data.session_token, userId: data.user_id, expires: new Date(data.expires) };
    },

    async getSessionAndUser(sessionToken) {
      const { data } = await supabase
        .from("sessions")
        .select("*, users(*)")
        .eq("session_token", sessionToken)
        .single();
      if (!data) return null;
      return {
        session: {
          sessionToken: data.session_token,
          userId: data.user_id,
          expires: new Date(data.expires),
        },
        user: mapAdapterUser(data.users),
      };
    },

    async updateSession({ sessionToken, expires, userId }) {
      const { data, error } = await supabase
        .from("sessions")
        .update({ expires: expires?.toISOString(), user_id: userId })
        .eq("session_token", sessionToken)
        .select()
        .single();
      if (error) throw error;
      return { sessionToken: data.session_token, userId: data.user_id, expires: new Date(data.expires) };
    },

    async deleteSession(sessionToken) {
      await supabase.from("sessions").delete().eq("session_token", sessionToken);
    },

    async createVerificationToken({ identifier, token, expires }) {
      const { error } = await supabase
        .from("verification_tokens")
        .insert({ identifier, token, expires: expires.toISOString() });
      if (error) throw error;
      return { identifier, token, expires };
    },

    async useVerificationToken({ identifier, token }) {
      const { data } = await supabase
        .from("verification_tokens")
        .delete()
        .eq("identifier", identifier)
        .eq("token", token)
        .select()
        .single();
      return data
        ? { identifier: data.identifier, token: data.token, expires: new Date(data.expires) }
        : null;
    },
  };
}
