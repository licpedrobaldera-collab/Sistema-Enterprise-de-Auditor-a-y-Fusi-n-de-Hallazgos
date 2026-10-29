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
  Scale,
  CheckCircle2,
  XCircle,
  Check,
  Lock
} from 'lucide-react';
import { AuditFinding, RiskLevel, FusionRule, SupervisorStatus, UserAccount } from '../types/audit';
import { formatCurrency } from '../utils/exporters';

interface FindingsTableProps {
  findings: AuditFinding[];
  rules: FusionRule[];
  currency: string;
  currentUser?: UserAccount;
  onUpdateFinding: (updated: AuditFinding) => void;
  onDeleteFinding: (id: number) => void;
  onAddFinding: (newFinding: AuditFinding) => void;
  onOpenVoiceModal: () => void;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({
  findings,
  rules,
  currency,
  currentUser,
  onUpdateFinding,
  onDeleteFinding,
  onAddFinding,
  onOpenVoiceModal,
}) => {
  const isMasterAdmin = !currentUser || currentUser.es_master || currentUser.rol === 'MASTER_ADMIN' || currentUser.email === 'licpedrobaldera@gmail.com';

  const canDeleteFinding = (finding: AuditFinding) => {
    if (isMasterAdmin) return true;
    if (finding.estado_supervision === 'Aprobado (10/10)') return false;
    return true;
  };

  const canEditFinding = (finding: AuditFinding) => {
    if (isMasterAdmin) return true;
    if (finding.estado_supervision === 'Aprobado (10/10)') {
      return !!currentUser?.permiso_editar_aprobados;
    }
    return true;
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRubro, setSelectedRubro] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedFusion, setSelectedFusion] = useState<string>('ALL');
  const [selectedSupervision, setSelectedSupervision] = useState<string>('ALL');
  const [selectedValidation, setSelectedValidation] = useState<string>('ALL');

  // Detailed Modal / Edit State
  const [editingFinding, setEditingFinding] = useState<AuditFinding | null>(null);
  const [viewingFinding, setViewingFinding] = useState<AuditFinding | null>(null);

  // New Finding Modal State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<Partial<AuditFinding>>({
    numero_hallazgo: '3.1.01',
    pagina_referencia: 'Pág. 10 - Acta de Hallazgos',
    punto_incidencia: 'Folio 42, Párrafo 2',
    norma_ley_nombre: 'Ley No. 340-06 de Compras y Contrataciones',
    articulo: 'Art. 14',
    numeral: 'Numeral 2',
    literal: 'Literal b',
    fuente_cruzada: 'Cotejo entre Registro Mercantil vs Ofertas Presentadas',
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
    puntuacion_calidad: 10.0,
    estado_supervision: 'Aprobado (10/10)',
    estado_validacion: 'Validado por Auditor',
    incidencia_supervisor: 'Cumple con normas vigentes.',
    ajuste_recomendado_supervisor: 'Punto calificado con 10/10 sin debilidades.',
    cadena_custodia: 'CCRD-EVID-2026-F42-78A1',
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
        (f.norma_ley_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.punto_incidencia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.id.toString().includes(searchTerm);

      const matchRubro = selectedRubro === 'ALL' || f.rubro === selectedRubro;
      const matchRisk = selectedRisk === 'ALL' || f.riesgo === selectedRisk;
      const matchFusion = selectedFusion === 'ALL' || f.fusion_id === selectedFusion;
      const matchSupervision =
        selectedSupervision === 'ALL' || f.estado_supervision === selectedSupervision;
      const matchValidation =
        selectedValidation === 'ALL' || (f.estado_validacion || 'Validado por Auditor') === selectedValidation;

      return matchSearch && matchRubro && matchRisk && matchFusion && matchSupervision && matchValidation;
    });
  }, [findings, searchTerm, selectedRubro, selectedRisk, selectedFusion, selectedSupervision, selectedValidation]);

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

  const handleQuickValidate = (finding: AuditFinding) => {
    onUpdateFinding({
      ...finding,
      estado_supervision: 'Aprobado (10/10)',
      puntuacion_calidad: 10.0,
      estado_validacion: 'Validado por Auditor',
      incidencia_supervisor: 'Punto validado por auditor con trazabilidad completa. Cumple normas.',
      ajuste_recomendado_supervisor: 'Calificación 10/10 definitiva para informe judicial.',
    });
  };

  const handleQuickDiscard = (finding: AuditFinding) => {
    onUpdateFinding({
      ...finding,
      estado_validacion: 'Descartado',
      estado_supervision: 'Requiere Ajuste',
    });
  };

  const handleValidateAllFiltered = () => {
    filteredFindings.forEach((f) => {
      onUpdateFinding({
        ...f,
        estado_supervision: 'Aprobado (10/10)',
        puntuacion_calidad: 10.0,
        estado_validacion: 'Validado por Auditor',
      });
    });
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
      punto_incidencia: newForm.punto_incidencia?.trim() || 'Folio y acta del expediente',
      norma_ley_nombre: newForm.norma_ley_nombre?.trim() || 'Ley de Control Gubernamental',
      articulo: newForm.articulo?.trim() || 'Art. de Ley',
      numeral: newForm.numeral?.trim() || 'Numeral 1',
      literal: newForm.literal?.trim() || 'Literal a',
      fuente_cruzada: newForm.fuente_cruzada?.trim() || 'Cotejo contra registros oficiales',
      titulo: newForm.titulo.trim(),
      rubro: newForm.rubro || 'Gobernanza y Control Interno',
      condicion: newForm.condicion?.trim() || 'Condición observada documentada.',
      criterio: newForm.criterio?.trim() || `${newForm.norma_ley_nombre}, ${newForm.articulo}`,
      causa: newForm.causa?.trim() || 'Falta de supervisión preventiva.',
      efecto: newForm.efecto?.trim() || 'Impacto potencial al erario público.',
      monto: Number(newForm.monto) || 0,
      recomendacion: newForm.recomendacion?.trim() || 'Implementar acciones correctivas inmediatas.',
      conclusion: newForm.conclusion?.trim() || 'Postura pericial forense preliminar.',
      riesgo: (newForm.riesgo as RiskLevel) || 'Medio',
      fusion_id: newForm.fusion_id || 'FUS-01',
      puntuacion_calidad: Number(newForm.puntuacion_calidad) || 10.0,
      estado_supervision: (newForm.estado_supervision as SupervisorStatus) || 'Aprobado (10/10)',
      estado_validacion: 'Nuevo Agregado',
      incidencia_supervisor: newForm.incidencia_supervisor?.trim() || 'Registrado por auditor actuante.',
      ajuste_recomendado_supervisor:
        newForm.ajuste_recomendado_supervisor?.trim() || 'Calificación 10/10.',
      evidencia_soporte: newForm.evidencia_soporte?.trim() || 'Expediente digital auditado',
      cadena_custodia: newForm.cadena_custodia?.trim() || `EVID-HASH-${Date.now()}`,
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
        <span>Ajuste ({score ?? 8.5}/10)</span>
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-6">
      {/* Table Header Section */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/40">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              Matriz de Hallazgos con Trazabilidad Legal de Precisión Judicial
            </h3>
            <span className="bg-slate-800 text-blue-300 border border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
              {filteredFindings.length} de {findings.length} Hallazgos
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Citas normativas exactas (Ley, Artículo, Numeral, Literal), folio de incidencia y fuentes cruzadas de verificación
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleValidateAllFiltered}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow transition"
            title="Llevar todos los hallazgos visibles a 10/10 aprobados"
          >
            <Check className="w-4 h-4 text-emerald-300" />
            <span>Aprobar Todos (10/10)</span>
          </button>
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
            placeholder="Buscar por Ley, Art, Pág, No., Título..."
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

        {/* Validation Filter */}
        <div>
          <select
            value={selectedValidation}
            onChange={(e) => setSelectedValidation(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">🔍 Estado Validación Auditor</option>
            <option value="Validado por Auditor">Validado por Auditor</option>
            <option value="Nuevo Agregado">Nuevo Agregado</option>
            <option value="Descartado">Descartado</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <th className="py-3 px-3 w-28">Ref. / Folio</th>
              <th className="py-3 px-3 w-36">Rubro / Área</th>
              <th className="py-3 px-3 min-w-[260px]">Título y Condición Observada</th>
              <th className="py-3 px-3 min-w-[210px]">Trazabilidad Normativa (Ley, Art, Num, Lit)</th>
              <th className="py-3 px-3 w-32 text-right">Monto ({currency})</th>
              <th className="py-3 px-3 w-28 text-center">Calidad 0-10</th>
              <th className="py-3 px-3 w-28 text-center">Validación</th>
              <th className="py-3 px-3 w-32 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredFindings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No se encontraron hallazgos con los criterios seleccionados.
                </td>
              </tr>
            ) : (
              filteredFindings.map((finding) => {
                const isDiscarded = finding.estado_validacion === 'Descartado';

                return (
                  <tr
                    key={finding.id}
                    className={`hover:bg-slate-800/40 transition group text-slate-300 ${
                      isDiscarded ? 'opacity-40 bg-slate-950/40 line-through' : ''
                    }`}
                  >
                    {/* Ref & Pag */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-blue-400 block">
                        No. {finding.numero_hallazgo || finding.id}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {finding.pagina_referencia || 'Pág. General'}
                      </span>
                      {finding.punto_incidencia && (
                        <span className="text-[9px] text-purple-300 block font-semibold truncate max-w-[110px]" title={finding.punto_incidencia}>
                          {finding.punto_incidencia}
                        </span>
                      )}
                    </td>

                    {/* Rubro */}
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      <span className="line-clamp-2">{finding.rubro}</span>
                      <span className="text-[10px] font-mono text-indigo-400 block mt-0.5">
                        {finding.fusion_id}
                      </span>
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
                    </td>

                    {/* Trazabilidad Normativa Exacta */}
                    <td className="py-3 px-3 text-[11px]">
                      <strong className="text-purple-300 block line-clamp-1" title={finding.norma_ley_nombre || finding.criterio}>
                        {finding.norma_ley_nombre || finding.criterio}
                      </strong>
                      <div className="flex flex-wrap gap-1 text-[10px] text-slate-300 mt-0.5">
                        <span className="bg-slate-800 px-1.5 py-0.2 rounded">
                          {finding.articulo || 'Art. de Ley'}
                        </span>
                        <span className="bg-slate-800 px-1.5 py-0.2 rounded text-amber-300">
                          {finding.numeral || 'Num. N/A'}
                        </span>
                        <span className="bg-slate-800 px-1.5 py-0.2 rounded text-emerald-300">
                          {finding.literal || 'Lit. N/A'}
                        </span>
                      </div>
                      {finding.fuente_cruzada && (
                        <span className="text-[9.5px] text-slate-400 block truncate mt-0.5" title={finding.fuente_cruzada}>
                          Cruce: {finding.fuente_cruzada}
                        </span>
                      )}
                    </td>

                    {/* Monto */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(finding.monto, currency)}
                    </td>

                    {/* Calidad 0-10 */}
                    <td className="py-3 px-3 text-center">
                      {getSupervisionBadge(
                        finding.estado_supervision || 'Aprobado (10/10)',
                        finding.puntuacion_calidad
                      )}
                    </td>

                    {/* Validacion Status */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        finding.estado_validacion === 'Descartado'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/50'
                          : finding.estado_validacion === 'Nuevo Agregado'
                          ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                      }`}>
                        {finding.estado_validacion || 'Validado por Auditor'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleQuickValidate(finding)}
                          className="p-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition"
                          title="Validar y llevar a 10/10"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        </button>
                        <button
                          onClick={() => setViewingFinding(finding)}
                          className="p-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition"
                          title="Ver Cédula Completa"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                        <button
                          onClick={() => {
                            if (!canEditFinding(finding)) {
                              alert('Acceso Restringido: El hallazgo está Aprobado (10/10) por el Administrador. Solo el Administrador Lic. Pedro Baldera puede autorizar la edición de datos aprobados en Gestión de Usuarios.');
                              return;
                            }
                            handleStartEdit(finding);
                          }}
                          className={`p-1 rounded transition ${
                            canEditFinding(finding)
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                              : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                          }`}
                          title={canEditFinding(finding) ? "Editar Cédula y Citas Legales" : "Edición bloqueada: Aprobado por Administrador"}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (!canDeleteFinding(finding)) {
                              alert('Acceso Restringido: Los colaboradores no pueden borrar datos aprobados por el Administrador Lic. Pedro Baldera.');
                              return;
                            }
                            if (window.confirm(`¿Desea descartar o eliminar el hallazgo No. ${finding.numero_hallazgo}?`)) {
                              onDeleteFinding(finding.id);
                            }
                          }}
                          className={`p-1 rounded transition ${
                            canDeleteFinding(finding)
                              ? 'bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300'
                              : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                          }`}
                          title={canDeleteFinding(finding) ? "Eliminar o descartar hallazgo" : "Borrado bloqueado: Aprobado por Administrador"}
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
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
                  1. Condición Observada (Hechos Reales Extraídos):
                </strong>
                <p className="text-slate-200 leading-relaxed">{viewingFinding.condicion}</p>
              </div>

              {/* Legal Reference Precision Box */}
              <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-3.5 space-y-2">
                <strong className="text-purple-300 block flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-purple-400" />
                  2. Fundamentación Legal Exacta y Trazabilidad Judicial:
                </strong>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Norma / Ley:</span>
                    <strong>{viewingFinding.norma_ley_nombre || viewingFinding.criterio}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Artículo:</span>
                    <strong className="text-amber-300">{viewingFinding.articulo || 'Art. Aplicable'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Numeral:</span>
                    <strong className="text-cyan-300">{viewingFinding.numeral || 'Numeral Específico'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Literal:</span>
                    <strong className="text-emerald-300">{viewingFinding.literal || 'Literal Específico'}</strong>
                  </div>
                </div>
                {viewingFinding.fuente_cruzada && (
                  <div className="pt-1 text-[11px] text-slate-400 border-t border-purple-900/40">
                    <strong>Fuente Cruzada de Comprobación:</strong> {viewingFinding.fuente_cruzada}
                  </div>
                )}
                {viewingFinding.punto_incidencia && (
                  <div className="text-[11px] text-purple-300">
                    <strong>Punto de Incidencia / Folio:</strong> {viewingFinding.punto_incidencia}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <strong className="text-rose-300 block mb-1">3. Causa Raíz:</strong>
                  <p className="text-slate-300">{viewingFinding.causa}</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <strong className="text-purple-300 block mb-1">4. Efecto / Impacto Patrimonial:</strong>
                  <p className="text-slate-300">{viewingFinding.efecto}</p>
                  <p className="font-mono text-emerald-400 font-bold mt-1">
                    Monto: {formatCurrency(viewingFinding.monto, currency)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <strong className="text-emerald-300 block mb-1">5. Recomendación del Auditor:</strong>
                  <p className="text-slate-300">{viewingFinding.recomendacion}</p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <strong className="text-blue-300 block mb-1">6. Conclusión y Postura Forense:</strong>
                  <p className="text-slate-300">{viewingFinding.conclusion}</p>
                </div>
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
              <span>Editar Hallazgo No. {editingFinding.numero_hallazgo} & Citas Legales</span>
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
                    Punto de Incidencia / Folio
                  </label>
                  <input
                    type="text"
                    value={editingFinding.punto_incidencia || ''}
                    onChange={(e) =>
                      setEditingFinding({ ...editingFinding, punto_incidencia: e.target.value })
                    }
                    placeholder="Ej: Folio 45, Acta No. 2"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-purple-300 font-mono"
                  />
                </div>
              </div>

              {/* Exact Legal Grounding Inputs */}
              <div className="bg-purple-950/20 border border-purple-800/40 p-3 rounded-xl space-y-2">
                <span className="text-xs font-bold text-purple-300 block">
                  Fundamento Jurídico Exacto (Ley, Artículo, Numeral, Literal):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Nombre Formal de la Ley</label>
                    <input
                      type="text"
                      value={editingFinding.norma_ley_nombre || editingFinding.criterio || ''}
                      onChange={(e) =>
                        setEditingFinding({ ...editingFinding, norma_ley_nombre: e.target.value, criterio: e.target.value })
                      }
                      placeholder="Ej: Ley No. 340-06 de Compras y Contrataciones"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Artículo</label>
                    <input
                      type="text"
                      value={editingFinding.articulo || ''}
                      onChange={(e) => setEditingFinding({ ...editingFinding, articulo: e.target.value })}
                      placeholder="Ej: Art. 14"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Numeral y Literal</label>
                    <input
                      type="text"
                      value={editingFinding.numeral ? `${editingFinding.numeral} ${editingFinding.literal || ''}` : ''}
                      onChange={(e) => {
                        const parts = e.target.value.split(' ');
                        setEditingFinding({
                          ...editingFinding,
                          numeral: parts[0] || '',
                          literal: parts.slice(1).join(' ') || '',
                        });
                      }}
                      placeholder="Ej: Numeral 2 Literal b"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Fuente Cruzada de Comprobación</label>
                  <input
                    type="text"
                    value={editingFinding.fuente_cruzada || ''}
                    onChange={(e) => setEditingFinding({ ...editingFinding, fuente_cruzada: e.target.value })}
                    placeholder="Ej: Cruce de Nómina SIGEF vs Portal de Transparencia vs Cheques"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nivel de Riesgo</label>
                  <select
                    value={editingFinding.riesgo}
                    onChange={(e) =>
                      setEditingFinding({ ...editingFinding, riesgo: e.target.value as RiskLevel })
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
                  <label className="block text-slate-300 font-semibold mb-1">Estado Validación</label>
                  <select
                    value={editingFinding.estado_validacion || 'Validado por Auditor'}
                    onChange={(e) =>
                      setEditingFinding({ ...editingFinding, estado_validacion: e.target.value as any })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Validado por Auditor">Validado por Auditor</option>
                    <option value="Requiere Ajuste">Requiere Ajuste</option>
                    <option value="Descartado">Descartado</option>
                    <option value="Nuevo Agregado">Nuevo Agregado</option>
                  </select>
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
                <span>Registrar Nuevo Hallazgo con Citas Legales Exactas</span>
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
                    Punto de Incidencia / Folio
                  </label>
                  <input
                    type="text"
                    value={newForm.punto_incidencia || ''}
                    onChange={(e) => setNewForm({ ...newForm, punto_incidencia: e.target.value })}
                    placeholder="Ej: Folio 14, Párrafo 2"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-purple-300 font-mono"
                  />
                </div>
              </div>

              {/* Exact Legal Grounding Inputs */}
              <div className="bg-purple-950/20 border border-purple-800/40 p-3 rounded-xl space-y-2">
                <span className="text-xs font-bold text-purple-300 block">
                  Cita Normativa de Precisión Judicial:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Nombre Formal de la Ley</label>
                    <input
                      type="text"
                      value={newForm.norma_ley_nombre || ''}
                      onChange={(e) => setNewForm({ ...newForm, norma_ley_nombre: e.target.value, criterio: e.target.value })}
                      placeholder="Ej: Ley No. 340-06 sobre Compras y Contrataciones"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Artículo</label>
                    <input
                      type="text"
                      value={newForm.articulo || ''}
                      onChange={(e) => setNewForm({ ...newForm, articulo: e.target.value })}
                      placeholder="Ej: Art. 14"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Numeral y Literal</label>
                    <input
                      type="text"
                      value={newForm.numeral ? `${newForm.numeral} ${newForm.literal || ''}` : ''}
                      onChange={(e) => {
                        const parts = e.target.value.split(' ');
                        setNewForm({
                          ...newForm,
                          numeral: parts[0] || '',
                          literal: parts.slice(1).join(' ') || '',
                        });
                      }}
                      placeholder="Ej: Numeral 2 Literal b"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Fuente Cruzada de Comprobación</label>
                  <input
                    type="text"
                    value={newForm.fuente_cruzada || ''}
                    onChange={(e) => setNewForm({ ...newForm, fuente_cruzada: e.target.value })}
                    placeholder="Ej: Cotejo SIGEF vs Nómina Portal Transparencia"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
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
                  placeholder="Ej: Pagos no justificados en servicios sin comprobante válido"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <label className="block text-slate-300 font-semibold mb-1">Fusión Asignada</label>
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
