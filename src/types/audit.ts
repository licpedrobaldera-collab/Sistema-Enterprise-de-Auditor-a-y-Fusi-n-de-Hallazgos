export type RiskLevel = 'Bajo' | 'Medio' | 'Alto' | 'Crítico';

export type SupervisorStatus = 'Aprobado (10/10)' | 'Requiere Ajuste' | 'Fusionado' | 'Pendiente';

export type UserRole = 
  | 'MASTER_ADMIN'
  | 'SUPERVISOR_CALIDAD'
  | 'AUDITOR_FORENSE'
  | 'PERITO_CONTABLE'
  | 'AUDITOR_JUNIOR';

export interface AuditFinding {
  id: number;
  numero_hallazgo: string; // Ej: "3.1.01", "2.1.04"
  pagina_referencia: string; // Ej: "Pág. 10", "Pág. 45 - Acta No. 04"
  titulo: string;
  rubro: string;
  condicion: string; // Condición observada completa (hechos objetivos)
  criterio: string; // Criterios legales y normativos (Ley 10-07, Ley 41-08, etc.)
  causa: string; // Causa raíz detectada
  efecto: string; // Efecto / Impacto operativo y financiero
  monto: number; // Monto involucrado en moneda local
  recomendacion: string; // Recomendación correctiva del auditor
  conclusion: string; // Conclusión y postura pericial/forense
  riesgo: RiskLevel;
  fusion_id: string; // Código de macro-fusión (FUS-01, etc.)
  
  // Evaluación y Control de Calidad del Supervisor (0 a 10)
  puntuacion_calidad: number; // Calificación técnica del 0 al 10
  estado_supervision: SupervisorStatus; // "Aprobado (10/10)" | "Requiere Ajuste" | "Fusionado"
  incidencia_supervisor: string; // Debilidad detectada bajo normas CGR/Cámara de Cuentas/INTOSAI
  ajuste_recomendado_supervisor: string; // Recomendación y ajuste para llevarlo a 10/10
  
  evidencia_soporte?: string; // Documento, factura o acta de sustento
  fecha_registro?: string;
  estado?: 'Borrador' | 'Confirmado' | 'Subsanado';
  auditor_registrador?: string;
  pais_jurisdiccion?: string;
}

export interface FusionRule {
  fusion_id: string;
  rubro: string;
  titulo_fusionado: string;
  keywords: string[];
  justificacion: string; // Razones o justificación técnica de fusión
  condicion_actualizada_ia: string; // Cómo quedaría la condición actualizada consolidada por IA
  criterios_actualizados: string; // Criterios legales actualizados y precisados
  criterios?: string; // Compatibilidad de criterios base
  recomendacion_actualizada: string; // Recomendación técnica integral consolidada
  conclusion_conformada: string; // Conclusión forense y conformación del nuevo hallazgo
  monto_consolidado?: number;
  modalidad?: string;
}

export interface InstitutionalConfig {
  entity_name: string;
  audit_type: string;
  audit_period: string;
  auditor_name: string;
  auditor_role: string;
  auditor_id?: string; // Cédula o RNC
  auditor_cpa_number?: string; // Exequátur o Colegiatura CPA
  supervisor_name: string;
  supervisor_role: string;
  supervisor_id?: string;
  recipient: string;
  country: string; // 'RD', 'US', 'ES', 'MX', 'CO', 'PA', 'PE', 'CL'
  currency: string;
  currency_symbol: string;
  language: 'es' | 'en' | 'fr' | 'pt';
  normativa_aplicable: string[]; // ISSAI, INTOSAI, NOBACI, NIIF, NICSP, etc.
  encryptionEnabled: boolean;
  securityHash: string;
  firm_name?: string;
  perito_judicial_text?: string;
}

export interface AuditNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  category: 'audit' | 'export' | 'voice' | 'security' | 'user';
}

export interface AuditTypeOption {
  id: string;
  name: string;
  description: string;
  badge: string;
  defaultRubros: string[];
}

export interface UserAccount {
  id: string;
  identificacion: string; // RNC o Cédula de Identidad
  nombre: string;
  email: string;
  rol: UserRole;
  password: string; // Clave sin fecha de vencimiento
  historial_claves: string[]; // Histórico de claves previas
  fecha_creacion: string;
  ultimo_acceso: string;
  estado: 'Activo' | 'Suspendido';
  es_master?: boolean;
}

export interface AuditCaseRecord {
  id: string;
  codigo_expediente: string; // Ej: "EXP-2026-BALDERA-01"
  nombre_caso: string;
  entidad: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  auditor_responsable: string;
  auditor_identificacion: string;
  usuario_id: string;
  pais: string;
  moneda: string;
  tipo_auditoria: string;
  total_hallazgos: number;
  monto_total: number;
  config: InstitutionalConfig;
  findings: AuditFinding[];
  fusionRules: FusionRule[];
  contratos_analizados?: ContractRecord[];
  dictamen_pericial?: ExpertDictamen;
}

export interface ContractRecord {
  id: string;
  numero_contrato: string;
  objeto: string;
  contratista: string;
  rnc_contratista: string;
  monto_original: number;
  monto_adendas: number;
  porcentaje_variacion: number;
  plazo_original_dias: number;
  plazo_adicional_dias: number;
  estado_poliza: 'Vigente' | 'Vencida' | 'Inexistente';
  alertas_riesgo: string[];
  cumplimiento_ley: 'Conforme' | 'Excede Tope Legal (>25%)' | 'Observado Crítico';
  observaciones: string;
  normativa_violada?: string;
}

export interface ExpertDictamen {
  numero_dictamen: string;
  tribunal_o_ente: string;
  perito_nombre: string;
  perito_cedula: string;
  perito_exequatur: string;
  fecha_emision: string;
  objeto_pericia: string;
  metodologia: string;
  operaciones_periciales: string[];
  analisis_contable: string;
  cuantificacion_perjuicio: {
    capital_desviado: number;
    intereses_legales: number;
    dano_emergente: number;
    total_indemnizatorio: number;
  };
  respuestas_cuestionario: Array<{ pregunta: string; respuesta: string }>;
  conclusion_pericial: string;
  fundamento_legal: string[];
}

export interface CountryOption {
  id: string;
  nombre: string;
  codigo: string;
  bandera: string;
  moneda: string;
  simbolo: string;
  organo_fiscalizador: string;
  organo_cuentas: string;
  normativa_base: string[];
  locale: string;
}
