import { useState, useEffect, useCallback } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCards from "@/components/StatsCards";
import ReportErrorModal from "@/components/ReportErrorModal";
import TeamSettings from "@/components/TeamSettings";
import ErrorsTable from "@/components/ErrorsTable";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import { SECTOR_CONFIG } from "@/components/PerformanceDashboard";
import PrioritiesTab from "@/components/PrioritiesTab";
import AdminPanel from "@/components/AdminPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [sectorFilter, setSectorFilter] = useState<string>("all");

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
      const target = errors.find((e) => e.id === id);
      await updateError(id, updates);
      // If resolving, notify the reporter
      if (updates.status === "Resolvido" && target && target.created_by && user) {
        await supabase.from("audit_log").insert({
          user_id: user.id,
          user_name: profile?.display_name || user.email || "",
          action: "Resolveu ticket",
          target_description: `${target.client_name} - ${target.process_id}`,
        });
        // Send notification to the reporter
        if (target.created_by !== user.id) {
          await supabase.from("notifications").insert({
            user_id: target.created_by,
            message: `O erro do cliente ${target.client_name} foi sanado!`,
            error_id: id,
          } as any);
        }
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

  const filterBySector = (list: ErrorReport[]) => {
    if (sectorFilter === "all") return list;
    const cfg = SECTOR_CONFIG[sectorFilter];
    if (!cfg) return list;
    return list.filter((e) => {
      const name = (e.solution_responsible || "").trim().toUpperCase().split(/\s+/)[0];
      return cfg.members.includes(name);
    });
  };

  const pendingErrors = filterBySector(errors.filter((e) => e.status !== "Resolvido"));
  const resolvedErrors = filterBySector(errors.filter((e) => e.status === "Resolvido"));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Se o usuário está logado mas não foi aprovado pelo administrador (admins sempre têm acesso)
  if (user && profile && profile.active === false && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardHeader displayName={profile.display_name || user.email || ""} isAdmin={false} onSignOut={signOut} userId={user.id} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="bg-muted/30 p-8 rounded-lg border border-dashed border-muted-foreground/50 w-full space-y-4">
            <h2 className="text-xl font-bold text-destructive">Aguardando Aprovação</h2>
            <p className="text-muted-foreground">Seu cadastro foi realizado com sucesso, mas a sua conta precisa ser aprovada por um administrador para acessar o sistema.</p>
            <p className="text-sm font-medium pt-4 text-foreground">Por favor, entre em contato com a gerência.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader displayName={profile?.display_name || user?.email || ""} isAdmin={isAdmin} onSignOut={signOut} userId={user?.id} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Tabs defaultValue="erros" className="w-full">
          <div className="flex justify-start mb-6 border-b">
            <TabsList className="bg-transparent h-12 w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger 
                value="erros" 
                className="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Erros no Protocolo
              </TabsTrigger>
              <TabsTrigger 
                value="prioridades" 
                className="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Aba de Prioridades
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger 
                  value="admin" 
                  className="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-3 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  Administrador
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="erros" className="space-y-6 mt-0">
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <TabsList>
                  <TabsTrigger value="pendentes">Pendentes ({pendingErrors.length})</TabsTrigger>
                  <TabsTrigger value="resolvidos">Resolvidos ({resolvedErrors.length})</TabsTrigger>
                </TabsList>
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger className="w-[220px] h-9 text-sm">
                    <SelectValue placeholder="Filtrar por Setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Setores</SelectItem>
                    {Object.keys(SECTOR_CONFIG).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TabsContent value="pendentes">
                <ErrorsTable errors={pendingErrors} teamMembers={teamMembers} onDelete={handleDelete} onUpdate={handleUpdate} currentUserId={user?.id} isAdmin={isAdmin} />
              </TabsContent>
              <TabsContent value="resolvidos">
                <ErrorsTable errors={resolvedErrors} teamMembers={teamMembers} onDelete={handleDelete} onUpdate={handleUpdate} showSearch currentUserId={user?.id} isAdmin={isAdmin} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="prioridades" className="mt-0">
            <PrioritiesTab teamMembers={teamMembers} isAdmin={isAdmin} currentUserId={user?.id} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="mt-0">
              <AdminPanel currentUserId={user?.id} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
