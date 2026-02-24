import { supabase } from "@/integrations/supabase/client";

export interface StatusHistoryEntry {
  status: string;
  changed_at: string;
}

export interface ErrorReport {
  id: string;
  client_name: string;
  process_id: string;
  description: string;
  reported_by: string;
  status: "Pendente" | "Em Análise" | "Resolvido";
  solution_responsible: string;
  created_at: string;
  notes: string;
  created_by: string | null;
  status_history: StatusHistoryEntry[];
}

export async function getErrors(): Promise<ErrorReport[]> {
  const { data, error } = await supabase
    .from("errors")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ErrorReport[];
}

export async function addError(
  error: Pick<ErrorReport, "client_name" | "process_id" | "description" | "reported_by"> & { created_by: string }
): Promise<ErrorReport> {
  const { data, error: err } = await supabase
    .from("errors")
    .insert(error)
    .select()
    .single();
  if (err) throw err;
  return data as unknown as ErrorReport;
}

export async function updateError(id: string, updates: Partial<ErrorReport>) {
  // If status is being changed, append to status_history
  if (updates.status) {
    const { data: current } = await supabase.from("errors").select("status_history").eq("id", id).single();
    const history = ((current?.status_history ?? []) as unknown as StatusHistoryEntry[]);
    history.push({ status: updates.status, changed_at: new Date().toISOString() });
    const { status_history: _sh, ...rest } = updates;
    const payload = { ...rest, status_history: history as any };
    const { error } = await supabase.from("errors").update(payload).eq("id", id);
    if (error) throw error;
    return;
  }
  const { status_history: _sh2, ...safeUpdates } = updates;
  const { error } = await supabase.from("errors").update(safeUpdates as any).eq("id", id);
  if (error) throw error;
}

export async function deleteError(id: string) {
  const { error } = await supabase.from("errors").delete().eq("id", id);
  if (error) throw error;
}

export async function getTeamMembers(): Promise<string[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select("name")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((d: { name: string }) => d.name);
}

export async function addTeamMember(name: string) {
  const { error } = await supabase.from("team_members").insert({ name });
  if (error) throw error;
}

export async function removeTeamMember(name: string) {
  const { error } = await supabase.from("team_members").delete().eq("name", name);
  if (error) throw error;
}
