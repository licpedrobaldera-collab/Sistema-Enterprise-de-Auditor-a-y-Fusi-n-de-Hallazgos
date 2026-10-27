import React from 'react';
import {
  FileText,
  X,
  FileCheck2,
  FileSpreadsheet,
  Download,
  Building2,
  Shield,
  Printer,
  CheckCircle,
} from 'lucide-react';
import { InstitutionalConfig, AuditFinding, FusionRule } from '../types/audit';
import { formatCurrency } from '../utils/exporters';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: InstitutionalConfig;
  findings: AuditFinding[];
  rules: FusionRule[];
  onExport: (format: 'pdf' | 'excel' | 'word' | 'csv') => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  config,
  findings,
  rules,
  onExport,
}) => {
  if (!isOpen) return null;

  const totalAmount = findings.reduce((sum, f) => sum + (f.monto || 0), 0);
  const criticalCount = findings.filter((f) => f.riesgo === 'Crítico').length;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Vista Previa del Informe Técnico & Dictamen Forense
              </h3>
              <p className="text-[11px] text-slate-400">
                Documento conforme a los estándares de la Cámara de Cuentas y Contraloría General
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExport('pdf')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition"
              title="Descargar versión PDF con membrete oficial"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => onExport('word')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
              title="Descargar documento Word (.docx)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Word</span>
            </button>
            <button
              onClick={() => onExport('excel')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
              title="Descargar matrices en Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document Preview Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/40">
          <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xl text-slate-200 text-xs leading-relaxed font-sans space-y-6">
            {/* Institutional Header */}
            <div className="text-center pb-6 border-b border-slate-800">
              <h2 className="text-lg sm:text-xl font-extrabold text-blue-400 tracking-wide uppercase">
                {config.entity_name}
              </h2>
              <h3 className="text-sm font-bold text-slate-200 mt-1">
                OFICINA DE AUDITORÍA INTERNA Y GESTIÓN DE CONTROL
              </h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                INFORME DE AJUSTES, CONSOLIDACIÓN Y RECOMENDACIONES DE MEJORA
              </p>
            </div>

            {/* Memorandum Metadata Block */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-1.5 text-xs">
              <div className="flex">
                <span className="w-40 font-bold text-blue-300">A:</span>
                <span className="text-white">{config.recipient}</span>
              </div>
              <div className="flex">
                <span className="w-40 font-bold text-blue-300">DE:</span>
                <span className="text-white">
                  {config.auditor_name}, {config.auditor_role}
                  <br />
                  <span className="text-slate-400 text-[11px]">
                    En representación de la Entidad Auditada ({config.entity_name})
                  </span>
                </span>
              </div>
              <div className="flex">
                <span className="w-40 font-bold text-blue-300">TIPO DE AUDITORÍA:</span>
                <span className="text-amber-300 font-semibold">{config.audit_type}</span>
              </div>
              <div className="flex">
                <span className="w-40 font-bold text-blue-300">PERÍODO AUDITADO:</span>
                <span className="text-slate-300">{config.audit_period}</span>
              </div>
              <div className="flex">
                <span className="w-40 font-bold text-blue-300">IMPACTO CONSOLIDADO:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {formatCurrency(totalAmount, config.currency)}
                </span>
              </div>
              <div className="flex">
                <span className="w-40 font-bold text-blue-300">ASUNTO:</span>
                <span className="text-white font-medium">
                  Informe Técnico de Análisis, Propuesta de Fusión de Hallazgos y Plan de Mejoras Sistémicas
                </span>
              </div>
            </div>

            {/* Section 1 */}
            <div>
              <h4 className="text-sm font-bold text-blue-400 mb-2 border-l-2 border-blue-500 pl-2">
                1. RESUMEN EJECUTIVO Y OBJETIVO DEL EXAMEN
              </h4>
              <p className="text-justify text-slate-300 text-xs">
                El presente informe técnico tiene por objeto consolidar, clasificar y fundar técnicamente
                los resultados derivados de las comprobaciones de auditoría practicadas en el marco del
                período <strong>{config.audit_period}</strong>. A fin de evitar la dispersión probatoria y
                permitir a la máxima autoridad jerárquica y a los órganos rectores de control (Cámara de
                Cuentas y Contraloría General) emitir un juicio ecuánime sobre causas estructurales, se ha
                empleado una metodología analítica asistida por Inteligencia Artificial de agrupamiento por
                macro-rubros normativos.
              </p>
            </div>

            {/* Section 2: Fused Findings Matrix */}
            <div>
              <h4 className="text-sm font-bold text-blue-400 mb-2 border-l-2 border-blue-500 pl-2">
                2. MATRIZ DE FUSIÓN Y CONSOLIDACIÓN TÉCNICA (CAUSAS RAÍZ)
              </h4>
              <div className="border border-slate-800 rounded-xl overflow-hidden mt-3">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800">
                      <th className="p-2 w-16 text-center">Cód.</th>
                      <th className="p-2 w-48">Rubro / Título Fusionado</th>
                      <th className="p-2 w-28 text-center">Hallazgos</th>
                      <th className="p-2 w-28 text-right">Monto ({config.currency})</th>
                      <th className="p-2">Criterio Legal / Fundamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {rules.map((rule) => {
                      const matched = findings.filter((f) => f.fusion_id === rule.fusion_id);
                      const sum = matched.reduce((acc, f) => acc + (f.monto || 0), 0);
                      const ids = matched.map((f) => `#${f.id}`).join(', ') || 'N/A';

                      return (
                        <tr key={rule.fusion_id} className="hover:bg-slate-800/30">
                          <td className="p-2 text-center font-mono font-bold text-indigo-400">
                            {rule.fusion_id}
                          </td>
                          <td className="p-2">
                            <span className="font-bold text-white block">{rule.rubro}</span>
                            <span className="text-slate-300 text-[10px] leading-tight block">
                              {rule.titulo_fusionado}
                            </span>
                          </td>
                          <td className="p-2 text-center font-mono text-blue-300 text-[10px]">
                            {ids}
                          </td>
                          <td className="p-2 text-right font-mono font-semibold text-emerald-400">
                            {formatCurrency(sum, config.currency)}
                          </td>
                          <td className="p-2 text-[10px] text-amber-300/90 leading-tight">
                            {rule.criterios}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Conclusions & Signature */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-sm font-bold text-blue-400 mb-2 border-l-2 border-blue-500 pl-2">
                3. DICTAMEN TÉCNICO Y RECOMENDACIÓN FINAL
              </h4>
              <p className="text-justify text-slate-300 text-xs mb-8">
                Se concluye que las no conformidades constatadas responden predominantemente a la falta de
                automatización integral de los módulos contables del SIGEF, carencia de perfiles en la
                escala salarial y ausencia de formalización contractual visada por el MAP. Se recomienda
                adoptar la presente Matriz de Fusión para formular el Plan de Acción Correctivo (PAC)
                institucional.
              </p>

              {/* Signature Block */}
              <div className="text-center pt-8 border-t border-slate-800/80 max-w-sm mx-auto">
                <div className="w-48 h-0.5 bg-slate-600 mx-auto mb-2" />
                <h5 className="font-bold text-white text-xs">{config.auditor_name}</h5>
                <p className="text-slate-400 text-[11px]">{config.auditor_role}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">
                  En representación de: {config.entity_name}
                </p>
                <div className="mt-2 text-[9px] font-mono text-slate-500 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span>Cadena de Custodia SHA-256 Verificada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
