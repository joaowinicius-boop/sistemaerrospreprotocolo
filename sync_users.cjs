const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function sync() {
  console.log("=== SINCRONIZANDO AUTH USERS ↔ PROFILES ===\n");

  // 1. List all auth users via admin API
  const { data: { users: authUsers }, error: authErr } = await admin.auth.admin.listUsers();
  if (authErr) { console.error("Erro ao listar auth users:", authErr); return; }
  console.log(`Auth users (${authUsers.length}):`);
  authUsers.forEach(u => console.log(`  - ${u.email} [id: ${u.id}]`));

  // 2. List all profiles
  const { data: profiles, error: profErr } = await admin.from("profiles").select("*");
  if (profErr) { console.error("Erro ao buscar profiles:", profErr); return; }
  console.log(`\nProfiles (${profiles.length}):`);
  profiles.forEach(p => console.log(`  - ${p.email} [user_id: ${p.user_id}] active: ${p.active}`));

  // 3. Find auth users that have NO profile and create one
  console.log("\n=== CRIANDO PROFILES AUSENTES ===");
  for (const u of authUsers) {
    const hasProfile = profiles.some(p => p.user_id === u.id);
    if (!hasProfile) {
      console.log(`  → Criando profile para: ${u.email}`);
      const { error: insertErr } = await admin.from("profiles").insert({
        user_id: u.id,
        email: u.email,
        display_name: u.user_metadata?.display_name || (u.email || "").split("@")[0],
        active: true // Activate all since admin needs to manage
      });
      if (insertErr) {
        console.error(`    Erro ao criar profile: ${insertErr.message}`);
      } else {
        // Also add user role
        await admin.from("user_roles").insert({ user_id: u.id, role: "user" });
        console.log(`    ✓ Profile e role criados`);
      }
    }
  }

  // 4. Activate ALL existing profiles
  console.log("\n=== ATIVANDO TODOS OS PROFILES ===");
  const { error: updateErr } = await admin
    .from("profiles")
    .update({ active: true })
    .neq("active", true);
  if (updateErr) {
    // Try one by one
    for (const p of profiles) {
      if (!p.active) {
        const { error: e } = await admin.from("profiles").update({ active: true }).eq("id", p.id);
        if (!e) console.log(`  ✓ Ativado: ${p.email}`);
        else console.error(`  Erro ao ativar ${p.email}: ${e.message}`);
      }
    }
  } else {
    console.log("  ✓ Todos profiles ativados.");
  }

  // 5. List all profiles after fix
  const { data: profilesAfter } = await admin.from("profiles").select("user_id, email, active");
  console.log("\n=== ESTADO FINAL ===");
  profilesAfter.forEach(p => console.log(`  - ${p.email} | active: ${p.active}`));
}

sync().catch(console.error);
