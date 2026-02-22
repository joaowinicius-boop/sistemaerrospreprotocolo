import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { addError } from "@/lib/storage";
import { toast } from "sonner";

interface ReportErrorModalProps {
  teamMembers: string[];
  onErrorAdded: () => void;
  currentUserName: string;
  currentUserId: string;
}

const ReportErrorModal = ({ teamMembers, onErrorAdded, currentUserName, currentUserId }: ReportErrorModalProps) => {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [processId, setProcessId] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!clientName.trim() || !processId.trim() || !description.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      await addError({
        client_name: clientName.trim(),
        process_id: processId.trim(),
        description: description.trim(),
        reported_by: currentUserName,
        created_by: currentUserId,
      });
      toast.success("Erro reportado com sucesso!");
      setClientName("");
      setProcessId("");
      setDescription("");
      setOpen(false);
      onErrorAdded();
    } catch {
      toast.error("Erro ao salvar.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Reportar Novo Erro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reportar Novo Erro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Nome completo do cliente *</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex: João da Silva" />
          </div>
          <div>
            <Label>ID do Processo *</Label>
            <Input value={processId} onChange={(e) => setProcessId(e.target.value)} placeholder="Ex: 0001234-56.2026.8.13.0001" />
          </div>
          <div>
            <Label>Descrição detalhada do erro *</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o erro encontrado..." rows={4} />
          </div>
          <div className="bg-muted/50 rounded-md p-3 text-sm">
            <span className="text-muted-foreground">Reportado por: </span>
            <span className="font-medium">{currentUserName}</span>
          </div>
          <Button onClick={handleSubmit} className="w-full">Enviar Reporte</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportErrorModal;
