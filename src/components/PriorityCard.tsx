import { useState } from "react";
import { Priority } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import PriorityDetailsModal from "./PriorityDetailsModal";

interface PriorityCardProps {
  priority: Priority;
  teamMembers: string[];
  isAdmin: boolean;
  currentUserId: string | undefined;
  onUpdate: () => void;
}

export default function PriorityCard({ priority, teamMembers, isAdmin, currentUserId, onUpdate }: PriorityCardProps) {
  const [open, setOpen] = useState(false);
  const deadlineDate = new Date(priority.deadline);
  const daysLeft = differenceInDays(deadlineDate, new Date());
  const isCritical = daysLeft <= 5;

  return (
    <PriorityDetailsModal
      priority={priority}
      teamMembers={teamMembers}
      isAdmin={isAdmin}
      currentUserId={currentUserId}
      onUpdate={onUpdate}
      open={open}
      onOpenChange={setOpen}
    >
      <Card className={`relative transition-all hover:shadow-md cursor-pointer border-l-4 ${isCritical ? "border-l-destructive" : "border-l-primary"}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{priority.client_name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Processo: {priority.process_id}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isCritical ? "text-destructive" : "text-muted-foreground"}`} />
            <span className={`text-sm font-medium ${isCritical ? "text-destructive" : ""}`}>
              Prazo: {formatDistanceToNow(deadlineDate, { locale: ptBR, addSuffix: true })}
            </span>
            {isCritical && <Badge variant="destructive" className="ml-auto">Crítico</Badge>}
          </div>

          {priority.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 italic border-l-2 pl-2 border-muted">
              "{priority.description}"
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block">Solicitante</span>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{priority.requested_by || "Não informado"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block">Setor</span>
              <span className="text-sm font-medium">{priority.current_sector}</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block">Responsável</span>
              <span className="text-sm font-medium">{priority.responsible_name || "Não atribuído"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </PriorityDetailsModal>
  );
}
