import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Building2, 
  Shield, 
  Calendar, 
  User, 
  DollarSign, 
  Lock, 
  Globe, 
  Award, 
  FileCheck2,
  Scale
} from 'lucide-react';
import { InstitutionalConfig } from '../types/audit';
import { COUNTRIES_CATALOG } from '../utils/constants';

interface InstitutionalConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: InstitutionalConfig;
  onSaveConfig: (updated: InstitutionalConfig) => void;
}

export const InstitutionalConfigModal: React.FC<InstitutionalConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [form, setForm] = useState<InstitutionalConfig>({ ...config });

  if (!isOpen) return null;

  const handleCountryChange = (countryId: string) => {
    const selected = COUNTRIES_CATALOG.find(c => c.id === countryId);
    if (!selected) return;

    setForm({
      ...form,
      country: selected.id,
      currency: selected.moneda,
      currency_symbol: selected.simbolo,
      recipient: `${selected.organo_cuentas} / ${selected.organo_fiscalizador}`,
      normativa_aplicable: selected.normativa_base,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800/50 flex items-center justify-center text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Configuración Institucional e Internacionalización
              </h3>
              <p className="text-xs text-slate-400">
                Personalice los datos del auditor, perito judicial, normas y jurisdicción de cualquier país del mundo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          
          {/* Country / Jurisdiction Selector */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="block text-slate-200 font-bold flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>País, Moneda y Jurisdicción Legal de Auditoría *</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COUNTRIES_CATALOG.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => handleCountryChange(c.id)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    form.country === c.id
                      ? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500'
                      : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="text-base">{c.bandera}</div>
                  <div className="font-bold text-[11px] truncate">{c.nombre}</div>
                  <div className="text-[10px] text-cyan-300 font-mono">{c.simbolo} ({c.moneda})</div>
                </button>
              ))}
            </div>
          </div>

          {/* Entidad Auditada & Período */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Entidad Auditada *</span>
              </label>
              <input
                type="text"
                required
                value={form.entity_name}
                onChange={(e) => setForm({ ...form, entity_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Período Auditado *</span>
              </label>
              <input
                type="text"
                required
                value={form.audit_period}
                onChange={(e) => setForm({ ...form, audit_period: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Destinatario */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Órgano Rector / Destinatario Oficial del Informe</span>
            </label>
            <input
              type="text"
              required
              value={form.recipient}
              onChange={(e) => setForm({ ...form, recipient: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Auditor Profile Credentials */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4" /> Datos del Auditor y Perito Contable Forense
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nombre Completo y Firma *
                </label>
                <input
                  type="text"
                  required
                  value={form.auditor_name}
                  onChange={(e) => setForm({ ...form, auditor_name: e.target.value })}
                  placeholder="Lic. Pedro A. Baldera Rondón, CPA"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Cédula de Identidad o RNC *
                </label>
                <input
                  type="text"
                  value={form.auditor_id || ''}
                  onChange={(e) => setForm({ ...form, auditor_id: e.target.value })}
                  placeholder="001-0854912-3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Cargo / Título Profesional
                </label>
                <input
                  type="text"
                  value={form.auditor_role}
                  onChange={(e) => setForm({ ...form, auditor_role: e.target.value })}
                  placeholder="Auditor Forense Antifraude & Perito Contable"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Número de Exequátur / CPA / Colegiatura
                </label>
                <input
                  type="text"
                  value={form.auditor_cpa_number || ''}
                  onChange={(e) => setForm({ ...form, auditor_cpa_number: e.target.value })}
                  placeholder="CPA No. 12845 / ICPARD"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Firma / Despacho Pericial Consultor
              </label>
              <input
                type="text"
                value={form.firm_name || ''}
                onChange={(e) => setForm({ ...form, firm_name: e.target.value })}
                placeholder="Baldera & Asociados - Consultores Forenses y Financieros"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Supervisor Profile */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Datos del Supervisor de Calidad Técnica (0 a 10)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nombre del Supervisor *
                </label>
                <input
                  type="text"
                  required
                  value={form.supervisor_name}
                  onChange={(e) => setForm({ ...form, supervisor_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Cargo del Supervisor
                </label>
                <input
                  type="text"
                  value={form.supervisor_role}
                  onChange={(e) => setForm({ ...form, supervisor_role: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Encryption and Security */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Lock className="w-4 h-4" />
              <span>Cifrado E2E Forense Habilitado (SHA-256 / AES-GCM)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">HASH: {form.securityHash.slice(0, 18)}...</span>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg"
            >
              Guardar y Aplicar al Sistema
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
