const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function listAndFix() {
  // List ALL auth users
  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 100 });
  if (error) { console.error("Error listing users:", error); return; }
  
  console.log("\n=== ALL AUTH USERS ===");
  users.forEach((u, i) => {
    console.log(`[${i}] id=${u.id}`);
    console.log(`    email=${u.email}`);
    console.log(`    created_at=${u.created_at}`);
    console.log(`    email_confirmed_at=${u.email_confirmed_at}`);
    console.log("");
  });
  
  // List profiles
  const { data: profiles } = await admin.from("profiles").select("user_id, email, active");
  console.log("\n=== ALL PROFILES ===");
  profiles.forEach(p => console.log(`  - ${p.email} | active: ${p.active} | user_id: ${p.user_id}`));
  
  // Find orphaned auth users (no profile)
  console.log("\n=== ORPHANED AUTH USERS (no profile) ===");
  const orphans = users.filter(u => !profiles.some(p => p.user_id === u.id));
  if (orphans.length === 0) {
    console.log("  None found.");
  } else {
    orphans.forEach(u => console.log(`  ORPHAN: ${u.email} [${u.id}]`));
  }
}

listAndFix().catch(console.error);
