const { createClient } = require("@supabase/supabase-js");

const admin = createClient(
  "https://gtyvqzljarwkwrmukejj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function diagnoseAndFix() {
  // Read a couple rows to understand the actual data shape
  const { data: rows } = await admin.from("priorities").select("id, current_sector, responsible_name, logs").limit(5);
  
  console.log("Current data sample:");
  rows.forEach(r => {
    console.log("  id:", r.id.slice(0, 8));
    console.log("  current_sector:", JSON.stringify(r.current_sector), "type:", typeof r.current_sector, "isArray:", Array.isArray(r.current_sector));
    console.log("  responsible_name:", JSON.stringify(r.responsible_name), "type:", typeof r.responsible_name, "isArray:", Array.isArray(r.responsible_name));
    console.log("  logs:", Array.isArray(r.logs) ? `array[${r.logs.length}]` : JSON.stringify(r.logs));
    console.log("---");
  });

  // Now try to update one row with an array to see what happens
  if (rows.length > 0) {
    const testRow = rows[0];
    console.log("\nTesting array update on row", testRow.id.slice(0, 8));
    const { error } = await admin
      .from("priorities")
      .update({ current_sector: ["Pendência"] })
      .eq("id", testRow.id);
    if (error) {
      console.log("Update with array FAILED:", error.message, error.code);
    } else {
      console.log("Update with array SUCCEEDED!");
    }
  }
}

diagnoseAndFix().catch(console.error);
