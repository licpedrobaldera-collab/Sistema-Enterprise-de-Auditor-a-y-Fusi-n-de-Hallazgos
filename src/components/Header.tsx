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
  Users,
  FolderClock,
  Scale,
  Brain,
  Globe,
  Award
} from 'lucide-react';
import { InstitutionalConfig, AuditTypeOption, UserAccount } from '../types/audit';
import { AUDIT_TYPES, COUNTRIES_CATALOG } from '../utils/constants';

interface HeaderProps {
  config: InstitutionalConfig;
  currentUser: UserAccount;
  onOpenConfig: () => void;
  onOpenCmdModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenUserModal: () => void;
  onOpenCaseHistoryModal: () => void;
  onOpenContractModal: () => void;
  onOpenDictamenModal: () => void;
  onSelectAuditType: (type: AuditTypeOption) => void;
  onSelectCountry: (countryId: string) => void;
  onQuickExport: (format: 'pdf' | 'excel' | 'word' | 'csv') => void;
  isVoiceActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  currentUser,
  onOpenConfig,
  onOpenCmdModal,
  onOpenVoiceModal,
  onOpenUserModal,
  onOpenCaseHistoryModal,
  onOpenContractModal,
  onOpenDictamenModal,
  onSelectAuditType,
  onSelectCountry,
  onQuickExport,
  isVoiceActive,
}) => {
  const currentCountry = COUNTRIES_CATALOG.find((c) => c.id === config.country) || COUNTRIES_CATALOG[0];

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner with Active User, Security and Country switcher */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-blue-900/40 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Active User and Persona Badge */}
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <button
              onClick={onOpenUserModal}
              className="flex items-center gap-1.5 hover:bg-blue-900/40 px-2 py-0.5 rounded transition font-semibold text-blue-200"
              title="Abrir panel de usuarios y credenciales"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentUser.nombre}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {currentUser.rol}
              </span>
            </button>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 hidden md:inline">{config.auditor_role}</span>
          </div>

          {/* Country Selector & Security Status */}
          <div className="flex items-center gap-3 text-slate-300">
            {/* Country Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-0.5">
              <span className="text-sm">{currentCountry.bandera}</span>
              <select
                aria-label="Seleccionar País y Jurisdicción"
                value={config.country}
                onChange={(e) => onSelectCountry(e.target.value)}
                className="bg-transparent text-[11px] font-semibold text-slate-200 focus:outline-none cursor-pointer"
              >
                {COUNTRIES_CATALOG.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.nombre} ({c.simbolo})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/80 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[11px] text-emerald-300">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">E2E SHA-256</span>
            </div>

            <div className="hidden lg:flex items-center gap-1 text-slate-400 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{config.audit_period}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Logo & Entity Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/30 ring-1 ring-white/10 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Sistema Enterprise de Auditoría & Fusión de Hallazgos
                  <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-mono px-2 py-0.5 rounded-md uppercase">
                    v2.5 Full IA
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold text-slate-200">{config.entity_name}</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-medium">{config.audit_type}</span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-cyan-400 font-mono hidden sm:inline">{config.currency_symbol}</span>
              </div>
            </div>
          </div>

          {/* Action Modules & Tools Group */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Modalidad Selector Dropdown */}
            <div className="relative">
              <select
                aria-label="Modalidad de Auditoría"
                value={
                  AUDIT_TYPES.find((t) => t.name === config.audit_type)?.id ||
                  'forense'
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

            {/* Histórico de Expedientes */}
            <button
              onClick={onOpenCaseHistoryModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-950/60 hover:bg-blue-900/60 text-blue-200 border border-blue-800/60 transition shadow-sm"
              title="Abrir Histórico de Expedientes y Casos Guardados"
            >
              <FolderClock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Histórico</span>
            </button>

            {/* Auditoría de Contratos y Adendas */}
            <button
              onClick={onOpenContractModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-950/40 hover:bg-amber-900/40 text-amber-200 border border-amber-800/50 transition shadow-sm"
              title="Fiscalización de Contratos y Adendas (>25%)"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Contratos</span>
            </button>

            {/* Dictamen Pericial Judicial IA */}
            <button
              onClick={onOpenDictamenModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-purple-950/50 hover:bg-purple-900/50 text-purple-200 border border-purple-800/50 transition shadow-sm"
              title="Dictamen Pericial Judicial e IA de Detección de Fraude"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Dictamen IA</span>
            </button>

            {/* Usuarios RBAC */}
            <button
              onClick={onOpenUserModal}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Gestión de Usuarios y Roles (Lic. Pedro Baldera Master)"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Usuarios</span>
            </button>

            {/* Voice Dictation */}
            <button
              onClick={onOpenVoiceModal}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition shadow-sm ${
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
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Lanzador CMD por doble clic y scripts (.bat / .py)"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">CMD</span>
            </button>

            {/* Config modal button */}
            <button
              onClick={onOpenConfig}
              className="p-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Ajustes institucionales, auditor y país"
            >
              <Settings className="w-4 h-4 text-blue-400" />
            </button>

            {/* Quick Export Group */}
            <div className="flex items-center rounded-lg bg-blue-950/60 border border-blue-800/60 p-0.5">
              <button
                onClick={() => onQuickExport('excel')}
                className="px-2 py-1.5 text-xs text-emerald-300 hover:text-white hover:bg-emerald-900/40 rounded flex items-center gap-1 font-medium transition"
                title="Exportar Matrices en Excel (Hoja 1 y Hoja 2)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => onQuickExport('word')}
                className="px-2 py-1.5 text-xs text-blue-300 hover:text-white hover:bg-blue-900/40 rounded flex items-center gap-1 font-medium transition"
                title="Exportar Informe de Supervisión en Word (.docx)"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Word</span>
              </button>
              <button
                onClick={() => onQuickExport('pdf')}
                className="px-2 py-1.5 text-xs text-rose-300 hover:text-white hover:bg-rose-900/40 rounded flex items-center gap-1 font-medium transition"
                title="Exportar Informe Oficial en PDF"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-rose-400" />
                <span>PDF</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
