export type RiskLevel = 'Bajo' | 'Medio' | 'Alto' | 'Crítico';

export type SupervisorStatus = 'Aprobado (10/10)' | 'Requiere Ajuste' | 'Fusionado' | 'Pendiente';

export type ClassificationType = 'Debilidad de Control Interno' | 'Hallazgo de Auditoría';

export type UserRole = 
  | 'MASTER_ADMIN'
  | 'SUPERVISOR_CALIDAD'
  | 'AUDITOR_FORENSE'
  | 'PERITO_CONTABLE'
  | 'AUDITOR_JUNIOR';

export interface AuditFinding {
  id: number;
  numero_hallazgo: string; // Ej: "3.01", "3.02", ..., "3.54"
  pagina_referencia: string; // Ej: "Pág. 1 - Acta CCRD", "Pág. 4, Anexo 1"
  titulo: string;
  rubro: string;
  condicion: string; // Condición observada completa (hechos objetivos)
  clasificacion_tipo?: ClassificationType; // 'Debilidad de Control Interno' | 'Hallazgo de Auditoría'
  marco_normativo?: string; // Marco legal o normativo aplicable (Ley 340-06, NOBACI, etc.)
  analisis_pericial?: string; // Análisis técnico-pericial y valoración de impacto
  posible_fusion?: string; // Posible fusión de hallazgos afines por marco normativo y causa
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

  // Trazabilidad Legal de Precisión Judicial (Ley, Numeral, Literal, Artículo, Punto de Incidencia)
  punto_incidencia?: string; // Folio, párrafo o ubicación exacta en la fuente
  norma_ley_nombre?: string; // Nombre formal de la ley/norma aplicada (ej: Ley 340-06)
  articulo?: string; // Artículo específico (ej: Art. 14)
  numeral?: string; // Numeral específico (ej: Numeral 2)
  literal?: string; // Literal específico (ej: Literal b)
  fuente_cruzada?: string; // Cruce de evidencias (ej: SIGEF vs Portal Transparencia vs Banco)
  estado_validacion?: 'Validado por Auditor' | 'Requiere Ajuste' | 'Descartado' | 'Pendiente' | 'Nuevo Agregado';
  cadena_custodia?: string; // Código hash o referencia de custodia de la evidencia
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
  equipo_auditores?: UserAccount[]; // Relación de auditores y peritos actuantes
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

export interface CredentialChangeLog {
  id: string;
  fecha: string;
  usuario_afectado: string;
  modificado_por: string;
  tipo_cambio: 'CREDENCIALES' | 'CLAVE' | 'FIRMA' | 'PERMISOS' | 'ASIGNACION';
  descripcion: string;
  valor_anterior?: string;
  valor_nuevo?: string;
}

export interface UserAccount {
  id: string;
  identificacion: string; // RNC o Cédula de Identidad
  nombre: string;
  email: string;
  rol: UserRole;
  cargo?: string; // Cargo oficial (ej: Perito Contable Forense)
  exequatur_cpa?: string; // Exequátur oficial de ley / Colegiatura CPA
  registro_pericial?: string; // No. Registro Perito Judicial ante el Consejo del Poder Judicial
  especialidad?: string; // Especialidad técnica (ej: Auditoría Forense y Delitos Económicos)
  telefono?: string;
  firma_digital?: string; // Imagen Base64 de firma o trazo de firma digitalizada
  sello_digital_hash?: string; // Hash criptográfico de la firma certificada
  password: string; // Clave sin fecha de vencimiento
  historial_claves: string[]; // Histórico de claves previas
  historial_credenciales?: CredentialChangeLog[]; // Registro de auditoría de modificaciones
  asignaciones_auditorias?: string[]; // IDs de expedientes asignados o ['ALL'] para todas
  permiso_editar_aprobados?: boolean; // Permiso explícito de admin para editar aprobados
  fecha_creacion: string;
  ultimo_acceso: string;
  estado: 'Activo' | 'Suspendido';
  es_master?: boolean;
}

export interface FraudTriangleFinding {
  finding_id: number;
  numero_hallazgo: string;
  titulo: string;
  rubro?: string;
  monto?: number;
  // Vértice 1: Presión / Incentivo
  presion_nivel: number; // 1 a 5
  presion_motivo: string; // Justificación o motivación detectada
  presion_evidencia_ref: string; // Documento o fuente vinculada
  presion_documentos?: string[]; // IDs o nombres de archivos de evidencia vinculados
  // Vértice 2: Oportunidad Percibida
  oportunidad_nivel: number; // 1 a 5
  oportunidad_motivo: string; // Ausencia de control, firmas no segregadas, NOBACI
  oportunidad_evidencia_ref: string;
  oportunidad_documentos?: string[]; // IDs o nombres de archivos de evidencia vinculados
  // Vértice 3: Racionalización / Justificación
  racionalizacion_nivel: number; // 1 a 5
  racionalizacion_motivo: string; // Discurso exculpatorio, costumbre, emergencia alegada
  racionalizacion_evidencia_ref: string;
  racionalizacion_documentos?: string[]; // IDs o nombres de archivos de evidencia vinculados
  // Síntesis Forense
  riesgo_fraude_global: 'Bajo' | 'Medio' | 'Alto' | 'Muy Alto' | 'Crítico';
  sustento_tecnico_vinculado: string;
}


export interface ForensicEvidenceCriterion {
  id: string;
  codigo_norma: string; // Ej: "INTOSAI-5000", "CPP-ART26", "NOBACI-04"
  nombre: string;
  descripcion: string;
  cumplido: boolean;
  observacion_auditor: string;
}

export interface EvidenceFileSupport {
  id: string;
  nombre: string;
  tipo: string;
  tamanio: string;
  hash_sha256: string;
  fecha_carga: string;
}

export interface FindingEvidenceEvaluation {
  finding_id: number;
  numero_hallazgo: string;
  titulo: string;
  pagina_referencia: string;
  punto_incidencia: string;
  // Lo que el auditor debe comprobar y sustentar
  evidencias_a_comprobar: string[];
  // Lo que el supervisor debe verificar y evaluar
  puntos_supervision: string[];
  // Checklist exigible Ministerio Público & Auditoría Forense
  criterios_mp: ForensicEvidenceCriterion[];
  // Soportes documentales cargados
  archivos_soporte: EvidenceFileSupport[];
  // Nivel de cumplimiento de 1 a 5
  nivel_cumplimiento: number;
  // Aprobación y Validación con IA
  aprobada_ia: boolean; // Requiere 5/5
  ia_feedback: {
    observaciones_penales: string;
    faltantes_especificos: string[];
    recomendaciones_paso_a_paso: string[];
    fecha_validacion?: string;
  };
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
  triangulo_fraude?: FraudTriangleFinding[];
  evaluaciones_evidencias?: FindingEvidenceEvaluation[];
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

export type TransparencyModuleType = 'NOMINA' | 'COMPRAS' | 'PRESUPUESTO' | 'DECLARACIONES';

export interface TransparencyCandidateFinding {
  id: string;
  modulo: TransparencyModuleType;
  titulo: string;
  condicion: string;
  criterio: string;
  norma_ley_nombre: string;
  articulo: string;
  numeral: string;
  literal: string;
  punto_incidencia: string;
  fuente_cruzada: string;
  monto: number;
  riesgo: RiskLevel;
  rubro: string;
  recomendacion: string;
  cadena_custodia: string;
}

