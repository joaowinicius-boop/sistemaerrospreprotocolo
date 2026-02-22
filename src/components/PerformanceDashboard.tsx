import { useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Clock } from "lucide-react";
import type { ErrorReport } from "@/lib/storage";

interface PerformanceDashboardProps {
  errors: ErrorReport[];
}

const COLORS = {
  pending: "hsl(0, 72%, 51%)",
  analysis: "hsl(38, 92%, 50%)",
  resolved: "hsl(142, 71%, 35%)",
};

const PerformanceDashboard = ({ errors }: PerformanceDashboardProps) => {
  const pieData = useMemo(() => {
    const pending = errors.filter((e) => e.status === "Pendente").length;
    const analysis = errors.filter((e) => e.status === "Em Análise").length;
    const resolved = errors.filter((e) => e.status === "Resolvido").length;
    return [
      { name: "Pendentes", value: pending, color: COLORS.pending },
      { name: "Em Análise", value: analysis, color: COLORS.analysis },
      { name: "Resolvidos", value: resolved, color: COLORS.resolved },
    ].filter((d) => d.value > 0);
  }, [errors]);

  const barData = useMemo(() => {
    const map: Record<string, number> = {};
    errors.forEach((e) => {
      map[e.reported_by] = (map[e.reported_by] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [errors]);

  const avgTime = useMemo(() => {
    // We can't compute real resolution time without a resolved_at field,
    // so we show "–" as a placeholder for now
    return null;
  }, []);

  if (errors.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Indicadores de Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pie Chart */}
        <div className="bg-card rounded-lg border shadow-sm p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Distribuição por Status</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3}>
                  {pieData.map((entry, i) => (
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

        {/* Avg Time Card */}
        <div className="bg-card rounded-lg border shadow-sm p-4 flex flex-col items-center justify-center">
          <Clock className="w-8 h-8 text-accent mb-2" />
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Tempo Médio de Resolução</h3>
          <p className="text-3xl font-bold text-foreground">
            {avgTime ?? "–"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Requer campo de data de resolução
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
