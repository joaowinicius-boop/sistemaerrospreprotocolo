import { AlertCircle, Clock, CheckCircle, FileText } from "lucide-react";
import type { ErrorReport } from "@/lib/storage";

interface StatsCardsProps {
  errors: ErrorReport[];
}

const StatsCards = ({ errors }: StatsCardsProps) => {
  const total = errors.length;
  const pending = errors.filter((e) => e.status === "Pendente").length;
  const inProgress = errors.filter((e) => e.status === "Em Análise").length;
  const resolved = errors.filter((e) => e.status === "Resolvido").length;

  const cards = [
    { label: "Total de Erros", value: total, icon: FileText, color: "text-accent" },
    { label: "Pendentes", value: pending, icon: AlertCircle, color: "text-destructive" },
    { label: "Em Análise", value: inProgress, icon: Clock, color: "text-warning" },
    { label: "Resolvidos", value: resolved, icon: CheckCircle, color: "text-success" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-card rounded-lg p-5 shadow-sm border animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
            <c.icon className={`w-5 h-5 ${c.color}`} />
          </div>
          <p className="text-3xl font-bold text-card-foreground">{c.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
