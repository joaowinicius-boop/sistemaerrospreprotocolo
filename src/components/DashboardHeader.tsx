import logo from "@/assets/logo-nicolas-gomes.jpg";

const DashboardHeader = () => {
  return (
    <header className="bg-primary text-primary-foreground px-6 py-4 flex items-center gap-4 shadow-md">
      <img
        src={logo}
        alt="Nicolas Gomes Advogado"
        className="w-12 h-12 rounded-full object-cover border-2 border-primary-foreground/30 bg-card flex-shrink-0"
      />
      <div>
        <h1 className="text-xl font-bold tracking-tight">Sistema de Gestão de Erros — Pré-Protocolo</h1>
        <p className="text-sm text-primary-foreground/70">Escritório Nicolas Gomes</p>
      </div>
    </header>
  );
};

export default DashboardHeader;
