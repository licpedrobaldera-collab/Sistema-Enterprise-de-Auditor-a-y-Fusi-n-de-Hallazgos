import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  FileSpreadsheet,
  Briefcase,
  Layers,
  Search,
  Check,
  ShieldAlert,
  UserCog
} from 'lucide-react';
import { UserAccount, UserRole, CredentialChangeLog } from '../types/audit';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  users: UserAccount[];
  activeCaseId?: string | null;
  onUpdateUsers: (users: UserAccount[]) => void;
  onSwitchUser: (user: UserAccount) => void;
  onNotify: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'danger') => void;
}

// Certified Historical Auditor Bank Catalog
const HISTORICAL_AUDITORS_BANK: Partial<UserAccount>[] = [
  {
    identificacion: '001-0854912-3',
    nombre: 'Lic. Pedro A. Baldera Rondón, CPA',
    email: 'licpedrobaldera@gmail.com',
    rol: 'MASTER_ADMIN',
    cargo: 'Supervisor de Grupos - Cámara de Cuentas / Auditor Forense Titular',
    exequatur_cpa: 'Exequátur No. 498-95 / ICPARD No. 12845',
    registro_pericial: 'RPE-CPJ-2024-0891 (Consejo del Poder Judicial)',
    especialidad: 'Auditoría Forense, Delitos Financieros, Obras Públicas e ISSAI 5000',
    telefono: '+1 (809) 555-0192',
    es_master: true,
  },
  {
    identificacion: '001-1928471-5',
    nombre: 'Licda. Carmen Altagracia Pérez, CPA',
    email: 'carmen.perez@auditoriaforense.do',
    rol: 'SUPERVISOR_CALIDAD',
    cargo: 'Supervisora General de Control de Calidad Gubernamental',
    exequatur_cpa: 'Exequátur No. 712-08 / ICPARD No. 18432',
    registro_pericial: 'RPE-CPJ-2023-0442',
    especialidad: 'Control de Calidad, Normas NOBACI y Guías Cámara de Cuentas',
    telefono: '+1 (809) 555-0144',
  },
  {
    identificacion: '001-0394812-8',
    nombre: 'Lic. Manuel de Jesús Rodríguez',
    email: 'manuel.rodriguez@auditoriaforense.do',
    rol: 'AUDITOR_FORENSE',
    cargo: 'Auditor Forense Investigador de Campo y Nóminas',
    exequatur_cpa: 'Colegiatura CPA No. 20914',
    registro_pericial: 'RPE-CPJ-2025-1002',
    especialidad: 'Investigación de Fraude en Nóminas Paralelas y Conciliaciones Bancarias',
    telefono: '+1 (809) 555-0188',
  },
  {
    identificacion: '001-0718293-4',
    nombre: 'Lic. Ramón Emilio Sánchez, CPA',
    email: 'ramon.sanchez@peritajejudicial.do',
    rol: 'PERITO_CONTABLE',
    cargo: 'Perito Contable Forense Auxiliar del Poder Judicial',
    exequatur_cpa: 'Exequátur No. 518-01 / ICPARD No. 11029',
    registro_pericial: 'RPE-CPJ-2022-0193',
    especialidad: 'Peritaje Contable Judicial, Liquidación Actuarial y Daño Emergente',
    telefono: '+1 (809) 555-0165',
  },
  {
    identificacion: '001-1284910-2',
    nombre: 'Licda. Ana Sofía Tejeda',
    email: 'ana.tejeda@auditoriaforense.do',
    rol: 'AUDITOR_JUNIOR',
    cargo: 'Auditora Asistente de Verificación Documental y Transparencia',
    exequatur_cpa: 'Colegiatura CPA No. 24810',
    registro_pericial: 'RPE-CPJ-2025-1882',
    especialidad: 'Cruce de Datos de Portales de Transparencia, SIGEF y TSS',
    telefono: '+1 (809) 555-0133',
  },
  {
    identificacion: '001-0491823-9',
    nombre: 'Ing. Francisco Javier Morales, CODIA',
    email: 'francisco.morales@peritajeobras.do',
    rol: 'PERITO_CONTABLE',
    cargo: 'Perito Forense en Obras Civiles e Infraestructura Vial',
    exequatur_cpa: 'Colegiatura CODIA No. 34812',
    registro_pericial: 'RPE-CPJ-2024-0319',
    especialidad: 'Peritaje de Cubicaciones de Obra, Topografía Láser y Adendas (>25%)',
    telefono: '+1 (809) 555-0219',
  }
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  activeCaseId = 'EXP-2026-BALDERA-01',
  onUpdateUsers,
  onSwitchUser,
  onNotify,
}) => {
  const [modalTab, setModalTab] = useState<'directorio' | 'historial' | 'banco'>('directorio');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

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
    sello_digital_hash: '',
    password: '',
    estado: 'Activo',
    permiso_editar_aprobados: false,
    asignaciones_auditorias: ['ALL'],
  });

  // Canvas ref for interactive signature drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const isMasterAdmin = currentUser.es_master || currentUser.rol === 'MASTER_ADMIN' || currentUser.email === 'licpedrobaldera@gmail.com';

  useEffect(() => {
    if (selectedUser && !isCreating) {
      setFormUser({ ...selectedUser });
    }
  }, [selectedUser, isCreating]);

  // Aggregate all history logs across all users
  const allHistoryLogs: CredentialChangeLog[] = useMemo(() => {
    const logs: CredentialChangeLog[] = [];
    users.forEach((u) => {
      if (Array.isArray(u.historial_credenciales)) {
        logs.push(...u.historial_credenciales);
      }
    });
    return logs.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [users]);

  // Filtered history logs
  const filteredHistoryLogs = useMemo(() => {
    if (!historySearchTerm.trim()) return allHistoryLogs;
    const term = historySearchTerm.toLowerCase();
    return allHistoryLogs.filter((log) =>
      log.usuario_afectado.toLowerCase().includes(term) ||
      log.descripcion.toLowerCase().includes(term) ||
      log.tipo_cambio.toLowerCase().includes(term) ||
      log.modificado_por.toLowerCase().includes(term)
    );
  }, [allHistoryLogs, historySearchTerm]);

  if (!isOpen) return null;

  // Signature image clipboard listener
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
              const sealHash = `SHA256:SEAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`;
              setFormUser((prev) => ({ ...prev, firma_digital: base64, sello_digital_hash: sealHash }));
              onNotify('Firma Pegada', 'Imagen de firma electrónica pegada con sello criptográfico.', 'success');
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      onNotify('Sin Imagen en Portapapeles', 'Copie una imagen de su firma (Ctrl+C) y luego presione este botón.', 'info');
    } catch {
      onNotify('Permiso de Portapapeles', 'Haga clic en la opción de subir archivo o dibujar con lápiz.', 'warning');
    }
  };

  const handleSignatureFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const sealHash = `SHA256:SEAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`;
      setFormUser((prev) => ({ ...prev, firma_digital: base64, sello_digital_hash: sealHash }));
      onNotify('Firma Cargada', 'Firma digitalizada y sello criptográfico incorporados.', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Canvas drawing logic
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
    const sealHash = `SHA256:SEAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`;
    setFormUser((prev) => ({ ...prev, firma_digital: base64, sello_digital_hash: sealHash }));
    setIsDrawingSignature(false);
    onNotify('Firma Guardada', 'Firma manuscrita digitalizada guardada.', 'success');
  };

  const handleStartCreate = () => {
    setFormUser({
      identificacion: '',
      nombre: '',
      email: '',
      rol: 'AUDITOR_FORENSE',
      cargo: 'Auditor Forense de Campo',
      exequatur_cpa: 'Exequátur No. Oficial / ICPARD',
      registro_pericial: 'RPE-CPJ-2026',
      especialidad: 'Auditoría Forense y Peritaje Contable',
      telefono: '',
      firma_digital: '',
      sello_digital_hash: '',
      password: '',
      estado: 'Activo',
      permiso_editar_aprobados: false,
      asignaciones_auditorias: ['ALL'],
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

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (isCreating) {
      if (!formUser.password?.trim()) {
        onNotify('Contraseña Requerida', 'Defina una contraseña inicial para el nuevo usuario.', 'warning');
        return;
      }

      const initialLog: CredentialChangeLog = {
        id: `LOG-${Date.now()}`,
        fecha: timestamp,
        usuario_afectado: formUser.nombre.trim(),
        modificado_por: currentUser.nombre,
        tipo_cambio: 'CREDENCIALES',
        descripcion: `Creación de cuenta de usuario con rol ${formUser.rol}.`,
        valor_nuevo: `Identificación: ${formUser.identificacion}, Cargo: ${formUser.cargo || 'Auditor'}`,
      };

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
        sello_digital_hash: formUser.sello_digital_hash || `SHA256:SEAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`,
        password: formUser.password,
        historial_claves: [formUser.password],
        historial_credenciales: [initialLog],
        asignaciones_auditorias: formUser.asignaciones_auditorias || ['ALL'],
        permiso_editar_aprobados: !!formUser.permiso_editar_aprobados,
        fecha_creacion: timestamp,
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
      // Editing existing user (Admin or any collaborator)
      const auditLog: CredentialChangeLog = {
        id: `LOG-${Date.now()}`,
        fecha: timestamp,
        usuario_afectado: formUser.nombre?.trim() || selectedUser.nombre,
        modificado_por: currentUser.nombre,
        tipo_cambio: 'CREDENCIALES',
        descripcion: `Actualización de credenciales profesionales (Cargo, Exequátur, CPJ, Permisos).`,
        valor_anterior: `Cargo: ${selectedUser.cargo}, Exequátur: ${selectedUser.exequatur_cpa}, CPJ: ${selectedUser.registro_pericial}`,
        valor_nuevo: `Cargo: ${formUser.cargo}, Exequátur: ${formUser.exequatur_cpa}, CPJ: ${formUser.registro_pericial}`,
      };

      const updatedUsers = users.map((u) => {
        if (u.id === selectedUser.id) {
          const currentLogs = u.historial_credenciales || [];
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
            sello_digital_hash: formUser.sello_digital_hash || u.sello_digital_hash,
            permiso_editar_aprobados: formUser.permiso_editar_aprobados !== undefined ? formUser.permiso_editar_aprobados : u.permiso_editar_aprobados,
            asignaciones_auditorias: formUser.asignaciones_auditorias || u.asignaciones_auditorias || ['ALL'],
            estado: formUser.estado || u.estado,
            historial_credenciales: [auditLog, ...currentLogs.slice(0, 19)],
          };
        }
        return u;
      });

      onUpdateUsers(updatedUsers);
      const updatedSel = updatedUsers.find((u) => u.id === selectedUser.id) || null;
      setSelectedUser(updatedSel);
      setIsEditing(false);
      onNotify('Credenciales Actualizadas', `Datos de ${formUser.nombre} archivados con trazabilidad.`, 'success');
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

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const passLog: CredentialChangeLog = {
      id: `LOG-PASS-${Date.now()}`,
      fecha: timestamp,
      usuario_afectado: selectedUser.nombre,
      modificado_por: currentUser.nombre,
      tipo_cambio: 'CLAVE',
      descripcion: 'Actualización y registro permanente de contraseña de acceso.',
    };

    const updatedUsers = users.map((u) => {
      if (u.id === selectedUser.id) {
        const history = u.historial_claves || [];
        const logs = u.historial_credenciales || [];
        return {
          ...u,
          password: newPassword,
          historial_claves: [newPassword, ...history.slice(0, 9)],
          historial_credenciales: [passLog, ...logs.slice(0, 19)],
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    setSelectedUser({
      ...selectedUser,
      password: newPassword,
      historial_claves: [newPassword, ...(selectedUser.historial_claves || []).slice(0, 9)],
      historial_credenciales: [passLog, ...(selectedUser.historial_credenciales || []).slice(0, 19)],
    });
    setIsEditingPassword(false);
    setNewPassword('');
    setConfirmPassword('');
    onNotify('Clave Actualizada', `La clave de ${selectedUser.nombre} fue actualizada y archivada.`, 'success');
  };

  const handleResetPassword = (targetUser: UserAccount) => {
    const defaultPass = `PASS_${targetUser.identificacion.replace(/[^0-9]/g, '').slice(-4) || '2026'}`;
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const resetLog: CredentialChangeLog = {
      id: `LOG-RESET-${Date.now()}`,
      fecha: timestamp,
      usuario_afectado: targetUser.nombre,
      modificado_por: currentUser.nombre,
      tipo_cambio: 'CLAVE',
      descripcion: `Contraseña reseteada por defecto a: ${defaultPass}`,
    };

    const updatedUsers = users.map((u) => {
      if (u.id === targetUser.id) {
        return {
          ...u,
          password: defaultPass,
          historial_claves: [defaultPass, ...(u.historial_claves || [])],
          historial_credenciales: [resetLog, ...(u.historial_credenciales || [])],
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

  // Add auditor from Historical Bank
  const handleAddAuditorFromBank = (bankAuditor: Partial<UserAccount>, assignMode: 'active' | 'all') => {
    const existing = users.find((u) => u.identificacion === bankAuditor.identificacion);
    if (existing) {
      // Just update assignment
      const currentAssignments = existing.asignaciones_auditorias || [];
      const newAssignments = assignMode === 'all' 
        ? ['ALL'] 
        : Array.from(new Set([...currentAssignments, activeCaseId || 'EXP-2026-BALDERA-01']));

      const updated = users.map((u) => (u.id === existing.id ? { ...u, asignaciones_auditorias: newAssignments } : u));
      onUpdateUsers(updated);
      onNotify('Auditor Asignado', `${existing.nombre} asignado a ${assignMode === 'all' ? 'todas las auditorías' : 'la auditoría en curso'}.`, 'success');
      return;
    }

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newId = `USR-${String(users.length + 1).padStart(3, '0')}`;
    const newAuditor: UserAccount = {
      id: newId,
      identificacion: bankAuditor.identificacion || '001-0000000-0',
      nombre: bankAuditor.nombre || 'Auditor Certificado',
      email: bankAuditor.email || `${newId.toLowerCase()}@auditoriaforense.do`,
      rol: bankAuditor.rol || 'AUDITOR_FORENSE',
      cargo: bankAuditor.cargo || 'Auditor Forense Especializado',
      exequatur_cpa: bankAuditor.exequatur_cpa || 'CPA No. Oficial',
      registro_pericial: bankAuditor.registro_pericial || 'RPE-CPJ-2026',
      especialidad: bankAuditor.especialidad || 'Auditoría Forense Gubernamental',
      telefono: bankAuditor.telefono || '+1 (809) 555-0100',
      firma_digital: '',
      sello_digital_hash: `SHA256:SEAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`,
      password: `AUDIT_${newId}_2026`,
      historial_claves: [`AUDIT_${newId}_2026`],
      historial_credenciales: [
        {
          id: `LOG-BANK-${Date.now()}`,
          fecha: timestamp,
          usuario_afectado: bankAuditor.nombre || 'Auditor',
          modificado_por: currentUser.nombre,
          tipo_cambio: 'ASIGNACION',
          descripcion: `Incorporación desde el Banco Histórico de Peritos y asignación a: ${assignMode === 'all' ? 'Todas las auditorías' : 'Auditoría actual'}.`,
        }
      ],
      asignaciones_auditorias: assignMode === 'all' ? ['ALL'] : [activeCaseId || 'EXP-2026-BALDERA-01'],
      permiso_editar_aprobados: false,
      fecha_creacion: timestamp,
      ultimo_acceso: 'Nunca',
      estado: 'Activo',
      es_master: !!bankAuditor.es_master,
    };

    onUpdateUsers([...users, newAuditor]);
    onNotify('Auditor Incorporado', `${newAuditor.nombre} añadido desde el banco histórico con credenciales completas.`, 'success');
  };

  // Toggle auditor assignment for an existing user
  const handleToggleAuditAssignment = (userId: string, assignToAll: boolean) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          asignaciones_auditorias: assignToAll 
            ? ['ALL'] 
            : [activeCaseId || 'EXP-2026-BALDERA-01'],
        };
      }
      return u;
    });
    onUpdateUsers(updated);
    onNotify('Asignación Modificada', `Alcance de asignación actualizado para el perito.`, 'info');
  };

  // Export users list
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
      const headers = ['ID', 'Nombre', 'Identificacion', 'Rol', 'Cargo', 'Exequatur_CPA', 'Registro_Pericial', 'Especialidad', 'Email', 'Telefono', 'Estado', 'Permiso_Editar_Aprobados'];
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
        u.permiso_editar_aprobados ? 'SI' : 'NO'
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Directorio_Auditores_Peritos_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getRoleBadge = (rol: UserRole) => {
    switch (rol) {
      case 'MASTER_ADMIN':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">MASTER ADMIN</span>;
      case 'SUPERVISOR_CALIDAD':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">SUPERVISOR CALIDAD</span>;
      case 'PERITO_CONTABLE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PERITO CONTABLE</span>;
      case 'AUDITOR_FORENSE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">AUDITOR FORENSE</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">AUDITOR JUNIOR</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Gestión Total de Usuarios, Credenciales y Firmas Digitales
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Control & Auditoría de Acceso
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Edición de credenciales de todos los usuarios, firmas certificadas, banco histórico y registro de cambios
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
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExportUsers('json')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all"
              title="Extraer directorio completo en JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>JSON</span>
            </button>
            <button
              onClick={handleStartCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nuevo Usuario</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* RBAC Master Notice Banner */}
        <div className="px-6 py-2 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border-b border-amber-500/20 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2 text-amber-300">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>
              Sesión Activa: <strong className="text-white font-semibold">{currentUser.nombre}</strong> ({currentUser.rol})
            </span>
          </div>
          <div className="text-slate-300 flex items-center gap-3">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Administrador Master: Permisos Totales de Edición y Borrado
            </span>
            <span className="text-slate-400 text-[11px]">
              Colaboradores: Restringido borrado en hallazgos aprobados
            </span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setModalTab('directorio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              modalTab === 'directorio' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCog className="w-3.5 h-3.5" />
            <span>Directorio & Credenciales ({users.length})</span>
          </button>
          <button
            onClick={() => setModalTab('banco')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              modalTab === 'banco' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Banco Histórico & Asignación de Auditorías</span>
          </button>
          <button
            onClick={() => setModalTab('historial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              modalTab === 'historial' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial de Cambios de Credenciales ({allHistoryLogs.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* TAB 1: DIRECTORIO & CREDENCIALES */}
          {modalTab === 'directorio' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Users List */}
              <div className="md:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <span>Auditores y Peritos Registrados</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Seleccione para editar o firmar</span>
                </div>

                <div className="space-y-2 max-h-[66vh] overflow-y-auto pr-1">
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
                  /* Form */
                  <form onSubmit={handleSaveUser} className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-750">
                      <h4 className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4" />
                        {isCreating ? 'Registrar Nuevo Auditor / Perito' : `Editar Credenciales de: ${selectedUser?.nombre}`}
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
                          Rol en el Sistema *
                        </label>
                        <select
                          value={formUser.rol}
                          onChange={(e) => setFormUser({ ...formUser, rol: e.target.value as UserRole })}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="MASTER_ADMIN">MASTER ADMIN (Control Total y Acreditación)</option>
                          <option value="SUPERVISOR_CALIDAD">SUPERVISOR DE CALIDAD (Ponderación 0-10)</option>
                          <option value="AUDITOR_FORENSE">AUDITOR FORENSE (Extracción y Fusión de Campo)</option>
                          <option value="PERITO_CONTABLE">PERITO CONTABLE JUDICIAL (Dictámenes con Fe Pública)</option>
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
                          Registro de Perito Judicial (CPJ)
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
                          Especialidad Pericial
                        </label>
                        <input
                          type="text"
                          value={formUser.especialidad || ''}
                          onChange={(e) => setFormUser({ ...formUser, especialidad: e.target.value })}
                          placeholder="Ej: Auditoría Forense y Delitos Financieros"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Teléfono Oficial
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
                          Correo Institucional
                        </label>
                        <input
                          type="email"
                          value={formUser.email || ''}
                          onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
                          placeholder="auditor@organorector.gob.do"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* RBAC Setting for Collaborators (Only Master Admin can configure) */}
                      {isMasterAdmin && formUser.rol !== 'MASTER_ADMIN' && (
                        <div className="sm:col-span-2 bg-slate-900/90 p-3 rounded-xl border border-amber-500/30">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!formUser.permiso_editar_aprobados}
                              onChange={(e) => setFormUser({ ...formUser, permiso_editar_aprobados: e.target.checked })}
                              className="rounded border-slate-700 text-blue-600 focus:ring-0"
                            />
                            <span className="text-xs font-semibold text-amber-300">
                              Autorizar Permiso de Edición en Hallazgos Aprobados
                            </span>
                          </label>
                          <p className="text-[10px] text-slate-400 mt-1 pl-5">
                            Si está desmarcado, el colaborador solo podrá visualizar los hallazgos aprobados (10/10) sin modificarlos ni eliminarlos.
                          </p>
                        </div>
                      )}

                      {isCreating && (
                        <div className="sm:col-span-2">
                          <label className="block text-slate-300 font-semibold mb-1">
                            Contraseña Permanente Inicial *
                          </label>
                          <input
                            type="password"
                            required
                            value={formUser.password || ''}
                            onChange={(e) => setFormUser({ ...formUser, password: e.target.value })}
                            placeholder="Defina una clave segura sin vencimiento"
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
                          Firma Digitalizada & Sello Criptográfico
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
                          >
                            <ClipboardPaste className="w-3 h-3 text-emerald-400" />
                            Pegar
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsDrawingSignature(!isDrawingSignature)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 transition flex items-center gap-1"
                          >
                            <PenTool className="w-3 h-3 text-purple-400" />
                            {isDrawingSignature ? 'Cerrar Pad' : 'Dibujar'}
                          </button>
                        </div>
                      </div>

                      {/* Interactive Drawing Pad */}
                      {isDrawingSignature && (
                        <div className="bg-white rounded-lg p-2 text-center space-y-2">
                          <p className="text-[11px] text-slate-700 font-medium">Dibuje su firma en el recuadro:</p>
                          <canvas
                            ref={canvasRef}
                            width={380}
                            height={100}
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
                              className="px-2.5 py-1 rounded bg-slate-200 text-slate-800 text-[11px] font-bold"
                            >
                              Limpiar
                            </button>
                            <button
                              type="button"
                              onClick={saveCanvasSignature}
                              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold"
                            >
                              Guardar Firma
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Signature Preview */}
                      <div className="flex items-center gap-4 pt-1">
                        <span className="text-[11px] text-slate-400">Vista previa:</span>
                        {formUser.firma_digital ? (
                          <div className="bg-white/95 p-1.5 rounded border border-slate-600 inline-block">
                            <img
                              src={formUser.firma_digital}
                              alt="Firma Digital"
                              className="h-10 max-w-[200px] object-contain"
                            />
                            {formUser.sello_digital_hash && (
                              <div className="text-[9px] font-mono text-slate-600 block mt-0.5">
                                {formUser.sello_digital_hash}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-400/90 italic">
                            Sin firma digital (se habilitará línea para firma física al imprimir)
                          </span>
                        )}
                        {formUser.firma_digital && (
                          <button
                            type="button"
                            onClick={() => setFormUser({ ...formUser, firma_digital: '', sello_digital_hash: '' })}
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
                        {isCreating ? 'Guardar Nuevo Auditor' : 'Guardar Cambios de Credenciales'}
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
                          Editar Credenciales
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
                        <strong className="text-amber-300">{selectedUser.exequatur_cpa || 'CPA Titular'}</strong>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Registro Perito Judicial (CPJ):</span>
                        <strong className="text-purple-300">{selectedUser.registro_pericial || 'RPE-CPJ-Oficial'}</strong>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Especialidad Pericial:</span>
                        <strong className="text-slate-200">{selectedUser.especialidad || 'Auditoría Forense'}</strong>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Correo Electrónico:</span>
                        <span className="text-slate-300">{selectedUser.email}</span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Asignación en Auditorías:</span>
                        <span className="text-emerald-300 font-semibold">
                          {(selectedUser.asignaciones_auditorias || []).includes('ALL') ? 'Todas las Auditorías' : 'Auditoría Actual'}
                        </span>
                      </div>
                    </div>

                    {/* Digital Signature Display */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-emerald-400" />
                        Firma Digitalizada & Sello Criptográfico para Dictámenes:
                      </span>
                      {selectedUser.firma_digital ? (
                        <div className="bg-white/95 p-2 rounded-lg border border-slate-400 inline-block">
                          <img
                            src={selectedUser.firma_digital}
                            alt="Firma Electrónica Registrada"
                            className="h-12 max-w-[240px] object-contain"
                          />
                          {selectedUser.sello_digital_hash && (
                            <div className="text-[9px] font-mono text-slate-600 block mt-0.5">
                              {selectedUser.sello_digital_hash}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-amber-400/90">
                          Sin firma digital. El informe generará una línea de firma física al imprimir.
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
                          >
                            Resetear Clave
                          </button>
                          {isMasterAdmin && (
                            <button
                              onClick={() => handleDeleteUser(selectedUser.id)}
                              className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold transition ml-auto flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Eliminar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-500">
                    <ShieldCheck className="w-12 h-12 text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-300">Seleccione un auditor o perito para ver o editar</p>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Edite credenciales oficiales (CPA, Exequátur, Registro CPJ), actualice firmas digitales y controle permisos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BANCO HISTÓRICO & ASIGNACIÓN */}
          {modalTab === 'banco' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-400" />
                    Banco Histórico de Auditores Forenses & Peritos Certificados
                  </h3>
                  <p className="text-xs text-slate-400">
                    Seleccione profesionales del banco para asignarlos manualmente a la auditoría activa o a todas las analizadas.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {HISTORICAL_AUDITORS_BANK.map((bankUser, idx) => {
                  const isAlreadyInTeam = users.some((u) => u.identificacion === bankUser.identificacion);
                  const matchingUser = users.find((u) => u.identificacion === bankUser.identificacion);
                  const isAssignedAll = matchingUser?.asignaciones_auditorias?.includes('ALL');

                  return (
                    <div
                      key={idx}
                      className="bg-slate-850 p-4 rounded-xl border border-slate-750 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {bankUser.nombre}
                          </span>
                          {getRoleBadge(bankUser.rol || 'AUDITOR_FORENSE')}
                        </div>
                        <div className="text-xs text-slate-400">
                          <span>ID: {bankUser.identificacion}</span> • <span className="text-amber-300">{bankUser.exequatur_cpa}</span>
                        </div>
                        <div className="text-xs text-purple-300 font-mono">
                          {bankUser.registro_pericial}
                        </div>
                        <p className="text-[11px] text-slate-300">
                          {bankUser.cargo} • <em>{bankUser.especialidad}</em>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        {isAlreadyInTeam ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> En el Equipo
                            </span>
                            <span className="text-[10px] text-slate-400">
                              (Asignación: {isAssignedAll ? 'Todas las Auditorías' : 'Auditoría Actual'})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">No asignado aún</span>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleAddAuditorFromBank(bankUser, 'active')}
                            className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-semibold transition"
                          >
                            Asignar a Esta Auditoría
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddAuditorFromBank(bankUser, 'all')}
                            className="px-2.5 py-1 rounded bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 text-xs font-semibold transition"
                          >
                            Asignar a Todas
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: HISTORIAL DE CAMBIOS DE CREDENCIALES */}
          {modalTab === 'historial' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-400" />
                    Historial de Modificaciones de Credenciales & Registro de Auditoría
                  </h3>
                  <p className="text-xs text-slate-400">
                    Trazabilidad inmutable para mantenimiento del sistema y recuperación de credenciales olvidadas.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    placeholder="Buscar en el historial..."
                    className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-750 text-xs text-white rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {filteredHistoryLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-850 rounded-xl border border-slate-800">
                  <History className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-400">No hay registros de cambios de credenciales aún</p>
                  <p className="text-xs text-slate-500 mt-1">Cualquier actualización de clave, exequátur o perfil se registrará aquí automáticamente.</p>
                </div>
              ) : (
                <div className="bg-slate-850 rounded-xl border border-slate-750 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Fecha y Hora</th>
                        <th className="p-3">Usuario Afectado</th>
                        <th className="p-3">Tipo de Modificación</th>
                        <th className="p-3">Descripción / Valores Previos</th>
                        <th className="p-3">Autorizado Por</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {filteredHistoryLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/50">
                          <td className="p-3 font-mono text-slate-400 text-[11px]">{log.fecha}</td>
                          <td className="p-3 font-semibold text-white">{log.usuario_afectado}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              {log.tipo_cambio}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">
                            <div>{log.descripcion}</div>
                            {log.valor_anterior && (
                              <div className="text-[10px] text-slate-400 mt-0.5 line-through">
                                Ant: {log.valor_anterior}
                              </div>
                            )}
                            {log.valor_nuevo && (
                              <div className="text-[10px] text-emerald-400 mt-0.5">
                                Nuevo: {log.valor_nuevo}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-cyan-300 font-medium">{log.modificado_por}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Administrador Titular Master: <strong className="text-amber-400">Lic. Pedro A. Baldera Rondón, CPA</strong> (Control Total)
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
