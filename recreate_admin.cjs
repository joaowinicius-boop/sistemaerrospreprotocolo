const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ADMIN_EMAIL = "joaowinicius@nicolasgomesadv.com.br";
const TEMP_PASSWORD = "Admin@2024!"; // Temporary password

async function recreateAdmin() {
  console.log(`Recriando conta admin: ${ADMIN_EMAIL}`);

  // 1. Create the auth user 
  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: TEMP_PASSWORD,
    email_confirm: true, // Bypass email confirmation
    user_metadata: { display_name: "João Winicius" }
  });

  if (createErr) {
    console.error("Erro ao criar usuário:", createErr.message);
    
    // Maybe the user still exists? Try to find them
    const { data: { users } } = await admin.auth.admin.listUsers();
    const found = users.find(u => u.email === ADMIN_EMAIL);
    if (found) {
      console.log("Usuário ainda existe! Atualizando senha...");
      const { error: updateErr } = await admin.auth.admin.updateUserById(found.id, {
        password: TEMP_PASSWORD,
        email_confirm: true
      });
      if (updateErr) console.error("Erro ao atualizar:", updateErr.message);
      else console.log("✓ Senha atualizada!");
      
      // Make sure profile exists
      await ensureProfile(found.id);
    }
    return;
  }

  console.log(`✓ Usuário criado! ID: ${newUser.user.id}`);

  // 2. Create profile
  await ensureProfile(newUser.user.id);
}

async function ensureProfile(userId) {
  // Check if profile exists
  const { data: existing } = await admin.from("profiles").select("*").eq("user_id", userId).single();
  
  if (existing) {
    // Update to active
    await admin.from("profiles").update({ active: true }).eq("user_id", userId);
    console.log("✓ Profile existente ativado.");
  } else {
    // Create profile
    const { error: profErr } = await admin.from("profiles").insert({
      user_id: userId,
      email: ADMIN_EMAIL,
      display_name: "João Winicius",
      active: true
    });
    if (profErr) console.error("Erro ao criar profile:", profErr.message);
    else console.log("✓ Profile criado!");
  }
  
  // Ensure admin role
  const { data: existingRole } = await admin.from("user_roles").select("*").eq("user_id", userId).single();
  if (!existingRole) {
    const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (roleErr) console.error("Erro ao criar role:", roleErr.message);
    else console.log("✓ Role admin criado!");
  } else {
    console.log("✓ Role já existe:", existingRole.role);
  }
  
  console.log(`\n===========================`);
  console.log(`PRONTO! Use estas credenciais:`);
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Senha: ${TEMP_PASSWORD}`);
  console.log(`===========================`);
}

recreateAdmin().catch(console.error);
