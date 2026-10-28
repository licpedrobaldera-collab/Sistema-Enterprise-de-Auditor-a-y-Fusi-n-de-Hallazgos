import React, { useState } from 'react';
import {
  Terminal,
  Download,
  Copy,
  Check,
  X,
  Play,
  FileCode2,
  Cpu,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface CmdConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CmdConsoleModal: React.FC<CmdConsoleModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'cmd' | 'bat' | 'python'>('cmd');
  const [copiedText, setCopiedText] = useState(false);

  const cmdCommand = 'python -m streamlit run sistema_analisis_hallazgos_baldera_V2.py';

  const batCode = `@echo off
TITLE Sistema de Auditoria y Fusion de Hallazgos con IA - Lic. Pedro Baldera
COLOR 0A
cls
echo ===============================================================================
echo   SISTEMA ENTERPRISE DE AUDITORIA, EXTRACCION Y FUSION DE HALLAZGOS CON IA
echo   Iniciando servidor local y abriendo interfaz grafica automatica...
echo ===============================================================================
echo.

:: Crear carpetas necesarias automaticamente
if not exist "evidencias_auditoria" mkdir evidencias_auditoria
if not exist "reportes_exportados" mkdir reportes_exportados

:: Verificar e instalar dependencias transparentemente
python -m streamlit --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Instalando dependencias requeridas (streamlit, pandas, openpyxl, python-docx, PyMuPDF, pillow)...
    pip install streamlit pandas openpyxl python-docx PyMuPDF pillow
)

echo [OK] Iniciando aplicacion para PC, tablet y celular en la red local...
python -m streamlit run sistema_analisis_hallazgos_baldera_V2.py --server.headless=false --server.address=0.0.0.0 --server.port=8501

pause`;

  const pythonPreview = `# -*- coding: utf-8 -*-
"""
SISTEMA ENTERPRISE DE ANÁLISIS DE AUDITORÍA, EXTRACCIÓN MULTIFORMATO Y FUSIÓN DE HALLAZGOS CON IA (v2)
=======================================================================================================
Autoría / Firma: Lic. Pedro A. Baldera Rondón, CPA - Auditor Forense Antifraude & Consultor Financiero
Plataforma: Python 3.10+ / Streamlit / OpenPyXL / python-docx / PyMuPDF / Pandas
"""
# Motor de Extracción Multiformato (PDF, Word, Excel, CSV)
# Clasificador de Fusión Heurístico & IA (NOBACI, PETI, Recursos Humanos, Nóminas, Ética)
# Exportadores Nativos en OpenPyXL y python-docx`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownload = (endpoint: string, filename: string) => {
    const a = document.createElement('a');
    a.href = endpoint;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Lógica de Ejecución CMD & Scripts Locales
              <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 text-[10px] px-2 py-0.5 rounded font-mono">
                Batch / Streamlit
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Instrucciones para ejecución automática con doble clic en Windows o consola local
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 gap-2 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('cmd')}
            className={`pb-2 px-3 border-b-2 transition ${
              activeTab === 'cmd'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            💻 Instrucciones CMD
          </button>
          <button
            onClick={() => setActiveTab('bat')}
            className={`pb-2 px-3 border-b-2 transition ${
              activeTab === 'bat'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📜 ejecutar_sistema_auditoria.bat
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`pb-2 px-3 border-b-2 transition ${
              activeTab === 'python'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🐍 sistema_analisis_hallazgos_baldera_V2.py
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'cmd' && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-emerald-400">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                  <span>Símbolo del sistema (CMD / PowerShell de Windows)</span>
                  <button
                    onClick={() => handleCopy(cmdCommand)}
                    className="flex items-center gap-1 text-slate-300 hover:text-white"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? 'Copiado' : 'Copiar Comando'}</span>
                  </button>
                </div>
                <p className="select-all text-sm font-bold">{cmdCommand}</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-200 text-xs">
                  Pasos de Ejecución Automática por Doble Clic:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>
                    <strong className="text-white">Descarga el lanzador (.bat):</strong> Guarda{' '}
                    <code className="text-emerald-300">ejecutar_sistema_auditoria.bat</code> y el script{' '}
                    <code className="text-emerald-300">sistema_analisis_hallazgos_baldera_V2.py</code> en
                    la misma carpeta.
                  </li>
                  <li>
                    <strong className="text-white">Doble clic en el archivo .bat:</strong> Abre la
                    consola CMD con fondo negro y letras verdes.
                  </li>
                  <li>
                    <strong className="text-white">Verificación transparente:</strong> Instala
                    automáticamente dependencias faltantes (Streamlit, Pandas, OpenPyXL, python-docx,
                    PyMuPDF).
                  </li>
                  <li>
                    <strong className="text-white">Despliegue automático:</strong> Inicia el servidor
                    local en el puerto 8501 y abre inmediatamente la interfaz gráfica en tu navegador web.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'bat' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Código del Lanzador de Consola Windows:</span>
                <button
                  onClick={() => handleCopy(batCode)}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código</span>
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                {batCode}
              </pre>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  Script de Producción en Python (Streamlit + OpenPyXL + python-docx):
                </span>
                <span className="text-[11px] text-slate-500">
                  Lic. Pedro A. Baldera Rondón, CPA
                </span>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-blue-300 overflow-x-auto">
                {pythonPreview}
              </pre>
            </div>
          )}
        </div>

        {/* Download Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 mt-4">
          <div className="text-[11px] text-slate-400">
            Descarga directa de los archivos originales para ejecutar en tu PC:
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleDownload('/api/download/bat-script', 'ejecutar_sistema_auditoria.bat')
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .BAT</span>
            </button>
            <button
              onClick={() =>
                handleDownload(
                  '/api/download/python-script',
                  'sistema_analisis_hallazgos_baldera_V2.py'
                )
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-700 hover:bg-blue-600 text-white shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .PY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
