export type RiskLevel = 'Bajo' | 'Medio' | 'Alto' | 'Crítico';

export interface AuditFinding {
  id: number;
  titulo: string;
  rubro: string;
  descripcion: string;
  monto: number;
  riesgo: RiskLevel;
  fusion_id: string;
  criterio?: string;
  fecha_registro?: string;
  estado?: 'Borrador' | 'Confirmado' | 'Subsanado';
}

export interface FusionRule {
  fusion_id: string;
  rubro: string;
  titulo_fusionado: string;
  keywords: string[];
  justificacion: string;
  criterios: string;
  modalidad?: string;
}

export interface InstitutionalConfig {
  entity_name: string;
  audit_type: string;
  audit_period: string;
  auditor_name: string;
  auditor_role: string;
  recipient: string;
  currency: string;
  encryptionEnabled: boolean;
  securityHash: string;
}

export interface AuditNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  category: 'audit' | 'export' | 'voice' | 'security';
}

export interface AuditTypeOption {
  id: string;
  name: string;
  description: string;
  badge: string;
  defaultRubros: string[];
}
