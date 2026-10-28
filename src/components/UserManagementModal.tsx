import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Key, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  AlertTriangle, 
  History, 
  UserPlus, 
  CheckCircle2,
  Lock,
  RotateCcw
} from 'lucide-react';
import { UserAccount, UserRole } from '../types/audit';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  users: UserAccount[];
  onUpdateUsers: (users: UserAccount[]) => void;
  onSwitchUser: (user: UserAccount) => void;
  onNotify: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'danger') => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onUpdateUsers,
  onSwitchUser,
  onNotify,
}) => {
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form state for creating / editing user
  const [formData, setFormData] = useState<{
    identificacion: string;
    nombre: string;
    email: string;
    rol: UserRole;
    password: string;
  }>({
    identificacion: '',
    nombre: '',
    email: '',
    rol: 'AUDITOR_FORENSE',
    password: '',
  });

  if (!isOpen) return null;

  const isMaster = currentUser.rol === 'MASTER_ADMIN' || currentUser.es_master;

  const handleStartCreate = () => {
    setFormData({
      identificacion: '',
      nombre: '',
      email: '',
      rol: 'AUDITOR_FORENSE',
      password: '',
    });
    setIsCreating(true);
    setSelectedUser(null);
  };

  const handleSaveNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identificacion.trim() || !formData.nombre.trim() || !formData.password.trim()) {
      onNotify('Campos Incompletos', 'Debe completar identificación, nombre y contraseña.', 'warning');
      return;
    }

    const newUser: UserAccount = {
      id: `USR-${String(users.length + 1).padStart(3, '0')}`,
      identificacion: formData.identificacion.trim(),
      nombre: formData.nombre.trim(),
      email: formData.email.trim() || `${formData.identificacion.replace(/[^0-9]/g, '')}@auditoria.do`,
      rol: formData.rol,
      password: formData.password,
      historial_claves: [formData.password],
      fecha_creacion: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ultimo_acceso: 'Nunca',
      estado: 'Activo',
    };

    const updated = [...users, newUser];
    onUpdateUsers(updated);
    setIsCreating(false);
    onNotify('Usuario Registrado', `Usuario ${newUser.nombre} (${newUser.rol}) creado exitosamente.`, 'success');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!newPassword.trim()) {
      onNotify('Clave Vacía', 'Debe ingresar una nueva contraseña.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      onNotify('Contraseñas No Coinciden', 'La confirmación no coincide con la nueva clave.', 'danger');
      return;
    }

    const updatedUsers = users.map((u) => {
      if (u.id === selectedUser.id) {
        const history = u.historial_claves || [];
        return {
          ...u,
          password: newPassword,
          historial_claves: [newPassword, ...history.slice(0, 9)], // conserva histórico
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    setSelectedUser({
      ...selectedUser,
      password: newPassword,
      historial_claves: [newPassword, ...(selectedUser.historial_claves || []).slice(0, 9)],
    });
    setIsEditingPassword(false);
    setNewPassword('');
    setConfirmPassword('');
    onNotify('Clave Actualizada', `La clave de ${selectedUser.nombre} fue actualizada y registrada en el historial.`, 'success');
  };

  const handleResetPassword = (targetUser: UserAccount) => {
    const defaultPass = `PASS_${targetUser.identificacion.replace(/[^0-9]/g, '').slice(-4) || '2026'}`;
    const updatedUsers = users.map((u) => {
      if (u.id === targetUser.id) {
        return {
          ...u,
          password: defaultPass,
          historial_claves: [defaultPass, ...(u.historial_claves || [])],
        };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);
    onNotify('Clave Reseteada', `Contraseña de ${targetUser.nombre} reseteada a: ${defaultPass}`, 'info');
  };

  const handleDeleteUser = (userId: string) => {
    if (!isMaster) {
      onNotify('Acceso Denegado', 'Solo el Administrador Master (Lic. Pedro Baldera) puede eliminar usuarios.', 'danger');
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (target?.es_master) {
      onNotify('Operación Bloqueada', 'No se puede eliminar la cuenta del Administrador Master Principal.', 'danger');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar definitivamente al usuario ${target?.nombre}?`)) {
      const updated = users.filter((u) => u.id !== userId);
      onUpdateUsers(updated);
      if (selectedUser?.id === userId) setSelectedUser(null);
      onNotify('Usuario Eliminado', `El usuario ${target?.nombre} ha sido removido del sistema.`, 'warning');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'MASTER_ADMIN':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">MASTER ADMIN</span>;
      case 'SUPERVISOR_CALIDAD':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">SUPERVISOR CALIDAD</span>;
      case 'AUDITOR_FORENSE':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">AUDITOR FORENSE</span>;
      case 'PERITO_CONTABLE':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PERITO JUDICIAL</span>;
      case 'AUDITOR_JUNIOR':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">AUDITOR JUNIOR</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Control Central de Usuarios y Seguridad RBAC
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Lic. Pedro Baldera - Master
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gestión de roles periciales, claves históricas perpetuas y control total de accesos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMaster && (
              <button
                onClick={handleStartCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Nuevo Usuario
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master Active Banner */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border-b border-amber-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>
              Usuario en Sesión Activa: <strong className="text-white font-semibold">{currentUser.nombre}</strong> ({currentUser.rol}) — ID/Cédula: <code>{currentUser.identificacion}</code>
            </span>
          </div>
          <div className="text-slate-400">
            {isMaster ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Privilegios Master Totales Habilitados (100%)
              </span>
            ) : (
              <span className="text-amber-400">Modo Operativo Estándar</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Users List */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span>Directorio de Usuarios Autorizados ({users.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Haga clic para ver detalles y gestionar</span>
            </div>

            <div className="space-y-2.5">
              {users.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                const isCurrent = currentUser.id === user.id;

                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setIsCreating(false);
                      setIsEditingPassword(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                        user.rol === 'MASTER_ADMIN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : user.rol === 'SUPERVISOR_CALIDAD'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {user.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{user.nombre}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              ACTIVO
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>ID/Cédula: <strong className="text-slate-300">{user.identificacion}</strong></span>
                          <span>•</span>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getRoleBadge(user.rol)}
                      {!isCurrent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSwitchUser(user);
                            onNotify('Cambio de Sesión', `Ha iniciado sesión como ${user.nombre}.`, 'info');
                          }}
                          className="px-2 py-1 rounded bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white text-xs font-medium transition-all"
                          title="Iniciar sesión con este usuario"
                        >
                          Conectar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: User Details / Edit / Create */}
          <div className="md:col-span-5 bg-slate-850 border border-slate-700/70 rounded-xl p-5 flex flex-col justify-between">
            {isCreating ? (
              /* Create User Form */
              <form onSubmit={handleSaveNewUser} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" /> Crear Nuevo Usuario Pericial
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cédula o RNC del Usuario *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.identificacion}
                    onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                    placeholder="Ej. 001-0854912-3"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nombre Completo y Titulación *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej. Lic. Pedro A. Baldera Rondón, CPA"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ejemplo@auditoriaforense.do"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rol Pericial / Función *
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="AUDITOR_FORENSE">AUDITOR FORENSE (Extracción y Análisis)</option>
                    <option value="SUPERVISOR_CALIDAD">SUPERVISOR DE CALIDAD (Revisión 0-10)</option>
                    <option value="PERITO_CONTABLE">PERITO CONTABLE JUDICIAL (Dictámenes)</option>
                    <option value="AUDITOR_JUNIOR">AUDITOR JUNIOR (Captura y Verificación)</option>
                    <option value="MASTER_ADMIN">MASTER ADMIN (Control Total)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contraseña Inicial (Sin Vencimiento) *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Defina una clave permanente"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all"
                >
                  Registrar Usuario y Asignar Privilegios
                </button>
              </form>
            ) : selectedUser ? (
              /* Selected User View & Actions */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      {selectedUser.nombre}
                    </h4>
                    <span className="text-xs text-slate-400">ID: {selectedUser.identificacion}</span>
                  </div>
                  {getRoleBadge(selectedUser.rol)}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Correo:</span>
                    <span className="text-slate-200 font-medium">{selectedUser.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Estado:</span>
                    <span className="text-emerald-400 font-semibold">{selectedUser.estado}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Fecha Creación:</span>
                    <span className="text-slate-300">{selectedUser.fecha_creacion}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Último Acceso:</span>
                    <span className="text-slate-300">{selectedUser.ultimo_acceso}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Vigencia de Clave:</span>
                    <span className="text-cyan-400 font-semibold">Permanente (Sin Vencimiento)</span>
                  </div>
                </div>

                {/* Password History Box */}
                <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-amber-400" /> Historial de Claves Anteriores ({selectedUser.historial_claves?.length || 1})
                    </span>
                    {isMaster && (
                      <span className="text-[10px] text-amber-400 font-mono">Clave Activa: ••••••••</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {(selectedUser.historial_claves || []).map((pass, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-400 font-mono bg-slate-950/60 px-2 py-1 rounded">
                        <span>Registro #{idx + 1}</span>
                        <span>{idx === 0 ? 'Clave Vigente' : 'Clave Anterior Reemplazada'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Password Edit Accordion */}
                {isEditingPassword ? (
                  <form onSubmit={handleChangePassword} className="space-y-2 bg-slate-900 p-3 rounded-lg border border-blue-500/40">
                    <label className="block text-xs font-bold text-blue-300">
                      Nueva Clave para {selectedUser.nombre}:
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nueva contraseña sin vencimiento"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                    />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmar nueva contraseña"
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                      >
                        Guardar Clave
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingPassword(false)}
                        className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => setIsEditingPassword(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-semibold transition-all"
                    >
                      <Key className="w-3.5 h-3.5" /> Cambiar Clave
                    </button>

                    {isMaster && (
                      <button
                        onClick={() => handleResetPassword(selectedUser)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-semibold transition-all"
                        title="Restablecer clave por defecto para soporte"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Resetear Clave
                      </button>
                    )}

                    {isMaster && !selectedUser.es_master && (
                      <button
                        onClick={() => handleDeleteUser(selectedUser.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-semibold transition-all ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-500">
                <ShieldCheck className="w-12 h-12 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-400">Seleccione un usuario para ver detalles</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  O presione "Nuevo Usuario" para agregar un auditor, perito judicial o supervisor de control de calidad.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Cifrado SHA-256 Activo</span>
              <span>Auditoría de Acciones Registrada</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Administrador Master Titular: <strong className="text-amber-400 font-semibold">Lic. Pedro A. Baldera Rondón, CPA</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
          >
            Cerrar Panel de Usuarios
          </button>
        </div>

      </div>
    </div>
  );
};
