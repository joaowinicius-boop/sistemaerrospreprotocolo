import logo from "@/assets/logo-nicolas-gomes.jpg";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldCheck } from "lucide-react";

interface DashboardHeaderProps {
  displayName?: string;
  isAdmin?: boolean;
  onSignOut?: () => void;
}

const DashboardHeader = ({ displayName, isAdmin, onSignOut }: DashboardHeaderProps) => {
  return (
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
      <div className="flex items-center gap-3">
        {isAdmin && <ShieldCheck className="w-5 h-5 text-primary-foreground/70" />}
        <span className="text-sm font-medium hidden sm:inline">{displayName}</span>
        <Button variant="ghost" size="icon" onClick={onSignOut} className="text-primary-foreground hover:bg-primary-foreground/10" title="Sair">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
