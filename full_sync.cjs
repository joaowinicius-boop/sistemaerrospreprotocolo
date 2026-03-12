const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ADMIN_EMAILS = ["joaowinicius@nicolasgomesadv.com.br", "joao.winicius@nicolasgomesadv.com.br"];

async function fullSync() {
  console.log("=== SINCRONIZAÇÃO COMPLETA ===\n");

  // Get all auth users
  const { data: { users: authUsers }, error: authErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) { console.error("Erro:", authErr); return; }

  // Get all profiles
  const { data: profiles } = await admin.from("profiles").select("*");
  const { data: roles } = await admin.from("user_roles").select("*");

  let created = 0, skipped = 0, errors = 0;

  for (const u of authUsers) {
    const hasProfile = (profiles || []).some(p => p.user_id === u.id);
    
    if (hasProfile) {
      // Make sure they're active
      await admin.from("profiles").update({ active: true }).eq("user_id", u.id);
      skipped++;
      console.log(`OK (ativado): ${u.email}`);
    } else {
      // Create profile
      const isAdmin = ADMIN_EMAILS.includes((u.email || "").toLowerCase());
      let displayNameStr = "Usuário";
      if (u.user_metadata && u.user_metadata.display_name) {
         displayNameStr = u.user_metadata.display_name;
      } else if (u.email) {
         displayNameStr = u.email.split("@")[0];
      }
      
      const { error: insertErr } = await admin.from("profiles").insert({
        user_id: u.id,
        email: u.email || "",
        display_name: Object.keys(displayNameStr).length > 0 ? displayNameStr : "UserFallback",
        active: true // All existing users get activated
      });
      
      if (insertErr) {
        console.error(`ERRO ao criar profile para ${u.email}: ${insertErr.message}`);
        errors++;
        continue;
      }

      // Create role
      const hasRole = (roles || []).some(r => r.user_id === u.id);
      if (!hasRole) {
        const role = isAdmin ? "admin" : "user";
        await admin.from("user_roles").insert({ user_id: u.id, role });
        console.log(`CRIADO [${role}]: ${u.email}`);
      } else {
        console.log(`CRIADO [role já existe]: ${u.email}`);
      }
      created++;
    }

    // Ensure admin role for admin emails
    if (ADMIN_EMAILS.includes((u.email || "").toLowerCase())) {
      const hasAdminRole = (roles || []).some(r => r.user_id === u.id && r.role === "admin");
      if (!hasAdminRole) {
        // Delete user role and add admin
        await admin.from("user_roles").delete().eq("user_id", u.id);
        await admin.from("user_roles").insert({ user_id: u.id, role: "admin" });
        console.log(`  → Role admin garantido!`);
      }
    }
  }

  // Final summary
  const { data: finalProfiles } = await admin.from("profiles").select("user_id, email, active");
  console.log(`\n=== RESUMO ===`);
  console.log(`Total auth users: ${authUsers.length}`);
  console.log(`Profiles criados: ${created}`);
  console.log(`Já existiam: ${skipped}`);
  console.log(`Erros: ${errors}`);
  console.log(`\n=== USUÁRIOS FINAIS ===`);
  (finalProfiles || []).forEach(p => console.log(`  ${p.active ? "✓" : "✗"} ${p.email}`));
}

fullSync().catch(console.error);
