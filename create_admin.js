import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  try {
    const email = "joaowinicius@nicolasgomesadv.com.br";
    const password = "Mandioca18*";
    
    console.log("Checking if user exists via sign in or signup...");
    
    // Attempt to create user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    let userId;
    
    if (createError) {
      if (createError.message.includes("already registered")) {
        console.log("User already exists. Skipping create...");
        // try to sign in to get the id (since admin.listUsers seems to bug out)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        userId = signInData.user.id;
      } else {
        throw createError;
      }
    } else {
      userId = newUser.user.id;
    }

    console.log("User ID resolved:", userId);

    console.log("Upserting profile...");
    await supabase.from("profiles").upsert({
       user_id: userId,
       email: email,
       display_name: "João Winicius (Admin)",
    });

    console.log("Inserting admin role...");
    // Just try inserting, ignore conflict if already admin
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: "admin"
    });
    
    if (roleError && !roleError.message.includes("duplicate key")) {
      console.error("Non-fatal role error:", roleError.message);
    }

    console.log("All done!");
    process.exit(0);
  } catch(e) {
    console.error("Script failed:", e.message);
    process.exit(1);
  }
}

main();
