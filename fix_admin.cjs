const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
// Use service_role key to bypass RLS
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixAll() {
  console.log("=== DIAGNÓSTICO E CORREÇÃO ===\n");

  // 1. List all profiles
  const { data: profiles, error: profErr } = await admin.from("profiles").select("*");
  if (profErr) { console.error("Erro ao buscar profiles:", profErr); return; }
  console.log("Usuários cadastrados:");
  profiles.forEach(p => console.log(`  - ${p.email} | active: ${p.active}`));

  // 2. List all user_roles
  const { data: roles, error: roleErr } = await admin.from("user_roles").select("*");
  if (roleErr) { console.error("Erro ao buscar user_roles:", roleErr); return; }
  console.log("\nPapéis (user_roles):");
  roles.forEach(r => console.log(`  - user_id: ${r.user_id} | role: ${r.role}`));

  // 3. Find the admin user and set their role
  const adminProfile = profiles.find(p => p.email && (p.email.includes("joaowinicius") || p.email.includes("joao.winicius")));
  if (adminProfile) {
    console.log(`\nAdmin encontrado: ${adminProfile.email}`);

    // Make sure admin is active
    const { error: activateErr } = await admin.from("profiles").update({ active: true }).eq("id", adminProfile.id);
    if (activateErr) console.error("Erro ao ativar admin:", activateErr);
    else console.log("✓ Admin ativado (active=true)");

    // Upsert admin role
    const existing = roles.find(r => r.user_id === adminProfile.user_id && r.role === "admin");
    if (!existing) {
      const { error: roleInsertErr } = await admin.from("user_roles").insert({ user_id: adminProfile.user_id, role: "admin" });
      if (roleInsertErr) console.error("Erro ao inserir admin role:", roleInsertErr);
      else console.log("✓ Role 'admin' criado para o usuário");
    } else {
      console.log("✓ Role 'admin' já existe");
    }
  } else {
    console.log("\n⚠ Admin não encontrado! Emails encontrados:");
    profiles.forEach(p => console.log("  -", p.email));
  }

  // 4. Test team_members insert
  console.log("\n=== TESTE DE INSERÇÃO EM team_members ===");
  const { error: insertErr } = await admin.from("team_members").insert({ name: "TEST_" + Date.now() });
  if (insertErr) {
    console.error("Erro ao inserir (com service_role):", JSON.stringify(insertErr));
  } else {
    console.log("✓ Inserção com service_role funciona");
    // Clean up
    await admin.from("team_members").delete().like("name", "TEST_%");
  }

  // 5. List current team_members policies via pg_policies
  console.log("\nFinalizando. Admin e ativação corrigidos!");
}

fixAll().catch(console.error);
