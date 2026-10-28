import React, { useState } from 'react';
import {
  GitMerge,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Sparkles,
  Layers,
  X,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  CheckCircle2,
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
  const [viewingRule, setViewingRule] = useState<FusionRule | null>(null);
  const [isAddingRule, setIsAddingRule] = useState<boolean>(false);
  const [newRuleForm, setNewRuleForm] = useState<Partial<FusionRule>>({
    fusion_id: `FUS-0${rules.length + 1}`,
    rubro: '',
    titulo_fusionado: '',
    keywords: [],
    justificacion: '',
    condicion_actualizada_ia: '',
    criterios_actualizados: '',
    recomendacion_actualizada: '',
    conclusion_conformada: '',
  });

  const [keywordInput, setKeywordInput] = useState('');

  const handleStartEdit = (rule: FusionRule) => {
    setEditingRule({ ...rule });
    setKeywordInput((rule.keywords || []).join(', '));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
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
      rubro: newRuleForm.rubro || 'Gobernanza y Control',
      titulo_fusionado: newRuleForm.titulo_fusionado.trim(),
      keywords: keywordInput
        .split(',')
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
      justificacion:
        newRuleForm.justificacion?.trim() || 'Fusión analítica basada en causa raíz verificada.',
      condicion_actualizada_ia:
        newRuleForm.condicion_actualizada_ia?.trim() ||
        'Condición consolidada unificada conforme a las evidencias.',
      criterios_actualizados:
        newRuleForm.criterios_actualizados?.trim() ||
        'Ley 10-07 del Sistema Nacional de Control Interno; Normas NOBACI.',
      recomendacion_actualizada:
        newRuleForm.recomendacion_actualizada?.trim() ||
        'Implementar controles estructurales inmediatos.',
      conclusion_conformada:
        newRuleForm.conclusion_conformada?.trim() ||
        'Postura forense pericial sobre la causa raíz unificada.',
    };

    onAddRule(created);
    setIsAddingRule(false);
    setNewRuleForm({
      fusion_id: `FUS-0${rules.length + 2}`,
      rubro: '',
      titulo_fusionado: '',
      keywords: [],
      justificacion: '',
      condicion_actualizada_ia: '',
      criterios_actualizados: '',
      recomendacion_actualizada: '',
      conclusion_conformada: '',
    });
    setKeywordInput('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mt-6">
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              Matriz de Fusión & Nueva Condición Actualizada con IA (Hoja 2)
            </h3>
            <span className="bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
              {rules.length} Grupos de Fusión
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Presenta el título actualizado, condición unificada por IA, criterios precisados y conformación
            de nuevo hallazgo sin inventar datos
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
              condicion_actualizada_ia: '',
              criterios_actualizados: '',
              recomendacion_actualizada: '',
              conclusion_conformada: '',
            });
            setKeywordInput('');
            setIsAddingRule(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Fusión de Puntos</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <th className="py-3 px-3 w-20 text-center">Cód.</th>
              <th className="py-3 px-3 w-36">Rubro Agrupado</th>
              <th className="py-3 px-3 w-48">Hallazgos Incluidos (No. & Pág.)</th>
              <th className="py-3 px-3 min-w-[260px]">Título del Hallazgo Fusionado</th>
              <th className="py-3 px-3 min-w-[320px]">
                Condición Actualizada y Unificada por IA (Sin inventar datos)
              </th>
              <th className="py-3 px-3 w-32 text-right">Monto Consolidado ({currency})</th>
              <th className="py-3 px-3 min-w-[220px]">Criterios Legales Precisados</th>
              <th className="py-3 px-3 w-20 text-center">Acciones</th>
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
                  {/* Cod */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-block bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 px-2 py-0.5 rounded-md font-mono text-xs font-bold shadow-sm">
                      {rule.fusion_id}
                    </span>
                  </td>

                  {/* Rubro */}
                  <td className="py-3.5 px-3 font-semibold text-slate-200">{rule.rubro}</td>

                  {/* Hallazgos Incluidos con Pág */}
                  <td className="py-3.5 px-3">
                    {matchedFindings.length === 0 ? (
                      <span className="text-slate-500 italic text-[11px]">Sin hallazgos</span>
                    ) : (
                      <div className="space-y-1">
                        {matchedFindings.map((f) => (
                          <div
                            key={f.id}
                            className="bg-slate-950/70 border border-slate-800 rounded p-1 text-[10px]"
                          >
                            <span className="font-mono font-bold text-blue-300">
                              No. {f.numero_hallazgo || f.id}:
                            </span>{' '}
                            <span className="text-slate-400 font-medium">{f.pagina_referencia}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Título */}
                  <td className="py-3.5 px-3">
                    <p className="font-bold text-white text-xs leading-snug">
                      {rule.titulo_fusionado}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                      <strong className="text-indigo-300">Justificación: </strong>
                      {rule.justificacion}
                    </p>
                  </td>

                  {/* Condición Actualizada por IA */}
                  <td className="py-3.5 px-3 text-slate-200 text-[11px] leading-relaxed">
                    <p className="line-clamp-4">
                      {rule.condicion_actualizada_ia || rule.justificacion}
                    </p>
                  </td>

                  {/* Monto Consolidado */}
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400">
                    {formatCurrency(consolidatedAmount, currency)}
                  </td>

                  {/* Criterios Precisados */}
                  <td className="py-3.5 px-3 text-amber-300/90 text-[10.5px] leading-relaxed">
                    <div className="flex items-start gap-1">
                      <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-3">
                        {rule.criterios_actualizados || rule.criterios}
                      </span>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="py-3.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => setViewingRule(rule)}
                        className="p-1.5 rounded hover:bg-slate-700 text-blue-400 hover:text-blue-300"
                        title="Ver Nuevo Hallazgo Conformado Completo"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(rule)}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                        title="Editar regla y condición IA"
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

      {/* MODAL 1: Ver Fusión & Nuevo Hallazgo Completo */}
      {viewingRule && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingRule(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono text-xs font-bold px-3 py-1 rounded-md">
                {viewingRule.fusion_id}
              </span>
              <span className="text-slate-300 font-bold text-xs">{viewingRule.rubro}</span>
            </div>

            <h3 className="text-base font-bold text-white mb-4">
              {viewingRule.titulo_fusionado}
            </h3>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <strong className="text-indigo-300 block mb-1">
                  1. Razones / Justificación Técnica de la Fusión de Puntos:
                </strong>
                <p className="text-slate-200 leading-relaxed">{viewingRule.justificacion}</p>
              </div>

              <div className="bg-blue-950/40 border border-blue-900/60 rounded-xl p-3.5">
                <strong className="text-blue-300 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    2. Condición Actualizada y Unificada por Inteligencia Artificial (Sin Inventar Datos):
                  </span>
                </strong>
                <p className="text-slate-100 leading-relaxed font-sans">
                  {viewingRule.condicion_actualizada_ia || viewingRule.justificacion}
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <strong className="text-amber-300 block mb-1">
                  3. Criterios Legales y Normativos Actualizados y Precisados:
                </strong>
                <p className="text-slate-200">
                  {viewingRule.criterios_actualizados || viewingRule.criterios}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <strong className="text-emerald-300 block mb-1">
                    4. Recomendación Técnica Consolidada:
                  </strong>
                  <p className="text-slate-300">
                    {viewingRule.recomendacion_actualizada ||
                      'Recomendación consolidada aplicable al nuevo hallazgo.'}
                  </p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <strong className="text-purple-300 block mb-1">
                    5. Conclusión Forense Conformada:
                  </strong>
                  <p className="text-slate-300">
                    {viewingRule.conclusion_conformada ||
                      'Conclusión y postura pericial sobre la causa raíz unificada.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setViewingRule(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Editar Regla de Fusión & Nuevo Hallazgo */}
      {editingRule && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setEditingRule(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-indigo-400" />
              <span>Editar Fusión y Condición Actualizada {editingRule.fusion_id}</span>
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Código Fusión</label>
                  <input
                    type="text"
                    required
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
                    required
                    value={editingRule.rubro}
                    onChange={(e) => setEditingRule({ ...editingRule, rubro: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Título del Hallazgo Fusionado Actualizado *
                </label>
                <input
                  type="text"
                  required
                  value={editingRule.titulo_fusionado}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, titulo_fusionado: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Razones / Justificación Técnica de Fusión *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingRule.justificacion}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, justificacion: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-blue-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Condición Actualizada y Unificada por IA (Sin inventar datos) *</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingRule.condicion_actualizada_ia}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, condicion_actualizada_ia: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-blue-800 rounded-lg px-3 py-2 text-slate-100 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Criterios Legales y Normativos Actualizados y Precisados *
                </label>
                <input
                  type="text"
                  required
                  value={editingRule.criterios_actualizados || editingRule.criterios}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, criterios_actualizados: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Recomendación Técnica Consolidada
                  </label>
                  <textarea
                    rows={2}
                    value={editingRule.recomendacion_actualizada}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, recomendacion_actualizada: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Conclusión Forense Conformada
                  </label>
                  <textarea
                    rows={2}
                    value={editingRule.conclusion_conformada}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, conclusion_conformada: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg"
                >
                  Salvar Fusión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Crear Nueva Regla de Fusión */}
      {isAddingRule && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddingRule(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Configurar Nueva Fusión de Puntos & Hallazgo Conformado</span>
            </h3>

            <form onSubmit={handleCreateRule} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  placeholder="Ej: Deficiencias Estructurales en Contrataciones y Pagos..."
                  value={newRuleForm.titulo_fusionado}
                  onChange={(e) =>
                    setNewRuleForm({ ...newRuleForm, titulo_fusionado: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Razones / Justificación Técnica de la Fusión
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explica la causa raíz que vincula los hallazgos dispersos..."
                  value={newRuleForm.justificacion}
                  onChange={(e) =>
                    setNewRuleForm({ ...newRuleForm, justificacion: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-blue-300 font-semibold mb-1">
                  Condición Actualizada y Unificada por IA (Sin inventar datos)
                </label>
                <textarea
                  rows={3}
                  placeholder="Redacción integral unificada del nuevo hallazgo consolidado..."
                  value={newRuleForm.condicion_actualizada_ia}
                  onChange={(e) =>
                    setNewRuleForm({ ...newRuleForm, condicion_actualizada_ia: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Criterios Legales y Normativos Precisados
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ley 10-07, Ley 41-08, Ley 340-06"
                  value={newRuleForm.criterios_actualizados}
                  onChange={(e) =>
                    setNewRuleForm({ ...newRuleForm, criterios_actualizados: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingRule(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg"
                >
                  Crear Fusión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
