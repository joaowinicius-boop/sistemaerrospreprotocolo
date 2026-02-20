import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface TeamSettingsProps {
  teamMembers: string[];
  onUpdate: (members: string[]) => void;
}

const TeamSettings = ({ teamMembers, onUpdate }: TeamSettingsProps) => {
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    if (teamMembers.includes(name)) {
      toast.error("Este membro já existe.");
      return;
    }
    onUpdate([...teamMembers, name]);
    setNewName("");
    toast.success("Membro adicionado!");
  };

  const handleRemove = (name: string) => {
    onUpdate(teamMembers.filter((m) => m !== name));
    toast.success("Membro removido.");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" /> Configurações
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Equipe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do novo membro"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd} size="icon" variant="outline">
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {teamMembers.map((m) => (
              <div key={m} className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                <span className="text-sm font-medium">{m}</span>
                <button onClick={() => handleRemove(m)} className="text-destructive hover:text-destructive/80 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamSettings;
