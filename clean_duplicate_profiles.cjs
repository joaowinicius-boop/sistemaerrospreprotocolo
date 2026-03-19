const { createClient } = require("@supabase/supabase-js");

const admin = createClient(
  "https://gtyvqzljarwkwrmukejj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3NzI4NCwiZXhwIjoyMDg4NjUzMjg0fQ.OEaRXGf10henfNYvNR1S3M8mpYRKGLicmG1uw0zKSTY",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function cleanDuplicates() {
  // 1. Get ALL profiles
  const { data: allProfiles, error } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching profiles:", error.message);
    return;
  }

  console.log("Total profiles:", allProfiles.length);

  // 2. Group by user_id
  const grouped = {};
  allProfiles.forEach((p) => {
    if (!grouped[p.user_id]) grouped[p.user_id] = [];
    grouped[p.user_id].push(p);
  });

  console.log("Unique user_ids:", Object.keys(grouped).length);

  let deletedCount = 0;

  for (const [userId, profiles] of Object.entries(grouped)) {
    if (profiles.length <= 1) continue;

    console.log(`\nUser ${profiles[0].email} has ${profiles.length} duplicates`);

    // Keep the first one that has active=true, or the very first one
    const activeProfile = profiles.find((p) => p.active === true);
    const keepProfile = activeProfile || profiles[0];

    console.log(`  Keeping profile id: ${keepProfile.id} (active: ${keepProfile.active})`);

    // Delete all others
    const idsToDelete = profiles
      .filter((p) => p.id !== keepProfile.id)
      .map((p) => p.id);

    console.log(`  Deleting ${idsToDelete.length} duplicate profiles...`);

    for (const id of idsToDelete) {
      const { error: delErr } = await admin
        .from("profiles")
        .delete()
        .eq("id", id);
      if (delErr) {
        console.error(`  Error deleting profile ${id}:`, delErr.message);
      } else {
        deletedCount++;
      }
    }
  }

  console.log(`\n✅ Done! Deleted ${deletedCount} duplicate profiles.`);

  // 3. Verify final count
  const { data: remaining } = await admin.from("profiles").select("id");
  console.log(`Remaining profiles: ${remaining.length}`);
}

cleanDuplicates().catch(console.error);
