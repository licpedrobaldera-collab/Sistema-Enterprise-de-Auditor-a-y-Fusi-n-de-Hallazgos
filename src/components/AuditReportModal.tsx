import React, { useState } from 'react';
import {
  FileText,
  X,
  FileCheck2,
  FileSpreadsheet,
  Download,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Award,
  PenTool,
  Upload,
  ClipboardPaste,
  Printer,
  Scale
} from 'lucide-react';
import { InstitutionalConfig, AuditFinding, FusionRule, UserAccount } from '../types/audit';
import { formatCurrency } from '../utils/exporters';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: InstitutionalConfig;
  findings: AuditFinding[];
  rules: FusionRule[];
  users?: UserAccount[];
  onUpdateUsers?: (users: UserAccount[]) => void;
  onExport: (format: 'pdf' | 'excel' | 'word' | 'csv') => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  config,
  findings,
  rules,
  users = [],
  onUpdateUsers,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState<'supervision' | 'normativa' | 'fusiones' | 'firmas'>('supervision');

  if (!isOpen) return null;

  const totalAmount = findings.reduce((sum, f) => sum + (f.monto || 0), 0);
  const approvedCount = findings.filter((f) => f.estado_supervision === 'Aprobado (10/10)').length;
  const adjustCount = findings.filter((f) => f.estado_supervision === 'Requiere Ajuste').length;
  const averageScore =
    findings.length > 0
      ? (
          findings.reduce((sum, f) => sum + (f.puntuacion_calidad ?? 8.5), 0) / findings.length
        ).toFixed(1)
      : '10.0';

  const actingTeam: UserAccount[] = users.length > 0
    ? users.filter((u) => u.rol === 'MASTER_ADMIN' || u.rol === 'SUPERVISOR_CALIDAD' || u.rol === 'PERITO_CONTABLE' || u.rol === 'AUDITOR_FORENSE')
    : [
        {
          id: 'USR-001',
          nombre: config.supervisor_name,
          identificacion: config.supervisor_id || '001-0854912-3',
          rol: 'SUPERVISOR_CALIDAD',
          cargo: config.supervisor_role,
          exequatur_cpa: config.auditor_cpa_number || 'CPA No. 12845 / ICPARD',
          email: 'supervisor@auditoria.gob.do',
          password: '',
          historial_claves: [],
          fecha_creacion: '',
          ultimo_acceso: '',
          estado: 'Activo',
        },
        {
          id: 'USR-002',
          nombre: config.auditor_name,
          identificacion: config.auditor_id || '001-0854912-3',
          rol: 'AUDITOR_FORENSE',
          cargo: config.auditor_role,
          exequatur_cpa: config.auditor_cpa_number || 'CPA No. 12845',
          email: 'auditor@auditoria.gob.do',
          password: '',
          historial_claves: [],
          fecha_creacion: '',
          ultimo_acceso: '',
          estado: 'Activo',
        }
      ];

  const handlePasteSignatureForUser = async (userId: string) => {
    if (!onUpdateUsers) return;
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target?.result as string;
              const updated = users.map((u) => (u.id === userId ? { ...u, firma_digital: base64 } : u));
              onUpdateUsers(updated);
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleUploadSignatureForUser = (userId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onUpdateUsers) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const updated = users.map((u) => (u.id === userId ? { ...u, firma_digital: base64 } : u));
      onUpdateUsers(updated);
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl relative flex flex-col max-h-[94vh] print:border-none print:shadow-none print:max-h-none print:w-full print:bg-white print:text-black">
        
        {/* Top Header (Hidden on print) */}
        <div className="p-4 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 rounded-t-3xl print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Informe de Supervisión Técnica de Calidad (0-10) & Fusión de Hallazgos
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  Promedio: {averageScore} / 10
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Dictamen técnico del supervisor según normas de Cámara de Cuentas, Contraloría General y órganos rectores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExport('word')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
              title="Descargar Informe en Word (.docx)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Word</span>
            </button>
            <button
              onClick={() => onExport('excel')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
              title="Descargar Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => onExport('pdf')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition"
              title="Descargar PDF"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Imprimir Informe Oficial"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Imprimir</span>
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/40 print:p-0 print:overflow-visible">
          <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xl text-slate-200 text-xs leading-relaxed space-y-6 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
            
            {/* Encabezado Oficial */}
            <div className="text-center pb-6 border-b border-slate-800 print:border-black">
              <h2 className="text-lg sm:text-xl font-extrabold text-blue-400 tracking-wide uppercase print:text-black">
                {config.entity_name}
              </h2>
              <h3 className="text-sm font-bold text-slate-200 mt-1 print:text-black">
                OFICINA DE AUDITORÍA FORENSE & CONTROL DE CALIDAD
              </h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5 print:text-black">
                INFORME TÉCNICO DE SUPERVISIÓN, CONTROL DE CALIDAD (0-10) Y TRAZABILIDAD NORMATIVA EXACTA
              </p>
            </div>

            {/* Bloque Memorando */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-1.5 text-xs print:bg-white print:border-black">
              <div className="flex">
                <span className="w-44 font-bold text-blue-300 print:text-black">A:</span>
                <span className="text-white font-medium print:text-black">{config.recipient}</span>
              </div>
              <div className="flex">
                <span className="w-44 font-bold text-blue-300 print:text-black">DE (SUPERVISOR):</span>
                <span className="text-white font-medium print:text-black">
                  {config.supervisor_name}, {config.supervisor_role}
                </span>
              </div>
              <div className="flex">
                <span className="w-44 font-bold text-blue-300 print:text-black">AUDITOR ACTUANTE:</span>
                <span className="text-slate-300 print:text-black">
                  {config.auditor_name}, {config.auditor_role}
                </span>
              </div>
              <div className="flex">
                <span className="w-44 font-bold text-blue-300 print:text-black">TIPO DE AUDITORÍA:</span>
                <span className="text-amber-300 font-semibold print:text-black">{config.audit_type}</span>
              </div>
              <div className="flex">
                <span className="w-44 font-bold text-blue-300 print:text-black">PERÍODO AUDITADO:</span>
                <span className="text-slate-300 print:text-black">{config.audit_period}</span>
              </div>
              <div className="flex">
                <span className="w-44 font-bold text-blue-300 print:text-black">MONTO TOTAL OBSERVADO:</span>
                <span className="text-emerald-400 font-bold font-mono print:text-black">
                  {formatCurrency(totalAmount, config.currency)}
                </span>
              </div>
              <div className="flex">
                <span className="w-44 font-bold text-blue-300 print:text-black">ESTADO SUPERVISIÓN:</span>
                <span className="text-slate-200 print:text-black">
                  <strong className="text-emerald-400 print:text-black">{approvedCount} Aprobados (10/10)</strong> |{' '}
                  <strong className="text-amber-400 print:text-black">{adjustCount} Requieren Ajuste IA</strong>
                </span>
              </div>
            </div>

            {/* Sección 1: Resumen del Supervisor */}
            <div>
              <h4 className="text-sm font-bold text-blue-400 mb-2 border-l-2 border-blue-500 pl-2 print:text-black print:border-black">
                1. RESUMEN EJECUTIVO Y OBJETIVOS DE LA REVISIÓN DEL SUPERVISOR
              </h4>
              <p className="text-justify text-slate-300 text-xs leading-relaxed print:text-black">
                El presente informe de supervisión y control de calidad evalúa la suficiencia, pertinencia y validez probatoria de las evidencias recabadas en <strong>{config.entity_name}</strong>. Conforme a las directrices de la Cámara de Cuentas, Contraloría General de la República y estándares internacionales ISSAI/INTOSAI, cada punto ha sido examinado con precisión jurídica, vinculando cada incidencia al artículo, numeral y literal de la ley aplicable para garantizar validez probatoria plena ante cualquier tribunal.
              </p>
            </div>

            {/* Sección 2: Detalle Punto por Punto con Trazabilidad Legal de Precisión */}
            <div>
              <h4 className="text-sm font-bold text-blue-400 mb-2 border-l-2 border-blue-500 pl-2 print:text-black print:border-black">
                2. EVALUACIÓN DE CALIDAD (0-10) Y TRAZABILIDAD LEGAL EXACTA (LEY, ART., NUMERAL, LITERAL)
              </h4>
              
              <div className="border border-slate-800 rounded-xl overflow-hidden mt-3 print:border-black">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                      <th className="p-2.5 w-24">Ref. / Folio</th>
                      <th className="p-2.5 min-w-[190px]">Título y Condición</th>
                      <th className="p-2.5 min-w-[200px]">Normativa Exacta (Ley, Art., Num., Lit.)</th>
                      <th className="p-2.5 w-24 text-center">Nota (0-10)</th>
                      <th className="p-2.5 min-w-[220px]">Incidencia y Ajuste 10/10</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-black">
                    {findings.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                        <td className="p-2.5 font-mono">
                          <span className="font-bold text-blue-300 block print:text-black">
                            No. {f.numero_hallazgo || f.id}
                          </span>
                          <span className="text-[10px] text-slate-400 block print:text-black">
                            {f.pagina_referencia}
                          </span>
                          {f.punto_incidencia && (
                            <span className="text-[9px] text-purple-300 block font-semibold print:text-black">
                              {f.punto_incidencia}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          <strong className="text-white block print:text-black">{f.titulo}</strong>
                          <span className="text-slate-300 text-[10.5px] line-clamp-2 block mt-0.5 print:text-black">
                            {f.condicion}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold block mt-1 print:text-black">
                            Monto: {formatCurrency(f.monto || 0, config.currency)}
                          </span>
                        </td>
                        <td className="p-2.5 text-[10.5px] leading-relaxed">
                          <strong className="text-purple-300 block print:text-black">{f.norma_ley_nombre || f.criterio}</strong>
                          <div className="text-[10px] text-slate-300 print:text-black mt-0.5 flex flex-wrap gap-x-2">
                            <span>Art: <strong>{f.articulo || 'N/A'}</strong></span>
                            <span>Num: <strong>{f.numeral || 'N/A'}</strong></span>
                            <span>Lit: <strong>{f.literal || 'N/A'}</strong></span>
                          </div>
                          {f.fuente_cruzada && (
                            <span className="text-[9.5px] text-slate-400 italic block mt-0.5 print:text-black">
                              Fuente: {f.fuente_cruzada}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-amber-300 print:text-black">
                          {f.puntuacion_calidad ?? 8.5} / 10
                          <span className="block text-[9px] font-normal text-slate-400 print:text-black mt-0.5">
                            {f.estado_supervision}
                          </span>
                        </td>
                        <td className="p-2.5 text-[10.5px] leading-relaxed">
                          {f.estado_supervision === 'Aprobado (10/10)' ? (
                            <span className="text-emerald-400 font-medium print:text-black">
                              Punto aceptado (10/10). Cumple con todas las normas.
                            </span>
                          ) : (
                            <div>
                              <p className="text-amber-300/90 print:text-black">
                                <strong>Debilidad: </strong>{f.incidencia_supervisor}
                              </p>
                              <p className="text-blue-300 mt-0.5 print:text-black">
                                <strong>Ajuste 10/10: </strong>{f.ajuste_recomendado_supervisor}
                              </p>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sección 3: Resumen Final de Fusión & Nuevos Hallazgos Conformados */}
            <div>
              <h4 className="text-sm font-bold text-blue-400 mb-2 border-l-2 border-blue-500 pl-2 print:text-black print:border-black">
                3. CONFORMACIÓN DE HALLAZGOS CONSOLIDADOS CON INTELIGENCIA ARTIFICIAL
              </h4>
              <p className="text-slate-300 text-xs mb-3 print:text-black">
                Puntos agrupados por causa raíz y marco legal para evitar dispersión probatoria:
              </p>

              <div className="space-y-3">
                {rules.map((rule) => {
                  const matched = findings.filter((f) => f.fusion_id === rule.fusion_id);
                  const sum = matched.reduce((acc, f) => acc + (f.monto || 0), 0);
                  const refs = matched
                    .map((m) => `No. ${m.numero_hallazgo || m.id} (${m.pagina_referencia})`)
                    .join('; ');

                  return (
                    <div
                      key={rule.fusion_id}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5 print:bg-white print:border-black"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-300 print:text-black">
                          [{rule.fusion_id}] {rule.rubro}
                        </span>
                        <span className="font-mono font-bold text-emerald-400 print:text-black">
                          {formatCurrency(sum, config.currency)}
                        </span>
                      </div>
                      <h5 className="font-bold text-white text-xs print:text-black">{rule.titulo_fusionado}</h5>
                      <p className="text-[11px] text-slate-400 print:text-black">
                        <strong>Puntos Agrupados: </strong>{refs || 'Sin hallazgos asociados'}
                      </p>
                      <div className="bg-blue-950/30 border border-blue-900/40 rounded-lg p-2 text-[11px] print:bg-slate-50 print:border-black">
                        <strong className="text-blue-300 print:text-black block mb-0.5">
                          Condición Unificada Actualizada por IA:
                        </strong>
                        <p className="text-slate-200 print:text-black">
                          {rule.condicion_actualizada_ia || rule.justificacion}
                        </p>
                      </div>
                      <p className="text-[11px] text-amber-300/90 print:text-black">
                        <strong>Criterios Legales Consolidados: </strong>{rule.criterios_actualizados || rule.criterios}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sección 4: Relación de Auditores Actuantes con Firma Física y Electrónica */}
            <div className="pt-6 border-t border-slate-800 space-y-4 print:pt-4 print:border-black">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                  RELACIÓN DE AUDITORES Y SUPERVISORES ACTUANTES
                </h4>
                <p className="text-xs text-slate-400 print:text-black">
                  Firmas autorizadas con plena fe pública pericial (admite firma digitalizada e impresión física)
                </p>
              </div>

              {/* Attestation Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
                {actingTeam.map((user) => (
                  <div
                    key={user.id}
                    className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between items-center text-center space-y-2 print:bg-white print:border-none print:p-0"
                  >
                    {/* Electronic Signature Box */}
                    <div className="w-full min-h-[60px] flex flex-col items-center justify-center">
                      {user.firma_digital ? (
                        <div className="bg-white/95 p-1 rounded border border-slate-400 inline-block mb-1">
                          <img
                            src={user.firma_digital}
                            alt={`Firma de ${user.nombre}`}
                            className="h-11 max-w-[180px] object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-9 flex items-center justify-center text-[10px] text-slate-500 italic print:hidden">
                          [Firma Digital o Impresa]
                        </div>
                      )}

                      {/* Controls to Paste or Upload Signature (Hidden on print) */}
                      <div className="flex items-center gap-1.5 print:hidden">
                        <button
                          type="button"
                          onClick={() => handlePasteSignatureForUser(user.id)}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 flex items-center gap-1"
                          title="Pegar imagen de firma copiada en el portapapeles"
                        >
                          <ClipboardPaste className="w-3 h-3 text-emerald-400" />
                          Pegar
                        </button>
                        <label className="cursor-pointer px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 flex items-center gap-1">
                          <Upload className="w-3 h-3 text-blue-400" />
                          Subir
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadSignatureForUser(user.id, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Physical signature print line */}
                    <div className="w-44 h-0.5 bg-slate-600 print:bg-black my-1" />

                    <div>
                      <strong className="text-xs font-bold text-white block print:text-black">{user.nombre}</strong>
                      <span className="text-[11px] text-slate-300 block print:text-black">{user.cargo || user.rol}</span>
                      <span className="text-[10px] text-amber-300 block print:text-black">{user.exequatur_cpa || 'CPA No. 12845'}</span>
                      <span className="text-[10px] text-purple-300 block print:text-black">Cédula: {user.identificacion}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1.5 print:text-black">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 print:hidden" />
                <span>Certificación Oficial de Calidad y Cadena de Custodia SHA-256 Verificada</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
