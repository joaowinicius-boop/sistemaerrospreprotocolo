import { useState, useEffect, useCallback } from "react";
import { getPriorities, Priority } from "@/lib/storage";
import PriorityCard from "./PriorityCard";
import PriorityKPIs from "./PriorityKPIs";
import AddPriorityModal from "./AddPriorityModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface PrioritiesTabProps {
  teamMembers: string[];
  isAdmin: boolean;
  currentUserId: string | undefined;
}

export default function PrioritiesTab({ teamMembers, isAdmin, currentUserId }: PrioritiesTabProps) {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all");

  const refresh = useCallback(async () => {
    try {
      const data = await getPriorities();
      setPriorities(data);
    } catch (e) {
      console.error(e);
      // Fallback empty array on DB error handled directly in storage.js
      setPriorities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const prioritiesChannel = supabase
      .channel("priorities-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "priorities" }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(prioritiesChannel);
    };
  }, [refresh]);

  const filteredData = priorities.filter(p => {
    if (sectorFilter !== "all" && p.current_sector !== sectorFilter) return false;
    if (responsibleFilter !== "all" && p.responsible_name !== responsibleFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PriorityKPIs priorities={priorities} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Setores</SelectItem>
              <SelectItem value="Pendência">Pendência</SelectItem>
              <SelectItem value="Organização de Documentos">Organização de Documentos</SelectItem>
              <SelectItem value="Peticionamento">Peticionamento</SelectItem>
              <SelectItem value="Protocolo">Protocolo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Editores</SelectItem>
              {teamMembers.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {currentUserId && (
          <AddPriorityModal 
            teamMembers={teamMembers} 
            onPriorityAdded={refresh} 
            currentUserId={currentUserId} 
          />
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando prioridades...</p>
      ) : filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-lg border border-dashed">
          <p className="text-muted-foreground mb-4">Nenhuma prioridade encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map(p => (
            <PriorityCard 
              key={p.id} 
              priority={p} 
              teamMembers={teamMembers} 
              isAdmin={isAdmin} 
              currentUserId={currentUserId}
              onUpdate={refresh} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
