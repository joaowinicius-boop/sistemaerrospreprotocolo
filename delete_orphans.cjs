const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function deleteOrphans() {
  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 100 });
  if (error) { console.error("Error:", error); return; }
  
  const { data: profiles } = await admin.from("profiles").select("user_id, email");
  
  // Find orphaned auth users (in auth but no profile)
  const orphans = users.filter(u => !profiles.some(p => p.user_id === u.id));
  
  if (orphans.length === 0) {
    console.log("Nenhum usuário órfão encontrado.");
    return;
  }
  
  console.log(`Encontrados ${orphans.length} usuário(s) órfão(s):`);
  
  for (const orphan of orphans) {
    console.log(`  Deletando: ${orphan.email} [${orphan.id}]`);
    const { error: delErr } = await admin.auth.admin.deleteUser(orphan.id);
    if (delErr) {
      console.error(`  ✗ Erro ao deletar: ${delErr.message}`);
    } else {
      console.log(`  ✓ Deletado com sucesso! Email '${orphan.email}' está livre para registro.`);
    }
  }
  
  console.log("\nPronto!");
}

deleteOrphans().catch(console.error);
