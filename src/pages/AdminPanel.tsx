import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, UserX, ShieldCheck, History, ShieldAlert, ShieldOff } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  user_id: string;
  display_name: string;
  email: string;
  active: boolean;
  created_at: string;
  role: string;
}

interface AuditEntry {
  id: string;
  user_name: string;
  action: string;
  target_description: string;
  created_at: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    const roleMap = new Map((roles ?? []).map((r: any) => [r.user_id, r.role]));
    setUsers(
      (profiles ?? []).map((p: any) => ({
        ...p,
        role: roleMap.get(p.user_id) || "user",
      }))
    );
  };

  const fetchAuditLog = async () => {
    const { data } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setAuditLog((data as AuditEntry[]) ?? []);
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchAuditLog()]).then(() => setLoading(false));
  }, []);

  const toggleActive = async (userId: string, active: boolean) => {
    const { error } = await supabase.from("profiles").update({ active: !active }).eq("user_id", userId);
    if (error) { toast.error("Erro ao atualizar."); return; }
    toast.success(active ? "Usuário desativado." : "Usuário reativado.");
    fetchUsers();
  };

  const toggleRole = async (userId: string, currentRole: string, userName: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);
    if (error) { toast.error("Erro ao alterar cargo."); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        user_name: "Admin",
        action: newRole === "admin" ? "Promoveu a Admin" : "Rebaixou para Usuário",
        target_description: userName,
      });
    }

    toast.success(newRole === "admin" ? `${userName} promovido a Admin!` : `${userName} rebaixado para Usuário.`);
    fetchUsers();
    fetchAuditLog();
  };

  const clearResolved = async () => {
    const { error } = await supabase.from("errors").delete().eq("status", "Resolvido");
    if (error) { toast.error("Erro ao limpar histórico."); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        user_name: "Admin",
        action: "Limpou histórico de resolvidos",
        target_description: "Todos os tickets resolvidos",
      });
    }
    toast.success("Histórico de resolvidos limpo!");
    fetchAuditLog();
  };

  if (loading) return <p className="text-muted-foreground p-8">Carregando...</p>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center gap-4 shadow-md">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-primary-foreground hover:bg-primary-foreground/10 gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Painel do Administrador
          </h1>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="secondary" size="sm" className="gap-2">
              <History className="w-4 h-4" /> Limpar Resolvidos
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar todos os resolvidos?</AlertDialogTitle>
              <AlertDialogDescription>Todos os tickets com status "Resolvido" serão excluídos permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={clearResolved} className="bg-destructive text-destructive-foreground">Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usuários Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-center">Ações de Conta</TableHead>
                    <TableHead className="text-center">Ações de Cargo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.display_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role === "admin" ? "Admin" : "Usuário"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.active ? "outline" : "destructive"}>
                          {u.active ? "Ativo" : "Desativado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(u.user_id, u.active)} title={u.active ? "Desativar" : "Reativar"}>
                          <UserX className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRole(u.user_id, u.role, u.display_name)}
                          title={u.role === "admin" ? "Rebaixar para Usuário" : "Promover a Admin"}
                          className="gap-1.5 text-xs"
                        >
                          {u.role === "admin" ? (
                            <><ShieldOff className="w-4 h-4 text-warning" /> Rebaixar</>
                          ) : (
                            <><ShieldAlert className="w-4 h-4 text-accent" /> Promover</>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLog.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma atividade registrada.</p>
            ) : (
              <div className="space-y-2">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <div className="text-sm">
                      <span className="font-medium text-foreground">{entry.user_name}</span>{" "}
                      <span className="text-muted-foreground">{entry.action}</span>{" "}
                      <span className="font-medium text-foreground">"{entry.target_description}"</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {new Date(entry.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPanel;
