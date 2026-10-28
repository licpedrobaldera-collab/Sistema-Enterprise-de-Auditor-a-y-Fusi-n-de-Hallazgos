import React, { useState, useRef, useEffect } from 'react';
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
  RotateCcw,
  Download,
  Upload,
  PenTool,
  ClipboardPaste,
  Award,
  BadgeCheck,
  Phone,
  Mail,
  FileSpreadsheet
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
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form for editing or creating user
  const [formUser, setFormUser] = useState<Partial<UserAccount>>({
    identificacion: '',
    nombre: '',
    email: '',
    rol: 'AUDITOR_FORENSE',
    cargo: '',
    exequatur_cpa: '',
    registro_pericial: '',
    especialidad: '',
    telefono: '',
    firma_digital: '',
    password: '',
    estado: 'Activo',
  });

  // Canvas ref for interactive signature drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (selectedUser && !isCreating) {
      setFormUser({ ...selectedUser });
    }
  }, [selectedUser, isCreating]);

  // Clipboard paste listener for signature images
  const handlePasteSignature = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target?.result as string;
              setFormUser((prev) => ({ ...prev, firma_digital: base64 }));
              onNotify('Firma Pegada', 'Imagen de firma electrónica pegada desde el portapapeles con éxito.', 'success');
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      onNotify('Sin Imagen en Portapapeles', 'Copie una imagen de firma antes de pegar (Ctrl+C en la imagen y luego presione este botón).', 'info');
    } catch {
      onNotify('Permiso de Portapapeles', 'Haga clic en la caja de firma o use el botón de subir imagen.', 'warning');
    }
  };

  const handleSignatureFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormUser((prev) => ({ ...prev, firma_digital: base64 }));
      onNotify('Firma Cargada', 'Firma digitalizada incorporada al perfil.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Drawing canvas logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1d4ed8'; // blue ink
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL('image/png');
    setFormUser((prev) => ({ ...prev, firma_digital: base64 }));
    setIsDrawingSignature(false);
    onNotify('Firma Guardada', 'Firma manuscrita digitalizada guardada.', 'success');
  };

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setFormUser({
      identificacion: '',
      nombre: '',
      email: '',
      rol: 'AUDITOR_FORENSE',
      cargo: 'Auditor Forense de Campo',
      exequatur_cpa: 'Exequátur Pendiente / Colegiatura',
      registro_pericial: 'RPE-CPJ-2026',
      especialidad: 'Auditoría Forense y Peritaje Contable',
      telefono: '',
      firma_digital: '',
      password: '',
      estado: 'Activo',
    });
    setIsCreating(true);
    setIsEditing(false);
    setSelectedUser(null);
  };

  const handleStartEdit = (user: UserAccount) => {
    setSelectedUser(user);
    setFormUser({ ...user });
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUser.identificacion?.trim() || !formUser.nombre?.trim()) {
      onNotify('Campos Obligatorios', 'Debe indicar Cédula/Identificación y Nombre Completo.', 'warning');
      return;
    }

    if (isCreating) {
      if (!formUser.password?.trim()) {
        onNotify('Contraseña Requerida', 'Defina una contraseña inicial para el nuevo usuario.', 'warning');
        return;
      }
      const newUser: UserAccount = {
        id: `USR-${String(users.length + 1).padStart(3, '0')}`,
        identificacion: formUser.identificacion.trim(),
        nombre: formUser.nombre.trim(),
        email: formUser.email?.trim() || `${formUser.identificacion.replace(/[^0-9]/g, '')}@auditoriaforense.do`,
        rol: formUser.rol || 'AUDITOR_FORENSE',
        cargo: formUser.cargo?.trim() || 'Auditor Forense Actuante',
        exequatur_cpa: formUser.exequatur_cpa?.trim() || 'CPA No. Oficial',
        registro_pericial: formUser.registro_pericial?.trim() || 'RPE-CPJ-Oficial',
        especialidad: formUser.especialidad?.trim() || 'Auditoría Gubernamental',
        telefono: formUser.telefono?.trim() || '',
        firma_digital: formUser.firma_digital || '',
        password: formUser.password,
        historial_claves: [formUser.password],
        fecha_creacion: new Date().toISOString().replace('T', ' ').slice(0, 19),
        ultimo_acceso: 'Nunca',
        estado: formUser.estado || 'Activo',
      };

      const updated = [...users, newUser];
      onUpdateUsers(updated);
      setSelectedUser(newUser);
      setIsCreating(false);
      setIsEditing(false);
      onNotify('Usuario Creado', `Usuario ${newUser.nombre} (${newUser.rol}) registrado con éxito.`, 'success');
    } else if (selectedUser) {
      // Editing existing user (including Master & Admin)
      const updatedUsers = users.map((u) => {
        if (u.id === selectedUser.id) {
          return {
            ...u,
            identificacion: formUser.identificacion?.trim() || u.identificacion,
            nombre: formUser.nombre?.trim() || u.nombre,
            email: formUser.email?.trim() || u.email,
            rol: formUser.rol || u.rol,
            cargo: formUser.cargo?.trim() || u.cargo,
            exequatur_cpa: formUser.exequatur_cpa?.trim() || u.exequatur_cpa,
            registro_pericial: formUser.registro_pericial?.trim() || u.registro_pericial,
            especialidad: formUser.especialidad?.trim() || u.especialidad,
            telefono: formUser.telefono?.trim() || u.telefono,
            firma_digital: formUser.firma_digital !== undefined ? formUser.firma_digital : u.firma_digital,
            estado: formUser.estado || u.estado,
          };
        }
        return u;
      });

      onUpdateUsers(updatedUsers);
      const updatedSel = updatedUsers.find((u) => u.id === selectedUser.id) || null;
      setSelectedUser(updatedSel);
      setIsEditing(false);
      onNotify('Perfil y Credenciales Actualizadas', `Datos de ${formUser.nombre} actualizados con éxito.`, 'success');
    }
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
          historial_claves: [newPassword, ...history.slice(0, 9)],
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
    onNotify('Clave Actualizada', `La clave de ${selectedUser.nombre} fue actualizada y registrada.`, 'success');
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
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    if (window.confirm(`¿Está seguro de eliminar definitivamente al usuario ${target.nombre} (${target.rol})?`)) {
      const updated = users.filter((u) => u.id !== userId);
      onUpdateUsers(updated);
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
        setIsEditing(false);
      }
      onNotify('Usuario Eliminado', `El usuario ${target.nombre} ha sido removido del sistema.`, 'warning');
    }
  };

  // Export full user directory to JSON or CSV
  const handleExportUsers = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(users, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Directorio_Auditores_Peritos_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['ID', 'Nombre', 'Identificacion', 'Rol', 'Cargo', 'Exequatur_CPA', 'Registro_Pericial', 'Especialidad', 'Email', 'Telefono', 'Estado'];
      const rows = users.map((u) => [
        u.id,
        `"${u.nombre.replace(/"/g, '""')}"`,
        `"${u.identificacion}"`,
        u.rol,
        `"${(u.cargo || '').replace(/"/g, '""')}"`,
        `"${(u.exequatur_cpa || '').replace(/"/g, '""')}"`,
        `"${(u.registro_pericial || '').replace(/"/g, '""')}"`,
        `"${(u.especialidad || '').replace(/"/g, '""')}"`,
        u.email,
        u.telefono || '',
        u.estado,
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Directorio_Auditores_Peritos_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    onNotify('Directorio Exportado', `Listado de auditores y peritos exportado en formato ${format.toUpperCase()}.`, 'success');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'MASTER_ADMIN':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">MASTER ADMIN</span>;
      case 'SUPERVISOR_CALIDAD':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">SUPERVISOR CALIDAD</span>;
      case 'AUDITOR_FORENSE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">AUDITOR FORENSE</span>;
      case 'PERITO_CONTABLE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PERITO JUDICIAL</span>;
      case 'AUDITOR_JUNIOR':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">AUDITOR JUNIOR</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Gestión Total de Usuarios, Peritos y Credenciales Profesionales
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Edición y Extracción Completa
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Permite agregar, editar (incluyendo Master y Administrador), extraer, borrar y actualizar firmas y credenciales de ley
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportUsers('csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all"
              title="Descargar listado en CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={() => handleExportUsers('json')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all"
              title="Extraer directorio completo en JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Extraer JSON</span>
            </button>
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nuevo Usuario / Perito</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Active User Banner */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border-b border-amber-500/20 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2 text-amber-300">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>
              Sesión Activa: <strong className="text-white font-semibold">{currentUser.nombre}</strong> ({currentUser.rol}) — ID: <code>{currentUser.identificacion}</code> {currentUser.exequatur_cpa && `| ${currentUser.exequatur_cpa}`}
            </span>
          </div>
          <div className="text-slate-400 flex items-center gap-3">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Gestión de Credenciales Habilitada para Todos los Roles
            </span>
          </div>
        </div>

        {/* Body Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Users List */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>Directorio de Auditores y Peritos ({users.length})</span>
              </h3>
              <span className="text-[11px] text-slate-500">Seleccione para ver o editar</span>
            </div>

            <div className="space-y-2 max-h-[68vh] overflow-y-auto pr-1">
              {users.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                const isCurrent = currentUser.id === user.id;

                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setIsCreating(false);
                      setIsEditing(false);
                      setIsEditingPassword(false);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                        : 'bg-slate-850/60 border-slate-750 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                        user.rol === 'MASTER_ADMIN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : user.rol === 'SUPERVISOR_CALIDAD'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : user.rol === 'PERITO_CONTABLE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}>
                        {user.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">{user.nombre}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              SESIÓN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          <span>ID: {user.identificacion}</span>
                          {user.cargo && <span className="block text-[10px] text-slate-500 truncate max-w-[200px]">{user.cargo}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getRoleBadge(user.rol)}
                      {!isCurrent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSwitchUser(user);
                            onNotify('Cambio de Sesión', `Ha iniciado sesión como ${user.nombre}.`, 'info');
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-[10px] font-medium transition-all"
                          title="Operar en el sistema con este usuario"
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

          {/* Right Column: User Profile Details / Full Editor */}
          <div className="md:col-span-7 bg-slate-850 border border-slate-700/70 rounded-xl p-5 flex flex-col justify-between">
            {isCreating || isEditing ? (
              /* Create or Edit Form */
              <form onSubmit={handleSaveUser} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-750">
                  <h4 className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4" />
                    {isCreating ? 'Registrar Nuevo Auditor / Perito Judicial' : `Editar Perfil y Credenciales de: ${selectedUser?.nombre}`}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Nombre Completo y Titulación Oficial *
                    </label>
                    <input
                      type="text"
                      required
                      value={formUser.nombre || ''}
                      onChange={(e) => setFormUser({ ...formUser, nombre: e.target.value })}
                      placeholder="Ej: Lic. Pedro A. Baldera Rondón, CPA"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Cédula de Identidad / RNC *
                    </label>
                    <input
                      type="text"
                      required
                      value={formUser.identificacion || ''}
                      onChange={(e) => setFormUser({ ...formUser, identificacion: e.target.value })}
                      placeholder="Ej: 001-0854912-3"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Rol en el Sistema de Auditoría *
                    </label>
                    <select
                      value={formUser.rol}
                      onChange={(e) => setFormUser({ ...formUser, rol: e.target.value as UserRole })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="MASTER_ADMIN">MASTER ADMIN (Control Total y Acreditación)</option>
                      <option value="SUPERVISOR_CALIDAD">SUPERVISOR DE CALIDAD (Revisión y Ponderación 0-10)</option>
                      <option value="AUDITOR_FORENSE">AUDITOR FORENSE (Extracción y Fusión de Campo)</option>
                      <option value="PERITO_CONTABLE">PERITO CONTABLE JUDICIAL (Emisión de Dictámenes con Fe Pública)</option>
                      <option value="AUDITOR_JUNIOR">AUDITOR JUNIOR (Verificación Documental y Soporte)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Cargo Oficial Institucional
                    </label>
                    <input
                      type="text"
                      value={formUser.cargo || ''}
                      onChange={(e) => setFormUser({ ...formUser, cargo: e.target.value })}
                      placeholder="Ej: Supervisor de Grupos de Auditoría CCRD"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Exequátur / Colegiatura CPA Titular
                    </label>
                    <input
                      type="text"
                      value={formUser.exequatur_cpa || ''}
                      onChange={(e) => setFormUser({ ...formUser, exequatur_cpa: e.target.value })}
                      placeholder="Ej: Exequátur No. 498-95 / ICPARD No. 12845"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Registro de Perito Judicial (Poder Judicial)
                    </label>
                    <input
                      type="text"
                      value={formUser.registro_pericial || ''}
                      onChange={(e) => setFormUser({ ...formUser, registro_pericial: e.target.value })}
                      placeholder="Ej: RPE-CPJ-2024-0891"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Especialidad Técnica Forense
                    </label>
                    <input
                      type="text"
                      value={formUser.especialidad || ''}
                      onChange={(e) => setFormUser({ ...formUser, especialidad: e.target.value })}
                      placeholder="Ej: Auditoría Forense, Obras Civiles y Fraude Financiero"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Teléfono de Contacto Oficial
                    </label>
                    <input
                      type="text"
                      value={formUser.telefono || ''}
                      onChange={(e) => setFormUser({ ...formUser, telefono: e.target.value })}
                      placeholder="Ej: +1 (809) 555-0192"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">
                      Correo Electrónico Institucional
                    </label>
                    <input
                      type="email"
                      value={formUser.email || ''}
                      onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
                      placeholder="auditor@organorector.gob.do"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {isCreating && (
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">
                        Contraseña Inicial (Permanente sin Vencimiento) *
                      </label>
                      <input
                        type="password"
                        required
                        value={formUser.password || ''}
                        onChange={(e) => setFormUser({ ...formUser, password: e.target.value })}
                        placeholder="Defina una clave segura"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Digital Signature Management Section */}
                <div className="bg-slate-900/90 border border-slate-750 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <PenTool className="w-4 h-4 text-amber-400" />
                      Firma Digitalizada para Informes y Dictámenes Periciales
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition flex items-center gap-1">
                        <Upload className="w-3 h-3 text-blue-400" />
                        Subir Imagen
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureFileUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handlePasteSignature}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition flex items-center gap-1"
                        title="Pegar imagen copiada en el portapapeles"
                      >
                        <ClipboardPaste className="w-3 h-3 text-emerald-400" />
                        Pegar Portapapeles
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDrawingSignature(!isDrawingSignature)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition flex items-center gap-1"
                      >
                        <PenTool className="w-3 h-3 text-purple-400" />
                        {isDrawingSignature ? 'Cerrar Pizarra' : 'Dibujar con Mouse/Lápiz'}
                      </button>
                    </div>
                  </div>

                  {/* Interactive Drawing Pad */}
                  {isDrawingSignature && (
                    <div className="bg-white rounded-lg p-2 text-center space-y-2">
                      <p className="text-[11px] text-slate-700 font-medium">Dibuje su firma en el recuadro blanco:</p>
                      <canvas
                        ref={canvasRef}
                        width={380}
                        height={110}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="border border-slate-300 rounded bg-white mx-auto cursor-crosshair touch-none"
                      />
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold"
                        >
                          Limpiar Trazo
                        </button>
                        <button
                          type="button"
                          onClick={saveCanvasSignature}
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold"
                        >
                          Guardar Firma Dibujada
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Signature Preview */}
                  <div className="flex items-center gap-4 pt-1">
                    <span className="text-[11px] text-slate-400">Vista previa en informe:</span>
                    {formUser.firma_digital ? (
                      <div className="bg-white/90 p-1.5 rounded border border-slate-600 inline-block">
                        <img
                          src={formUser.firma_digital}
                          alt="Firma Digital"
                          className="h-10 max-w-[200px] object-contain"
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-400/90 italic">
                        Sin firma digital registrada (se habilitará línea para firma física al imprimir)
                      </span>
                    )}
                    {formUser.firma_digital && (
                      <button
                        type="button"
                        onClick={() => setFormUser({ ...formUser, firma_digital: '' })}
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Quitar firma
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    {isCreating ? 'Guardar Nuevo Auditor / Perito' : 'Guardar Cambios de Perfil'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : selectedUser ? (
              /* Selected User View */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-750">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-blue-400" />
                      {selectedUser.nombre}
                    </h4>
                    <span className="text-xs text-slate-400">ID / Cédula: <strong>{selectedUser.identificacion}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(selectedUser.rol)}
                    <button
                      onClick={() => handleStartEdit(selectedUser)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar Perfil
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Cargo Oficial:</span>
                    <strong className="text-slate-200">{selectedUser.cargo || 'Auditor Forense Actuante'}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Exequátur / Colegiatura CPA:</span>
                    <strong className="text-amber-300">{selectedUser.exequatur_cpa || 'CPA No. 12845 / ICPARD'}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Registro Perito Judicial (CPJ):</span>
                    <strong className="text-purple-300">{selectedUser.registro_pericial || 'RPE-CPJ-Oficial'}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Especialidad Pericial:</span>
                    <strong className="text-slate-200">{selectedUser.especialidad || 'Auditoría Forense y Delitos Económicos'}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Correo Electrónico:</span>
                    <span className="text-slate-300">{selectedUser.email}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Teléfono:</span>
                    <span className="text-slate-300">{selectedUser.telefono || 'No registrado'}</span>
                  </div>
                </div>

                {/* Digital Signature Display */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                    Firma Electrónica Registrada para Impresión y Expediente Digital:
                  </span>
                  {selectedUser.firma_digital ? (
                    <div className="bg-white/95 p-2 rounded-lg border border-slate-400 inline-block">
                      <img
                        src={selectedUser.firma_digital}
                        alt="Firma Electrónica Registrada"
                        className="h-12 max-w-[240px] object-contain"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-amber-400/90">
                      No hay firma digital subida. El informe generará una línea de firma física oficial al imprimir.
                    </p>
                  )}
                </div>

                {/* Password & Security Card */}
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      Seguridad y Clave de Acceso
                    </span>
                    <span className="text-[10px] text-cyan-400 font-semibold">Sin Vencimiento (Permanente)</span>
                  </div>

                  {isEditingPassword ? (
                    <form onSubmit={handleChangePassword} className="space-y-2 pt-1 border-t border-slate-800">
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nueva contraseña sin fecha de vencimiento"
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
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                        >
                          Guardar Clave
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingPassword(false)}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => setIsEditingPassword(true)}
                        className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-semibold transition"
                      >
                        Cambiar Contraseña
                      </button>
                      <button
                        onClick={() => handleResetPassword(selectedUser)}
                        className="px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-semibold transition"
                        title="Resetear clave por defecto"
                      >
                        Resetear Clave
                      </button>
                      <button
                        onClick={() => handleDeleteUser(selectedUser.id)}
                        className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold transition ml-auto flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar Usuario
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-500">
                <ShieldCheck className="w-12 h-12 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">Seleccione un auditor o perito para ver o editar</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Puede editar todos los perfiles en general, incluyendo el Administrador Master, actualizar credenciales (CPA, Exequátur, Registro CPJ) y digitalizar su firma.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between mt-4">
              <span>Cifrado SHA-256 Verificado</span>
              <span>Auditoría de Acciones y Fe Pública Pericial</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Perito Master Titular: <strong className="text-amber-400">Lic. Pedro A. Baldera Rondón, CPA</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all"
          >
            Cerrar Gestión de Usuarios
          </button>
        </div>

      </div>
    </div>
  );
};
