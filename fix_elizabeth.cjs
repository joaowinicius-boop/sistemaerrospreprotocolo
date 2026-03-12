const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixElizabeth() {
  const query = `
    INSERT INTO public.profiles (user_id, email, display_name, active)
    VALUES 
      ('6b71493f-33e3-4961-8259-5ba7f53b4479', 'elizabeth@nicolasgomesadv.com.br', 'Elizabeth Souza', true),
      ('9c10b9d3-22e6-4608-b2dd-a513e43f5ada', 'souzaeliza57@gmail.com', 'Elizabeth', true)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      display_name = EXCLUDED.display_name,
      active = EXCLUDED.active;
      
    INSERT INTO public.user_roles (user_id, role)
    VALUES 
      ('6b71493f-33e3-4961-8259-5ba7f53b4479', 'user'),
      ('9c10b9d3-22e6-4608-b2dd-a513e43f5ada', 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  `;

  const { data, error } = await admin.rpc('run_sql', { sql: query }).catch(async () => {
     // Since run_sql might not exist, we'll try something else
     return { error: { message: "run_sql does not exist" } };
  });

  if (error) {
     console.log("Tentando fix manual usando update/insert...");
     
     // First try to delete them to avoid null constraint on update
     await admin.from('profiles').delete().in('user_id', ['6b71493f-33e3-4961-8259-5ba7f53b4479', '9c10b9d3-22e6-4608-b2dd-a513e43f5ada']);
     
     // Then insert strictly
     const { error: ins1 } = await admin.from('profiles').upsert({
        id: '6b71493f-33e3-4961-8259-5ba7f53b4479', // Provide ID just in case
        user_id: '6b71493f-33e3-4961-8259-5ba7f53b4479', 
        email: 'elizabeth@nicolasgomesadv.com.br', 
        display_name: 'Elizabeth Souza', 
        active: true
     });
     console.log("Elizabeth 1:", ins1 ? ins1.message : "OK");
     
     const { error: ins2 } = await admin.from('profiles').upsert({
        id: '9c10b9d3-22e6-4608-b2dd-a513e43f5ada',
        user_id: '9c10b9d3-22e6-4608-b2dd-a513e43f5ada', 
        email: 'souzaeliza57@gmail.com', 
        display_name: 'Elizabeth', 
        active: true
     });
     console.log("Elizabeth 2:", ins2 ? ins2.message : "OK");
  }
}

fixElizabeth().catch(console.error);
