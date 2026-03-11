import { Priority } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle2, ListTodo } from "lucide-react";
import { differenceInDays } from "date-fns";

interface PriorityKPIsProps {
  priorities: Priority[];
}

export default function PriorityKPIs({ priorities }: PriorityKPIsProps) {
  const completedPriorities = priorities.filter(p => !!p.completed_at);
  const activePriorities = priorities.length - completedPriorities.length;
  
  const urgentPriorities = priorities.filter(p => {
    if (p.completed_at) return false; // Not urgent if completed
    const daysLeft = differenceInDays(new Date(p.deadline), new Date());
    return daysLeft <= 2;
  }).length;

  const getSectorCount = (sector: string) => {
    // Only count active for sectors typically
    return priorities.filter(p => p.current_sector === sector && !p.completed_at).length;
  };

  // Calculate Average Completion Time
  let averageCompletion = "N/A";
  const completedWithDate = priorities.filter(p => p.completed_at && p.requested_date);
  
  if (completedWithDate.length > 0) {
    let totalDays = 0;
    completedWithDate.forEach(p => {
      // requested_date is string "yyyy-MM-dd"
      // completed_at is full ISO
      const days = differenceInDays(new Date(p.completed_at!), new Date(p.requested_date));
      // Even if they do it on the same day, let's treat it as at least 0 days and show < 1.
      totalDays += Math.max(0, days);
    });
    
    const avg = Math.round(totalDays / completedWithDate.length);
    averageCompletion = avg === 0 ? "< 1 dia" : `${avg} dia${avg > 1 ? 's' : ''}`;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Prioridades Ativas</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">{activePriorities}</div>
            <span className="text-sm text-green-600 font-medium">/ {completedPriorities.length} concluídos</span>
          </div>
          <p className="text-xs text-muted-foreground">Total de processos a decorrer vs finalizados</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Urgentes (Alerta)</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{urgentPriorities}</div>
          <p className="text-xs text-muted-foreground">Processos a 2 dias ou menos do prazo</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Distribuição p/ Setor</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pendência:</span>
              <span className="font-medium">{getSectorCount("Pendência")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Org. Docs:</span>
              <span className="font-medium">{getSectorCount("Organização de Documentos")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peticionamento:</span>
              <span className="font-medium">{getSectorCount("Peticionamento")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Protocolo:</span>
              <span className="font-medium">{getSectorCount("Protocolo")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média de Conclusão</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageCompletion}</div>
          <p className="text-xs text-muted-foreground">Tempo médio para protocolar</p>
        </CardContent>
      </Card>
    </div>
  );
}
