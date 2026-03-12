const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://gtyvqzljarwkwrmukejj.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runMig() {
  const sql = `
    ALTER TABLE public.priorities ALTER COLUMN sector SET DATA TYPE TEXT[] USING ARRAY[sector]::TEXT[];
    ALTER TABLE public.priorities ALTER COLUMN responsible_name SET DATA TYPE TEXT[] USING ARRAY[responsible_name]::TEXT[];
    ALTER TABLE public.priorities ADD COLUMN IF NOT EXISTS logs JSONB DEFAULT '[]'::jsonb;
  `;
  const res = await admin.rpc('run_sql', { sql }).catch(e => {
    console.log("Since run_sql doesn't work out of the box on all instances, we'll need the user to run this in SQL Editor");
  });
  console.log("Tried running SQL via RPC");
}
runMig();
