import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, ShieldAlert, CheckCircle, XCircle } from "lucide-react";

interface UserProfile {
  user_id: string;
  display_name: string;
  email: string;
  active: boolean;
  role: "admin" | "user";
}

interface AdminPanelProps {
  currentUserId?: string;
}

export default function AdminPanel({ currentUserId }: AdminPanelProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);

      if (!profiles || !roles) return;

      const merged: UserProfile[] = profiles.map((p) => {
        const userRole = roles.find((r) => r.user_id === p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          email: p.email,
          active: p.active,
          role: (userRole?.role as "admin" | "user") || "user",
        };
      });

      setUsers(merged);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    
    // Realtime not strictly necessary for admin panel, but nice to have.
    const profilesChannel = supabase.channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, fetchUsers)
      .subscribe();
      
    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, [fetchUsers]);

  const toggleActiveStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ active: !currentStatus })
        .eq("user_id", userId);
        
      if (error) throw error;
      toast.success(currentStatus ? "Usuário bloqueado." : "Usuário aprovado!");
      fetchUsers();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao alterar status do usuário.");
    }
  };

  const changeRole = async (userId: string, newRole: "admin" | "user") => {
    if (userId === currentUserId) {
      toast.error("Você não pode alterar seu próprio nível de acesso aqui.");
      return;
    }
    
    try {
      // Upsert the role
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id,role" });
        
      if (error) {
        // If upsert fails due to unique constraint or existing role, delete and insert
        await supabase.from("user_roles").delete().eq("user_id", userId);
        const { error: insertErr } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
        if (insertErr) throw insertErr;
      }
      
      toast.success("Nível de acesso atualizado.");
      fetchUsers();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao atualizar nível de acesso.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          Gerenciamento de Usuários
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Aprove novos cadastros para que possam acessar o sistema, ou bloqueie acessos indevidos.
        </p>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Nível de Acesso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">{u.display_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {u.active ? (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30">Aguardando</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v: "admin" | "user") => changeRole(u.user_id, v)}
                      disabled={u.user_id === currentUserId}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário Comum</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={u.active ? "destructive" : "default"}
                      size="sm"
                      className={!u.active ? "bg-green-600 hover:bg-green-700" : ""}
                      onClick={() => toggleActiveStatus(u.user_id, u.active)}
                      disabled={u.user_id === currentUserId}
                    >
                      {u.active ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" /> Bloquear
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" /> Aprovar
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
