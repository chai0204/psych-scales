import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AccessToken {
  id: string;
  email: string;
  note: string | null;
  max_uses: number;
  use_count: number;
  expires_at: string;
  created_at: string;
  revoked: boolean;
  uses: Array<{ at: string; ip: string }>;
}
