import { ReactNode } from "react";
import { Priority, updatePriority, deletePriority, PriorityLog } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash, Clock, CheckCircle, Navigation } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, differenceInDays, addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface PriorityDetailsModalProps {
  priority: Priority;
  teamMembers: string[];
  isAdmin: boolean;
  currentUserId: string | undefined;
  currentUserName: string;
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
  currentUserName,
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

  const handleSectorToggle = async (sector: string) => {
    if (!canEdit) return;
    try {
      const currentSectors = priority.current_sector || [];
      const isSelected = currentSectors.includes(sector);
      const newSectors = isSelected 
        ? currentSectors.filter(s => s !== sector)
        : [...currentSectors, sector];
        
      if (newSectors.length === 0) {
        toast.error("A prioridade deve ter pelo menos um setor.");
        return;
      }
      
      const updates: Partial<Priority> = { current_sector: newSectors };
      
      // Auto-complete logic when only Protocolo is selected
      if (newSectors.length === 1 && newSectors[0] === "Protocolo" && (!currentSectors.includes("Protocolo") || currentSectors.length > 1)) {
        updates.completed_at = new Date().toISOString();
      } else if (!newSectors.includes("Protocolo") && currentSectors.includes("Protocolo")) {
        updates.completed_at = null;
      }
      
      await updatePriority(priority.id, updates);
      onUpdate();
    } catch {
      toast.error("Erro ao atualizar.");
    }
  };

  const handleResponsibleToggle = async (resp: string) => {
    if (!canEdit) return;
    try {
      const currentResp = priority.responsible_name || [];
      const isSelected = currentResp.includes(resp);
      const newResp = isSelected
        ? currentResp.filter(r => r !== resp)
        : [...currentResp, resp];
        
      await updatePriority(priority.id, { responsible_name: newResp });
      onUpdate();
    } catch {
      toast.error("Erro ao atualizar responsável!");
    }
  };

  const handleCompleteStep = async () => {
    const userName = currentUserName || "Usuário desconhecido";
    try {
       const newLog: PriorityLog = {
         action: "concluiu sua etapa",
         user: userName,
         created_at: new Date().toISOString()
       };
       const updatedLogs = [...(priority.logs || []), newLog];
       await updatePriority(priority.id, { logs: updatedLogs });
       toast.success("Etapa concluída registrada com sucesso!");
       onUpdate();
    } catch {
       toast.error("Erro ao registrar conclusão da etapa.");
    }
  };

  const handleDescriptionChange = async (desc: string) => {
    // Allow ALL users to update description, but log who did it
    try {
      const updatedLogs = [
        ...(priority.logs || []),
        {
          action: "atualizou a descrição",
          user: currentUserName || "Usuário",
          created_at: new Date().toISOString()
        }
      ];
      await updatePriority(priority.id, { description: desc, logs: updatedLogs });
      toast.success("Descrição salva!");
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
          current_sector: ["Protocolo"] // Automatically move to protocol if completed
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
              <span className="text-sm font-medium">Setores Envolvidos</span>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] bg-background">
                {SECTORS.map(sec => {
                  const isSelected = (priority.current_sector || []).includes(sec);
                  if (!canEdit && !isSelected) return null; // In read-only mode, only show selected
                  
                  return (
                    <div 
                      key={sec} 
                      onClick={() => handleSectorToggle(sec)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${canEdit ? 'cursor-pointer' : ''} ${
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {sec}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Responsáveis</span>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] max-h-[120px] overflow-y-auto bg-background">
                {!canEdit && (priority.responsible_name || []).length === 0 && (
                   <span className="text-sm text-muted-foreground p-1">Sem responsável</span>
                )}
                
                {teamMembers.map(m => {
                  const isSelected = (priority.responsible_name || []).includes(m);
                  if (!canEdit && !isSelected) return null; // In read-only mode, only show selected

                  return (
                    <div 
                      key={m} 
                      onClick={() => handleResponsibleToggle(m)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${canEdit ? 'cursor-pointer' : ''} ${
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {m}
                    </div>
                  );
                })}
              </div>
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
            {/* All authenticated users can edit the description to add notes */}
            <Textarea 
              key={priority.description}
              defaultValue={priority.description || ""}
              onBlur={(e) => {
                if (e.target.value !== priority.description) {
                  handleDescriptionChange(e.target.value);
                }
              }}
              placeholder="Adicione detalhes, observações ou anotações importantes..."
              className="resize-none h-24"
            />
            <p className="text-xs text-muted-foreground">Clique fora da caixa de texto para salvar. Sua anotação ficará registrada no histórico abaixo.</p>
          </div>


          {/* Timeline and OK button section */}
          <div className="pt-4 border-t mt-6">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-semibold flex items-center gap-2">
                 <Navigation className="w-4 h-4 text-primary" />
                 Histórico de Tramitação
               </h3>
               {/* Button visible to ALL authenticated users - not just canEdit */}
               <Button 
                  onClick={() => handleCompleteStep()}
                  variant="outline"
                  className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
               >
                 <CheckCircle className="w-4 h-4 mr-2" />
                 Concluir minha etapa
               </Button>
            </div>

            <div className="pl-2 space-y-4 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px before:w-0.5 before:bg-muted before:h-[90%] before:mt-4">
              {(priority.logs || []).map((log, index) => (
                <div key={index} className="relative flex items-start gap-4 z-10">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary mt-1 ring-4 ring-background"></div>
                  <div className="bg-muted/30 p-3 rounded-md border flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-primary">{log.user}</span> {log.action}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                  </div>
                </div>
              ))}
              {(!priority.logs || priority.logs.length === 0) && (
                 <p className="text-sm text-muted-foreground italic ml-8 py-2">Nenhum histórico registrado ainda.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
