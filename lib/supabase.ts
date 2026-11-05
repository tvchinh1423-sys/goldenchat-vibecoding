import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase environment is not configured");
  client = createClient(url, key);
  return client;
}

// Preserve the shared API while allowing the Inbox demo to build without keys.
// Configuration errors are raised inside route handlers' existing try/catch.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const instance = getSupabase();
    const value = Reflect.get(instance, property);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
