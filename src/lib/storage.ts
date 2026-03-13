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

export interface PriorityLog {
  action: string;
  user: string;
  created_at: string;
}

export interface Priority {
  id: string;
  client_name: string;
  process_id: string;
  description: string;
  requested_by: string;
  requested_date: string;
  current_sector: string[];
  responsible_name: string[];
  deadline: string;
  completed_at: string | null;
  created_at: string;
  created_by: string | null;
  logs: PriorityLog[];
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

export async function getPriorities(): Promise<Priority[]> {
  const { data, error } = await supabase
    .from("priorities")
    .select("*")
    .order("deadline", { ascending: true });
  if (error && error.code !== "42P01") throw error; // ignore 'table does not exist' for initial load without table
  
  const parseArrayField = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      if (value.startsWith("[")) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      return value ? [value] : [];
    }
    return [];
  };

  const parseLogsField = (value: any): PriorityLog[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try { const p = JSON.parse(value); if (Array.isArray(p)) return p; } catch {}
    }
    return [];
  };

  const normalized = (data ?? []).map((p: any) => ({
    ...p,
    current_sector: parseArrayField(p.current_sector),
    responsible_name: parseArrayField(p.responsible_name),
    logs: parseLogsField(p.logs),
  }));
  
  return normalized as Priority[];
}

export async function addPriority(
  priority: Pick<Priority, "client_name" | "process_id" | "description" | "requested_by" | "requested_date" | "current_sector" | "responsible_name" | "deadline"> & { created_by: string }
): Promise<Priority> {
  const { data, error: err } = await supabase
    .from("priorities")
    .insert(priority)
    .select()
    .single();
  if (err) throw err;
  return data as unknown as Priority;
}

export async function updatePriority(id: string, updates: Partial<Priority>) {
  const { error } = await supabase.from("priorities").update(updates as any).eq("id", id);
  if (error) throw error;
}

export async function deletePriority(id: string) {
  const { error } = await supabase.from("priorities").delete().eq("id", id);
  if (error) throw error;
}
