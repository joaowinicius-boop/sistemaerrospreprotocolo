import { ReactNode } from "react";
import { Priority, updatePriority, deletePriority } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface PriorityDetailsModalProps {
  priority: Priority;
  teamMembers: string[];
  isAdmin: boolean;
  currentUserId: string | undefined;
  onUpdate: () => void;
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SECTORS = ["Pendência", "Organização de Documentos", "Peticionamento", "Protocolo"] as const;

export default function PriorityDetailsModal({ 
  priority, 
  teamMembers, 
  isAdmin, 
  currentUserId,
  onUpdate,
  children,
  open,
  onOpenChange
}: PriorityDetailsModalProps) {
  const deadlineDate = new Date(priority.deadline);
  const daysLeft = differenceInDays(deadlineDate, new Date());
  const isCritical = daysLeft <= 5;
  
  // RLS Validation on Frontend UI: Only Admin or the Creator can edit this priority
  const canEdit = isAdmin || (currentUserId && priority.created_by === currentUserId);

  const handleSectorChange = async (sector: string) => {
    if (!canEdit) return;
    try {
      const updates: Partial<Priority> = { current_sector: sector as any };
      // Auto-complete logic when moving to Protocolo
      if (sector === "Protocolo" && priority.current_sector !== "Protocolo") {
        updates.completed_at = new Date().toISOString();
      } else if (sector !== "Protocolo" && priority.current_sector === "Protocolo") {
        updates.completed_at = null;
      }
      
      await updatePriority(priority.id, updates);
      toast.success("Setor atualizado!");
      onUpdate();
    } catch {
      toast.error("Erro ao atualizar.");
    }
  };

  const handleResponsibleChange = async (resp: string) => {
    if (!canEdit) return;
    try {
      await updatePriority(priority.id, { responsible_name: resp });
      toast.success("Responsável atualizado!");
      onUpdate();
    } catch {
      toast.error("Erro ao atualizar!");
    }
  };

  const handleDescriptionChange = async (desc: string) => {
    if (!canEdit) return;
    try {
      await updatePriority(priority.id, { description: desc });
      // Remove toast.success here to prevent spamming on blur, handled silently
      onUpdate();
    } catch {
      toast.error("Erro ao salvar descrição!");
    }
  };

  const handleRequestedByChange = async (reqBy: string) => {
    if (!canEdit) return;
    try {
      await updatePriority(priority.id, { requested_by: reqBy });
      onUpdate();
    } catch {
      toast.error("Erro ao salvar solicitante!");
    }
  };

  const handleRequestedDateChange = async (reqDate: string) => {
    if (!canEdit || !reqDate) return;
    try {
      // Recalculate deadline
      const baseDate = new Date(reqDate);
      baseDate.setHours(23, 59, 59, 999);
      const newDeadline = addDays(baseDate, 5).toISOString();
      
      await updatePriority(priority.id, { 
        requested_date: reqDate,
        deadline: newDeadline
      });
      toast.success("Data da solicitação e prazo atualizados!");
      onUpdate();
    } catch {
      toast.error("Erro ao atualizar a data!");
    }
  };

  const handleToggleComplete = async () => {
    if (!canEdit) return;
    const isCompleted = !!priority.completed_at;
    try {
      if (isCompleted) {
        // Reopen
        await updatePriority(priority.id, { completed_at: null });
        toast.success("Prioridade reaberta.");
      } else {
        // Complete
        await updatePriority(priority.id, { 
          completed_at: new Date().toISOString(),
          current_sector: "Protocolo" // Automatically move to protocol if completed
        });
        toast.success("Prioridade marcada como concluída!");
      }
      onUpdate();
    } catch {
      toast.error("Erro ao alterar status.");
    }
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    if (!confirm("Tem certeza que deseja excluir esta prioridade?")) return;
    try {
      await deletePriority(priority.id);
      toast.success("Excluído com sucesso.");
      onOpenChange(false);
      onUpdate();
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] max-w-lg">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl">{priority.client_name}</DialogTitle>
              {priority.completed_at && (
                <Badge className="bg-green-600 hover:bg-green-700">Concluído</Badge>
              )}
            </div>
            {canEdit && (
              <div className="flex items-center gap-1">
                <Button 
                  variant={priority.completed_at ? "outline" : "default"} 
                  size="sm" 
                  className={priority.completed_at ? "" : "bg-green-600 hover:bg-green-700"}
                  onClick={handleToggleComplete}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {priority.completed_at ? "Reabrir" : "Concluir"}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive ml-1" onClick={handleDelete} title="Excluir Prioridade">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">ID do Processo</p>
              <p className="font-medium">{priority.process_id}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Prazo Final</p>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${isCritical ? "text-destructive" : "text-muted-foreground"}`} />
                <span className={`font-medium ${isCritical ? "text-destructive" : ""}`}>
                  {formatDistanceToNow(deadlineDate, { locale: ptBR, addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-sm font-medium">Setor Atual</span>
              {canEdit ? (
                <Select value={priority.current_sector} onValueChange={handleSectorChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 border rounded-md bg-muted/30 text-muted-foreground">{priority.current_sector}</div>
              )}
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Responsável</span>
              {canEdit ? (
                <Select value={priority.responsible_name || ""} onValueChange={handleResponsibleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 border rounded-md bg-muted/30 text-muted-foreground">
                  {priority.responsible_name || "Sem responsável"}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Solicitado por</span>
            {canEdit ? (
              <Input
                defaultValue={priority.requested_by || ""}
                onBlur={(e) => {
                  if (e.target.value !== priority.requested_by) {
                    handleRequestedByChange(e.target.value);
                  }
                }}
                placeholder="Nome de quem pediu a urgência..."
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/30 text-muted-foreground text-sm">
                {priority.requested_by || "Não informado."}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Data da Solicitação</span>
            {canEdit ? (
              <Input
                type="date"
                defaultValue={priority.requested_date || ""}
                onBlur={(e) => {
                  if (e.target.value && e.target.value !== priority.requested_date) {
                    handleRequestedDateChange(e.target.value);
                  }
                }}
              />
            ) : (
              <div className="p-2 border rounded-md bg-muted/30 text-muted-foreground text-sm">
                {priority.requested_date ? priority.requested_date.split('-').reverse().join('/') : "Não informado"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Descrição / Observações</span>
            {canEdit ? (
              <Textarea 
                defaultValue={priority.description || ""}
                onBlur={(e) => {
                  if (e.target.value !== priority.description) {
                    handleDescriptionChange(e.target.value);
                  }
                }}
                placeholder="Detalhes adicionais importantes..."
                className="resize-none h-24"
              />
            ) : (
              <div className="p-3 border rounded-md bg-muted/30 text-muted-foreground whitespace-pre-wrap min-h-20 text-sm">
                {priority.description || "Nenhuma descrição fornecida."}
              </div>
            )}
            {canEdit && <p className="text-xs text-muted-foreground">Clique fora da caixa texto para salvar automaticamente.</p>}
          </div>

          {!canEdit && (
            <div className="text-xs text-muted-foreground mt-4 italic bg-muted/50 p-3 rounded-md">
              Modo de leitura: Apenas o Administrador ou o criador deste registro podem fazer alterações.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
