import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Clock } from "lucide-react";
import type { ErrorReport } from "@/lib/storage";

interface PerformanceDashboardProps {
  errors: ErrorReport[];
}

const STATUS_COLORS = {
  pending: "hsl(0, 72%, 51%)",
  analysis: "hsl(38, 92%, 50%)",
  resolved: "hsl(142, 71%, 35%)",
};

const RESPONSIBLE_COLORS = [
  "hsl(210, 60%, 45%)",
  "hsl(0, 72%, 51%)",
  "hsl(38, 92%, 50%)",
  "hsl(142, 71%, 35%)",
  "hsl(270, 50%, 50%)",
  "hsl(180, 50%, 40%)",
  "hsl(330, 60%, 50%)",
  "hsl(60, 70%, 40%)",
];

const SECTOR_CONFIG: Record<string, { members: string[]; color: string }> = {
  "Organização de Documentos": {
    members: ["JOAO", "FABIELEM", "JOSE", "HINGRID"],
    color: "hsl(210, 65%, 35%)",
  },
  "Peticionamento": {
    members: ["MILENA", "LARISSA", "ELIZABETH"],
    color: "hsl(210, 30%, 65%)",
  },
};

export { SECTOR_CONFIG };

const normalize = (name: string) => name.trim().toUpperCase();
const firstName = (name: string) => normalize(name).split(/\s+/)[0];

const PerformanceDashboard = ({ errors }: PerformanceDashboardProps) => {
  const pieStatusData = useMemo(() => {
    const pending = errors.filter((e) => e.status === "Pendente").length;
    const analysis = errors.filter((e) => e.status === "Em Análise").length;
    const resolved = errors.filter((e) => e.status === "Resolvido").length;
    return [
      { name: "Pendentes", value: pending, color: STATUS_COLORS.pending },
      { name: "Em Análise", value: analysis, color: STATUS_COLORS.analysis },
      { name: "Resolvidos", value: resolved, color: STATUS_COLORS.resolved },
    ].filter((d) => d.value > 0);
  }, [errors]);

  const pieResponsibleData = useMemo(() => {
    const map: Record<string, number> = {};
    errors.forEach((e) => {
      const raw = e.solution_responsible;
      if (!raw || !raw.trim()) return;
      const key = firstName(raw);
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value], i) => ({ name, value, color: RESPONSIBLE_COLORS[i % RESPONSIBLE_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [errors]);

  const barData = useMemo(() => {
    const map: Record<string, { display: string; total: number }> = {};
    errors.forEach((e) => {
      const key = firstName(e.reported_by);
      if (!map[key]) map[key] = { display: key, total: 0 };
      map[key].total += 1;
    });
    return Object.values(map)
      .map((v) => ({ name: v.display, total: v.total }))
      .sort((a, b) => b.total - a.total);
  }, [errors]);

  const sectorData = useMemo(() => {
    return Object.entries(SECTOR_CONFIG).map(([sector, cfg]) => {
      const count = errors.filter((e) => {
        const name = firstName(e.solution_responsible || "");
        return cfg.members.includes(name);
      }).length;
      return { name: sector, value: count, color: cfg.color };
    }).filter((d) => d.value > 0);
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Indicadores de Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Pie */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Distribuição por Status</h3>
          {pieStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3}>
                  {pieStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Registros"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">Sem dados</p>
          )}
        </div>

        {/* Responsible Pie */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Erros por Responsável pela Solução</h3>
          {pieResponsibleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieResponsibleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3}>
                  {pieResponsibleData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Erros"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">Sem dados</p>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Erros por Membro</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [value, "Erros identificados"]} />
                <Bar dataKey="total" fill="hsl(210, 60%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">Sem dados</p>
          )}
        </div>

        {/* Sector Pie */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Volume de Erros por Setor</h3>
          {sectorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sectorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3}>
                  {sectorData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, "Erros"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">Sem dados</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
