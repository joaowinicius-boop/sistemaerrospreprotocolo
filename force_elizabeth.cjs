const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function forceCreateAccounts() {
  console.log("=== CRIANDO CONTAS IGNORANDO LIMITES ===\n");

  const accounts = [
    { email: "elizabeth@nicolasgomesadv.com.br", name: "Elizabeth Souza", pass: "Elizabeth@123" },
    { email: "souzaeliza57@gmail.com", name: "Elizabeth", pass: "Elizabeth@123" }
  ];

  for (const acc of accounts) {
    console.log(`Tentando criar: ${acc.email}`);
    
    // 1. Create User bypassing limits
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email: acc.email,
      password: acc.pass,
      email_confirm: true, // This bypasses the email limits and auto-confirms
      user_metadata: { display_name: acc.name }
    });

    if (createErr) {
      console.error(`  ✗ Erro ao criar: ${createErr.message}`);
      
      // If it says "already registered", let's update password
      if (createErr.message.includes("already registered")) {
        const { data: { users } } = await admin.auth.admin.listUsers();
        const found = users.find(u => u.email === acc.email);
        if (found) {
           await admin.auth.admin.updateUserById(found.id, { password: acc.pass, email_confirm: true });
           console.log(`  ✓ Conta já existia, senha atualizada para: ${acc.pass}`);
        }
      }
      continue;
    }

    console.log(`  ✓ Usuário criado! ID: ${newUser.user.id}`);

    // 2. Create Profile explicitly
    const { error: profErr } = await admin.from("profiles").upsert({
      user_id: newUser.user.id,
      email: acc.email,
      display_name: acc.name,
      active: true
    });
    
    if (profErr) {
       console.error(`  ✗ Erro ao criar perfil: ${profErr.message}`);
    } else {
       console.log(`  ✓ Perfil criado/ativado!`);
    }

    // 3. Create User Role explicitly
    await admin.from("user_roles").upsert({ user_id: newUser.user.id, role: "user" });
    console.log(`  ✓ Nível de acesso (user) configurado!`);
  }

  console.log("\nPronto! Você já pode logar com as credenciais mostradas.");
}

forceCreateAccounts().catch(console.error);
