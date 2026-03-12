import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  const { data, error } = await supabase.rpc("execute_sql", { sql: "SELECT * FROM pg_policies WHERE tablename = 'team_members';" });
  if (error) {
    console.error("RPC Error:", error.message);
    // Let's try inserting via API to see the error
    const { data: d2, error: e2 } = await supabase.from("team_members").insert({ name: "TEST_MEMBER" }).select();
    console.log("Insert Test Error:", e2);
  } else {
    console.log(data);
  }
}

checkPolicies();
