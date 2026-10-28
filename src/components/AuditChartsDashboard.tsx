import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Activity, BarChart2, ShieldAlert, Award, PieChart, DollarSign } from 'lucide-react';
import { AuditFinding } from '../types/audit';
import { formatCurrency } from '../utils/exporters';

interface AuditChartsDashboardProps {
  findings: AuditFinding[];
  currency: string;
}

export const AuditChartsDashboard: React.FC<AuditChartsDashboardProps> = ({ findings, currency }) => {
  // 1. Data for Bar Chart: Distribution of financial amount & findings count by Rubro / Área
  const barData = useMemo(() => {
    const rubroAgg: Record<string, { rubro: string; monto: number; cantidad: number; avgQuality: number }> = {};

    findings.forEach((f) => {
      const area = f.rubro || 'General';
      if (!rubroAgg[area]) {
        rubroAgg[area] = { rubro: area, monto: 0, cantidad: 0, avgQuality: 0 };
      }
      rubroAgg[area].monto += f.monto || 0;
      rubroAgg[area].cantidad += 1;
      rubroAgg[area].avgQuality += f.puntuacion_calidad || 8.5;
    });

    return Object.values(rubroAgg)
      .map((item) => ({
        ...item,
        avgQuality: Number((item.avgQuality / item.cantidad).toFixed(1)),
        shortRubro: item.rubro.length > 18 ? item.rubro.slice(0, 16) + '…' : item.rubro,
      }))
      .sort((a, b) => b.monto - a.monto);
  }, [findings]);

  // 2. Data for Radar Chart: Multidimensional Risk & Quality (0-10) profile across Rubros
  const radarData = useMemo(() => {
    const rubroStats: Record<
      string,
      { count: number; totalQuality: number; criticalCount: number; maxMonto: number }
    > = {};

    findings.forEach((f) => {
      const area = f.rubro || 'General';
      if (!rubroStats[area]) {
        rubroStats[area] = { count: 0, totalQuality: 0, criticalCount: 0, maxMonto: 0 };
      }
      rubroStats[area].count += 1;
      rubroStats[area].totalQuality += f.puntuacion_calidad || 8.5;
      if (f.riesgo === 'Crítico') rubroStats[area].criticalCount += 1;
      if ((f.monto || 0) > rubroStats[area].maxMonto) rubroStats[area].maxMonto = f.monto || 0;
    });

    const entries = Object.entries(rubroStats);
    if (entries.length === 0) return [];

    return entries.slice(0, 8).map(([area, stat]) => {
      const avgScore = Number((stat.totalQuality / stat.count).toFixed(1));
      // Severity index (0 to 10 scale based on critical findings proportion)
      const severityScore = Number(Math.min(10, ((stat.criticalCount / stat.count) * 6 + (stat.count > 3 ? 4 : 2))).toFixed(1));

      return {
        area: area.length > 16 ? area.slice(0, 14) + '..' : area,
        fullName: area,
        calidadSupervisor: avgScore, // 0 to 10
        severidadRiesgo: severityScore, // 0 to 10
      };
    });
  }, [findings]);

  // Color palette for bars
  const BAR_COLORS = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#F43F5E', // Rose
    '#6366F1', // Indigo
  ];

  // Overall KPIs
  const overallAvgQuality = useMemo(() => {
    if (findings.length === 0) return 0;
    const sum = findings.reduce((acc, f) => acc + (f.puntuacion_calidad || 8.5), 0);
    return Number((sum / findings.length).toFixed(1));
  }, [findings]);

  const maxExposureArea = useMemo(() => {
    if (barData.length === 0) return { rubro: 'Ninguno', monto: 0 };
    return barData[0];
  }, [barData]);

  if (findings.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl mt-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Dashboard Analítico Visual: Severidad (0-10) y Distribución Presupuestaria
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Gráficos de radar pericial y barras de impacto financiero por rubro evaluado
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">Calidad Supervisor Promedio:</span>
            <span className="text-xs font-bold font-mono text-purple-300">
              {overallAvgQuality} / 10
            </span>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-xs text-slate-400">Mayor Exposición:</span>
            <span className="text-xs font-bold text-rose-300 truncate max-w-[140px]" title={maxExposureArea.rubro}>
              {maxExposureArea.rubro}
            </span>
          </div>
        </div>
      </div>

      {/* Grid with Radar & Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Radar Chart (Col 5) */}
        <div className="lg:col-span-5 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-purple-400" />
                Perfil de Calidad (0-10) y Severidad por Área
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Comparativa de calificación técnica del supervisor vs severidad del riesgo
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
              Escala 0-10
            </span>
          </div>

          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="area"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 10]}
                  tick={{ fill: '#64748b', fontSize: 9 }}
                  stroke="#475569"
                />
                <Radar
                  name="Calidad Supervisor (0-10)"
                  dataKey="calidadSupervisor"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.4}
                />
                <Radar
                  name="Severidad del Riesgo (0-10)"
                  dataKey="severidadRiesgo"
                  stroke="#F43F5E"
                  fill="#F43F5E"
                  fillOpacity={0.25}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white border-b border-slate-800 pb-1">{data.fullName}</p>
                          <p className="text-purple-300 flex justify-between gap-3">
                            <span>Calidad Supervisor:</span>
                            <strong className="font-mono">{data.calidadSupervisor} / 10</strong>
                          </p>
                          <p className="text-rose-300 flex justify-between gap-3">
                            <span>Severidad Riesgo:</span>
                            <strong className="font-mono">{data.severidadRiesgo} / 10</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={24}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: '#cbd5e1', paddingTop: '8px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Objetivo de calidad: 10/10 en todas las áreas</span>
            <span>Estándares CCRD / CGR</span>
          </div>
        </div>

        {/* Bar Chart: Budgetary Distribution by Area (Col 7) */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <BarChart2 className="w-4 h-4 text-blue-400" />
                Distribución Presupuestaria de Montos Observados ({currency})
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cuantificación económica de irregularidades por departamento o rubro auditado
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/30">
              {barData.length} Rubros
            </span>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 15, right: 20, left: 10, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="shortRubro"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return `${val}`;
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[200px]">
                          <p className="font-bold text-white border-b border-slate-800 pb-1">{data.rubro}</p>
                          <div className="space-y-1 text-slate-300">
                            <p className="flex justify-between">
                              <span className="text-slate-400">Monto Involucrado:</span>
                              <strong className="text-emerald-400 font-mono">
                                {formatCurrency(data.monto, currency)}
                              </strong>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">Cantidad Hallazgos:</span>
                              <strong className="text-blue-300">{data.cantidad}</strong>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">Puntaje Calidad Prom.:</span>
                              <strong className="text-purple-300 font-mono">{data.avgQuality} / 10</strong>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="monto"
                  name={`Monto Observado (${currency})`}
                  radius={[6, 6, 0, 0]}
                >
                  {barData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pase el cursor sobre las barras para ver detalle de hallazgos y montos</span>
            <span>Fuente: Cédulas Analíticas de Auditoría</span>
          </div>
        </div>

      </div>
    </div>
  );
};
