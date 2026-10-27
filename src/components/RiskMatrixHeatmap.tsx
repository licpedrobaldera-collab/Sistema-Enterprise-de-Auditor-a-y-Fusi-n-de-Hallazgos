import React from 'react';
import { ShieldAlert, TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { AuditFinding } from '../types/audit';
import { formatCurrency } from '../utils/exporters';

interface RiskMatrixHeatmapProps {
  findings: AuditFinding[];
  currency: string;
}

export const RiskMatrixHeatmap: React.FC<RiskMatrixHeatmapProps> = ({ findings, currency }) => {
  const totalFindings = findings.length;
  const criticalFindings = findings.filter((f) => f.riesgo === 'Crítico');
  const highFindings = findings.filter((f) => f.riesgo === 'Alto');
  const mediumFindings = findings.filter((f) => f.riesgo === 'Medio');
  const lowFindings = findings.filter((f) => f.riesgo === 'Bajo');

  const totalAmount = findings.reduce((acc, f) => acc + (f.monto || 0), 0);
  const criticalAmount = criticalFindings.reduce((acc, f) => acc + (f.monto || 0), 0);

  // Group by rubro for quick distribution
  const rubroMap = findings.reduce((acc, f) => {
    acc[f.rubro] = (acc[f.rubro] || 0) + (f.monto || 0);
    return acc;
  }, {} as Record<string, number>);

  const rubroList = Object.entries(rubroMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Evaluación Integral de Riesgo & Impacto Financiero
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Matriz de calor COSO ERM y distribución patrimonial de irregularidades detectadas
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Exposición en Riesgo Crítico:</span>
          <span className="font-mono font-bold text-rose-400">
            {formatCurrency(criticalAmount, currency)} (
            {totalAmount > 0 ? ((criticalAmount / totalAmount) * 100).toFixed(1) : 0}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
        {/* KPI 1 */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Total Hallazgos
            </span>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{totalFindings}</p>
            <span className="text-[10px] text-slate-500">Cédulas de auditoría</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Monto Observado
            </span>
            <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              {formatCurrency(totalAmount, currency)}
            </p>
            <span className="text-[10px] text-slate-500">Riesgo patrimonial total</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Severidad Crítica
            </span>
            <p className="text-2xl font-bold text-rose-400 mt-1 font-mono">
              {criticalFindings.length}
            </p>
            <span className="text-[10px] text-rose-400/80">Requieren acción penal / CGR</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-950 border border-rose-800/50 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              Nivel de Fusión
            </span>
            <p className="text-2xl font-bold text-indigo-400 mt-1 font-mono">
              {findings.filter((f) => f.fusion_id).length} / {totalFindings}
            </p>
            <span className="text-[10px] text-indigo-300">100% agrupados en causas raíz</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Heatmap Bar / Breakdown */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <span className="text-xs font-semibold text-slate-300 block mb-2">
          Distribución de Hallazgos por Nivel de Riesgo (Semáforo de Auditoría):
        </span>
        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex ring-1 ring-slate-800">
          <div
            style={{ width: `${(criticalFindings.length / (totalFindings || 1)) * 100}%` }}
            className="bg-rose-500 h-full transition-all"
            title={`Crítico: ${criticalFindings.length}`}
          />
          <div
            style={{ width: `${(highFindings.length / (totalFindings || 1)) * 100}%` }}
            className="bg-amber-500 h-full transition-all"
            title={`Alto: ${highFindings.length}`}
          />
          <div
            style={{ width: `${(mediumFindings.length / (totalFindings || 1)) * 100}%` }}
            className="bg-yellow-500 h-full transition-all"
            title={`Medio: ${mediumFindings.length}`}
          />
          <div
            style={{ width: `${(lowFindings.length / (totalFindings || 1)) * 100}%` }}
            className="bg-blue-500 h-full transition-all"
            title={`Bajo: ${lowFindings.length}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs mt-2 text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Crítico: {criticalFindings.length}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Alto: {highFindings.length}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>Medio: {mediumFindings.length}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Bajo: {lowFindings.length}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
