const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function forceConfirmAllUsers() {
  console.log("=== CONFIRMANDO TODOS OS EMAILS PENDENTES ===\n");

  const { data: { users }, error } = await admin.auth.admin.listUsers();
  
  if (error) {
     console.error("Erro ao listar usuários:", error.message);
     return;
  }

  let count = 0;
  for (const user of users) {
    if (!user.email_confirmed_at) {
      console.log(`Confirmando email para: ${user.email}`);
      const { error: updErr } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
      if (updErr) {
        console.error(`  ✗ Erro ao confirmar ${user.email}:`, updErr.message);
      } else {
        console.log(`  ✓ Confirmado!`);
        count++;
      }
    }
  }

  console.log(`\nPronto! ${count} usuários foram confirmados.`);
}

forceConfirmAllUsers().catch(console.error);
