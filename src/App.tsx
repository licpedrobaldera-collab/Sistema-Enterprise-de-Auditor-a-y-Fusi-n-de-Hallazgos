import React, { useState } from 'react';
import {
  FileText,
  FileCheck2,
  FileSpreadsheet,
  Download,
  Terminal,
  Mic,
  Shield,
  Layers,
  Sparkles,
  BarChart2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Header } from './components/Header';
import { ExtractorPanel } from './components/ExtractorPanel';
import { FindingsTable } from './components/FindingsTable';
import { FusionMatrixTable } from './components/FusionMatrixTable';
import { RiskMatrixHeatmap } from './components/RiskMatrixHeatmap';
import { InstitutionalConfigModal } from './components/InstitutionalConfigModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { CmdConsoleModal } from './components/CmdConsoleModal';
import { AuditReportModal } from './components/AuditReportModal';
import { NotificationToast } from './components/NotificationToast';

import {
  AuditFinding,
  FusionRule,
  InstitutionalConfig,
  AuditTypeOption,
  AuditNotification,
} from './types/audit';
import { INITIAL_CONFIG, INITIAL_RULES, INITIAL_FINDINGS, AUDIT_TYPES } from './utils/constants';
import { exportToExcel, exportToPDF, exportToWord, exportToCSV } from './utils/exporters';

export default function App() {
  const [config, setConfig] = useState<InstitutionalConfig>(INITIAL_CONFIG);
  const [findings, setFindings] = useState<AuditFinding[]>(INITIAL_FINDINGS);
  const [rules, setRules] = useState<FusionRule[]>(INITIAL_RULES);

  // Modals state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<AuditNotification[]>([]);

  const addNotification = (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'danger' = 'info',
    category: 'audit' | 'export' | 'voice' | 'security' = 'audit'
  ) => {
    const newNotif: AuditNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      title,
      message,
      type,
      category,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // CRUD for Findings
  const handleUpdateFinding = (updated: AuditFinding) => {
    setFindings((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    addNotification(
      'Hallazgo Actualizado',
      `Hallazgo #${updated.id} guardado satisfactoriamente en la matriz.`,
      'success'
    );
  };

  const handleDeleteFinding = (id: number) => {
    setFindings((prev) => prev.filter((f) => f.id !== id));
    addNotification('Hallazgo Eliminado', `Se ha removido el hallazgo #${id}.`, 'warning');
  };

  const handleAddFinding = (newFinding: AuditFinding) => {
    setFindings((prev) => [newFinding, ...prev]);
    addNotification(
      'Nuevo Hallazgo Registrado',
      `Hallazgo #${newFinding.id}: "${newFinding.titulo}" añadido a la matriz.`,
      'success'
    );
  };

  // CRUD for Fusion Rules
  const handleUpdateRule = (updated: FusionRule) => {
    setRules((prev) => prev.map((r) => (r.fusion_id === updated.fusion_id ? updated : r)));
    addNotification(
      'Regla de Fusión Modificada',
      `Criterios para ${updated.fusion_id} actualizados.`,
      'info'
    );
  };

  const handleAddRule = (newRule: FusionRule) => {
    setRules((prev) => [...prev, newRule]);
    addNotification(
      'Nueva Regla de Fusión',
      `Se agregó la regla ${newRule.fusion_id}: ${newRule.rubro}.`,
      'success'
    );
  };

  const handleDeleteRule = (fusion_id: string) => {
    setRules((prev) => prev.filter((r) => r.fusion_id !== fusion_id));
    addNotification('Regla Eliminada', `Regla de fusión ${fusion_id} removida.`, 'warning');
  };

  // Switch Audit Mode
  const handleSelectAuditType = (type: AuditTypeOption) => {
    setConfig((prev) => ({ ...prev, audit_type: type.name }));
    addNotification(
      'Modalidad Cambiada',
      `Se ha activado el modo de ${type.name}.`,
      'info'
    );
  };

  // Load Sample Case
  const handleLoadSampleData = () => {
    setConfig(INITIAL_CONFIG);
    setFindings(INITIAL_FINDINGS);
    setRules(INITIAL_RULES);
    addNotification(
      'Expediente Cargado',
      'Cargados datos de muestra del Hospital San Lorenzo de Los Mina.',
      'info'
    );
  };

  // Analysis Complete Handler
  const handleAnalysisComplete = (newFindings: AuditFinding[], source: string) => {
    setFindings(newFindings);
    addNotification(
      'Análisis con IA Finalizado',
      `Se procesaron y fusionaron ${newFindings.length} hallazgos mediante ${source}.`,
      'success'
    );
  };

  // Exporters
  const handleTriggerExport = (format: 'pdf' | 'excel' | 'word' | 'csv') => {
    try {
      if (format === 'pdf') {
        exportToPDF(config, findings, rules);
        addNotification('Exportación en PDF', 'Informe oficial descargado.', 'success', 'export');
      } else if (format === 'excel') {
        exportToExcel(config, findings, rules);
        addNotification(
          'Exportación en Excel',
          'Matrices de hallazgos y fusiones exportadas a .xlsx.',
          'success',
          'export'
        );
      } else if (format === 'word') {
        exportToWord(config, findings, rules);
        addNotification(
          'Exportación en Word',
          'Informe técnico con membrete y firmas descargado en .docx.',
          'success',
          'export'
        );
      } else if (format === 'csv') {
        exportToCSV(config, findings);
        addNotification('Exportación en CSV', 'Matriz de datos exportada en CSV.', 'success', 'export');
      }
    } catch (e: any) {
      console.error(e);
      addNotification('Error de Exportación', 'No se pudo generar el archivo solicitado.', 'danger');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Institutional Header */}
      <Header
        config={config}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenCmdModal={() => setIsCmdOpen(true)}
        onOpenVoiceModal={() => setIsVoiceOpen(true)}
        onSelectAuditType={handleSelectAuditType}
        onQuickExport={handleTriggerExport}
        isVoiceActive={isVoiceOpen}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Banner with View Report & Quick Actions */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-950/30 to-slate-900/60 border border-blue-900/50 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Auditoría Corporativa & Matriz de Fusión Inteligente
              </h2>
              <p className="text-xs text-slate-400">
                Extracción multiformato (PDF, Word, Excel), clasificación NOBACI/COSO y generación
                automatizada de informes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition ring-1 ring-white/10"
            >
              <FileText className="w-4 h-4" />
              <span>Ver Informe Completo</span>
            </button>
            <button
              onClick={() => handleTriggerExport('pdf')}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 transition"
              title="Descargar PDF"
            >
              <FileCheck2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleTriggerExport('excel')}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition"
              title="Descargar Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. Multiformat Document Extractor Panel */}
        <ExtractorPanel
          config={config}
          rules={rules}
          onAnalysisComplete={handleAnalysisComplete}
          onLoadSampleData={handleLoadSampleData}
          isAnalyzing={isAnalyzing}
          setIsAnalyzing={setIsAnalyzing}
        />

        {/* 2. Interactive Risk Matrix & Financial Heatmap */}
        <RiskMatrixHeatmap findings={findings} currency={config.currency} />

        {/* 3. Matriz de Hallazgos Reales (Editable Table) */}
        <FindingsTable
          findings={findings}
          rules={rules}
          currency={config.currency}
          onUpdateFinding={handleUpdateFinding}
          onDeleteFinding={handleDeleteFinding}
          onAddFinding={handleAddFinding}
          onOpenVoiceModal={() => setIsVoiceOpen(true)}
        />

        {/* 4. Matriz de Análisis y Fusión Recomendada */}
        <FusionMatrixTable
          rules={rules}
          findings={findings}
          currency={config.currency}
          onUpdateRule={handleUpdateRule}
          onAddRule={handleAddRule}
          onDeleteRule={handleDeleteRule}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Sistema de Auditoría & Fusión de Hallazgos | Firma: {config.auditor_name}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Cumple con Ley 10-07 (CGR/NOBACI), Ley 41-08 (Función Pública), Ley 126-01 y Normas NIA
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <InstitutionalConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={(updated) => {
          setConfig(updated);
          addNotification('Configuración Guardada', 'Datos institucionales actualizados.', 'success');
        }}
      />

      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onAddFinding={handleAddFinding}
        onFilterText={(t) => {
          // If needed, filtering is handled in findings table
        }}
        onTriggerExport={handleTriggerExport}
        onAddNotification={addNotification}
      />

      <CmdConsoleModal isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />

      <AuditReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        config={config}
        findings={findings}
        rules={rules}
        onExport={handleTriggerExport}
      />

      {/* Real-time Notifications Toast */}
      <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
}
