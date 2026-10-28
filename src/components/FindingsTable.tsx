import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  FileText,
  Star,
  ChevronDown,
  ChevronUp,
  Maximize2,
  BookOpen,
} from 'lucide-react';
import { AuditFinding, RiskLevel, FusionRule, SupervisorStatus } from '../types/audit';
import { formatCurrency } from '../utils/exporters';

interface FindingsTableProps {
  findings: AuditFinding[];
  rules: FusionRule[];
  currency: string;
  onUpdateFinding: (updated: AuditFinding) => void;
  onDeleteFinding: (id: number) => void;
  onAddFinding: (newFinding: AuditFinding) => void;
  onOpenVoiceModal: () => void;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({
  findings,
  rules,
  currency,
  onUpdateFinding,
  onDeleteFinding,
  onAddFinding,
  onOpenVoiceModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRubro, setSelectedRubro] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedFusion, setSelectedFusion] = useState<string>('ALL');
  const [selectedSupervision, setSelectedSupervision] = useState<string>('ALL');

  // Detailed Modal / Edit State
  const [editingFinding, setEditingFinding] = useState<AuditFinding | null>(null);
  const [viewingFinding, setViewingFinding] = useState<AuditFinding | null>(null);

  // New Finding Modal State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<Partial<AuditFinding>>({
    numero_hallazgo: '3.1.01',
    pagina_referencia: 'Pág. 10 - Acta de Hallazgos',
    titulo: '',
    rubro: 'Gobernanza y Control Interno',
    condicion: '',
    criterio: 'Ley 10-07 del Sistema Nacional de Control Interno; Normas NOBACI.',
    causa: 'Ausencia de supervisión y debilidad en controles internos preventivos.',
    efecto: 'Riesgo patrimonial y limitación a la certeza del gasto.',
    monto: 0,
    recomendacion: 'Establecer controles institucionales inmediatos y archivar soportes.',
    conclusion: 'Se determina incumplimiento a la normativa gubernamental vigente.',
    riesgo: 'Alto',
    fusion_id: 'FUS-01',
    puntuacion_calidad: 8.5,
    estado_supervision: 'Requiere Ajuste',
    incidencia_supervisor: 'Falta cuantificar la muestra analizada según guías de la Cámara de Cuentas.',
    ajuste_recomendado_supervisor: 'Incorporar el universo total y citar el artículo específico para elevar a 10/10.',
    evidencia_soporte: '',
  });

  // Extract unique rubros for filter dropdown
  const rubros = useMemo(() => {
    const list = Array.from(new Set(findings.map((f) => f.rubro).filter(Boolean)));
    return list.sort();
  }, [findings]);

  // Filtered findings
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSearch =
        searchTerm === '' ||
        f.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.condicion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.numero_hallazgo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.pagina_referencia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.id.toString().includes(searchTerm);

      const matchRubro = selectedRubro === 'ALL' || f.rubro === selectedRubro;
      const matchRisk = selectedRisk === 'ALL' || f.riesgo === selectedRisk;
      const matchFusion = selectedFusion === 'ALL' || f.fusion_id === selectedFusion;
      const matchSupervision =
        selectedSupervision === 'ALL' || f.estado_supervision === selectedSupervision;

      return matchSearch && matchRubro && matchRisk && matchFusion && matchSupervision;
    });
  }, [findings, searchTerm, selectedRubro, selectedRisk, selectedFusion, selectedSupervision]);

  // Total amount observed
  const totalAmount = useMemo(() => {
    return filteredFindings.reduce((acc, curr) => acc + (curr.monto || 0), 0);
  }, [filteredFindings]);

  const handleStartEdit = (finding: AuditFinding) => {
    setEditingFinding({ ...finding });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFinding) {
      onUpdateFinding(editingFinding);
      setEditingFinding(null);
    }
  };

  const handleCreateFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.titulo?.trim()) return;

    const nextId =
      findings.length > 0 ? Math.max(...findings.map((f) => f.id)) + 1 : 1;

    const created: AuditFinding = {
      id: nextId,
      numero_hallazgo: newForm.numero_hallazgo?.trim() || `3.1.${nextId}`,
      pagina_referencia: newForm.pagina_referencia?.trim() || 'Pág. General',
      titulo: newForm.titulo.trim(),
      rubro: newForm.rubro || 'Gobernanza y Control Interno',
      condicion: newForm.condicion?.trim() || 'Condición observada documentada.',
      criterio: newForm.criterio?.trim() || 'Normativa de Control Interno Vigente',
      causa: newForm.causa?.trim() || 'Falta de supervisión preventiva.',
      efecto: newForm.efecto?.trim() || 'Impacto potencial al erario público.',
      monto: Number(newForm.monto) || 0,
      recomendacion: newForm.recomendacion?.trim() || 'Implementar acciones correctivas inmediatas.',
      conclusion: newForm.conclusion?.trim() || 'Postura pericial forense preliminar.',
      riesgo: (newForm.riesgo as RiskLevel) || 'Medio',
      fusion_id: newForm.fusion_id || 'FUS-01',
      puntuacion_calidad: Number(newForm.puntuacion_calidad) || 8.5,
      estado_supervision: (newForm.estado_supervision as SupervisorStatus) || 'Requiere Ajuste',
      incidencia_supervisor: newForm.incidencia_supervisor?.trim() || 'Revisión técnica en proceso.',
      ajuste_recomendado_supervisor:
        newForm.ajuste_recomendado_supervisor?.trim() || 'Ajustar redacción para 10/10.',
      evidencia_soporte: newForm.evidencia_soporte?.trim() || 'Expediente digital auditado',
      fecha_registro: new Date().toISOString().slice(0, 10),
      estado: 'Confirmado',
    };

    onAddFinding(created);
    setIsAddingNew(false);
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'Crítico':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Alto':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Medio':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'Bajo':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const getSupervisionBadge = (status: SupervisorStatus, score?: number) => {
    if (status === 'Aprobado (10/10)') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          <span>Aprobado (10/10)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-amber-950/80 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
        <AlertCircle className="w-3 h-3 text-amber-400" />
        <span>{score ? `${score}/10` : ''} Requiere Ajuste</span>
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-6">
      {/* Table Header & Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              Matriz de Hallazgos Extraídos (Hoja 1: Estructura Completa & Evaluación 0-10)
            </h3>
            <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-mono">
              {filteredFindings.length} de {findings.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Incluye número, página de referencia, condición, criterios, causas, efecto, recomendación,
            conclusión y dictamen del supervisor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Hallazgo</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950/60 p-3 sm:p-4 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Pág, No., Título o Hecho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Rubro Filter */}
        <div>
          <select
            value={selectedRubro}
            onChange={(e) => setSelectedRubro(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">📁 Todos los Rubros ({rubros.length})</option>
            {rubros.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Risk Filter */}
        <div>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">⚠️ Todos los Riesgos</option>
            <option value="Crítico">🔴 Crítico</option>
            <option value="Alto">🟠 Alto</option>
            <option value="Medio">🟡 Medio</option>
            <option value="Bajo">🔵 Bajo</option>
          </select>
        </div>

        {/* Supervision Filter */}
        <div>
          <select
            value={selectedSupervision}
            onChange={(e) => setSelectedSupervision(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">⭐ Control Calidad Supervisor</option>
            <option value="Aprobado (10/10)">✅ Aprobado (10/10)</option>
            <option value="Requiere Ajuste">⚠️ Requiere Ajuste</option>
          </select>
        </div>

        {/* Fusion Group Filter */}
        <div>
          <select
            value={selectedFusion}
            onChange={(e) => setSelectedFusion(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">🔗 Todas las Fusiones</option>
            {rules.map((rule) => (
              <option key={rule.fusion_id} value={rule.fusion_id}>
                {rule.fusion_id} - {rule.rubro.slice(0, 20)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <th className="py-3 px-3 w-28">Ref. / Página</th>
              <th className="py-3 px-3 w-40">Rubro / Área</th>
              <th className="py-3 px-3 min-w-[280px]">Título y Condición Observada</th>
              <th className="py-3 px-3 w-32 text-right">Monto ({currency})</th>
              <th className="py-3 px-3 w-24 text-center">Riesgo</th>
              <th className="py-3 px-3 w-36 text-center">Control Calidad Supervisor</th>
              <th className="py-3 px-3 min-w-[240px]">Debilidad & Ajuste IA para 10/10</th>
              <th className="py-3 px-3 w-20 text-center">Fusión</th>
              <th className="py-3 px-3 w-24 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredFindings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  No se encontraron hallazgos con los criterios seleccionados.
                </td>
              </tr>
            ) : (
              filteredFindings.map((finding) => {
                return (
                  <tr
                    key={finding.id}
                    className="hover:bg-slate-800/40 transition group text-slate-300"
                  >
                    {/* Ref & Pag */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-blue-400 block">
                        No. {finding.numero_hallazgo || finding.id}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {finding.pagina_referencia || 'Pág. No indicada'}
                      </span>
                    </td>

                    {/* Rubro */}
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      <span className="line-clamp-2">{finding.rubro}</span>
                    </td>

                    {/* Titulo y Condicion */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-xs leading-snug">
                        {finding.titulo}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                        <strong className="text-slate-400">Condición: </strong>
                        {finding.condicion}
                      </p>
                      {finding.criterio && (
                        <p className="text-[10px] text-amber-300/90 mt-0.5 line-clamp-1">
                          <strong>Criterio: </strong>
                          {finding.criterio}
                        </p>
                      )}
                    </td>

                    {/* Monto */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(finding.monto, currency)}
                    </td>

                    {/* Riesgo */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block border px-2 py-0.5 rounded-full text-[10px] font-semibold ${getRiskBadge(
                          finding.riesgo
                        )}`}
                      >
                        {finding.riesgo}
                      </span>
                    </td>

                    {/* Control Calidad Supervisor */}
                    <td className="py-3 px-3 text-center">
                      {getSupervisionBadge(
                        finding.estado_supervision || 'Aprobado (10/10)',
                        finding.puntuacion_calidad
                      )}
                    </td>

                    {/* Debilidad & Ajuste IA */}
                    <td className="py-3 px-3 text-[11px] leading-relaxed">
                      {finding.estado_supervision === 'Aprobado (10/10)' ? (
                        <span className="text-emerald-400 text-[10px] font-semibold">
                          Punto conforme con normas Cámara de Cuentas / CGR. Sin debilidades.
                        </span>
                      ) : (
                        <div>
                          <p className="text-amber-300/90 line-clamp-2">
                            <strong>Incidencia: </strong>
                            {finding.incidencia_supervisor}
                          </p>
                          <p className="text-blue-300/90 line-clamp-2 mt-0.5 font-medium">
                            <strong>Ajuste IA 10/10: </strong>
                            {finding.ajuste_recomendado_supervisor}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Fusión */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                        {finding.fusion_id}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => setViewingFinding(finding)}
                          className="p-1.5 rounded hover:bg-slate-700 text-blue-400 hover:text-blue-300"
                          title="Ver Cédula Completa"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(finding)}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                          title="Editar en pantalla"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Confirma eliminar el hallazgo No. ${finding.numero_hallazgo}: "${finding.titulo}"?`
                              )
                            ) {
                              onDeleteFinding(finding.id);
                            }
                          }}
                          className="p-1.5 rounded hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                          title="Borrar hallazgo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: Ver Cédula Completa */}
      {viewingFinding && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingFinding(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-900/50 text-blue-300 border border-blue-700/50 font-mono text-xs font-bold px-2.5 py-1 rounded-md">
                No. {viewingFinding.numero_hallazgo}
              </span>
              <span className="text-slate-400 text-xs font-mono">
                {viewingFinding.pagina_referencia}
              </span>
              <span className="ml-auto">
                {getSupervisionBadge(
                  viewingFinding.estado_supervision,
                  viewingFinding.puntuacion_calidad
                )}
              </span>
            </div>

            <h3 className="text-base font-bold text-white mb-4">{viewingFinding.titulo}</h3>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <strong className="text-blue-300 block mb-1">
                  1. Condición Observada (Hechos Completos Extraídos):
                </strong>
                <p className="text-slate-200 leading-relaxed">{viewingFinding.condicion}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <strong className="text-amber-300 block mb-1">2. Criterios Legales / Normas:</strong>
                  <p className="text-slate-300">{viewingFinding.criterio}</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <strong className="text-rose-300 block mb-1">3. Causa Raíz:</strong>
                  <p className="text-slate-300">{viewingFinding.causa}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <strong className="text-purple-300 block mb-1">4. Efecto / Impacto:</strong>
                  <p className="text-slate-300">{viewingFinding.efecto}</p>
                  <p className="font-mono text-emerald-400 font-bold mt-1">
                    Monto: {formatCurrency(viewingFinding.monto, currency)}
                  </p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <strong className="text-emerald-300 block mb-1">5. Recomendación del Auditor:</strong>
                  <p className="text-slate-300">{viewingFinding.recomendacion}</p>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <strong className="text-blue-300 block mb-1">6. Conclusión y Postura Forense:</strong>
                <p className="text-slate-300">{viewingFinding.conclusion}</p>
              </div>

              <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-3.5">
                <strong className="text-amber-300 block mb-1">
                  7. Dictamen de Calidad del Supervisor (0-10):
                </strong>
                <p className="text-slate-300">
                  <span className="font-bold text-white">Incidencia Detectada: </span>
                  {viewingFinding.incidencia_supervisor}
                </p>
                <p className="text-blue-300 mt-1">
                  <span className="font-bold text-white">Ajuste IA para 10/10: </span>
                  {viewingFinding.ajuste_recomendado_supervisor}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewingFinding(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Editar Hallazgo Completo en Pantalla */}
      {editingFinding && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setEditingFinding(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-400" />
              <span>Editar Hallazgo No. {editingFinding.numero_hallazgo} en Pantalla</span>
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    No. de Hallazgo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingFinding.numero_hallazgo}
                    onChange={(e) =>
                      setEditingFinding({ ...editingFinding, numero_hallazgo: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Página / Fuente Ref. *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingFinding.pagina_referencia}
                    onChange={(e) =>
                      setEditingFinding({ ...editingFinding, pagina_referencia: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Monto Observado ({currency})
                  </label>
                  <input
                    type="number"
                    value={editingFinding.monto}
                    onChange={(e) =>
                      setEditingFinding({
                        ...editingFinding,
                        monto: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Título del Hallazgo *
                </label>
                <input
                  type="text"
                  required
                  value={editingFinding.titulo}
                  onChange={(e) => setEditingFinding({ ...editingFinding, titulo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Condición Observada (Hechos Reales Extraídos) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingFinding.condicion}
                  onChange={(e) =>
                    setEditingFinding({ ...editingFinding, condicion: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Criterios Legales / Normas
                  </label>
                  <textarea
                    rows={2}
                    value={editingFinding.criterio}
                    onChange={(e) =>
                      setEditingFinding({ ...editingFinding, criterio: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Causa Raíz</label>
                  <textarea
                    rows={2}
                    value={editingFinding.causa}
                    onChange={(e) => setEditingFinding({ ...editingFinding, causa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Recomendación del Auditor
                  </label>
                  <textarea
                    rows={2}
                    value={editingFinding.recomendacion}
                    onChange={(e) =>
                      setEditingFinding({ ...editingFinding, recomendacion: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Conclusión Forense Pericial
                  </label>
                  <textarea
                    rows={2}
                    value={editingFinding.conclusion}
                    onChange={(e) =>
                      setEditingFinding({ ...editingFinding, conclusion: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              {/* Evaluación del Supervisor */}
              <div className="bg-slate-950 border border-blue-900/50 p-3.5 rounded-xl space-y-3">
                <span className="font-bold text-blue-300 text-xs block">
                  Control de Calidad del Supervisor (Escala 0 a 10):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Calificación (0 - 10)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={editingFinding.puntuacion_calidad}
                      onChange={(e) =>
                        setEditingFinding({
                          ...editingFinding,
                          puntuacion_calidad: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Estado de Supervisión
                    </label>
                    <select
                      value={editingFinding.estado_supervision}
                      onChange={(e) =>
                        setEditingFinding({
                          ...editingFinding,
                          estado_supervision: e.target.value as SupervisorStatus,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    >
                      <option value="Aprobado (10/10)">Aprobado (10/10)</option>
                      <option value="Requiere Ajuste">Requiere Ajuste</option>
                      <option value="Fusionado">Fusionado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Código Fusión
                    </label>
                    <select
                      value={editingFinding.fusion_id}
                      onChange={(e) =>
                        setEditingFinding({ ...editingFinding, fusion_id: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    >
                      {rules.map((r) => (
                        <option key={r.fusion_id} value={r.fusion_id}>
                          {r.fusion_id} - {r.rubro.slice(0, 18)}...
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Debilidad o Incidencia Detectada (Cámara de Cuentas / CGR)
                  </label>
                  <input
                    type="text"
                    value={editingFinding.incidencia_supervisor}
                    onChange={(e) =>
                      setEditingFinding({
                        ...editingFinding,
                        incidencia_supervisor: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Ajuste Recomendado con IA para Elevar a 10/10
                  </label>
                  <input
                    type="text"
                    value={editingFinding.ajuste_recomendado_supervisor}
                    onChange={(e) =>
                      setEditingFinding({
                        ...editingFinding,
                        ajuste_recomendado_supervisor: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-blue-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFinding(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Crear Nuevo Hallazgo Manual con Datos Reales */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddingNew(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Registrar Nuevo Hallazgo con Estructura Forense Completa</span>
              </h3>
              <button
                type="button"
                onClick={onOpenVoiceModal}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Dictar con Voz
              </button>
            </div>

            <form onSubmit={handleCreateFinding} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    No. Hallazgo (ej: 3.1.01) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newForm.numero_hallazgo}
                    onChange={(e) => setNewForm({ ...newForm, numero_hallazgo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Página Fuente (ej: Pág. 10) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newForm.pagina_referencia}
                    onChange={(e) => setNewForm({ ...newForm, pagina_referencia: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Monto Observado ({currency})
                  </label>
                  <input
                    type="number"
                    value={newForm.monto}
                    onChange={(e) =>
                      setNewForm({ ...newForm, monto: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Título del Hallazgo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Contratación de servicios de mantenimiento sin cotizaciones"
                  value={newForm.titulo}
                  onChange={(e) => setNewForm({ ...newForm, titulo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Condición Observada (Hechos Completos Extraídos) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe detalladamente los hechos constatados..."
                  value={newForm.condicion}
                  onChange={(e) => setNewForm({ ...newForm, condicion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Criterios Legales / Normativos
                  </label>
                  <input
                    type="text"
                    value={newForm.criterio}
                    onChange={(e) => setNewForm({ ...newForm, criterio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Causa Raíz</label>
                  <input
                    type="text"
                    value={newForm.causa}
                    onChange={(e) => setNewForm({ ...newForm, causa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Recomendación del Auditor
                  </label>
                  <input
                    type="text"
                    value={newForm.recomendacion}
                    onChange={(e) => setNewForm({ ...newForm, recomendacion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Conclusión Forense
                  </label>
                  <input
                    type="text"
                    value={newForm.conclusion}
                    onChange={(e) => setNewForm({ ...newForm, conclusion: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nivel de Riesgo</label>
                  <select
                    value={newForm.riesgo}
                    onChange={(e) =>
                      setNewForm({ ...newForm, riesgo: e.target.value as RiskLevel })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Bajo">Bajo</option>
                    <option value="Medio">Medio</option>
                    <option value="Alto">Alto</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Calificación Inicial (0-10)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={newForm.puntuacion_calidad}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        puntuacion_calidad: parseFloat(e.target.value) || 8.5,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Fusión Asignada
                  </label>
                  <select
                    value={newForm.fusion_id}
                    onChange={(e) => setNewForm({ ...newForm, fusion_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    {rules.map((r) => (
                      <option key={r.fusion_id} value={r.fusion_id}>
                        {r.fusion_id} - {r.rubro.slice(0, 18)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg"
                >
                  Registrar Hallazgo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
