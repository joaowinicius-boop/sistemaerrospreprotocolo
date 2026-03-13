const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function check() {
  const { data: { users } } = await admin.auth.admin.listUsers();
  const jose = users.find(u => u.email === "jose.henrique9843@gmail.com");
  
  if (!jose) {
    console.log("Jose NOT found in auth.users");
    return;
  }
  
  console.log("Jose found! ID:", jose.id, "Email confirmed?", !!jose.email_confirmed_at);
  
  const { data: prof } = await admin.from("profiles").select("*").eq("user_id", jose.id).single();
  console.log("Jose profile:", prof ? JSON.stringify(prof) : "NOT FOUND - no profile record!");
  
  // If missing, create it
  if (!prof) {
    console.log("\nCreating profile for Jose with active=false...");
    const { error: e1 } = await admin.from("profiles").insert({
      user_id: jose.id,
      email: jose.email,
      display_name: "Jose Henrique",
      active: false
    });
    const { error: e2 } = await admin.from("user_roles").insert({
      user_id: jose.id,
      role: "user"
    });
    console.log("Profile insert:", e1 ? e1.message : "OK");
    console.log("Role insert:", e2 ? e2.message : "OK");
  } else if (prof.active) {
    console.log("\nJose's profile has active=true! Setting to false...");
    const { error } = await admin.from("profiles").update({ active: false }).eq("user_id", jose.id);
    console.log("Update:", error ? error.message : "OK - Jose must now be re-approved");
  }
}

check().catch(console.error);
