import { useState, useEffect, useCallback } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCards from "@/components/StatsCards";
import ReportErrorModal from "@/components/ReportErrorModal";
import TeamSettings from "@/components/TeamSettings";
import ErrorsTable from "@/components/ErrorsTable";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getErrors, deleteError, updateError, getTeamMembers, addTeamMember, removeTeamMember } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ErrorReport } from "@/lib/storage";
import { toast } from "sonner";

const Index = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [errs, members] = await Promise.all([getErrors(), getTeamMembers()]);
      setErrors(errs);
      setTeamMembers(members);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const errorsChannel = supabase
      .channel("errors-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "errors" }, () => refresh())
      .subscribe();
    const teamChannel = supabase
      .channel("team-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(errorsChannel);
      supabase.removeChannel(teamChannel);
    };
  }, [refresh]);

  const handleDelete = async (id: string) => {
    try {
      const target = errors.find((e) => e.id === id);
      await deleteError(id);
      if (user) {
        await supabase.from("audit_log").insert({
          user_id: user.id,
          user_name: profile?.display_name || user.email || "",
          action: "Excluiu ticket",
          target_description: target ? `${target.client_name} - ${target.process_id}` : id,
        });
      }
      toast.success("Registro excluído.");
    } catch { toast.error("Erro ao excluir."); }
  };

  const handleUpdate = async (id: string, updates: Partial<ErrorReport>) => {
    try {
      await updateError(id, updates);
      if (updates.status === "Resolvido" && user) {
        const target = errors.find((e) => e.id === id);
        await supabase.from("audit_log").insert({
          user_id: user.id,
          user_name: profile?.display_name || user.email || "",
          action: "Resolveu ticket",
          target_description: target ? `${target.client_name} - ${target.process_id}` : id,
        });
      }
    } catch { toast.error("Erro ao atualizar."); }
  };

  const handleAddMember = async (name: string) => {
    try { await addTeamMember(name); toast.success("Membro adicionado!"); }
    catch { toast.error("Erro ao adicionar membro."); }
  };

  const handleRemoveMember = async (name: string) => {
    try { await removeTeamMember(name); toast.success("Membro removido."); }
    catch { toast.error("Erro ao remover membro."); }
  };

  const pendingErrors = errors.filter((e) => e.status !== "Resolvido");
  const resolvedErrors = errors.filter((e) => e.status === "Resolvido");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader displayName={profile?.display_name || user?.email || ""} isAdmin={isAdmin} onSignOut={signOut} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <StatsCards errors={errors} />
        <PerformanceDashboard errors={errors} />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Registros de Erros</h2>
          <div className="flex gap-3">
            <TeamSettings teamMembers={teamMembers} onAdd={handleAddMember} onRemove={handleRemoveMember} />
            <ReportErrorModal
              teamMembers={teamMembers}
              onErrorAdded={refresh}
              currentUserName={profile?.display_name || user?.email || ""}
              currentUserId={user?.id || ""}
            />
          </div>
        </div>
        <Tabs defaultValue="pendentes">
          <TabsList>
            <TabsTrigger value="pendentes">Pendentes ({pendingErrors.length})</TabsTrigger>
            <TabsTrigger value="resolvidos">Resolvidos ({resolvedErrors.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pendentes">
            <ErrorsTable errors={pendingErrors} teamMembers={teamMembers} onDelete={handleDelete} onUpdate={handleUpdate} currentUserId={user?.id} isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="resolvidos">
            <ErrorsTable errors={resolvedErrors} teamMembers={teamMembers} onDelete={handleDelete} onUpdate={handleUpdate} showSearch currentUserId={user?.id} isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
