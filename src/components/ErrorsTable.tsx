import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, Search } from "lucide-react";
import type { ErrorReport } from "@/lib/storage";
import ErrorDetailModal from "./ErrorDetailModal";

interface ErrorsTableProps {
  errors: ErrorReport[];
  teamMembers: string[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ErrorReport>) => void;
  showSearch?: boolean;
}

const statusColors: Record<string, string> = {
  Pendente: "bg-destructive/10 text-destructive border-destructive/20",
  "Em Análise": "bg-warning/10 text-warning border-warning/20",
  Resolvido: "bg-success/10 text-success border-success/20",
};

const ErrorsTable = ({ errors, teamMembers, onDelete, onUpdate, showSearch = false }: ErrorsTableProps) => {
  const [selectedError, setSelectedError] = useState<ErrorReport | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = showSearch && search.trim()
    ? errors.filter(
        (e) =>
          e.process_id.toLowerCase().includes(search.toLowerCase()) ||
          e.client_name.toLowerCase().includes(search.toLowerCase())
      )
    : errors;

  if (errors.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground">
        <p className="text-lg">Nenhum registro nesta aba.</p>
      </div>
    );
  }

  return (
    <>
      {showSearch && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID do Processo ou Nome do Cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold">ID Processo</TableHead>
                <TableHead className="font-semibold max-w-[250px]">Descrição</TableHead>
                <TableHead className="font-semibold">Reportado por</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Resp. Solução</TableHead>
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((error) => (
                <TableRow
                  key={error.id}
                  className="animate-fade-in cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedError(error);
                    setModalOpen(true);
                  }}
                >
                  <TableCell className="font-medium">{error.client_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{error.process_id}</TableCell>
                  <TableCell className="max-w-[250px] truncate text-sm">{error.description}</TableCell>
                  <TableCell className="text-sm">{error.reported_by}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select value={error.status} onValueChange={(v) => onUpdate(error.id, { status: v as ErrorReport["status"] })}>
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <Badge variant="outline" className={`${statusColors[error.status]} text-xs`}>
                          {error.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Em Análise">Em Análise</SelectItem>
                        <SelectItem value="Resolvido">Resolvido</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={error.solution_responsible || "none"}
                      onValueChange={(v) => onUpdate(error.id, { solution_responsible: v === "none" ? "" : v })}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não atribuído</SelectItem>
                        {teamMembers.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(error.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="text-destructive hover:text-destructive/80 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O erro do cliente "{error.client_name}" será removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(error.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ErrorDetailModal
        error={selectedError}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdate={onUpdate}
      />
    </>
  );
};

export default ErrorsTable;
