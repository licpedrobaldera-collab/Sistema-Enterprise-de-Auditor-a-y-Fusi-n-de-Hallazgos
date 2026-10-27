import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  Tag,
  DollarSign,
  HelpCircle,
} from 'lucide-react';
import { AuditFinding, RiskLevel, FusionRule } from '../types/audit';
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

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AuditFinding | null>(null);

  // New Finding Modal State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<Partial<AuditFinding>>({
    titulo: '',
    rubro: 'Gobernanza y Control Interno',
    descripcion: '',
    monto: 0,
    riesgo: 'Medio',
    fusion_id: 'FUS-01',
    criterio: '',
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
        f.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.id.toString().includes(searchTerm);

      const matchRubro = selectedRubro === 'ALL' || f.rubro === selectedRubro;
      const matchRisk = selectedRisk === 'ALL' || f.riesgo === selectedRisk;
      const matchFusion = selectedFusion === 'ALL' || f.fusion_id === selectedFusion;

      return matchSearch && matchRubro && matchRisk && matchFusion;
    });
  }, [findings, searchTerm, selectedRubro, selectedRisk, selectedFusion]);

  // Total amount observed
  const totalAmount = useMemo(() => {
    return filteredFindings.reduce((acc, curr) => acc + (curr.monto || 0), 0);
  }, [filteredFindings]);

  const handleStartEdit = (finding: AuditFinding) => {
    setEditingId(finding.id);
    setEditForm({ ...finding });
  };

  const handleSaveEdit = () => {
    if (editForm) {
      onUpdateFinding(editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleCreateFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.titulo?.trim()) return;

    const nextId =
      findings.length > 0 ? Math.max(...findings.map((f) => f.id)) + 1 : 1;

    const created: AuditFinding = {
      id: nextId,
      titulo: newForm.titulo.trim(),
      rubro: newForm.rubro || 'Gobernanza y Control Interno',
      descripcion: newForm.descripcion?.trim() || 'Sin descripción adicional.',
      monto: Number(newForm.monto) || 0,
      riesgo: (newForm.riesgo as RiskLevel) || 'Medio',
      fusion_id: newForm.fusion_id || 'FUS-01',
      criterio: newForm.criterio?.trim() || 'Normativa de Control Interno Vigente',
      fecha_registro: new Date().toISOString().slice(0, 10),
      estado: 'Confirmado',
    };

    onAddFinding(created);
    setIsAddingNew(false);
    setNewForm({
      titulo: '',
      rubro: 'Gobernanza y Control Interno',
      descripcion: '',
      monto: 0,
      riesgo: 'Medio',
      fusion_id: 'FUS-01',
      criterio: '',
    });
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-6">
      {/* Table Header & Toolbar */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              Matriz de Hallazgos Reales Identificados
            </h3>
            <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-mono">
              {filteredFindings.length} de {findings.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monto acumulado en vista:{' '}
            <span className="text-emerald-400 font-bold font-mono">
              {formatCurrency(totalAmount, currency)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Hallazgo</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-950/60 p-4 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ID, título o descripción..."
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

        {/* Fusion Group Filter */}
        <div>
          <select
            value={selectedFusion}
            onChange={(e) => setSelectedFusion(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">🔗 Todos los Grupos de Fusión</option>
            {rules.map((rule) => (
              <option key={rule.fusion_id} value={rule.fusion_id}>
                {rule.fusion_id} - {rule.rubro.slice(0, 24)}...
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
              <th className="py-3 px-4 w-12 text-center">No.</th>
              <th className="py-3 px-4 w-44">Rubro / Área</th>
              <th className="py-3 px-4 min-w-[220px]">Título del Hallazgo</th>
              <th className="py-3 px-4 min-w-[300px]">Condición Observada</th>
              <th className="py-3 px-4 w-36 text-right">Monto ({currency})</th>
              <th className="py-3 px-4 w-24 text-center">Riesgo</th>
              <th className="py-3 px-4 w-24 text-center">Fusión</th>
              <th className="py-3 px-4 w-24 text-center">Acciones</th>
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
                const isEditing = editingId === finding.id;

                if (isEditing && editForm) {
                  return (
                    <tr key={finding.id} className="bg-blue-950/30">
                      <td className="py-3 px-4 text-center font-mono font-bold text-blue-400">
                        {editForm.id}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editForm.rubro}
                          onChange={(e) => setEditForm({ ...editForm, rubro: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editForm.titulo}
                          onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-medium"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <textarea
                          rows={2}
                          value={editForm.descripcion}
                          onChange={(e) =>
                            setEditForm({ ...editForm, descripcion: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          value={editForm.monto}
                          onChange={(e) =>
                            setEditForm({ ...editForm, monto: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-400 font-mono text-right"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={editForm.riesgo}
                          onChange={(e) =>
                            setEditForm({ ...editForm, riesgo: e.target.value as RiskLevel })
                          }
                          className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200"
                        >
                          <option value="Bajo">Bajo</option>
                          <option value="Medio">Medio</option>
                          <option value="Alto">Alto</option>
                          <option value="Crítico">Crítico</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={editForm.fusion_id}
                          onChange={(e) => setEditForm({ ...editForm, fusion_id: e.target.value })}
                          className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-200"
                        >
                          {rules.map((r) => (
                            <option key={r.fusion_id} value={r.fusion_id}>
                              {r.fusion_id}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                            title="Salvar cambios"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={finding.id}
                    className="hover:bg-slate-800/40 transition group text-slate-300"
                  >
                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-400">
                      #{finding.id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      <span className="line-clamp-2">{finding.rubro}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <span className="line-clamp-2">{finding.titulo}</span>
                      {finding.criterio && (
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1">
                          Norma: {finding.criterio}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <p className="line-clamp-2">{finding.descripcion}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-emerald-400">
                      {formatCurrency(finding.monto, currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block border px-2 py-0.5 rounded-full text-[10px] font-semibold ${getRiskBadge(
                          finding.riesgo
                        )}`}
                      >
                        {finding.riesgo}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block bg-blue-900/40 border border-blue-700/50 text-blue-300 px-2 py-0.5 rounded font-mono text-[11px] font-bold">
                        {finding.fusion_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleStartEdit(finding)}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                          title="Editar resultado en pantalla"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `¿Confirma eliminar el hallazgo #${finding.id}: "${finding.titulo}"?`
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

      {/* New Finding Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddingNew(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <span>Agregar Nuevo Hallazgo a la Matriz</span>
              </h3>
              <button
                type="button"
                onClick={onOpenVoiceModal}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Dictar por voz
              </button>
            </div>

            <form onSubmit={handleCreateFinding} className="space-y-4 text-xs">
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Rubro / Área Auditada
                  </label>
                  <input
                    type="text"
                    value={newForm.rubro}
                    onChange={(e) => setNewForm({ ...newForm, rubro: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Monto Involucrado ({currency})
                  </label>
                  <input
                    type="number"
                    value={newForm.monto}
                    onChange={(e) =>
                      setNewForm({ ...newForm, monto: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Descripción / Condición Observada (Hechos, Causa y Efecto)
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalla las observaciones objetivas constatadas..."
                  value={newForm.descripcion}
                  onChange={(e) => setNewForm({ ...newForm, descripcion: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nivel de Riesgo</label>
                  <select
                    value={newForm.riesgo}
                    onChange={(e) =>
                      setNewForm({ ...newForm, riesgo: e.target.value as RiskLevel })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Bajo">Bajo</option>
                    <option value="Medio">Medio</option>
                    <option value="Alto">Alto</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Fusión Recomendada
                  </label>
                  <select
                    value={newForm.fusion_id}
                    onChange={(e) => setNewForm({ ...newForm, fusion_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {rules.map((r) => (
                      <option key={r.fusion_id} value={r.fusion_id}>
                        {r.fusion_id} - {r.rubro.slice(0, 20)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Criterio Legal o Normativo Aplicable
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ley 340-06, Ley 41-08, Normas NOBACI"
                  value={newForm.criterio}
                  onChange={(e) => setNewForm({ ...newForm, criterio: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
                  Guardar Hallazgo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
