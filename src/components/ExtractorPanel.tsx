import React, { useState } from 'react';
import {
  UploadCloud,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  Database,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  FileCheck2,
  Image as ImageIcon,
  Trash2,
  FolderOpen,
  PlusCircle,
  FileCode,
  Link2,
  Globe,
  ClipboardPaste,
  Building2,
  AlertCircle
} from 'lucide-react';
import { InstitutionalConfig, FusionRule, AuditFinding } from '../types/audit';
import { REAL_PRESET_CASES, AuditPresetCase } from '../utils/constants';

interface ExtractorPanelProps {
  config: InstitutionalConfig;
  rules: FusionRule[];
  onAnalysisComplete: (
    newFindings: AuditFinding[],
    source: string,
    updatedRules?: Partial<FusionRule>[]
  ) => void;
  onLoadPresetCase: (preset: AuditPresetCase) => void;
  onCleanDatabase: () => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
}

interface UploadedFileRecord {
  name: string;
  size: number;
  type: string;
  base64: string;
}

export const ExtractorPanel: React.FC<ExtractorPanelProps> = ({
  config,
  rules,
  onAnalysisComplete,
  onLoadPresetCase,
  onCleanDatabase,
  isAnalyzing,
  setIsAnalyzing,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'link' | 'paste'>('files');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileRecord[]>([]);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isFetchingUrl, setIsFetchingUrl] = useState<boolean>(false);
  const [rawText, setRawText] = useState<string>(
    `=== ACTA DE REUNIÓN LECTURA DEL INFORME PRELIMINAR CCRD ===\nEntidad: ${config.entity_name}\nPeríodo Evaluado: ${config.audit_period}\nÓrgano Rector: Cámara de Cuentas de la República Dominicana (Resolución ADM-2025-040)\n\nDOCUMENTO OFICIAL LISTO PARA EXTRACCIÓN Y FUSIÓN DE 54 HALLAZGOS REALES O CARGA DE NUEVOS SOPORTES DIGITALES.`
  );
  const [showRawText, setShowRawText] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);

  // File Upload with base64 conversion for all formats (Word, Excel, PDF, Images, Text)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setStatusMessage(`Cargando y leyendo ${fileList.length} archivo(s)...`);

    const newFiles: UploadedFileRecord[] = [];

    for (const file of fileList) {
      const base64 = await readFileAsBase64(file);
      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.type || getMimeFromExtension(file.name),
        base64,
      });
    }

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setStatusMessage(
      `Listos ${newFiles.length} archivo(s) para extracción inteligente (Word, Excel, PDF, Imágenes con OCR).`
    );
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const getMimeFromExtension = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.docx'))
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (lower.endsWith('.xlsx'))
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (lower.endsWith('.csv')) return 'text/csv';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    return 'text/plain';
  };

  const getFileIcon = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.pdf')) return <FileCheck2 className="w-4 h-4 text-rose-400" />;
    if (lower.endsWith('.docx') || lower.endsWith('.doc'))
      return <FileText className="w-4 h-4 text-blue-400" />;
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv'))
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp'))
      return <ImageIcon className="w-4 h-4 text-amber-400" />;
    return <FileCode className="w-4 h-4 text-slate-400" />;
  };

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Fetch from Link / URL
  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;
    setIsFetchingUrl(true);
    setStatusMessage(`Importando contenido digital desde URL: ${urlInput}...`);

    try {
      const res = await fetch('/api/ai/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();
      if (data.success && data.content) {
        setRawText((prev) => `\n\n--- INICIO DE EVIDENCIA IMPORTADA DESDE ENLACE WEB (${urlInput}) ---\n${data.content}\n--- FIN DE EVIDENCIA WEB ---\n\n` + prev);
        setStatusMessage(`Contenido importado correctamente (${data.length} caracteres desde ${data.title || urlInput}).`);
        setActiveTab('paste');
        setShowRawText(true);
      } else {
        setStatusMessage(`No se pudo leer la URL: ${data.error || 'Verifique el enlace'}.`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Error al conectar con la URL proporcionada.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Run Extraction & AI Fusion
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setStatusMessage(
      uploadedFiles.length > 0
        ? `Procesando ${uploadedFiles.length} documento(s) (Word/Excel/PDF/Imágenes con OCR) y fusionando hallazgos...`
        : 'Analizando texto y fusionando hallazgos con IA...'
    );

    try {
      const res = await fetch('/api/ai/parse-and-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: uploadedFiles,
          rawText,
          auditType: config.audit_type,
          customRules: rules,
        }),
      });

      const data = await res.json();
      if (data.findings && Array.isArray(data.findings)) {
        onAnalysisComplete(data.findings, data.source || 'IA', data.updatedRules);
        if (data.extractedText) {
          setRawText(data.extractedText);
        }
        setStatusMessage(
          `Extracción finalizada: ${data.findings.length} hallazgos consolidados (${data.source}).`
        );
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage('Error procesando archivos. Se ha recuperado la matriz existente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Entity Isolation Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              Entidad Activa: <span className="text-blue-300 font-semibold">{config.entity_name}</span>
            </h2>
            <span className="bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded text-[10px] font-mono">
              {config.audit_period}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingreso y extracción multicanal de datos reales (archivos digitales, enlaces web y actas) con aislamiento estricto por caso
          </p>
        </div>

        {/* Action Buttons: Clean DB, Load Presets & AI Extraction */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Clean DB button */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  '¿Desea limpiar la base de datos para comenzar una auditoría completamente en blanco (0 hallazgos)? Los datos anteriores no se mezclarán.'
                )
              ) {
                onCleanDatabase();
                setUploadedFiles([]);
                setRawText('');
                setStatusMessage('Base de datos limpiada (0 hallazgos). Lista para ingresar nuevos datos reales.');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition"
            title="Iniciar auditoría con base de datos limpia"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Base Limpia (0)</span>
          </button>

          {/* Load Real Presets button */}
          <button
            onClick={() => setShowPresetModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-900/40 transition"
            title="Seleccionar entre expedientes reales"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Casos Reales</span>
          </button>

          {/* AI Extraction Button */}
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition ${
              isAnalyzing
                ? 'bg-blue-800 opacity-70 cursor-wait'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/30 ring-1 ring-white/10'
            }`}
          >
            {isAnalyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>{isAnalyzing ? 'Extrayendo 100% con IA...' : 'Procesar con IA 100%'}</span>
          </button>
        </div>
      </div>

      {/* Source Selector Tabs */}
      <div className="flex items-center gap-2 mt-4 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'files'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Archivos Digitales (Word, Excel, PDF, Fotos OCR)</span>
          {uploadedFiles.length > 0 && (
            <span className="bg-blue-900 text-blue-200 px-1.5 py-0.2 rounded-full text-[10px]">
              {uploadedFiles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('link')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'link'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Dirección Web / Enlace / URL</span>
        </button>

        <button
          onClick={() => setActiveTab('paste')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'paste'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Pegado Directo de Texto / Acta Oficial</span>
        </button>
      </div>

      {/* Tab 1: Upload Zone */}
      {activeTab === 'files' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-2">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-5 bg-slate-950/40 cursor-pointer transition group">
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition mb-2" />
              <div className="text-center">
                <span className="text-xs font-semibold text-slate-200">
                  Arrastra soportes de auditoría o{' '}
                  <span className="text-blue-400 underline">haz clic para examinar archivos</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Formatos admitidos:{' '}
                  <strong className="text-blue-300">Word (.docx)</strong>,{' '}
                  <strong className="text-emerald-300">Excel (.xlsx, .csv)</strong>,{' '}
                  <strong className="text-rose-300">PDF (.pdf)</strong>,{' '}
                  <strong className="text-amber-300">Imágenes OCR (.png, .jpg)</strong> y TXT
                </p>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {/* Uploaded Files Badges List */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 max-h-36 overflow-y-auto">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 shadow-sm"
                  >
                    {getFileIcon(file.name)}
                    <span className="max-w-[140px] truncate font-medium">{file.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="text-slate-400 hover:text-rose-400 ml-1"
                      title="Remover archivo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats Box */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-slate-300">Estado de Evidencias</span>
                <button
                  onClick={() => setShowRawText(!showRawText)}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
                >
                  {showRawText ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showRawText ? 'Ocultar' : 'Ver Texto'}</span>
                </button>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Archivos cargados:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {uploadedFiles.length} archivo(s)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Caracteres en memoria:</span>
                  <span className="font-mono text-slate-200">{rawText.length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reglas activas de fusión:</span>
                  <span className="font-mono text-indigo-400">{rules.length} macro-categorías</span>
                </div>
              </div>
            </div>

            {statusMessage && (
              <div className="mt-3 bg-blue-950/40 border border-blue-800/50 rounded-lg p-2 text-[11px] text-blue-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{statusMessage}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Link / URL Input */}
      {activeTab === 'link' && (
        <div className="mt-4 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
          <label className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Importar Datos o Enlace Web (Resoluciones, Portales de Transparencia, Actas en Línea)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2 mt-1">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://transparencia.gob.do/resoluciones/acta-auditoria-2021.html"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleFetchUrl}
              disabled={isFetchingUrl || !urlInput.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 transition"
            >
              {isFetchingUrl ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              <span>{isFetchingUrl ? 'Importando...' : 'Descargar Contenido'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            El sistema descargará el texto y estructura de la página remota de forma segura para alimentar los motores de auditoría forense con IA.
          </p>
        </div>
      )}

      {/* Tab 3: Direct Text Paste */}
      {activeTab === 'paste' && (
        <div className="mt-4 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <ClipboardPaste className="w-4 h-4 text-indigo-400" />
              <span>Pegado Directo de Texto / Acta Oficial de Auditoría</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {rawText.length.toLocaleString()} caracteres
            </span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={7}
            placeholder="Pega aquí el contenido completo de actas de reunión, pliegos, resoluciones, contratos o informes de auditoría..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-slate-400">
              Presione el botón "Procesar con IA 100%" para extraer los hallazgos con sus 4 C (Condición, Criterio, Causa, Efecto).
            </span>
            <button
              onClick={() => setRawText('')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Limpiar Texto
            </button>
          </div>
        </div>
      )}

      {/* Raw Text Drawer when toggle in Tab 1 */}
      {showRawText && activeTab !== 'paste' && (
        <div className="mt-4 border-t border-slate-800 pt-3">
          <label className="text-xs font-semibold text-slate-300 mb-1 block">
            Texto Extraído de Documentos (Word, Excel, PDF, TXT):
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={5}
            placeholder="Pega aquí actas, transcripciones, sentencias o déjalo vacío para que el extractor lea tus archivos..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Preset Real Cases Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPresetModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ×
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                Expedientes Reales de Auditoría Gubernamental & Forense
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Selecciona un expediente real con datos verificables o inicia una auditoría en blanco:
            </p>

            <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto">
              {REAL_PRESET_CASES.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => {
                    onLoadPresetCase(preset);
                    setShowPresetModal(false);
                    setStatusMessage(`Cargado caso real: "${preset.name}".`);
                  }}
                  className="bg-slate-950/70 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-600 rounded-xl p-3.5 cursor-pointer transition text-xs"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-bold">{preset.name}</strong>
                    <span className="bg-blue-900/40 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded text-[10px] font-mono">
                      {preset.findings.length} Hallazgos
                    </span>
                  </div>
                  <p className="text-amber-400 font-medium text-[11px] mt-0.5">{preset.subtitle}</p>
                  <p className="text-slate-400 text-[11px] mt-1">{preset.summaryText}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
