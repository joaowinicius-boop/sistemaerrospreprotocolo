const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: { users } } = await admin.auth.admin.listUsers();
  
  const eliz1 = users.find(u => u.email === 'elizabeth@nicolasgomesadv.com.br');
  if (eliz1) {
    const { error } = await admin.auth.admin.updateUserById(eliz1.id, { password: 'Usuario@123', email_confirm: true });
    console.log('Reset Elizabeth 1:', error ? error.message : 'OK');
  } else {
    console.log('Elizabeth 1 não encontrada');
  }

  const eliz2 = users.find(u => u.email === 'souzaeliza57@gmail.com');
  if (eliz2) {
    const { error } = await admin.auth.admin.updateUserById(eliz2.id, { password: 'Usuario@123', email_confirm: true });
    console.log('Reset Elizabeth 2:', error ? error.message : 'OK');
  } else {
    console.log('Elizabeth 2 não encontrada');
  }
}

run().catch(console.error);
