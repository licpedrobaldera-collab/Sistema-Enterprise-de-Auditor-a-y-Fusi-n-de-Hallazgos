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
  PlusCircle,
  Inbox,
  FolderOpen,
  FolderClock,
  Scale,
  Brain,
  Users,
  RotateCcw
} from 'lucide-react';
import { Header } from './components/Header';
import { ExtractorPanel } from './components/ExtractorPanel';
import { FindingsTable } from './components/FindingsTable';
import { FusionMatrixTable } from './components/FusionMatrixTable';
import { RiskMatrixHeatmap } from './components/RiskMatrixHeatmap';
import { AuditChartsDashboard } from './components/AuditChartsDashboard';
import { InstitutionalConfigModal } from './components/InstitutionalConfigModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { CmdConsoleModal } from './components/CmdConsoleModal';
import { AuditReportModal } from './components/AuditReportModal';
import { UserManagementModal } from './components/UserManagementModal';
import { AuditCaseHistoryModal } from './components/AuditCaseHistoryModal';
import { ContractAnalysisModal } from './components/ContractAnalysisModal';
import { ForensicExpertDictamenModal } from './components/ForensicExpertDictamenModal';
import { NotificationToast } from './components/NotificationToast';

import {
  AuditFinding,
  FusionRule,
  InstitutionalConfig,
  AuditTypeOption,
  AuditNotification,
  UserAccount,
  AuditCaseRecord,
  ContractRecord,
  ExpertDictamen,
} from './types/audit';
import {
  INITIAL_CONFIG,
  INITIAL_RULES,
  INITIAL_FINDINGS,
  REAL_PRESET_CASES,
  AuditPresetCase,
  MASTER_USER,
  INITIAL_USERS,
  INITIAL_CASE_HISTORY,
  INITIAL_CONTRACTS,
  INITIAL_EXPERT_DICTAMEN,
  COUNTRIES_CATALOG,
} from './utils/constants';
import { exportToExcel, exportToPDF, exportToWord, exportToCSV } from './utils/exporters';

export default function App() {
  // Institutional Config & Findings
  const [config, setConfig] = useState<InstitutionalConfig>(INITIAL_CONFIG);
  const [findings, setFindings] = useState<AuditFinding[]>(INITIAL_FINDINGS);
  const [rules, setRules] = useState<FusionRule[]>(INITIAL_RULES);

  // Security, Users & RBAC
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount>(MASTER_USER);

  // Historical Cases & Workspaces
  const [caseHistory, setCaseHistory] = useState<AuditCaseRecord[]>(INITIAL_CASE_HISTORY);
  const [activeCaseId, setActiveCaseId] = useState<string | null>('EXP-2026-BALDERA-01');

  // Contracts & Forensic Dictamen
  const [contracts, setContracts] = useState<ContractRecord[]>(INITIAL_CONTRACTS);
  const [dictamen, setDictamen] = useState<ExpertDictamen>(INITIAL_EXPERT_DICTAMEN);

  // Modals state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isCaseHistoryOpen, setIsCaseHistoryOpen] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isDictamenOpen, setIsDictamenOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<AuditNotification[]>([]);

  const addNotification = (
    title: string,
    message: string,
    type: 'success' | 'info' | 'warning' | 'danger' = 'info',
    category: 'audit' | 'export' | 'voice' | 'security' | 'user' = 'audit'
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

  // 1. Clean Database (0 findings & 0 rules)
  const handleCleanDatabase = () => {
    setFindings([]);
    setRules([]);
    setActiveCaseId(null);
    addNotification(
      'Base de Datos Limpiada (0)',
      'Se han eliminado todos los hallazgos y matrices. Espacio listo para una auditoría forense limpia.',
      'warning'
    );
  };

  // Restore Default 24 Forensic Findings
  const handleRestoreFullCatalog = () => {
    setFindings(INITIAL_FINDINGS);
    setRules(INITIAL_RULES);
    setConfig(INITIAL_CONFIG);
    addNotification(
      'Catálogo Forense Restaurado (100%)',
      `Se han cargado los ${INITIAL_FINDINGS.length} hallazgos reales y verificables del expediente forense.`,
      'success'
    );
  };

  // 2. Load Preset Case
  const handleLoadPresetCase = (preset: AuditPresetCase) => {
    setConfig(preset.config);
    setFindings(preset.findings);
    setRules(INITIAL_RULES);
    setActiveCaseId(preset.id);
    addNotification(
      'Caso Real Cargado al 100%',
      `Expediente "${preset.name}" cargado con sus ${preset.findings.length} hallazgos completos.`,
      'success'
    );
  };

  // 3. Case History: Load, Save, Delete, Import
  const handleLoadCase = (c: AuditCaseRecord) => {
    setConfig(c.config);
    setFindings(c.findings);
    setRules(c.fusionRules && c.fusionRules.length > 0 ? c.fusionRules : INITIAL_RULES);
    if (c.contratos_analizados) setContracts(c.contratos_analizados);
    if (c.dictamen_pericial) setDictamen(c.dictamen_pericial);
    setActiveCaseId(c.id);
    addNotification('Expediente Retomado', `Caso "${c.nombre_caso}" cargado con ${c.findings.length} hallazgos.`, 'success');
  };

  const handleSaveCurrentCase = (caseName: string, overwriteId?: string) => {
    const caseId = overwriteId || activeCaseId || `EXP-${new Date().getFullYear()}-BALDERA-${String(caseHistory.length + 1).padStart(2, '0')}`;
    const totalAmount = findings.reduce((acc, f) => acc + (f.monto || 0), 0);

    const newRecord: AuditCaseRecord = {
      id: caseId,
      codigo_expediente: caseId,
      nombre_caso: caseName,
      entidad: config.entity_name,
      fecha_creacion: new Date().toISOString().replace('T', ' ').slice(0, 19),
      fecha_modificacion: new Date().toISOString().replace('T', ' ').slice(0, 19),
      auditor_responsable: config.auditor_name,
      auditor_identificacion: config.auditor_id || currentUser.identificacion,
      usuario_id: currentUser.id,
      pais: config.country,
      moneda: config.currency,
      tipo_auditoria: config.audit_type,
      total_hallazgos: findings.length,
      monto_total: totalAmount,
      config,
      findings,
      fusionRules: rules,
      contratos_analizados: contracts,
      dictamen_pericial: dictamen,
    };

    setCaseHistory((prev) => {
      const exists = prev.some((c) => c.id === caseId);
      if (exists) {
        return prev.map((c) => (c.id === caseId ? newRecord : c));
      }
      return [newRecord, ...prev];
    });

    setActiveCaseId(caseId);
    addNotification('Caso Guardado en el Histórico', `Expediente "${caseName}" archivado exitosamente.`, 'success');
  };

  const handleDeleteCase = (caseId: string) => {
    setCaseHistory((prev) => prev.filter((c) => c.id !== caseId));
    if (activeCaseId === caseId) setActiveCaseId(null);
  };

  const handleImportCase = (caseData: AuditCaseRecord) => {
    setCaseHistory((prev) => [caseData, ...prev]);
    handleLoadCase(caseData);
  };

  // 4. Country Switcher
  const handleSelectCountry = (countryId: string) => {
    const selected = COUNTRIES_CATALOG.find((c) => c.id === countryId);
    if (!selected) return;

    setConfig((prev) => ({
      ...prev,
      country: selected.id,
      currency: selected.moneda,
      currency_symbol: selected.simbolo,
      recipient: `${selected.organo_cuentas} / ${selected.organo_fiscalizador}`,
      normativa_aplicable: selected.normativa_base,
    }));

    addNotification(
      'Jurisdicción Actualizada',
      `Marco normativo adaptado a: ${selected.nombre} (${selected.simbolo} / ${selected.moneda}).`,
      'info'
    );
  };

  // 5. CRUD for Findings
  const handleUpdateFinding = (updated: AuditFinding) => {
    setFindings((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    addNotification(
      'Hallazgo Guardado',
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
      `Hallazgo "${newFinding.titulo}" añadido a la matriz.`,
      'success'
    );
  };

  // 6. CRUD for Fusion Rules
  const handleUpdateRule = (updated: FusionRule) => {
    setRules((prev) => prev.map((r) => (r.fusion_id === updated.fusion_id ? updated : r)));
    addNotification('Regla de Fusión Modificada', `Criterios para ${updated.fusion_id} actualizados.`, 'info');
  };

  const handleAddRule = (newRule: FusionRule) => {
    setRules((prev) => [...prev, newRule]);
    addNotification('Nueva Regla de Fusión', `Se agregó la regla ${newRule.fusion_id}: ${newRule.rubro}.`, 'success');
  };

  const handleDeleteRule = (fusion_id: string) => {
    setRules((prev) => prev.filter((r) => r.fusion_id !== fusion_id));
    addNotification('Regla Eliminada', `Regla de fusión ${fusion_id} removida.`, 'warning');
  };

  // Switch Audit Mode
  const handleSelectAuditType = (type: AuditTypeOption) => {
    setConfig((prev) => ({ ...prev, audit_type: type.name }));
    addNotification('Modalidad Cambiada', `Se ha activado el modo de ${type.name}.`, 'info');
  };

  // Analysis Complete Handler
  const handleAnalysisComplete = (
    newFindings: AuditFinding[],
    source: string,
    updatedRules?: Partial<FusionRule>[]
  ) => {
    setFindings(newFindings);
    if (Array.isArray(updatedRules) && updatedRules.length > 0) {
      setRules((prevRules) =>
        prevRules.map((rule) => {
          const match = updatedRules.find((ur) => ur.fusion_id === rule.fusion_id);
          if (match) {
            return {
              ...rule,
              condicion_actualizada_ia:
                match.condicion_actualizada_ia || rule.condicion_actualizada_ia,
              criterios_actualizados:
                match.criterios_actualizados || rule.criterios_actualizados,
              recomendacion_actualizada:
                match.recomendacion_actualizada || rule.recomendacion_actualizada,
              conclusion_conformada:
                match.conclusion_conformada || rule.conclusion_conformada,
            };
          }
          return rule;
        })
      );
    }
    addNotification(
      'Extracción y Fusión Completa (100%)',
      `Se extrajeron ${newFindings.length} hallazgos con rigor forense (${source}).`,
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
          'Informe técnico de supervisión descargado en .docx.',
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
      {/* Institutional Header with Country, User, and Actions */}
      <Header
        config={config}
        currentUser={currentUser}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenCmdModal={() => setIsCmdOpen(true)}
        onOpenVoiceModal={() => setIsVoiceOpen(true)}
        onOpenUserModal={() => setIsUserOpen(true)}
        onOpenCaseHistoryModal={() => setIsCaseHistoryOpen(true)}
        onOpenContractModal={() => setIsContractOpen(true)}
        onOpenDictamenModal={() => setIsDictamenOpen(true)}
        onSelectAuditType={handleSelectAuditType}
        onSelectCountry={handleSelectCountry}
        onQuickExport={handleTriggerExport}
        isVoiceActive={isVoiceOpen}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        
        {/* Banner with Executive Status & Quick Navigation */}
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-950/30 to-purple-950/30 border border-blue-800/40 rounded-2xl p-4 mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Auditoría Forense Integral, Contratos & Fusión de Hallazgos con IA
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {findings.length} Hallazgos Registrados
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lectura multiformato, control de calidad 0-10, fiscalización de contratos y dictamen judicial vinculante
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsReportOpen(true)}
              disabled={findings.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white shadow-lg transition ring-1 ring-white/10"
            >
              <FileText className="w-4 h-4" />
              <span>Informe Supervisor</span>
            </button>
            <button
              onClick={() => setIsDictamenOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition"
            >
              <Brain className="w-4 h-4" />
              <span>Dictamen Pericial</span>
            </button>
            <button
              onClick={() => setIsContractOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 transition"
            >
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Contratos & Adendas</span>
            </button>
            <button
              onClick={() => setIsCaseHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition"
            >
              <FolderClock className="w-4 h-4 text-cyan-400" />
              <span>Expedientes</span>
            </button>
          </div>
        </div>

        {/* 1. Multiformat Document Extractor Panel */}
        <ExtractorPanel
          config={config}
          rules={rules}
          onAnalysisComplete={handleAnalysisComplete}
          onLoadPresetCase={handleLoadPresetCase}
          onCleanDatabase={handleCleanDatabase}
          isAnalyzing={isAnalyzing}
          setIsAnalyzing={setIsAnalyzing}
        />

        {/* Empty State Banner if Clean DB */}
        {findings.length === 0 && (
          <div className="bg-slate-900 border border-dashed border-slate-700 rounded-2xl p-8 my-6 text-center shadow-lg animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400 mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              Base de Datos Limpia (0 Hallazgos en Matriz)
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Estás en modo de auditoría en blanco. Puedes alimentar la matriz con documentos reales, dictado por voz, o restaurar el catálogo pericial:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <button
                onClick={handleRestoreFullCatalog}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar Caso Real Los Mina CCRD (54 Hallazgos Reales)
              </button>
              <button
                onClick={() => setIsCaseHistoryOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              >
                <FolderClock className="w-4 h-4 text-cyan-400" />
                Cargar Caso del Histórico
              </button>
            </div>
          </div>
        )}

        {/* 2. Interactive Risk Matrix & Financial Heatmap */}
        <RiskMatrixHeatmap findings={findings} currency={config.currency_symbol || config.currency} />

        {/* 2.1 Visual Risk & Budget Dashboard (Recharts Radar & Bar Charts) */}
        <AuditChartsDashboard findings={findings} currency={config.currency_symbol || config.currency} />

        {/* 3. Matriz de Hallazgos Reales (Editable Table with 0-10 supervisor rating) */}
        <FindingsTable
          findings={findings}
          rules={rules}
          currency={config.currency_symbol || config.currency}
          onUpdateFinding={handleUpdateFinding}
          onDeleteFinding={handleDeleteFinding}
          onAddFinding={handleAddFinding}
          onOpenVoiceModal={() => setIsVoiceOpen(true)}
        />

        {/* 4. Matriz de Análisis y Fusión Recomendada */}
        <FusionMatrixTable
          rules={rules}
          findings={findings}
          currency={config.currency_symbol || config.currency}
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
              Sistema Enterprise de Auditoría & Fusión de Hallazgos con IA | Firma: {config.auditor_name}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Cumple con ISSAI 5000, INTOSAI, NOBACI, Ley 10-07, Ley 340-06, Ley 41-08, NIIF / NICSP y Normas Periciales Judiciales
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
          addNotification('Configuración Guardada', 'Datos institucionales y de auditoría actualizados.', 'success');
        }}
      />

      <UserManagementModal
        isOpen={isUserOpen}
        onClose={() => setIsUserOpen(false)}
        currentUser={currentUser}
        users={users}
        onUpdateUsers={(updated) => setUsers(updated)}
        onSwitchUser={(user) => setCurrentUser(user)}
        onNotify={addNotification}
      />

      <AuditCaseHistoryModal
        isOpen={isCaseHistoryOpen}
        onClose={() => setIsCaseHistoryOpen(false)}
        caseHistory={caseHistory}
        activeCaseId={activeCaseId}
        currentFindings={findings}
        currentRules={rules}
        currentConfig={config}
        currentContracts={contracts}
        currentDictamen={dictamen}
        onLoadCase={handleLoadCase}
        onSaveCurrentCase={handleSaveCurrentCase}
        onDeleteCase={handleDeleteCase}
        onImportCase={handleImportCase}
        onNotify={addNotification}
      />

      <ContractAnalysisModal
        isOpen={isContractOpen}
        onClose={() => setIsContractOpen(false)}
        contracts={contracts}
        config={config}
        onAddContract={(contr) => setContracts((prev) => [contr, ...prev])}
        onImportContractAsFinding={handleAddFinding}
        onNotify={addNotification}
      />

      <ForensicExpertDictamenModal
        isOpen={isDictamenOpen}
        onClose={() => setIsDictamenOpen(false)}
        dictamen={dictamen}
        findings={findings}
        config={config}
        onUpdateDictamen={(d) => setDictamen(d)}
        onNotify={addNotification}
      />

      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onAddFinding={handleAddFinding}
        onFilterText={() => {}}
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
