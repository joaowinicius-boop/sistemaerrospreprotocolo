import { useState, useCallback } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCards from "@/components/StatsCards";
import ReportErrorModal from "@/components/ReportErrorModal";
import TeamSettings from "@/components/TeamSettings";
import ErrorsTable from "@/components/ErrorsTable";
import { getErrors, deleteError, updateError, getTeamMembers, saveTeamMembers } from "@/lib/storage";
import type { ErrorReport } from "@/lib/storage";
import { toast } from "sonner";

const Index = () => {
  const [errors, setErrors] = useState<ErrorReport[]>(getErrors);
  const [teamMembers, setTeamMembers] = useState<string[]>(getTeamMembers);

  const refresh = useCallback(() => setErrors(getErrors()), []);

  const handleDelete = (id: string) => {
    deleteError(id);
    refresh();
    toast.success("Registro excluído.");
  };

  const handleUpdate = (id: string, updates: Partial<ErrorReport>) => {
    updateError(id, updates);
    refresh();
  };

  const handleTeamUpdate = (members: string[]) => {
    saveTeamMembers(members);
    setTeamMembers(members);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <StatsCards errors={errors} />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Registros de Erros</h2>
          <div className="flex gap-3">
            <TeamSettings teamMembers={teamMembers} onUpdate={handleTeamUpdate} />
            <ReportErrorModal teamMembers={teamMembers} onErrorAdded={refresh} />
          </div>
        </div>
        <ErrorsTable errors={errors} teamMembers={teamMembers} onDelete={handleDelete} onUpdate={handleUpdate} />
      </main>
    </div>
  );
};

export default Index;
