import React, { useState } from 'react';
import { 
  FolderClock, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Play, 
  X, 
  CheckCircle2, 
  FileSpreadsheet, 
  Building, 
  Calendar, 
  User, 
  Search,
  Copy,
  Clock
} from 'lucide-react';
import { AuditCaseRecord, AuditFinding, FusionRule, InstitutionalConfig, ContractRecord, ExpertDictamen } from '../types/audit';

interface AuditCaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseHistory: AuditCaseRecord[];
  activeCaseId: string | null;
  currentFindings: AuditFinding[];
  currentRules: FusionRule[];
  currentConfig: InstitutionalConfig;
  currentContracts?: ContractRecord[];
  currentDictamen?: ExpertDictamen;
  onLoadCase: (caseRecord: AuditCaseRecord) => void;
  onSaveCurrentCase: (newCaseName: string, overwriteId?: string) => void;
  onDeleteCase: (caseId: string) => void;
  onImportCase: (caseData: AuditCaseRecord) => void;
  onNotify: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'danger') => void;
}

export const AuditCaseHistoryModal: React.FC<AuditCaseHistoryModalProps> = ({
  isOpen,
  onClose,
  caseHistory,
  activeCaseId,
  currentFindings,
  currentRules,
  currentConfig,
  currentContracts,
  currentDictamen,
  onLoadCase,
  onSaveCurrentCase,
  onDeleteCase,
  onImportCase,
  onNotify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [caseNameInput, setCaseNameInput] = useState(
    `Auditoría Forense - ${currentConfig.entity_name} (${new Date().getFullYear()})`
  );

  if (!isOpen) return null;

  const filteredCases = caseHistory.filter(
    (c) =>
      c.nombre_caso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigo_expediente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.auditor_responsable.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNameInput.trim()) {
      onNotify('Nombre Inválido', 'Debe asignar un nombre al expediente de auditoría.', 'warning');
      return;
    }
    onSaveCurrentCase(caseNameInput.trim());
    setIsSavingNew(false);
  };

  const handleExportJSON = (c: AuditCaseRecord) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(c, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Expediente_${c.codigo_expediente}_${c.entidad.replace(/\s+/g, '_').slice(0, 20)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onNotify('Expediente Exportado', `Expediente ${c.codigo_expediente} descargado en formato JSON portátil.`, 'success');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.findings || !Array.isArray(parsed.findings)) {
          throw new Error('Estructura de expediente no válida.');
        }
        onImportCase(parsed);
        onNotify('Expediente Importado', `Se importó exitosamente el caso "${parsed.nombre_caso || file.name}".`, 'success');
      } catch (err: any) {
        onNotify('Error al Importar', 'El archivo no contiene un formato de expediente válido.', 'danger');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FolderClock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Histórico de Expedientes e Investigaciones Periciales
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {caseHistory.length} Registros Guardados
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Guarde, retome, reevalúe y preserve el 100% de los hallazgos y evidencias sin límite de tiempo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-cyan-400" />
              Importar (.JSON)
              <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
            </label>

            <button
              onClick={() => setIsSavingNew(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              Guardar Caso Actual ({currentFindings.length})
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Save Current Case Modal Banner */}
        {isSavingNew && (
          <form onSubmit={handleSaveSubmit} className="p-4 bg-blue-950/40 border-b border-blue-500/30 flex flex-col md:flex-row items-center gap-3 animate-in fade-in">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-blue-300 mb-1">
                Nombre del Expediente a Guardar en el Histórico:
              </label>
              <input
                type="text"
                required
                value={caseNameInput}
                onChange={(e) => setCaseNameInput(e.target.value)}
                placeholder="Nombre descriptivo del caso de auditoría"
                className="w-full px-3 py-1.5 bg-slate-900 border border-blue-500/40 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-2 pt-4 md:pt-0">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Confirmar Guardado
              </button>
              <button
                type="button"
                onClick={() => setIsSavingNew(false)}
                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Search bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código de expediente, entidad, auditor o palabra clave..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400">
            Mostrando <strong>{filteredCases.length}</strong> de {caseHistory.length}
          </span>
        </div>

        {/* Case List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredCases.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <FolderClock className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-400">No se encontraron expedientes en el histórico</p>
              <p className="text-xs text-slate-500 mt-1">
                Presione "Guardar Caso Actual" para archivar el trabajo que tiene en pantalla.
              </p>
            </div>
          ) : (
            filteredCases.map((c) => {
              const isActive = activeCaseId === c.id;
              const totalAmount = c.monto_total || c.findings.reduce((acc, f) => acc + (f.monto || 0), 0);

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-blue-950/30 border-blue-500 shadow-md ring-1 ring-blue-500/40'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {c.codigo_expediente}
                        </span>
                        <h3 className="text-sm font-bold text-white tracking-wide">
                          {c.nombre_caso}
                        </h3>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> ACTIVO EN PANTALLA
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-blue-400" />
                          <strong className="text-white">{c.entidad}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {c.auditor_responsable} ({c.auditor_identificacion})
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Guardado: {c.fecha_modificacion || c.fecha_creacion}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300">
                          Total Hallazgos: <strong className="text-cyan-400">{c.findings.length}</strong>
                        </span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300">
                          Monto Cuantificado: <strong className="text-emerald-400">{c.moneda || 'RD$'} {totalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>
                        </span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300">
                          Tipo: {c.tipo_auditoria}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => {
                          onLoadCase(c);
                          onNotify('Expediente Cargado', `Expediente "${c.nombre_caso}" cargado exitosamente.`, 'success');
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-all"
                        title="Cargar expediente para editar, corregir y continuar análisis"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Retomar / Editar
                      </button>

                      <button
                        onClick={() => handleExportJSON(c)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                        title="Exportar archivo JSON portátil"
                      >
                        <Download className="w-4 h-4 text-cyan-400" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`¿Está seguro de eliminar el expediente "${c.nombre_caso}"?`)) {
                            onDeleteCase(c.id);
                            onNotify('Expediente Eliminado', `Expediente ${c.codigo_expediente} eliminado.`, 'info');
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600/30 text-slate-400 hover:text-red-400 border border-slate-700 transition-all"
                        title="Eliminar del histórico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            Los expedientes históricos conservan el 100% de matrices, evidencias y dictámenes judiciales.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all"
          >
            Cerrar Histórico
          </button>
        </div>

      </div>
    </div>
  );
};
