import React, { useState } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  X, 
  Building2, 
  Calendar, 
  DollarSign, 
  ShieldAlert, 
  ArrowRight,
  Send,
  Scale
} from 'lucide-react';
import { ContractRecord, InstitutionalConfig, AuditFinding } from '../types/audit';

interface ContractAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  contracts: ContractRecord[];
  config: InstitutionalConfig;
  onAddContract: (contract: ContractRecord) => void;
  onImportContractAsFinding: (finding: AuditFinding) => void;
  onNotify: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'danger') => void;
}

export const ContractAnalysisModal: React.FC<ContractAnalysisModalProps> = ({
  isOpen,
  onClose,
  contracts,
  config,
  onAddContract,
  onImportContractAsFinding,
  onNotify,
}) => {
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(contracts[0] || null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Contract Form
  const [formData, setFormData] = useState<{
    numero_contrato: string;
    objeto: string;
    contratista: string;
    rnc_contratista: string;
    monto_original: number;
    monto_adendas: number;
    plazo_original_dias: number;
    plazo_adicional_dias: number;
    estado_poliza: 'Vigente' | 'Vencida' | 'Inexistente';
    normativa_violada: string;
    observaciones: string;
  }>({
    numero_contrato: '',
    objeto: '',
    contratista: '',
    rnc_contratista: '',
    monto_original: 0,
    monto_adendas: 0,
    plazo_original_dias: 180,
    plazo_adicional_dias: 0,
    estado_poliza: 'Vigente',
    normativa_violada: 'Art. 31 Ley 340-06 / Normas Internacionales de Contratación Pública',
    observaciones: '',
  });

  if (!isOpen) return null;

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numero_contrato.trim() || formData.monto_original <= 0) {
      onNotify('Datos Incompletos', 'Debe suministrar número de contrato y monto original.', 'warning');
      return;
    }

    const variationPct = Number(((formData.monto_adendas / formData.monto_original) * 100).toFixed(2));
    const alerts: string[] = [];

    if (variationPct > 25) {
      alerts.push(`Excede el límite legal del 25% (Variación calculada: ${variationPct}%)`);
    }
    if (formData.estado_poliza === 'Vencida' || formData.estado_poliza === 'Inexistente') {
      alerts.push(`Póliza de fianza en estado: ${formData.estado_poliza}`);
    }
    if (formData.plazo_adicional_dias > formData.plazo_original_dias) {
      alerts.push(`Prórroga de tiempo de ${formData.plazo_adicional_dias} días excede el plazo contractual inicial`);
    }

    const newRecord: ContractRecord = {
      id: `CONTR-${String(contracts.length + 1).padStart(3, '0')}`,
      numero_contrato: formData.numero_contrato.trim(),
      objeto: formData.objeto.trim(),
      contratista: formData.contratista.trim(),
      rnc_contratista: formData.rnc_contratista.trim(),
      monto_original: formData.monto_original,
      monto_adendas: formData.monto_adendas,
      porcentaje_variacion: variationPct,
      plazo_original_dias: formData.plazo_original_dias,
      plazo_adicional_dias: formData.plazo_adicional_dias,
      estado_poliza: formData.estado_poliza,
      alertas_riesgo: alerts,
      cumplimiento_ley: variationPct > 25 ? 'Excede Tope Legal (>25%)' : alerts.length > 0 ? 'Observado Crítico' : 'Conforme',
      observaciones: formData.observaciones.trim() || 'Evaluación pericial de fiscalización de contratos.',
      normativa_violada: formData.normativa_violada,
    };

    onAddContract(newRecord);
    setSelectedContract(newRecord);
    setIsAddingNew(false);
    onNotify('Contrato Auditado', `Contrato ${newRecord.numero_contrato} registrado con variación de ${variationPct}%.`, 'success');
  };

  const handlePushAsFinding = (contr: ContractRecord) => {
    const finding: AuditFinding = {
      id: Date.now(),
      numero_hallazgo: `C-${contr.numero_contrato.slice(-6)}`,
      pagina_referencia: `Expediente Contractual No. ${contr.numero_contrato} - Legajo Jurídico`,
      titulo: `Irregularidades Contractuales en Adendas y Plazos: Contrato ${contr.numero_contrato}`,
      rubro: 'Obras Públicas, Contratos y Adendas',
      condicion: `El contrato No. ${contr.numero_contrato} suscrito con ${contr.contratista} (RNC: ${contr.rnc_contratista}) por valor inicial de ${config.currency_symbol} ${contr.monto_original.toLocaleString('es-DO', { minimumFractionDigits: 2 })} fue modificado mediante adendas por ${config.currency_symbol} ${contr.monto_adendas.toLocaleString('es-DO', { minimumFractionDigits: 2 })}, alcanzando una alteración presupuestaria del ${contr.porcentaje_variacion}%. Asimismo, la fianza contractual figura en estado '${contr.estado_poliza}' con ${contr.plazo_adicional_dias} días de prórroga concedidos.`,
      criterio: contr.normativa_violada || 'Ley 340-06 sobre Compras y Contrataciones del Estado (Art. 31); Reglamento 543-12; Normas Internacionales ISSAI 5000.',
      causa: 'Falta de planificación en pliegos técnicos y otorgamiento deliberado de incrementos presupuestarios al margen del procedimiento de licitación.',
      efecto: `Compromiso de recursos públicos no licitados por ${config.currency_symbol} ${contr.monto_adendas.toLocaleString('es-DO', { minimumFractionDigits: 2 })} y exposición a desamparo por garantías no renovadas.`,
      monto: contr.monto_adendas,
      recomendacion: 'Proceder a la declaratoria de nulidad de las adendas que sobrepasen el 25% legal, intimar al contratista para la entrega de fianzas vigentes y deducir responsabilidades civiles y penales.',
      conclusion: 'La modificación contractual por encima del límite legal y la custodia de garantías vencidas vulneran preceptos de orden público y comprometen la responsabilidad personal de las autoridades firmantes.',
      riesgo: contr.porcentaje_variacion > 25 ? 'Crítico' : 'Alto',
      fusion_id: 'FUS-06',
      puntuacion_calidad: 9.5,
      estado_supervision: 'Requiere Ajuste',
      incidencia_supervisor: 'El hallazgo contractual requiere anexar el cálculo del exceso matemático exacto sobre el 25% y la certificación del banco emisor de la fianza.',
      ajuste_recomendado_supervisor: 'Incorporar la constancia de nulidad de la adenda y anexar los oficios de intimación de la aseguradora para calificar 10/10.',
      fecha_registro: new Date().toISOString().slice(0, 10),
      estado: 'Confirmado',
      evidencia_soporte: `Contrato_${contr.numero_contrato.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      auditor_registrador: config.auditor_name,
      pais_jurisdiccion: config.country,
    };

    onImportContractAsFinding(finding);
    onNotify('Hallazgo Agregado a la Matriz', `El contrato ${contr.numero_contrato} ha sido incorporado a la matriz de auditoría en pantalla.`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Módulo de Fiscalización de Contratos, Adendas y Pliegos
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Límite Legal: 25% Máximo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoría pericial bajo Ley 340-06, ISSAI 5000, INTOSAI y fiscalización de pólizas de fiel cumplimiento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Evaluar Nuevo Contrato
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Contracts List */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Contratos en Fiscalización ({contracts.length})
            </h3>

            <div className="space-y-2">
              {contracts.map((c) => {
                const isSelected = selectedContract?.id === c.id;
                const isViolation = c.porcentaje_variacion > 25;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedContract(c);
                      setIsAddingNew(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500 ring-1 ring-amber-500/40 shadow-lg'
                        : 'bg-slate-850 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {c.numero_contrato}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isViolation
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        +{c.porcentaje_variacion}% Adendas
                      </span>
                    </div>

                    <p className="text-xs text-white font-medium line-clamp-1">
                      {c.objeto}
                    </p>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between mt-2 pt-2 border-t border-slate-750">
                      <span>{c.contratista}</span>
                      <span className={c.estado_poliza === 'Vencida' ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                        Fianza: {c.estado_poliza}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Details or New Contract Form */}
          <div className="md:col-span-7 bg-slate-850 border border-slate-700/70 rounded-xl p-5 flex flex-col justify-between">
            {isAddingNew ? (
              /* Add New Contract Form */
              <form onSubmit={handleSaveContract} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Ingresar Contrato / Adenda para Análisis Pericial
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Número / Código del Contrato *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.numero_contrato}
                      onChange={(e) => setFormData({ ...formData, numero_contrato: e.target.value })}
                      placeholder="Ej. MOPC-CCC-LPN-2021-0022"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      RNC del Contratista
                    </label>
                    <input
                      type="text"
                      value={formData.rnc_contratista}
                      onChange={(e) => setFormData({ ...formData, rnc_contratista: e.target.value })}
                      placeholder="130-99887-1"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Empresa Contratista Adjudicataria *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contratista}
                    onChange={(e) => setFormData({ ...formData, contratista: e.target.value })}
                    placeholder="Nombre o Razón Social del Consorcio"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Objeto Contractual Detallado
                  </label>
                  <input
                    type="text"
                    value={formData.objeto}
                    onChange={(e) => setFormData({ ...formData, objeto: e.target.value })}
                    placeholder="Descripción de la obra, servicio o suministro"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Monto Original Contratado ({config.currency_symbol}) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.monto_original || ''}
                      onChange={(e) => setFormData({ ...formData, monto_original: Number(e.target.value) })}
                      placeholder="Monto base sin adendas"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Monto Acumulado en Adendas ({config.currency_symbol}) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.monto_adendas || ''}
                      onChange={(e) => setFormData({ ...formData, monto_adendas: Number(e.target.value) })}
                      placeholder="Total adicionado mediante adendas"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Plazo Original (Días)
                    </label>
                    <input
                      type="number"
                      value={formData.plazo_original_dias}
                      onChange={(e) => setFormData({ ...formData, plazo_original_dias: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Prórroga Otorgada (Días)
                    </label>
                    <input
                      type="number"
                      value={formData.plazo_adicional_dias}
                      onChange={(e) => setFormData({ ...formData, plazo_adicional_dias: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Estado de Póliza de Fianza
                    </label>
                    <select
                      value={formData.estado_poliza}
                      onChange={(e) => setFormData({ ...formData, estado_poliza: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="Vigente">Vigente</option>
                      <option value="Vencida">Vencida</option>
                      <option value="Inexistente">Inexistente</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all mt-2"
                >
                  Registrar Contrato y Ejecutar Cálculo de Variación
                </button>
              </form>
            ) : selectedContract ? (
              /* Selected Contract Details */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {selectedContract.numero_contrato}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      {selectedContract.objeto}
                    </h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                    selectedContract.porcentaje_variacion > 25
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {selectedContract.cumplimiento_ley}
                  </span>
                </div>

                {/* Mathematical Variation Box */}
                <div className="grid grid-cols-3 gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Monto Original</span>
                    <p className="text-xs font-bold text-slate-200 mt-0.5 font-mono">
                      {config.currency_symbol} {selectedContract.monto_original.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Monto en Adendas</span>
                    <p className="text-xs font-bold text-amber-300 mt-0.5 font-mono">
                      {config.currency_symbol} {selectedContract.monto_adendas.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Variación Porcentual</span>
                    <p className={`text-sm font-black mt-0.5 ${
                      selectedContract.porcentaje_variacion > 25 ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {selectedContract.porcentaje_variacion}% {selectedContract.porcentaje_variacion > 25 ? '(Ilegal)' : '(Conforme)'}
                    </p>
                  </div>
                </div>

                {/* Over-threshold warning */}
                {selectedContract.porcentaje_variacion > 25 && (
                  <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-red-300 font-bold">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      ALERTA PERICIAL: EXCESO DEL UMBRAL MÁXIMO DEL 25% (LEY 340-06 ART. 31)
                    </div>
                    <p className="text-red-200 text-[11px]">
                      El exceso sobre el límite permitido es de <strong>{(selectedContract.porcentaje_variacion - 25).toFixed(2)}%</strong>, equivalente a <strong>{config.currency_symbol} {(selectedContract.monto_adendas - (selectedContract.monto_original * 0.25)).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong> desembolsados sin amparo en la Ley de Contrataciones Públicas.
                    </p>
                  </div>
                )}

                {/* Risk Alerts */}
                <div>
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1 mb-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Banderas Rojas y Alertas de Riesgo Contractual ({selectedContract.alertas_riesgo.length})
                  </span>
                  <div className="space-y-1">
                    {selectedContract.alertas_riesgo.map((alert, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{alert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action button to insert as finding */}
                <div className="pt-2">
                  <button
                    onClick={() => handlePushAsFinding(selectedContract)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Incorporar Hallazgo Contractual a la Matriz de Auditoría en Pantalla
                  </button>
                </div>
              </div>
            ) : null}

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Auditoría de Obras e Infraestructura</span>
              <span>Criterio Vinculante de Ley 340-06</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            Verificación automática de adendas y vencimiento de garantías aseguradoras.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all"
          >
            Cerrar Módulo
          </button>
        </div>

      </div>
    </div>
  );
};
