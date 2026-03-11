import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { addPriority } from "@/lib/storage";
import { toast } from "sonner";
import { addDays, format } from "date-fns";

interface AddPriorityModalProps {
  teamMembers: string[];
  onPriorityAdded: () => void;
  currentUserId: string;
}

const SECTORS = ["Pendência", "Organização de Documentos", "Peticionamento", "Protocolo"] as const;

export default function AddPriorityModal({ teamMembers, onPriorityAdded, currentUserId }: AddPriorityModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    process_id: "",
    description: "",
    requested_by: "",
    requested_date: format(new Date(), "yyyy-MM-dd"),
    current_sector: "Pendência",
    responsible_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Calculate deadline as 5 days from requested date
      const baseDate = new Date(formData.requested_date);
      // Ensure time is set to end of day to not miss the entire 5th day
      baseDate.setHours(23, 59, 59, 999);
      const deadlineDate = addDays(baseDate, 5);

      await addPriority({
        ...formData,
        current_sector: formData.current_sector as any,
        created_by: currentUserId,
        deadline: deadlineDate.toISOString(),
      });
      toast.success("Prioridade adicionada com sucesso!");
      setOpen(false);
      onPriorityAdded();
      
      // Reset form
      setFormData({
        client_name: "",
        process_id: "",
        description: "",
        requested_by: "",
        requested_date: format(new Date(), "yyyy-MM-dd"),
        current_sector: "Pendência",
        responsible_name: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao adicionar prioridade. A tabela priorities existe no banco?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Nova Prioridade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Prioridade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Cliente</Label>
            <Input
              required
              placeholder="Digite o nome completo do cliente"
              value={formData.client_name}
              onChange={(e) => setFormData(s => ({ ...s, client_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>ID do Processo</Label>
            <Input
              required
              placeholder="Ex: 12345-67.2024..."
              value={formData.process_id}
              onChange={(e) => setFormData(s => ({ ...s, process_id: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Solicitado por</Label>
            <Input
              required
              placeholder="Nome de quem pediu urgência"
              value={formData.requested_by}
              onChange={(e) => setFormData(s => ({ ...s, requested_by: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Data da Solicitação</Label>
            <Input
              required
              type="date"
              value={formData.requested_date}
              onChange={(e) => setFormData(s => ({ ...s, requested_date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição / Observações</Label>
            <Textarea
              placeholder="Detalhes adicionais sobre o caso..."
              className="resize-none h-20"
              value={formData.description}
              onChange={(e) => setFormData(s => ({ ...s, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Setor Atual</Label>
            <Select
              value={formData.current_sector}
              onValueChange={(v) => setFormData(s => ({ ...s, current_sector: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTORS.map(sec => <SelectItem key={sec} value={sec}>{sec}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select
              value={formData.responsible_name}
              onValueChange={(v) => setFormData(s => ({ ...s, responsible_name: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded-md">
            O prazo será calculado e atribuído automaticamente (5 dias a partir da data de solicitação).
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Salvar Ficha</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
