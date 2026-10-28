import React, { useState } from 'react';
import { 
  Scale, 
  Brain, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Printer, 
  X, 
  ShieldAlert, 
  DollarSign, 
  Award,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ExpertDictamen, InstitutionalConfig, AuditFinding } from '../types/audit';

interface ForensicExpertDictamenModalProps {
  isOpen: boolean;
  onClose: () => void;
  dictamen: ExpertDictamen;
  findings: AuditFinding[];
  config: InstitutionalConfig;
  onUpdateDictamen: (d: ExpertDictamen) => void;
  onNotify: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'danger') => void;
}

export const ForensicExpertDictamenModal: React.FC<ForensicExpertDictamenModalProps> = ({
  isOpen,
  onClose,
  dictamen,
  findings,
  config,
  onUpdateDictamen,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'dictamen' | 'fraude' | 'cuantificacion'>('dictamen');

  if (!isOpen) return null;

  // Calculate live total capital from findings
  const totalFindingsAmount = findings.reduce((acc, f) => acc + (f.monto || 0), 0);
  const capitalDesviado = totalFindingsAmount > 0 ? totalFindingsAmount : dictamen.cuantificacion_perjuicio.capital_desviado;
  const interesesLegales = capitalDesviado * 0.12; // 12% anual
  const danoEmergente = capitalDesviado * 0.05; // 5% costos procesales y depreciación
  const totalIndemnizatorio = capitalDesviado + interesesLegales + danoEmergente;

  const handlePrint = () => {
    window.print();
  };

  const handleExportText = () => {
    const textContent = `
====================================================================================================
DICTAMEN PERICIAL CONTABLE FORENSE - EMISIÓN OFICIAL CON FE PÚBLICA
Número de Dictamen: ${dictamen.numero_dictamen}
Tribunal / Órgano Receptor: ${dictamen.tribunal_o_ente}
Perito Forense Actuante: ${config.auditor_name} (${config.auditor_cpa_number || 'CPA'}) - Cédula: ${config.auditor_id || 'N/A'}
Entidad Evaluada: ${config.entity_name}
Período Auditado: ${config.audit_period}
Fecha de Emisión: ${dictamen.fecha_emision}
====================================================================================================

I. OBJETO DEL DICTAMEN PERICIAL
${dictamen.objeto_pericia}

II. METODOLOGÍA FORENSE Y ESTÁNDARES INTERNACIONALES (ISSAI 5000 / NIA 240)
${dictamen.metodologia}

III. OPERACIONES PERICIALES REALIZADAS
${dictamen.operaciones_periciales.map((op, idx) => `${idx + 1}. ${op}`).join('\n')}

IV. ANÁLISIS CONTABLE Y RAZONAMIENTO FORENSE
${dictamen.analisis_contable}

V. CUANTIFICACIÓN PERICIAL DEL PERJUICIO PATRIMONIAL AL ERARIO PÚBLICO
- Capital Principal Desviado: ${config.currency_symbol} ${capitalDesviado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
- Intereses Legales Resarcitorios (12%): ${config.currency_symbol} ${interesesLegales.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
- Daño Emergente y Gastos de Recuperación (5%): ${config.currency_symbol} ${danoEmergente.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
----------------------------------------------------------------------------------------------------
TOTAL MONTO INDEMNIZATORIO DETERMINADO: ${config.currency_symbol} ${totalIndemnizatorio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
----------------------------------------------------------------------------------------------------

VI. RESPUESTAS AL CUESTIONARIO PERICIAL JUDICIAL
${dictamen.respuestas_cuestionario.map((q, idx) => `
PREGUNTA ${idx + 1}: ${q.pregunta}
RESPUESTA DEL PERITO: ${q.respuesta}
`).join('\n')}

VII. CONCLUSIÓN PERICIAL CONCLUYENTE
${dictamen.conclusion_pericial}

VIII. FUNDAMENTO LEGAL Y NORMATIVO
${dictamen.fundamento_legal.map(f => `- ${f}`).join('\n')}

_______________________________________________________________
${config.auditor_name}
Auditor Forense Antifraude & Perito Contable Judicial
${config.auditor_cpa_number || 'CPA Miembro Titular'} | Cédula: ${config.auditor_id || '001-0854912-3'}
Firma con Fe Pública Pericial
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dictamen_Pericial_Forense_${config.entity_name.replace(/\s+/g, '_').slice(0, 20)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify('Dictamen Exportado', 'Dictamen pericial judicial exportado en texto legal auténtico.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  IA Aplicada al Razonamiento Pericial Contable y Dictamen Forense
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ISSAI 5000 / NIA 240
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Construcción y fundamentación probatoria de Dictamen Judicial emitido por {config.auditor_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-all"
            >
              <Download className="w-4 h-4" />
              Exportar Texto Legal
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Imprimir Dictamen"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('dictamen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'dictamen'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Dictamen Pericial Judicial
          </button>
          <button
            onClick={() => setActiveTab('fraude')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'fraude'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Triángulo del Fraude & Banderas Rojas
          </button>
          <button
            onClick={() => setActiveTab('cuantificacion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cuantificacion'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Cuantificación del Perjuicio
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'dictamen' && (
            <div className="space-y-6">
              
              {/* Header Box of Official Dictamen */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-purple-400 font-bold">
                  EXPEDIENTE JUDICIAL PERICIAL FORENSE
                </span>
                <h3 className="text-base font-bold text-white tracking-wide">
                  {dictamen.numero_dictamen}
                </h3>
                <div className="flex items-center justify-center gap-4 text-xs text-slate-300 pt-1">
                  <span>Destinatario: <strong className="text-white">{dictamen.tribunal_o_ente}</strong></span>
                  <span>•</span>
                  <span>Perito: <strong className="text-purple-300">{config.auditor_name}</strong></span>
                  <span>•</span>
                  <span>Exequátur/Colegiatura: <strong className="text-slate-200">{config.auditor_cpa_number || 'CPA No. 12845'}</strong></span>
                </div>
              </div>

              {/* Objeto */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-1.5">
                <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> I. Objeto de la Pericia Forense
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {dictamen.objeto_pericia}
                </p>
              </div>

              {/* Metodología */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-1.5">
                <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-4 h-4" /> II. Metodología y Estándares Forenses Aplicados
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {dictamen.metodologia}
                </p>
              </div>

              {/* Operaciones Periciales */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> III. Operaciones Periciales de Campo Ejecutadas ({dictamen.operaciones_periciales.length})
                </h4>
                <div className="space-y-1.5">
                  {dictamen.operaciones_periciales.map((op, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                      <span className="text-purple-400 font-bold font-mono">{idx + 1}.</span>
                      <span>{op}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Análisis Contable */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-1.5">
                <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4" /> IV. Análisis Contable y Razonamiento Forense
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {dictamen.analisis_contable}
                </p>
              </div>

              {/* Cuestionario Judicial */}
              <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
                <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-400" /> V. Respuestas al Cuestionario Pericial Judicial
                </h4>
                <div className="space-y-2">
                  {dictamen.respuestas_cuestionario.map((item, idx) => (
                    <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                      <div className="text-xs font-bold text-amber-300">
                        Pregunta #{idx + 1}: {item.pregunta}
                      </div>
                      <div className="text-xs text-slate-200 pl-3 border-l-2 border-purple-500/50">
                        <strong>Respuesta Pericial:</strong> {item.respuesta}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conclusión Pericial */}
              <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-purple-950/20 p-5 rounded-xl border border-purple-500/40 space-y-2">
                <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-400" /> VI. Conclusión Pericial Concluyente con Fe Pública
                </h4>
                <p className="text-xs text-slate-100 font-medium leading-relaxed">
                  {dictamen.conclusion_pericial}
                </p>
                <div className="pt-4 border-t border-purple-500/20 flex flex-col items-center justify-center text-center">
                  <div className="w-48 border-b border-slate-400 mb-1"></div>
                  <strong className="text-xs font-bold text-white">{config.auditor_name}</strong>
                  <span className="text-[11px] text-slate-400">{config.auditor_role}</span>
                  <span className="text-[11px] text-purple-300">{config.auditor_cpa_number || 'CPA No. 12845'} — Cédula: {config.auditor_id || '001-0854912-3'}</span>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'fraude' && (
            <div className="space-y-5">
              
              {/* Cressey Fraud Triangle Grid */}
              <div>
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-3">
                  Modelo Forense: Triángulo del Fraude de Donald Cressey
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-850 p-4 rounded-xl border border-red-500/30 space-y-2">
                    <span className="text-[11px] font-bold uppercase text-red-400">1. Presión / Motivación</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Necesidad de financiar operaciones al margen de presupuestos ordinarios, compromisos electorales o enriquecimiento ilícito de la cúpula administrativa.
                    </p>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-750">
                      Detectado en: Nóminas paralelas e incentivos arbitrarios.
                    </div>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-xl border border-amber-500/30 space-y-2">
                    <span className="text-[11px] font-bold uppercase text-amber-400">2. Oportunidad Percibida</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Inexistencia de controles automáticos en SIGEF, uso de hojas de cálculo modificables, falta de comisiones de compras y descontrol en la custodia de garantías.
                    </p>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-750">
                      Detectado en: Cuentas fuera de CUT y adendas superiores al 25%.
                    </div>
                  </div>

                  <div className="bg-slate-850 p-4 rounded-xl border border-blue-500/30 space-y-2">
                    <span className="text-[11px] font-bold uppercase text-blue-400">3. Racionalización</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Justificación moral basada en la 'urgencia de la atención médica' o 'prácticas usuales en administraciones precedentes' para evadir licitaciones.
                    </p>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-750">
                      Detectado en: Fraccionamiento de órdenes de compra.
                    </div>
                  </div>
                </div>
              </div>

              {/* Red Flags Inventory */}
              <div className="bg-slate-850 p-5 rounded-xl border border-slate-750 space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Catálogo de Banderas Rojas (Red Flags) Confirmadas en la Investigación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <strong className="text-red-400 block mb-1">🔴 Proveedores Fantasma y Empresas Vinculadas:</strong>
                    Oferentes con la misma dirección física y socios comunes en compras de más de RD$ 21.8M.
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <strong className="text-red-400 block mb-1">🔴 Nóminas Paralelas Discrecionales:</strong>
                    RD$ 36.9M liquidados sin contratos aprobados por el MAP ni control previo de la CGR.
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <strong className="text-red-400 block mb-1">🔴 Cubicaciones No Ejecutadas en Obra:</strong>
                    RD$ 84.2M certificados en papel que no existen físicamente según topografía láser.
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <strong className="text-red-400 block mb-1">🔴 Ocultamiento Documental:</strong>
                    RD$ 77.4M en soportes negados reiteradamente al equipo auditor forense actuante.
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'cuantificacion' && (
            <div className="space-y-5">
              
              {/* Financial Box */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/20 p-6 rounded-2xl border border-emerald-500/40">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                  LIQUIDACIÓN MATEMÁTICA Y ACTUARIAL DEL PERJUICIO ECONÓMICO
                </span>
                <h3 className="text-2xl font-black text-white font-mono">
                  {config.currency_symbol} {totalIndemnizatorio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Monto total reclamable en sede judicial civil y administrativa a favor del Estado
                </p>
              </div>

              {/* Breakdown Table */}
              <div className="bg-slate-850 rounded-xl border border-slate-750 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Concepto Indemnizatorio</th>
                      <th className="p-3">Base de Cálculo / Fundamento</th>
                      <th className="p-3 text-right">Monto Cuantificado ({config.currency_symbol})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    <tr>
                      <td className="p-3 font-semibold">1. Capital Principal Desviado</td>
                      <td className="p-3 text-slate-400">Total de hallazgos verificados y pagos indebidos comprobados</td>
                      <td className="p-3 text-right font-mono font-bold text-white">
                        {capitalDesviado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">2. Intereses Legales Resarcitorios</td>
                      <td className="p-3 text-slate-400">Tasa de interés legal del 12% anual sobre fondos distraídos</td>
                      <td className="p-3 text-right font-mono text-amber-300">
                        {interesesLegales.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">3. Daño Emergente y Gastos Periciales</td>
                      <td className="p-3 text-slate-400">Costas de peritajes técnicos, topografía y auditoría forense (5%)</td>
                      <td className="p-3 text-right font-mono text-cyan-300">
                        {danoEmergente.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="bg-slate-900 font-bold">
                      <td className="p-3 text-emerald-400">TOTAL PERJUICIO ECONÓMICO RESARCITORIO</td>
                      <td className="p-3 text-slate-400">Dictamen definitivo con fe pública de Perito CPA</td>
                      <td className="p-3 text-right font-mono text-emerald-400 text-sm">
                        {totalIndemnizatorio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            Dictamen pericial estructurado para validez en tribunales y organismos rectores internacionales.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all"
          >
            Cerrar Dictamen
          </button>
        </div>

      </div>
    </div>
  );
};
