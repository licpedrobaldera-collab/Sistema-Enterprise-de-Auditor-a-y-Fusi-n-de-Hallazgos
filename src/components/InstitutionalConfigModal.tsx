import React, { useState } from 'react';
import { Settings, X, Building2, Shield, Calendar, User, DollarSign, Lock } from 'lucide-react';
import { InstitutionalConfig } from '../types/audit';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Configuración Institucional de Auditoría</h3>
            <p className="text-xs text-slate-400">
              Personaliza el membrete, destinatario, firma oficial y parámetros de exportación
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Modalidad / Tipo de Auditoría</span>
              </label>
              <input
                type="text"
                required
                value={form.audit_type}
                onChange={(e) => setForm({ ...form, audit_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Período Auditado</span>
              </label>
              <input
                type="text"
                required
                value={form.audit_period}
                onChange={(e) => setForm({ ...form, audit_period: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Destinatario Oficial del Informe
            </label>
            <input
              type="text"
              value={form.recipient}
              onChange={(e) => setForm({ ...form, recipient: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auditor Responsable / Firma</span>
              </label>
              <input
                type="text"
                required
                value={form.auditor_name}
                onChange={(e) => setForm({ ...form, auditor_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Cargo / Credenciales Profesionales
              </label>
              <input
                type="text"
                value={form.auditor_role}
                onChange={(e) => setForm({ ...form, auditor_role: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Moneda de Registro</span>
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="RD$">RD$ - Peso Dominicano</option>
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Cifrado E2E Forense</span>
              </label>
              <div className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Activo (SHA-256)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
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
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
