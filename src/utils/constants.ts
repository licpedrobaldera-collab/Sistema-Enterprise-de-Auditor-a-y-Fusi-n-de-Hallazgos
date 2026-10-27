import { AuditFinding, FusionRule, AuditTypeOption } from '../types/audit';

export const AUDIT_TYPES: AuditTypeOption[] = [
  {
    id: 'forense',
    name: 'Auditoría Forense Antifraude',
    description: 'Investigación técnica para recolección de evidencias legales, fraude patrimonial e irregularidades penales/administrativas.',
    badge: 'Forense',
    defaultRubros: ['Fraude y Corrupción', 'Nepotismo', 'Falsedad Documental', 'Desviación de Fondos']
  },
  {
    id: 'financiera_especial',
    name: 'Auditoría Financiera e Investigación Especial',
    description: 'Examen de estados contables, razonabilidad de cuentas presupuestarias, imputaciones y arqueos.',
    badge: 'Financiera / Especial',
    defaultRubros: ['Gestión Financiera', 'Nóminas y Sueldos', 'Tesorería', 'Activos Fijos']
  },
  {
    id: 'integral',
    name: 'Auditoría Integral y de Control Interno',
    description: 'Evaluación global bajo el marco COSO y NOBACI de gobernanza, riesgo institucional y cumplimiento normativo.',
    badge: 'Integral',
    defaultRubros: ['Gobernanza y Control Interno', 'Tecnología y Sistemas', 'Recursos Humanos', 'Compras y Contrataciones']
  },
  {
    id: 'obras',
    name: 'Auditoría de Obras Públicas e Infraestructura',
    description: 'Fiscalización de cubicaciones, memorias técnicas, especificaciones y contratos de construcción estatal (Ley 340-06).',
    badge: 'Obras Públicas',
    defaultRubros: ['Cubicaciones de Obra', 'Sobrecostos y Adendas', 'Fianzas y Garantías', 'Supervisión Técnica']
  },
  {
    id: 'salud',
    name: 'Auditoría de Salud Pública y Gestión Hospitalaria',
    description: 'Inspección de farmacia hospitalaria, insumos médicos, facturación al Senasa y protocolos sanitarios.',
    badge: 'Salud Pública',
    defaultRubros: ['Insumos y Medicamentos', 'Facturación ARS/Senasa', 'Equipamiento Biomédico', 'Servicios Clínicos']
  }
];

export const INITIAL_RULES: FusionRule[] = [
  {
    fusion_id: "FUS-01",
    rubro: "Gobernanza y Control Interno",
    titulo_fusionado: "Deficiencias Estructurales en la Implementación del Sistema de Control Interno (NOBACI), Ética y Gobernanza Institucional",
    keywords: ["nobaci", "código de ética", "codigo de etica", "denuncias", "incumplimientos", "control interno", "gobernanza", "documentación no suministrada"],
    justificacion: "Los hallazgos reflejan la falta de una arquitectura de control interno bajo el marco NOBACI, carencia de Código de Ética adaptado y socializado, y ausencia de canales formales de denuncia.",
    criterios: "Ley 10-07 (Sistema Nacional de Control Interno), Resoluciones CGR sobre NOBACI, Ley 41-08 de Función Pública."
  },
  {
    fusion_id: "FUS-02",
    rubro: "Tecnología y Sistemas Financieros",
    titulo_fusionado: "Inexistencia de Transformación Tecnológica, Plan Estratégico de TI (PETI) e Automatización de Contabilidad y Compras (SIGEF)",
    keywords: ["peti", "tecnologías", "contabilidad automatizados", "módulo de compras", "sigef", "software", "sistemas", "hojas de cálculo"],
    justificacion: "La falta de un sistema contable automatizado, el no uso del módulo de compras del SIGEF y la carencia de un PETI son manifestaciones del mismo déficit tecnológico.",
    criterios: "Ley 126-01 de Contabilidad Gubernamental, Normas CGR y DIGECOG."
  },
  {
    fusion_id: "FUS-03",
    rubro: "Recursos Humanos y Admin. de Personal",
    titulo_fusionado: "Debilidades Sistémicas en la Gestión Integral del Talento Humano: Expedientes, Novedades, Escala Salarial y Permanencia Irregular",
    keywords: ["novedades del personal", "manual de descripción", "funciones no acordes", "escala salarial", "expedientes de personal", "asistencia", "talento humano"],
    justificacion: "Todos estos puntos convergen en la desorganización de la administración de personal: falta de registro de novedades, expedientes incompletos y ausencia de escala salarial.",
    criterios: "Ley 41-08 de Función Pública, Reglamento 523-09 de Relaciones Laborales."
  },
  {
    fusion_id: "FUS-04",
    rubro: "Gestión de Nóminas y Remuneraciones",
    titulo_fusionado: "Inobservancia de Políticas, Formalización Administrativa e Imputación Contable en Pagos de Nóminas Internas y Complementarias",
    keywords: ["nómina interna", "nómina complementaria", "clasificación del gasto", "pagos relacionados", "compensaciones", "incentivos"],
    justificacion: "Agrupa los desembolsos por nómina interna y complementaria sin soporte normativo y la reclasificación contable incorrecta.",
    criterios: "Ley 41-08, Ley 126-01 de Contabilidad Gubernamental, Clasificador Presupuestario del Sector Público."
  },
  {
    fusion_id: "FUS-05",
    rubro: "Ética Pública, Transparencia y Régimen Legal",
    titulo_fusionado: "Incumplimiento de Regímenes de Incompatibilidades, Transparencia Legal, Nepotismo y Declaraciones Juradas de Patrimonio",
    keywords: ["otras entidades del estado", "declaración jurada", "vínculos familiares", "nepotismo", "conflicto de interés", "doble sueldo"],
    justificacion: "Engloba las violaciones legales relativas a la conducta del servidor público: cobro simultáneo en múltiples instituciones del Estado y nepotismo directivo.",
    criterios: "Constitución de la República (Art. 144 y 146), Ley 311-14 de Declaración Jurada, Ley 41-08."
  },
  {
    fusion_id: "FUS-06",
    rubro: "Obras Públicas e Infraestructura",
    titulo_fusionado: "Inconsistencias en Memorias Técnicas, Cubicaciones Sin Ejecutar y Adendas Superiores al Límite Legal del 25%",
    keywords: ["obras", "cubicaciones", "sobrecostos", "construcción", "adendas", "remodelación", "ingeniería", "bitácora"],
    justificacion: "Concentra irregularidades en ejecución de obra civil, deficiencias en bitácora, pagos anticipados sin cubicación aprobada y fraccionamiento.",
    criterios: "Ley 340-06 sobre Compras y Contrataciones del Estado, Reglamento 543-12 y CODIA."
  },
  {
    fusion_id: "FUS-07",
    rubro: "Salud Pública e Insumos Hospitalarios",
    titulo_fusionado: "Carencia de Trazabilidad en Kardex de Farmacia, Fármacos Vencidos y Facturación No Conciliada con Aseguradoras",
    keywords: ["medicamentos", "insumos médicos", "farmacia", "kardex", "recetas", "senasa", "hospital", "vencidos"],
    justificacion: "Consolida las debilidades en el control de inventario de medicamentos de alto costo, falta de actas de incineración y glosas médicas no reclamadas.",
    criterios: "Ley General de Salud 42-01, Ley 87-01 de Seguridad Social y Normativas del Servicio Nacional de Salud (SNS)."
  }
];

export const INITIAL_FINDINGS: AuditFinding[] = [
  {
    id: 1,
    titulo: "Deficiencias en el registro de novedades del personal y expedientes incompletos",
    rubro: "Recursos Humanos y Admin. de Personal",
    monto: 0.0,
    descripcion: "Falta de base de datos digital de novedades, omisión de firmas en acciones de personal y legajos sin documentos académicos verificados.",
    riesgo: "Alto",
    fusion_id: "FUS-03",
    criterio: "Ley 41-08 de Función Pública, Art. 12 y Reglamento 523-09 de Relaciones Laborales.",
    fecha_registro: "2021-12-15",
    estado: "Confirmado"
  },
  {
    id: 2,
    titulo: "Ausencia de sistemas de contabilidad automatizados y módulos de compras SIGEF",
    rubro: "Tecnología y Sistemas Financieros",
    monto: 0.0,
    descripcion: "Uso de hojas de cálculo individuales manuales para el control patrimonial, sin bitácora de auditoría digital ni enlaces al SIGEF.",
    riesgo: "Alto",
    fusion_id: "FUS-02",
    criterio: "Ley 126-01 de Contabilidad Gubernamental y Normas NOBACI de Tecnologías de la Información.",
    fecha_registro: "2021-12-16",
    estado: "Confirmado"
  },
  {
    id: 32,
    titulo: "Pagos relacionados al personal contratado nómina interna sin contratos formalizados",
    rubro: "Gestión de Nóminas y Remuneraciones",
    monto: 18509628.0,
    descripcion: "Desembolsos por nómina interna sin contratos visados por el Ministerio de Administración Pública (MAP) ni autorización de la CGR.",
    riesgo: "Crítico",
    fusion_id: "FUS-04",
    criterio: "Ley 41-08 de Función Pública y Ley 10-07 del Sistema Nacional de Control Interno.",
    fecha_registro: "2021-12-18",
    estado: "Confirmado"
  },
  {
    id: 33,
    titulo: "Pagos relacionados a nómina complementaria sin autorización ni escala salarial",
    rubro: "Gestión de Nóminas y Remuneraciones",
    monto: 18484585.0,
    descripcion: "Compensaciones especiales e incentivos fijos sin base legal, carentes de evaluaciones de desempeño documentadas.",
    riesgo: "Crítico",
    fusion_id: "FUS-04",
    criterio: "Ley 105-13 sobre Regulación Salarial del Estado Dominicano y Normativas del MAP.",
    fecha_registro: "2021-12-19",
    estado: "Confirmado"
  },
  {
    id: 41,
    titulo: "Personal con parentesco de consanguinidad y afinidad laborando bajo subordinación directa",
    rubro: "Ética Pública, Transparencia y Régimen Legal",
    monto: 4320000.0,
    descripcion: "Designación de familiares directos en áreas de compras, finanzas y almacén contraviniendo el régimen de nepotismo e incompatibilidades.",
    riesgo: "Crítico",
    fusion_id: "FUS-05",
    criterio: "Constitución de la República (Art. 144 y 146) y Ley 41-08 de Función Pública.",
    fecha_registro: "2021-12-20",
    estado: "Confirmado"
  },
  {
    id: 54,
    titulo: "Documentación no suministrada en el proceso de la auditoría y limitación al alcance",
    rubro: "Gobernanza y Control Interno",
    monto: 77407415.0,
    descripcion: "Limitación al alcance provocada por la no entrega de comprobantes fiscales de respaldo, cotizaciones, órdenes de compra y conduces de recepción.",
    riesgo: "Crítico",
    fusion_id: "FUS-01",
    criterio: "Ley 10-07 de Control Interno y Normas Internacionales de Auditoría (NIA 705).",
    fecha_registro: "2021-12-22",
    estado: "Confirmado"
  }
];

export const INITIAL_CONFIG = {
  entity_name: "Hospital Materno Infantil San Lorenzo de Los Mina",
  audit_type: "Auditoría Financiera e Investigación Especial",
  audit_period: "1.° de enero de 2020 al 31 de diciembre de 2021",
  auditor_name: "Lic. Pedro A. Baldera Rondón, CPA",
  auditor_role: "Auditor Forense Antifraude & Consultor Financiero",
  recipient: "Cámara de Cuentas de la República Dominicana / Dirección de Auditoría",
  currency: "RD$",
  encryptionEnabled: true,
  securityHash: "SHA256:7e8a93bf40d826a512b9c7042aee4602f09311394b2a8d10b8cf8964432c69d8"
};
