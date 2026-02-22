import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import type { ErrorReport } from "@/lib/storage";
import { toast } from "sonner";

interface ErrorDetailModalProps {
  error: ErrorReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<ErrorReport>) => void;
}

const statusColors: Record<string, string> = {
  Pendente: "bg-destructive/10 text-destructive border-destructive/20",
  "Em Análise": "bg-warning/10 text-warning border-warning/20",
  Resolvido: "bg-success/10 text-success border-success/20",
};

const ErrorDetailModal = ({ error, open, onOpenChange, onUpdate }: ErrorDetailModalProps) => {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && error) {
      setNotes(error.notes || "");
    }
    onOpenChange(isOpen);
  };

  const handleSaveNotes = async () => {
    if (!error) return;
    setSaving(true);
    try {
      await onUpdate(error.id, { notes });
      toast.success("Anotações salvas!");
    } catch {
      toast.error("Erro ao salvar anotações.");
    } finally {
      setSaving(false);
    }
  };

  if (!error) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Detalhes do Erro
            <Badge variant="outline" className={statusColors[error.status]}>
              {error.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Nome do Cliente</Label>
              <p className="font-medium text-foreground">{error.client_name}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">ID do Processo</Label>
              <p className="font-medium text-foreground">{error.process_id}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Reportado por</Label>
              <p className="font-medium text-foreground">{error.reported_by}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Responsável pela Solução</Label>
              <p className="font-medium text-foreground">{error.solution_responsible || "Não atribuído"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-xs">Data de Criação</Label>
              <p className="font-medium text-foreground">
                {new Date(error.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Descrição Completa</Label>
            <div className="bg-muted/50 rounded-md p-3 text-sm text-foreground whitespace-pre-wrap">
              {error.description}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label className="font-semibold text-foreground">Anotações da Subliderança</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções, feedback ou observações sobre este caso..."
              rows={4}
            />
            <Button onClick={handleSaveNotes} disabled={saving} size="sm" className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Salvando..." : "Salvar Anotações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorDetailModal;
