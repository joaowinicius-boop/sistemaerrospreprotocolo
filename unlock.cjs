const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function unlock() {
  console.log("Iniciando desbloqueio...");
  const { data: profiles, error } = await supabase.from("profiles").select("*");
  if (error) {
    console.error("Erro ao buscar perfis:", error);
    return;
  }

  for (const p of profiles) {
    const { error: updError } = await supabase.from("profiles").update({ active: true }).eq("id", p.id);
    if (updError) {
      console.error(`Erro ao desbloquear ${p.email}:`, updError);
    } else {
      console.log(`Desbloqueado: ${p.email}`);
    }
    
    if (p.email.includes("joaowinicius")) {
       await supabase.from("user_roles").upsert({ user_id: p.user_id, role: 'admin' }, { onConflict: "user_id,role" });
       console.log("Admin garantido para: " + p.email);
    }
  }
}

unlock();
