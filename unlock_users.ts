import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function unlockAllUsers() {
  console.log("Unlocking all users...");
  const { data, error } = await supabase.from("profiles").update({ active: true }).neq("active", null); // Updates all matching rows
  
  // Since we might not be able to update all without an equality, let's just use raw SQL via RPC or fetch all and update.
  const { data: users, error: selectErr } = await supabase.from("profiles").select("id, user_id, email");
  if (users) {
      for (const u of users) {
          await supabase.from("profiles").update({ active: true }).eq("id", u.id);
          console.log(`Unlocked: ${u.email}`);
          
          // Also violently ensure the admin role for joaowinicius
          if (u.email && u.email.includes("joaowinicius")) {
              await supabase.from("user_roles").upsert({ user_id: u.user_id, role: 'admin' }, { onConflict: "user_id,role" });
              console.log("Set admin role for " + u.email);
          }
      }
  }

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Unlock done.");
  }
}

unlockAllUsers();
