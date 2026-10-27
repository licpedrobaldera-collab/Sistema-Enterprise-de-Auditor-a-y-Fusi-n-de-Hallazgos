import React, { useState } from 'react';
import {
  GitMerge,
  Plus,
  Edit2,
  Trash2,
  Shield,
  BookOpen,
  DollarSign,
  Layers,
  X,
  Save,
} from 'lucide-react';
import { FusionRule, AuditFinding } from '../types/audit';
import { formatCurrency } from '../utils/exporters';

interface FusionMatrixTableProps {
  rules: FusionRule[];
  findings: AuditFinding[];
  currency: string;
  onUpdateRule: (updated: FusionRule) => void;
  onAddRule: (newRule: FusionRule) => void;
  onDeleteRule: (fusion_id: string) => void;
  onFilterByFusion?: (fusion_id: string) => void;
}

export const FusionMatrixTable: React.FC<FusionMatrixTableProps> = ({
  rules,
  findings,
  currency,
  onUpdateRule,
  onAddRule,
  onDeleteRule,
  onFilterByFusion,
}) => {
  const [editingRule, setEditingRule] = useState<FusionRule | null>(null);
  const [isAddingRule, setIsAddingRule] = useState<boolean>(false);
  const [newRuleForm, setNewRuleForm] = useState<Partial<FusionRule>>({
    fusion_id: `FUS-0${rules.length + 1}`,
    rubro: '',
    titulo_fusionado: '',
    keywords: [],
    justificacion: '',
    criterios: '',
  });

  const [keywordInput, setKeywordInput] = useState('');

  const handleStartEdit = (rule: FusionRule) => {
    setEditingRule({ ...rule });
    setKeywordInput(rule.keywords.join(', '));
  };

  const handleSaveEdit = () => {
    if (editingRule) {
      const updated: FusionRule = {
        ...editingRule,
        keywords: keywordInput
          .split(',')
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean),
      };
      onUpdateRule(updated);
      setEditingRule(null);
    }
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleForm.titulo_fusionado?.trim()) return;

    const created: FusionRule = {
      fusion_id: newRuleForm.fusion_id || `FUS-0${rules.length + 1}`,
      rubro: newRuleForm.rubro || 'Control Interno',
      titulo_fusionado: newRuleForm.titulo_fusionado.trim(),
      keywords: keywordInput
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
      justificacion: newRuleForm.justificacion?.trim() || 'Fusión analítica basada en causa raíz.',
      criterios: newRuleForm.criterios?.trim() || 'Normativas Generales de Control Interno (NOBACI).',
    };

    onAddRule(created);
    setIsAddingRule(false);
    setNewRuleForm({
      fusion_id: `FUS-0${rules.length + 2}`,
      rubro: '',
      titulo_fusionado: '',
      keywords: [],
      justificacion: '',
      criterios: '',
    });
    setKeywordInput('');
  };

  const totalConsolidatedMonto = findings.reduce((acc, f) => acc + (f.monto || 0), 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-6">
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Matriz de Análisis y Fusión Recomendada (Consolidación con IA)
            </h3>
            <span className="bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
              {rules.length} Grupos Estructurales
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Agrupamiento de hallazgos aislados en debilidades sistémicas para informes ante la Cámara
            de Cuentas y Contraloría General
          </p>
        </div>

        <button
          onClick={() => {
            setNewRuleForm({
              fusion_id: `FUS-0${rules.length + 1}`,
              rubro: '',
              titulo_fusionado: '',
              keywords: [],
              justificacion: '',
              criterios: '',
            });
            setKeywordInput('');
            setIsAddingRule(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Configurar Nueva Regla de Fusión</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <th className="py-3 px-4 w-24 text-center">Cód. Fusión</th>
              <th className="py-3 px-4 w-44">Rubro Agrupado</th>
              <th className="py-3 px-4 min-w-[240px]">Título del Hallazgo Fusionado</th>
              <th className="py-3 px-4 w-32 text-center">Hallazgos Incluidos</th>
              <th className="py-3 px-4 w-36 text-right">Monto Consolidado ({currency})</th>
              <th className="py-3 px-4 min-w-[280px]">Justificación Técnica</th>
              <th className="py-3 px-4 min-w-[220px]">Criterios Legales / Normativos</th>
              <th className="py-3 px-4 w-20 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rules.map((rule) => {
              const matchedFindings = findings.filter((f) => f.fusion_id === rule.fusion_id);
              const consolidatedAmount = matchedFindings.reduce(
                (sum, f) => sum + (f.monto || 0),
                0
              );

              return (
                <tr
                  key={rule.fusion_id}
                  className="hover:bg-slate-800/40 transition group text-slate-300"
                >
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 px-2.5 py-1 rounded-md font-mono text-xs font-bold shadow-sm">
                      {rule.fusion_id}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{rule.rubro}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-white leading-snug">{rule.titulo_fusionado}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rule.keywords.slice(0, 4).map((kw, i) => (
                        <span
                          key={i}
                          className="bg-slate-800 text-[10px] text-slate-400 px-1.5 py-0.5 rounded"
                        >
                          {kw}
                        </span>
                      ))}
                      {rule.keywords.length > 4 && (
                        <span className="text-[10px] text-slate-500">
                          +{rule.keywords.length - 4} más
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {matchedFindings.length === 0 ? (
                      <span className="text-slate-500 italic text-[11px]">Ninguno</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 justify-center max-w-[130px] mx-auto">
                        {matchedFindings.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => onFilterByFusion && onFilterByFusion(rule.fusion_id)}
                            className="bg-slate-800 hover:bg-blue-900/60 text-blue-300 border border-slate-700 text-[11px] font-mono px-1.5 py-0.5 rounded font-semibold transition"
                            title={`Hallazgo #${f.id}: ${f.titulo}`}
                          >
                            #{f.id}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                    {formatCurrency(consolidatedAmount, currency)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 leading-relaxed text-[11.5px]">
                    {rule.justificacion}
                  </td>
                  <td className="py-3.5 px-4 text-amber-300/90 text-[11px] leading-relaxed">
                    <div className="flex items-start gap-1">
                      <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{rule.criterios}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleStartEdit(rule)}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                        title="Editar regla de fusión"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿Desea eliminar la regla de fusión ${rule.fusion_id}: ${rule.titulo_fusionado}?`
                            )
                          ) {
                            onDeleteRule(rule.fusion_id);
                          }
                        }}
                        className="p-1.5 rounded hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingRule(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-indigo-400" />
              <span>Editar Regla de Fusión {editingRule.fusion_id}</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Código</label>
                  <input
                    type="text"
                    value={editingRule.fusion_id}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, fusion_id: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Rubro Agrupado</label>
                  <input
                    type="text"
                    value={editingRule.rubro}
                    onChange={(e) => setEditingRule({ ...editingRule, rubro: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Título del Hallazgo Fusionado
                </label>
                <input
                  type="text"
                  value={editingRule.titulo_fusionado}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, titulo_fusionado: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Palabras Clave de Detección (separadas por coma)
                </label>
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Justificación Técnica de Fusión
                </label>
                <textarea
                  rows={3}
                  value={editingRule.justificacion}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, justificacion: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Criterios Legales y Normativos
                </label>
                <input
                  type="text"
                  value={editingRule.criterios}
                  onChange={(e) => setEditingRule({ ...editingRule, criterios: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg"
                >
                  Salvar Regla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Rule Modal */}
      {isAddingRule && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddingRule(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Configurar Nueva Regla de Fusión</span>
            </h3>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Código Fusión</label>
                  <input
                    type="text"
                    required
                    value={newRuleForm.fusion_id}
                    onChange={(e) =>
                      setNewRuleForm({ ...newRuleForm, fusion_id: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Rubro Agrupado</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Obras Públicas, Salud Pública, Tesorería"
                    value={newRuleForm.rubro}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, rubro: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Título del Hallazgo Fusionado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Irregularidades Sistemáticas en Cubicaciones de Obra Civil y Adendas..."
                  value={newRuleForm.titulo_fusionado}
                  onChange={(e) =>
                    setNewRuleForm({ ...newRuleForm, titulo_fusionado: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Palabras Clave para Clasificación Automática (separadas por coma)
                </label>
                <input
                  type="text"
                  placeholder="cubicaciones, adendas, sobrecosto, contratista"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Justificación Técnica de Fusión
                </label>
                <textarea
                  rows={2}
                  placeholder="Fundamento técnico que explica por qué estos hallazgos convergen en una misma causa raíz..."
                  value={newRuleForm.justificacion}
                  onChange={(e) =>
                    setNewRuleForm({ ...newRuleForm, justificacion: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Criterios Legales y Normativos
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ley 340-06, Reglamento 543-12, Ley 10-07"
                  value={newRuleForm.criterios}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, criterios: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg"
                >
                  Crear Regla de Fusión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
