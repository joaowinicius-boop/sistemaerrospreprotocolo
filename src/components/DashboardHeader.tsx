import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-nicolas-gomes.jpg";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, KeyRound, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NotificationBell from "./NotificationBell";

interface DashboardHeaderProps {
  displayName?: string;
  isAdmin?: boolean;
  onSignOut?: () => void;
  userId?: string;
}

const DashboardHeader = ({ displayName, isAdmin, onSignOut, userId }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      toast.error("Erro ao alterar senha.");
    } else {
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setPasswordOpen(false);
    }
  };

  return (
    <>
      <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center gap-4 shadow-md">
        <img
          src={logo}
          alt="Nicolas Gomes Advogado"
          className="w-12 h-12 rounded-full object-cover border-2 border-primary-foreground/30 bg-card flex-shrink-0"
        />
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Sistema de Gestão de Erros — Pré-Protocolo</h1>
          <p className="text-sm text-primary-foreground/70">Escritório Nicolas Gomes</p>
        </div>
        <div className="flex items-center gap-2">
          {userId && <NotificationBell userId={userId} />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 gap-1.5">
                <span className="hidden sm:inline font-medium">{displayName}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Painel Admin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => setPasswordOpen(true)} className="gap-2 cursor-pointer">
                <KeyRound className="w-4 h-4" />
                Alterar Senha
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="gap-2 cursor-pointer text-destructive">
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <Button onClick={handleChangePassword} disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DashboardHeader;
