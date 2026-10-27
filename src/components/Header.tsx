import React from 'react';
import {
  ShieldCheck,
  Lock,
  Terminal,
  Mic,
  Settings,
  FileSpreadsheet,
  FileText,
  FileCheck2,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { InstitutionalConfig, AuditTypeOption } from '../types/audit';
import { AUDIT_TYPES } from '../utils/constants';

interface HeaderProps {
  config: InstitutionalConfig;
  onOpenConfig: () => void;
  onOpenCmdModal: () => void;
  onOpenVoiceModal: () => void;
  onSelectAuditType: (type: AuditTypeOption) => void;
  onQuickExport: (format: 'pdf' | 'excel' | 'word') => void;
  isVoiceActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenConfig,
  onOpenCmdModal,
  onOpenVoiceModal,
  onSelectAuditType,
  onQuickExport,
  isVoiceActive,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner with credentials & security */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-blue-900/40 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-blue-200 uppercase tracking-wider">
              {config.auditor_name}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">{config.auditor_role}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] text-emerald-300">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Cifrado E2E Activo (AES-GCM / SHA-256)</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Período: {config.audit_period}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Logo & Entity Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/30 ring-1 ring-white/10 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Sistema Enterprise de Auditoría & Fusión de Hallazgos
                  <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-mono px-2 py-0.5 rounded-md uppercase">
                    v2.0 IA
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium text-slate-200">{config.entity_name}</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-medium">{config.audit_type}</span>
              </div>
            </div>
          </div>

          {/* Action Tools & Audit Type Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Modalidad Selector Dropdown */}
            <div className="relative">
              <select
                aria-label="Modalidad de Auditoría"
                value={
                  AUDIT_TYPES.find((t) => t.name === config.audit_type)?.id ||
                  'financiera_especial'
                }
                onChange={(e) => {
                  const selected = AUDIT_TYPES.find((t) => t.id === e.target.value);
                  if (selected) onSelectAuditType(selected);
                }}
                className="bg-slate-900 border border-slate-700 hover:border-blue-500 text-xs text-white rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer transition shadow-sm"
              >
                {AUDIT_TYPES.map((type) => (
                  <option key={type.id} value={type.id} className="bg-slate-900 text-slate-100">
                    📂 {type.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                ▼
              </div>
            </div>

            {/* Voice Dictation button */}
            <button
              onClick={onOpenVoiceModal}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition shadow-sm ${
                isVoiceActive
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Dictado por voz de hallazgos y comandos"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voz</span>
            </button>

            {/* CMD & Python script inspector */}
            <button
              onClick={onOpenCmdModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Instrucciones de ejecución CMD y scripts (.bat / .py)"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">CMD / Streamlit</span>
            </button>

            {/* Config modal button */}
            <button
              onClick={onOpenConfig}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Ajustes institucionales y destinatario"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>

            {/* Quick Export Group */}
            <div className="flex items-center rounded-lg bg-blue-950/60 border border-blue-800/60 p-0.5">
              <button
                onClick={() => onQuickExport('pdf')}
                className="px-2.5 py-1.5 text-xs text-rose-300 hover:text-white hover:bg-rose-900/40 rounded flex items-center gap-1 font-medium transition"
                title="Exportar Informe Oficial en PDF"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-rose-400" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => onQuickExport('excel')}
                className="px-2.5 py-1.5 text-xs text-emerald-300 hover:text-white hover:bg-emerald-900/40 rounded flex items-center gap-1 font-medium transition"
                title="Exportar Matrices en Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => onQuickExport('word')}
                className="px-2.5 py-1.5 text-xs text-blue-300 hover:text-white hover:bg-blue-900/40 rounded flex items-center gap-1 font-medium transition"
                title="Exportar Informe Técnico en Word (.docx)"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Word</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
