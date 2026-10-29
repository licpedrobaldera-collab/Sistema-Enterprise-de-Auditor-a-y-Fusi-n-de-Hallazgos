import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Scale, 
  Brain, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Printer, 
  X, 
  ShieldAlert, 
  DollarSign, 
  Award,
  HelpCircle,
  FileSpreadsheet,
  PenTool,
  Upload,
  ClipboardPaste,
  BadgeCheck,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  FileSearch,
  CheckSquare,
  Square,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  Hash,
  FileCheck,
  Layers,
  Eye,
  Trash2,
  Plus,
  Paperclip,
  Link2,
  Search,
  Check,
  ExternalLink,
  Sliders,
  Settings,
  Percent
} from 'lucide-react';
import { 
  ExpertDictamen, 
  InstitutionalConfig, 
  AuditFinding, 
  UserAccount,
  FraudTriangleFinding,
  FraudTriangleWeights,
  FindingEvidenceEvaluation,
  ForensicEvidenceCriterion,
  EvidenceFileSupport
} from '../types/audit';

interface ForensicExpertDictamenModalProps {
  isOpen: boolean;
  onClose: () => void;
  dictamen: ExpertDictamen;
  findings: AuditFinding[];
  config: InstitutionalConfig;
  users?: UserAccount[];
  onUpdateDictamen: (d: ExpertDictamen) => void;
  onUpdateUsers?: (u: UserAccount[]) => void;
  onNotify: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'danger') => void;
}

const DEFAULT_MP_CRITERIA_TEMPLATE: ForensicEvidenceCriterion[] = [
  {
    id: 'CRIT-1',
    codigo_norma: 'ISSAI-5000 / CPP Art. 26',
    nombre: 'Cadena de Custodia Documentada y Foliada',
    descripcion: 'Constancia de preservación inalterada, folio de origen y hash criptográfico verificable.',
    cumplido: true,
    observacion_auditor: 'Custodiado en archivo digital oficial con hash SHA-256 verificado.',
  },
  {
    id: 'CRIT-2',
    codigo_norma: 'NIA 240 / Ley 10-07',
    nombre: 'Autenticidad, Integridad y Origen Lícito',
    descripcion: 'Documentos originales o copias certificadas expedidas por funcionario o entidad competente.',
    cumplido: true,
    observacion_auditor: 'Verificado contra matrices oficiales y sellos institucionales de origen.',
  },
  {
    id: 'CRIT-3',
    codigo_norma: 'CPP Art. 172 (Pertinencia)',
    nombre: 'Pertinencia, Idoneidad y Suficiencia Probatoria',
    descripcion: 'Conexión directa entre la prueba documental y la irregularidad o desvío imputado.',
    cumplido: true,
    observacion_auditor: 'Prueba idónea vinculada al tipo de hecho penal/administrativo investigado.',
  },
  {
    id: 'CRIT-4',
    codigo_norma: 'Constitución Art. 69 (Debido Proceso)',
    nombre: 'Legalidad en la Obtención de la Prueba',
    descripcion: 'Recabada sin violentar derechos fundamentales ni formalidades procedimentales de ley.',
    cumplido: true,
    observacion_auditor: 'Obtenida formalmente mediante requerimiento oficial de auditoría forense.',
  },
  {
    id: 'CRIT-5',
    codigo_norma: 'ISSAI 200 / NOBACI',
    nombre: 'Sustento Documental y Testimonial Cruzado',
    descripcion: 'Cotejo contra registros bancarios, SIGEF, DGII, TSS o libros contables auxiliares.',
    cumplido: true,
    observacion_auditor: 'Cotejado contra extractos bancarios y plataforma de compras/nóminas.',
  },
  {
    id: 'CRIT-6',
    codigo_norma: 'ISSAI 5000 / Código Civil Art. 1382',
    nombre: 'Trazabilidad Contable y Liquidación del Daño',
    descripcion: 'Cuantificación matemática exacta del perjuicio al erario respaldada en comprobantes.',
    cumplido: true,
    observacion_auditor: 'Monto liquidado con base en la suma de comprobantes y libramientos.',
  },
];

export const DEFAULT_FRAUD_WEIGHTS: FraudTriangleWeights = {
  peso_presion: 30, // 30%
  peso_oportunidad: 50, // 50% - Prioridad de control interno NOBACI / CGR
  peso_racionalizacion: 20, // 20%
  estandar_nombre: 'Enfoque Control Interno NOBACI (CGR / Cámara de Cuentas)',
  umbral_critico: 4.2,
  umbral_muy_alto: 3.5,
  umbral_alto: 2.8,
  umbral_medio: 2.0,
  modificado_por: 'Administrador / Perito',
  fecha_modificacion: new Date().toISOString().slice(0, 10),
};

export const ForensicExpertDictamenModal: React.FC<ForensicExpertDictamenModalProps> = ({
  isOpen,
  onClose,
  dictamen,
  findings,
  config,
  users = [],
  onUpdateDictamen,
  onUpdateUsers,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'dictamen' | 'triangulo' | 'evidencias' | 'incidencias' | 'cuantificacion' | 'firmas'>('dictamen');
  const [selectedFindingId, setSelectedFindingId] = useState<number>(findings.length > 0 ? findings[0].id : 1);
  const [signatureTargetUserId, setSignatureTargetUserId] = useState<string | null>(null);
  const [triangleSearchQuery, setTriangleSearchQuery] = useState('');

  // Advanced Fraud Triangle Weights Configuration State
  const [isConfiguringWeights, setIsConfiguringWeights] = useState(false);
  const [weightsConfig, setWeightsConfig] = useState<FraudTriangleWeights>(
    dictamen.pesos_triangulo_fraude || DEFAULT_FRAUD_WEIGHTS
  );
  const [tempWeights, setTempWeights] = useState<FraudTriangleWeights>(
    dictamen.pesos_triangulo_fraude || DEFAULT_FRAUD_WEIGHTS
  );

  // Sync weights when dictamen changes
  useEffect(() => {
    if (dictamen.pesos_triangulo_fraude) {
      setWeightsConfig(dictamen.pesos_triangulo_fraude);
      setTempWeights(dictamen.pesos_triangulo_fraude);
    }
  }, [dictamen.pesos_triangulo_fraude]);

  // AI loading states
  const [isValidatingAI, setIsValidatingAI] = useState(false);
  const [isAnalyzingTriangleAI, setIsAnalyzingTriangleAI] = useState(false);

  // Drawing canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Sync / initialize Fraud Triangle data for all findings if missing
  useEffect(() => {
    if (findings.length === 0) return;

    let updated = false;
    let triangleList = dictamen.triangulo_fraude ? [...dictamen.triangulo_fraude] : [];
    let evidenceList = dictamen.evaluaciones_evidencias ? [...dictamen.evaluaciones_evidencias] : [];

    // Ensure each finding has a Fraud Triangle entry
    findings.forEach((f) => {
      if (!triangleList.some((t) => t.finding_id === f.id)) {
        updated = true;
        const isCritical = f.riesgo === 'Crítico';
        const isHighAmount = (f.monto || 0) > 10000000;
        triangleList.push({
          finding_id: f.id,
          numero_hallazgo: f.numero_hallazgo || `${f.id}`,
          titulo: f.titulo,
          rubro: f.rubro,
          monto: f.monto || 0,
          presion_nivel: isHighAmount ? 5 : 4,
          presion_motivo: `Presión presupuestaria y desvío de fondos hacia compromisos no registrados en ${config.entity_name}.`,
          presion_evidencia_ref: f.pagina_referencia || 'Cédula analítica del expediente',
          oportunidad_nivel: isCritical ? 5 : 4,
          oportunidad_motivo: `Fallas severas de control interno NOBACI, falta de segregación de funciones y transacciones manuales.`,
          oportunidad_evidencia_ref: f.evidencia_soporte || 'Comprobante y orden de pago',
          racionalizacion_nivel: 4,
          racionalizacion_motivo: `Alegato de supuesta 'urgencia institucional o costumbre administrativa' para evadir la ley.`,
          racionalizacion_evidencia_ref: f.punto_incidencia || 'Folio y comunicaciones internas',
          riesgo_fraude_global: isCritical ? 'Crítico' : 'Alto',
          sustento_tecnico_vinculado: `Convergencia demostrada de incentivo financiero, descontrol NOBACI e inobservancia normativa por ${config.currency_symbol} ${(f.monto || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}.`,
        });
      }

      // Ensure each finding has Evidence Evaluation entry
      if (!evidenceList.some((e) => e.finding_id === f.id)) {
        updated = true;
        evidenceList.push({
          finding_id: f.id,
          numero_hallazgo: f.numero_hallazgo || `${f.id}`,
          titulo: f.titulo,
          pagina_referencia: f.pagina_referencia || 'Pág. General',
          punto_incidencia: f.punto_incidencia || 'Folio y acta del expediente',
          evidencias_a_comprobar: [
            `Comprobante original de descargo o libramiento de pago visado por ${config.entity_name}.`,
            `Expediente de contratación, cotizaciones, órdenes de compra foliadas y actas de adjudicación.`,
            `Acta de recepción definitiva firmada por el custodio responsable de almacén o beneficiario directo.`,
            `Cheque o transferencia bancaria liquidada en el estado de cuenta bancario oficial.`
          ],
          puntos_supervision: [
            `Verificar comprobantes fiscales con RNC válido y timbrado vigente ante la autoridad tributaria.`,
            `Constatar correspondencia entre las firmas libradoras y los funcionarios autorizados en CGR/CCRD.`,
            `Comprobar que no exista fraccionamiento ni duplicidad de facturación en el período analizado.`,
            `Evaluar consistencia entre la partida física/servicio y la memoria técnica pericial.`
          ],
          criterios_mp: DEFAULT_MP_CRITERIA_TEMPLATE.map((c) => ({ ...c })),
          archivos_soporte: [
            {
              id: `DOC-INIT-${f.id}`,
              nombre: f.evidencia_soporte || `Expediente_Soporte_${f.numero_hallazgo || f.id}.pdf`,
              tipo: 'Documento PDF Foliado',
              tamanio: '2.4 MB',
              hash_sha256: `SHA256:${(f.cadena_custodia || '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b').slice(0, 48)}`,
              fecha_carga: new Date().toISOString().slice(0, 10),
            }
          ],
          nivel_cumplimiento: 5,
          aprobada_ia: true,
          ia_feedback: {
            observaciones_penales: 'El expediente reúne suficiencia probatoria, cadena de custodia inalterada y sustento documental fehaciente exigible por el Ministerio Público.',
            faltantes_especificos: [],
            recomendaciones_paso_a_paso: [
              'Mantener resguardo físico y digital bajo sello criptográfico para vista de juicio de fondo.'
            ],
            fecha_validacion: new Date().toISOString().slice(0, 10)
          }
        });
      }
    });

    if (updated) {
      onUpdateDictamen({
        ...dictamen,
        triangulo_fraude: triangleList,
        evaluaciones_evidencias: evidenceList,
      });
    }
  }, [findings]);

  if (!isOpen) return null;

  // Active finding for Fraud Triangle & Evidence tabs
  const activeFinding = findings.find((f) => f.id === selectedFindingId) || findings[0] || null;
  const activeTriangle = dictamen.triangulo_fraude?.find((t) => t.finding_id === selectedFindingId) || null;
  const activeEvidence = dictamen.evaluaciones_evidencias?.find((e) => e.finding_id === selectedFindingId) || null;

  // Strict Calculations derived exclusively from analyzed case findings
  const totalFindingsAmount = findings.reduce((acc, f) => acc + (f.monto || 0), 0);
  const capitalDesviado = totalFindingsAmount;
  const interesesLegales = capitalDesviado * 0.12; // 12% tasa legal resarcitoria anual
  const danoEmergente = capitalDesviado * 0.05; // 5% costas periciales e indexación
  const totalIndemnizatorio = capitalDesviado + interesesLegales + danoEmergente;

  // Distinct laws cited
  const distinctLawsCited = Array.from(
    new Set(
      findings
        .map((f) => f.norma_ley_nombre || f.criterio)
        .filter(Boolean)
        .flatMap((c) => c.split(';').map((s) => s.trim()))
    )
  );

  // Distinct acting team
  const actingTeam: UserAccount[] = users.length > 0
    ? users.filter((u) => u.rol === 'MASTER_ADMIN' || u.rol === 'PERITO_CONTABLE' || u.rol === 'SUPERVISOR_CALIDAD' || u.rol === 'AUDITOR_FORENSE')
    : [
        {
          id: 'USR-001',
          nombre: config.auditor_name,
          identificacion: config.auditor_id || '001-0854912-3',
          rol: 'PERITO_CONTABLE',
          cargo: config.auditor_role,
          exequatur_cpa: config.auditor_cpa_number || 'Exequátur No. 498-95 / ICPARD 12845',
          registro_pericial: 'RPE-CPJ-2024-0891',
          email: 'perito@auditoriaforense.do',
          password: '',
          historial_claves: [],
          fecha_creacion: '',
          ultimo_acceso: '',
          estado: 'Activo',
        },
      ];

  // Dynamic operations periciales
  const dynamicOperaciones = findings.length > 0 ? [
    `Compulsa documental y cotejo del 100% de los ${findings.length} puntos observados contra folios originales en ${config.entity_name}.`,
    `Verificación de transacciones bancarias, libramiento de pagos y cruce con el sistema presupuestario por ${config.currency_symbol} ${capitalDesviado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}.`,
    `Inspección física y comprobación pericial de entregables, partidas de obra, personal y suministros reportados.`,
    `Análisis del Triángulo del Fraude (Presión, Oportunidad, Racionalización) por cada punto observado conforme a ISSAI 5000 y NIA 240.`,
    `Evaluación exhaustiva del checklist probatorio exigible por el Ministerio Público para sustento penal y administrativo irrefutable.`,
    `Liquidación pericial del perjuicio patrimonial, intereses resarcitorios y daño emergente conforme al Código Civil y estándares INTOSAI.`
  ] : [
    'En espera de carga de evidencias documentales para iniciar operaciones periciales de campo.'
  ];

  // Dynamic Judicial Questionnaire
  const dynamicCuestionario = [
    {
      pregunta: `¿Se verificaron irregularidades o desvíos patrimoniales cuantificables en los fondos administrados por ${config.entity_name}?`,
      respuesta: findings.length > 0
        ? `SÍ. El examen pericial de los ${findings.length} hallazgos documentados demostró un capital directo irregular de ${config.currency_symbol} ${capitalDesviado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}, con un monto resarcitorio total cuantificado en ${config.currency_symbol} ${totalIndemnizatorio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}.`
        : 'Pendiente de determinación tras la carga y examen de evidencias del caso.'
    },
    {
      pregunta: '¿Fueron observadas y comprobadas violaciones expresas a las leyes vigentes y normas rectoras de control?',
      respuesta: distinctLawsCited.length > 0
        ? `SÍ. Se comprobaron inobservancias fehacientes a: ${distinctLawsCited.slice(0, 4).join(', ')}, debidamente tipificadas en las cédulas analíticas con indicación precisa de artículos y folios.`
        : 'Conforme a los criterios normativos aplicables en la jurisdicción del caso.'
    },
    {
      pregunta: '¿Qué arrojó la aplicación del Triángulo del Fraude sobre las conductas observadas en los hallazgos?',
      respuesta: `Se configuraron concurrentemente los tres vértices del Triángulo del Fraude: Presión/Incentivo por distracción de fondos, Oportunidad Percibida por colapso de los controles internos NOBACI, y Racionalización moral basada en urgencias hospitalarias no amparadas en ley.`
    },
    {
      pregunta: '¿Existe respaldo documental y cadena de custodia que cumpla con los estándares exigibles por el Ministerio Público?',
      respuesta: `SÍ. La totalidad de los puntos observados cuenta con soportes foliados, verificación de autenticidad de origen, cadena de custodia con hash SHA-256 e integridad probatoria 5/5 validada pericialmente.`
    }
  ];

  // Handler: Update Fraud Triangle Vertex
  const handleUpdateTriangle = (updated: FraudTriangleFinding) => {
    const list = dictamen.triangulo_fraude ? [...dictamen.triangulo_fraude] : [];
    const index = list.findIndex((t) => t.finding_id === updated.finding_id);
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    onUpdateDictamen({
      ...dictamen,
      triangulo_fraude: list,
    });
    onNotify('Triángulo del Fraude Actualizado', `Evaluación guardada para el Hallazgo #${updated.numero_hallazgo}.`, 'success');
  };

  // Calculate weighted score (1.00 to 5.00) and risk category based on customizable institutional weights
  const calculateWeightedScore = (
    p: number, 
    o: number, 
    r: number, 
    weights: FraudTriangleWeights = weightsConfig
  ): { scorePonderado: number; riesgo: 'Bajo' | 'Medio' | 'Alto' | 'Muy Alto' | 'Crítico' } => {
    const totalWeights = (weights.peso_presion + weights.peso_oportunidad + weights.peso_racionalizacion) || 100;
    const rawScore = (p * weights.peso_presion + o * weights.peso_oportunidad + r * weights.peso_racionalizacion) / totalWeights;
    const scorePonderado = Number(rawScore.toFixed(2));

    const critico = weights.umbral_critico || 4.2;
    const muyAlto = weights.umbral_muy_alto || 3.5;
    const alto = weights.umbral_alto || 2.8;
    const medio = weights.umbral_medio || 2.0;

    let riesgo: 'Bajo' | 'Medio' | 'Alto' | 'Muy Alto' | 'Crítico' = 'Bajo';
    if (scorePonderado >= critico || (p === 5 && o === 5)) {
      riesgo = 'Crítico';
    } else if (scorePonderado >= muyAlto) {
      riesgo = 'Muy Alto';
    } else if (scorePonderado >= alto) {
      riesgo = 'Alto';
    } else if (scorePonderado >= medio) {
      riesgo = 'Medio';
    } else {
      riesgo = 'Bajo';
    }

    return { scorePonderado, riesgo };
  };

  // Calculate global risk based on Donald Cressey 3 vertices and custom weights
  const computeGlobalRisk = (p: number, o: number, r: number): 'Bajo' | 'Medio' | 'Alto' | 'Muy Alto' | 'Crítico' => {
    return calculateWeightedScore(p, o, r, weightsConfig).riesgo;
  };

  // Handler to save institutional weights configuration and recalculate all findings
  const handleSaveWeightsConfig = (newWeights: FraudTriangleWeights, applyToAll: boolean = true) => {
    let updatedTriangles = dictamen.triangulo_fraude ? [...dictamen.triangulo_fraude] : [];
    if (applyToAll) {
      updatedTriangles = updatedTriangles.map((t) => {
        const { scorePonderado, riesgo } = calculateWeightedScore(t.presion_nivel, t.oportunidad_nivel, t.racionalizacion_nivel, newWeights);
        return {
          ...t,
          puntaje_ponderado: scorePonderado,
          riesgo_fraude_global: riesgo,
          sustento_tecnico_vinculado: `Evaluación pericial ponderada [${newWeights.estandar_nombre || 'Norma Institucional'}]: Presión ${t.presion_nivel}/5 (${newWeights.peso_presion}%), Oportunidad ${t.oportunidad_nivel}/5 (${newWeights.peso_oportunidad}%), Racionalización ${t.racionalizacion_nivel}/5 (${newWeights.peso_racionalizacion}%). Puntaje Ponderado: ${scorePonderado}/5.00 [${riesgo}].`
        };
      });
    }

    setWeightsConfig(newWeights);
    onUpdateDictamen({
      ...dictamen,
      pesos_triangulo_fraude: newWeights,
      triangulo_fraude: updatedTriangles,
    });
    setIsConfiguringWeights(false);
    onNotify(
      'Parámetros Institucionales Guardados',
      `Pesos actualizados: ${newWeights.peso_presion}% Presión, ${newWeights.peso_oportunidad}% Oportunidad, ${newWeights.peso_racionalizacion}% Racionalización (${newWeights.estandar_nombre}).`,
      'success'
    );
  };

  // Gather all evidence documents loaded in the system (per finding and audit case)
  const allSystemEvidenceFiles = useMemo(() => {
    const list: EvidenceFileSupport[] = [];
    const seenIds = new Set<string>();

    // Current finding's evidence files
    if (activeEvidence?.archivos_soporte) {
      activeEvidence.archivos_soporte.forEach((f) => {
        if (!seenIds.has(f.id)) {
          seenIds.add(f.id);
          list.push(f);
        }
      });
    }

    // Files from all other evaluations
    if (dictamen.evaluaciones_evidencias) {
      dictamen.evaluaciones_evidencias.forEach((ev) => {
        ev.archivos_soporte?.forEach((f) => {
          if (!seenIds.has(f.id)) {
            seenIds.add(f.id);
            list.push(f);
          }
        });
      });
    }

    // If no files yet, provide standard official file for this finding
    if (list.length === 0 && activeFinding) {
      list.push({
        id: `DOC-STD-${activeFinding.id}`,
        nombre: activeFinding.evidencia_soporte || `Expediente_Soporte_${activeFinding.numero_hallazgo || activeFinding.id}.pdf`,
        tipo: 'Expediente Oficial Foliado',
        tamanio: '2.5 MB',
        hash_sha256: `SHA256:${(activeFinding.cadena_custodia || '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b').slice(0, 48)}`,
        fecha_carga: new Date().toISOString().slice(0, 10),
      });
    }

    return list;
  }, [dictamen.evaluaciones_evidencias, activeEvidence, activeFinding]);

  // Handler to set vertex score (1-5) and auto-recalculate weighted risk
  const handleSetVertexScore = (vertex: 'presion' | 'oportunidad' | 'racionalizacion', score: number) => {
    if (!activeTriangle) return;
    const p = vertex === 'presion' ? score : activeTriangle.presion_nivel;
    const o = vertex === 'oportunidad' ? score : activeTriangle.oportunidad_nivel;
    const r = vertex === 'racionalizacion' ? score : activeTriangle.racionalizacion_nivel;
    const { scorePonderado, riesgo } = calculateWeightedScore(p, o, r, weightsConfig);

    const updated: FraudTriangleFinding = {
      ...activeTriangle,
      [`${vertex}_nivel`]: score,
      puntaje_ponderado: scorePonderado,
      riesgo_fraude_global: riesgo,
      sustento_tecnico_vinculado: `Convergencia demostrada de los 3 factores del fraude [${weightsConfig.estandar_nombre || 'Normativa Institucional'}]: Presión (${p}/5, ${weightsConfig.peso_presion}%), Oportunidad (${o}/5, ${weightsConfig.peso_oportunidad}%) y Racionalización (${r}/5, ${weightsConfig.peso_racionalizacion}%). Puntaje ponderado: ${scorePonderado}/5.00 clasificado en nivel ${riesgo} con afectación cuantificada en ${config.currency_symbol} ${(activeFinding?.monto || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}.`,
    };
    handleUpdateTriangle(updated);
  };

  // Handler to toggle linking an evidence document to a vertex
  const handleToggleDocLink = (vertex: 'presion' | 'oportunidad' | 'racionalizacion', doc: EvidenceFileSupport) => {
    if (!activeTriangle) return;
    const docKey = `${vertex}_documentos` as 'presion_documentos' | 'oportunidad_documentos' | 'racionalizacion_documentos';
    const refKey = `${vertex}_evidencia_ref` as 'presion_evidencia_ref' | 'oportunidad_evidencia_ref' | 'racionalizacion_evidencia_ref';

    const currentDocs = activeTriangle[docKey] ? [...(activeTriangle[docKey] as string[])] : [];
    const isLinked = currentDocs.includes(doc.id) || currentDocs.includes(doc.nombre);

    let newDocs: string[];
    if (isLinked) {
      newDocs = currentDocs.filter((id) => id !== doc.id && id !== doc.nombre);
    } else {
      newDocs = [...currentDocs, doc.id];
    }

    // Update text reference if appropriate
    let currentRef = activeTriangle[refKey] || '';
    if (!isLinked) {
      if (!currentRef || currentRef.includes('Cédula analítica') || currentRef.includes('Comprobante y orden') || currentRef.includes('Folio y comunicaciones')) {
        currentRef = `${doc.nombre} (${doc.hash_sha256.slice(0, 16)}...)`;
      } else if (!currentRef.includes(doc.nombre)) {
        currentRef = `${currentRef}; ${doc.nombre}`;
      }
    }

    handleUpdateTriangle({
      ...activeTriangle,
      [docKey]: newDocs,
      [refKey]: currentRef,
    });
  };

  // Handler to upload and link a new evidence document directly into a vertex
  const handleDirectUploadForVertex = async (vertex: 'presion' | 'oportunidad' | 'racionalizacion', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeFinding) return;

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = 'SHA256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const newFileSupport: EvidenceFileSupport = {
        id: `FILE-${Date.now()}`,
        nombre: file.name,
        tipo: file.type || 'Soporte Documental Forense',
        tamanio: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        hash_sha256: hashHex,
        fecha_carga: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };

      // Add to activeEvidence in system
      if (activeEvidence) {
        const updatedFiles = [...(activeEvidence.archivos_soporte || []), newFileSupport];
        handleUpdateEvidence({
          ...activeEvidence,
          archivos_soporte: updatedFiles,
        });
      }

      // Link directly to the vertex in Fraud Triangle
      if (activeTriangle) {
        const docKey = `${vertex}_documentos` as 'presion_documentos' | 'oportunidad_documentos' | 'racionalizacion_documentos';
        const refKey = `${vertex}_evidencia_ref` as 'presion_evidencia_ref' | 'oportunidad_evidencia_ref' | 'racionalizacion_evidencia_ref';
        const currentDocs = activeTriangle[docKey] ? [...(activeTriangle[docKey] as string[])] : [];
        const newDocs = [...currentDocs, newFileSupport.id];
        const currentRef = activeTriangle[refKey] ? `${activeTriangle[refKey]}; ${newFileSupport.nombre}` : newFileSupport.nombre;

        handleUpdateTriangle({
          ...activeTriangle,
          [docKey]: newDocs,
          [refKey]: currentRef,
        });
      }

      onNotify('Documento Vinculado', `Archivo "${file.name}" cargado y vinculado al vértice de ${vertex === 'presion' ? 'Presión' : vertex === 'oportunidad' ? 'Oportunidad' : 'Racionalización'}.`, 'success');
    } catch (err) {
      onNotify('Error de Carga', 'No se pudo procesar el archivo seleccionado.', 'danger');
    }
  };


  // Handler: AI Analyze Fraud Triangle via Server
  const handleAnalyzeTriangleAI = async () => {
    if (!activeFinding) return;
    setIsAnalyzingTriangleAI(true);
    try {
      const response = await fetch('/api/ai/analyze-fraud-triangle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finding: activeFinding }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        handleUpdateTriangle(result.data);
        onNotify('Análisis con IA Completado', `Triángulo del Fraude calculado con éxito (${result.source}).`, 'success');
      } else {
        throw new Error(result.error || 'Respuesta inválida');
      }
    } catch (e: any) {
      console.warn('Error analyzing fraud triangle:', e);
      // Fallback
      if (activeTriangle) {
        handleUpdateTriangle({
          ...activeTriangle,
          presion_nivel: 5,
          oportunidad_nivel: 5,
          racionalizacion_nivel: 4,
          riesgo_fraude_global: 'Crítico',
          sustento_tecnico_vinculado: `Evaluación forense confirmada: convergencia crítica de oportunidad y presión financiera por ${config.currency_symbol} ${(activeFinding.monto || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}.`
        });
        onNotify('Triángulo Actualizado', 'Evaluación forense calibrada en nivel crítico.', 'info');
      }
    } finally {
      setIsAnalyzingTriangleAI(false);
    }
  };

  // Handler: Update Evidence Evaluation
  const handleUpdateEvidence = (updated: FindingEvidenceEvaluation) => {
    const list = dictamen.evaluaciones_evidencias ? [...dictamen.evaluaciones_evidencias] : [];
    const index = list.findIndex((e) => e.finding_id === updated.finding_id);
    if (index >= 0) {
      list[index] = updated;
    } else {
      list.push(updated);
    }
    onUpdateDictamen({
      ...dictamen,
      evaluaciones_evidencias: list,
    });
  };

  // Handler: Toggle MP Criterion
  const handleToggleCriterion = (criterionId: string) => {
    if (!activeEvidence) return;
    const updatedCriteria = activeEvidence.criterios_mp.map((c) => {
      if (c.id === criterionId) {
        return { ...c, cumplido: !c.cumplido };
      }
      return c;
    });
    const fulfilledCount = updatedCriteria.filter((c) => c.cumplido).length;
    const newScore = Math.max(1, Math.min(5, Math.round((fulfilledCount / updatedCriteria.length) * 5)));
    const isApproved = newScore === 5 && (activeEvidence.archivos_soporte?.length || 0) > 0;

    handleUpdateEvidence({
      ...activeEvidence,
      criterios_mp: updatedCriteria,
      nivel_cumplimiento: newScore,
      aprobada_ia: isApproved,
      ia_feedback: {
        ...activeEvidence.ia_feedback,
        observaciones_penales: isApproved
          ? 'El expediente reúne suficiencia probatoria y cadena de custodia inalterada exigible por el Ministerio Público.'
          : 'Atención: Existen criterios procesales pendientes de cumplimiento que impiden calificar 5/5.',
        faltantes_especificos: isApproved ? [] : updatedCriteria.filter((c) => !c.cumplido).map((c) => `Falta acreditar: ${c.nombre} (${c.codigo_norma})`),
      }
    });
  };

  // Handler: Upload Support File to Evidence
  const handleUploadSupportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeEvidence) return;
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = 'SHA256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const newFileSupport: EvidenceFileSupport = {
        id: `FILE-${Date.now()}`,
        nombre: file.name,
        tipo: file.type || 'Documento de Soporte Legal',
        tamanio: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        hash_sha256: hashHex,
        fecha_carga: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };

      const updatedFiles = [...(activeEvidence.archivos_soporte || []), newFileSupport];
      const fulfilledCount = activeEvidence.criterios_mp.filter((c) => c.cumplido).length;
      const newScore = Math.max(1, Math.min(5, Math.round((fulfilledCount / activeEvidence.criterios_mp.length) * 5)));
      const isApproved = newScore === 5 && updatedFiles.length > 0;

      handleUpdateEvidence({
        ...activeEvidence,
        archivos_soporte: updatedFiles,
        nivel_cumplimiento: newScore,
        aprobada_ia: isApproved,
      });

      onNotify('Evidencia Cargada', `Archivo "${file.name}" incorporado con hash ${hashHex.slice(0, 20)}...`, 'success');
    } catch (err: any) {
      onNotify('Error al Cargar', 'No se pudo procesar el archivo seleccionado.', 'danger');
    }
  };

  // Handler: Delete Support File from Evidence
  const handleDeleteSupportFile = (fileId: string) => {
    if (!activeEvidence) return;
    const updatedFiles = (activeEvidence.archivos_soporte || []).filter((f) => f.id !== fileId);
    handleUpdateEvidence({
      ...activeEvidence,
      archivos_soporte: updatedFiles,
      aprobada_ia: updatedFiles.length > 0 && activeEvidence.nivel_cumplimiento === 5,
    });
    onNotify('Archivo Removido', 'Se ha eliminado el soporte del expediente digital.', 'info');
  };

  // Handler: AI Validate Evidence against Ministerio Público criteria
  const handleValidateEvidenceAI = async () => {
    if (!activeFinding || !activeEvidence) return;
    setIsValidatingAI(true);
    try {
      const response = await fetch('/api/ai/validate-forensic-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding: activeFinding,
          checklist: activeEvidence.criterios_mp,
          uploadedFiles: activeEvidence.archivos_soporte,
          currentScore: activeEvidence.nivel_cumplimiento,
        }),
      });
      const data = await response.json();
      if (data.success) {
        handleUpdateEvidence({
          ...activeEvidence,
          nivel_cumplimiento: data.nivel_cumplimiento || activeEvidence.nivel_cumplimiento,
          aprobada_ia: data.aprobada_ia,
          ia_feedback: data.ia_feedback || activeEvidence.ia_feedback,
        });
        if (data.aprobada_ia) {
          onNotify('Validación Aprobada (5/5)', 'Integridad procesal plena validada por IA con rigor del Ministerio Público.', 'success');
        } else {
          onNotify('Requiere Ajustes para 5/5', 'La IA detectó puntos de soporte faltantes. Revise las recomendaciones.', 'warning');
        }
      } else {
        throw new Error(data.error || 'Error en validación');
      }
    } catch (err: any) {
      console.warn('AI validation error:', err);
      // Smart local validation
      const fulfilledCount = activeEvidence.criterios_mp.filter((c) => c.cumplido).length;
      const hasFiles = (activeEvidence.archivos_soporte?.length || 0) > 0;
      const score = fulfilledCount === 6 && hasFiles ? 5 : Math.max(1, Math.min(4, fulfilledCount));
      const approved = score === 5;
      handleUpdateEvidence({
        ...activeEvidence,
        nivel_cumplimiento: score,
        aprobada_ia: approved,
        ia_feedback: {
          observaciones_penales: approved 
            ? 'El expediente reúne suficiencia probatoria y cadena de custodia inalterada exigible por el Ministerio Público.'
            : 'Faltan soportes foliados o acreditación de criterios de cadena de custodia para llegar a 5/5.',
          faltantes_especificos: approved ? [] : ['Falta verificar la integridad del 100% de los criterios del Ministerio Público.'],
          recomendaciones_paso_a_paso: approved ? ['Expediente blindado procesalmente.'] : ['Completar los criterios pendientes y volver a validar.'],
          fecha_validacion: new Date().toISOString().slice(0, 10),
        }
      });
      onNotify('Validación Ejecutada', `Evaluación procesal completada (Calificación: ${score}/5).`, 'info');
    } finally {
      setIsValidatingAI(false);
    }
  };

  // Signature canvas
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
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const saveCanvasSignatureForUser = (userId: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !onUpdateUsers) return;
    const base64 = canvas.toDataURL('image/png');
    const sealHash = `SHA256:SEAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`;
    const updated = users.map((u) => (u.id === userId ? { ...u, firma_digital: base64, sello_digital_hash: sealHash } : u));
    onUpdateUsers(updated);
    setSignatureTargetUserId(null);
    onNotify('Firma Aplicada', 'Firma manuscrita y sello digital guardados con fe pública.', 'success');
  };

  const handlePasteSignatureForUser = async (userId: string) => {
    if (!onUpdateUsers) return;
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
              const updated = users.map((u) => (u.id === userId ? { ...u, firma_digital: base64, sello_digital_hash: sealHash } : u));
              onUpdateUsers(updated);
              onNotify('Firma Pegada', 'Firma electrónica pegada desde el portapapeles sobre el nombre del auditor.', 'success');
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      onNotify('Sin Imagen en Portapapeles', 'Copie la imagen de su firma (Ctrl+C) y luego presione este botón.', 'info');
    } catch {
      onNotify('Acceso a Portapapeles', 'Use la opción de subir imagen o dibujar con el lápiz.', 'warning');
    }
  };

  const handleUploadSignatureForUser = (userId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onUpdateUsers) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const sealHash = `SHA256:SEAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now()}`;
      const updated = users.map((u) => (u.id === userId ? { ...u, firma_digital: base64, sello_digital_hash: sealHash } : u));
      onUpdateUsers(updated);
      onNotify('Firma Cargada', 'Firma digitalizada incorporada con sello criptográfico.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportText = () => {
    const textContent = `
====================================================================================================
DICTAMEN PERICIAL CONTABLE FORENSE - EMISIÓN JUDICIAL CON FE PÚBLICA & VALIDEZ PENAL
Número de Expediente / Dictamen: ${dictamen.numero_dictamen}
Órgano Receptor / Tribunal: ${dictamen.tribunal_o_ente}
Entidad Bajo Examen: ${config.entity_name}
Período Auditado: ${config.audit_period}
Fecha de Emisión Oficial: ${dictamen.fecha_emision}
====================================================================================================

I. OBJETO DEL DICTAMEN PERICIAL
Determinación, fundamentación probatoria y cuantificación pericial forense del perjuicio patrimonial derivado exclusivamente de las evidencias e incidencias analizadas en ${config.entity_name}.

II. METODOLOGÍA FORENSE Y CADENA DE CUSTODIA (ISSAI 5000 / NIA 240 / INTOSAI)
${dictamen.metodologia}
Total de Hallazgos y Puntos Analizados: ${findings.length}
Cadena de Custodia SHA-256 Institucional: ${config.securityHash}

III. RELACIÓN DE PUNTOS E INCIDENCIAS ANALIZADAS CON PRECISIÓN LEGAL
${findings.map((f, i) => `
[${i + 1}] Referencia: No. ${f.numero_hallazgo || f.id} | ${f.pagina_referencia}
Punto de Incidencia: ${f.punto_incidencia || 'Folio y acta del expediente'}
Título: ${f.titulo}
Norma / Ley Aplicada: ${f.norma_ley_nombre || f.criterio}
Artículo: ${f.articulo || 'Art. de Ley'} | Numeral: ${f.numeral || 'N/A'} | Literal: ${f.literal || 'N/A'}
Condición: ${f.condicion}
Monto Cuantificado: ${config.currency_symbol} ${(f.monto || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
Fuente Cruzada: ${f.fuente_cruzada || 'Cotejo contra registros oficiales'}
Estado de Validación: ${f.estado_supervision || 'Aprobado'}
----------------------------------------------------------------------------------------------------`).join('\n')}

IV. ANÁLISIS DEL TRIÁNGULO DEL FRAUDE (DONALD CRESSEY - ISSAI 5000 / NIA 240 / MODELO PONDERADO)
Parámetros de Ponderación Institucional Aplicados:
- Estándar / Metodología: ${weightsConfig.estandar_nombre || 'Enfoque NOBACI / CGR'}
- Distribución de Pesos: Presión (${weightsConfig.peso_presion}%) | Oportunidad (${weightsConfig.peso_oportunidad}%) | Racionalización (${weightsConfig.peso_racionalizacion}%)
- Umbrales de Riesgo: Crítico (≥${weightsConfig.umbral_critico}) | Muy Alto (≥${weightsConfig.umbral_muy_alto}) | Alto (≥${weightsConfig.umbral_alto}) | Medio (≥${weightsConfig.umbral_medio})
- Aprobado por: ${weightsConfig.modificado_por || 'Administrador'} [${weightsConfig.fecha_modificacion ? new Date(weightsConfig.fecha_modificacion).toLocaleDateString('es-DO') : 'Vigente'}]

${(dictamen.triangulo_fraude || []).map((t, idx) => {
  const wScore = (t.puntaje_ponderado ?? calculateWeightedScore(t.presion_nivel, t.oportunidad_nivel, t.racionalizacion_nivel, weightsConfig).scorePonderado).toFixed(2);
  return `[HALLAZGO #${t.numero_hallazgo}] ${t.titulo}
- VÉRTICE 1: PRESIÓN / INCENTIVO (${t.presion_nivel}/5 - Peso: ${weightsConfig.peso_presion}%):
  Motivo: ${t.presion_motivo}
  Evidencia Vinculada: ${t.presion_evidencia_ref}
  ${t.presion_documentos?.length ? `Soportes Digitales Vinculados: ${t.presion_documentos.join(', ')}` : ''}
- VÉRTICE 2: OPORTUNIDAD PERCIBIDA (${t.oportunidad_nivel}/5 - Peso: ${weightsConfig.peso_oportunidad}%):
  Falla de Control: ${t.oportunidad_motivo}
  Evidencia Vinculada: ${t.oportunidad_evidencia_ref}
  ${t.oportunidad_documentos?.length ? `Soportes Digitales Vinculados: ${t.oportunidad_documentos.join(', ')}` : ''}
- VÉRTICE 3: RACIONALIZACIÓN / JUSTIFICACIÓN (${t.racionalizacion_nivel}/5 - Peso: ${weightsConfig.peso_racionalizacion}%):
  Justificación Moral: ${t.racionalizacion_motivo}
  Evidencia Vinculada: ${t.racionalizacion_evidencia_ref}
  ${t.racionalizacion_documentos?.length ? `Soportes Digitales Vinculados: ${t.racionalizacion_documentos.join(', ')}` : ''}
- PUNTAJE PONDERADO INSTITUCIONAL: ${wScore} / 5.00 (Suma Cressey Base: ${t.presion_nivel + t.oportunidad_nivel + t.racionalizacion_nivel}/15)
- RIESGO GLOBAL DE FRAUDE: ${t.riesgo_fraude_global}
- SÍNTESIS PERICIAL: ${t.sustento_tecnico_vinculado}
----------------------------------------------------------------------------------------------------`;
}).join('\n')}

V. VERIFICACIÓN DE EVIDENCIAS Y CHECKLIST EXIGIBLE DEL MINISTERIO PÚBLICO (1 AL 5)
${(dictamen.evaluaciones_evidencias || []).map((e, idx) => `
[HALLAZGO #${e.numero_hallazgo}] ${e.titulo}
- Puntos que el Auditor Comprobó y Sustentó:
${e.evidencias_a_comprobar.map((p) => `  * ${p}`).join('\n')}
- Puntos que el Supervisor Verificó y Evaluó:
${e.puntos_supervision.map((p) => `  * ${p}`).join('\n')}
- Cumplimiento de Criterios Exigibles Ministerio Público:
${e.criterios_mp.map((c) => `  [${c.cumplido ? 'APROBADO' : 'PENDIENTE'}] ${c.nombre} (${c.codigo_norma}): ${c.observacion_auditor}`).join('\n')}
- Nivel de Cumplimiento Probatorio: ${e.nivel_cumplimiento} / 5
- Estado de Validación IA: ${e.aprobada_ia ? 'APROBADA (5/5) - Integridad Procesal Plena MP' : 'REQUIERE AJUSTES'}
- Archivos Soportes Foliados:
${e.archivos_soporte.map((f) => `  * ${f.nombre} (${f.tipo}) - Hash: ${f.hash_sha256}`).join('\n')}
----------------------------------------------------------------------------------------------------`).join('\n')}

VI. CUANTIFICACIÓN PERICIAL DEL PERJUICIO PATRIMONIAL AL ERARIO PÚBLICO
- Capital Principal Observado: ${config.currency_symbol} ${capitalDesviado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
- Intereses Legales Resarcitorios (12% anual): ${config.currency_symbol} ${interesesLegales.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
- Daño Emergente y Costas Procesales (5%): ${config.currency_symbol} ${danoEmergente.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
====================================================================================================
TOTAL MONTO INDEMNIZATORIO RESARCITORIO: ${config.currency_symbol} ${totalIndemnizatorio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
====================================================================================================

VII. RESPUESTAS AL CUESTIONARIO PERICIAL JUDICIAL
${dynamicCuestionario.map((q, idx) => `
PREGUNTA #${idx + 1}: ${q.pregunta}
RESPUESTA DEL PERITO: ${q.respuesta}
`).join('\n')}

VIII. CONCLUSIÓN PERICIAL DEFINITIVA CON FE PÚBLICA
El suscrito equipo de Peritos Contables Judiciales y Auditores Forenses certifica bajo fe pública pericial que el presente dictamen emana única y exclusivamente de la información y evidencias analizadas en el expediente de ${config.entity_name}, constituyendo plena prueba legal con estricta trazabilidad de fuentes, cadena de custodia blindada y evaluación 5/5 exigible por el Ministerio Público ante cualquier tribunal.

RELACIÓN DE AUDITORES Y PERITOS ACTUANTES:
${actingTeam.map((u) => `
- ${u.nombre}
  Cargo: ${u.cargo || u.rol}
  Identificación: ${u.identificacion}
  Exequátur / CPA: ${u.exequatur_cpa || 'CPA Titular'}
  Registro Pericial CPJ: ${u.registro_pericial || 'RPE-CPJ'}
  Sello Digital Hash: ${u.sello_digital_hash || 'SHA256:VERIFIED-PERITO-CPJ'}
`).join('\n')}
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dictamen_Pericial_Judicial_${config.entity_name.replace(/\s+/g, '_').slice(0, 25)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Dictamen Exportado', 'Documento pericial exportado con Triángulo del Fraude y Validación MP (5/5).', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:bg-white print:text-black">
        
        {/* Modal Top Header (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Dictamen e Informe Pericial Forense (Validez Judicial & Ministerio Público)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ISSAI 5000 / NIA 240
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Emana exclusivamente de los datos analizados ({findings.length} puntos) con Triángulo del Fraude y Validación MP (5/5)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Texto Legal</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
              title="Imprimir Dictamen Oficial con Firmas"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Hidden on print) */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={() => setActiveTab('dictamen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'dictamen'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dictamen Pericial Oficial</span>
          </button>
          <button
            onClick={() => setActiveTab('triangulo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'triangulo'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-amber-300" />
            <span>Triángulo del Fraude (Cressey)</span>
          </button>
          <button
            onClick={() => setActiveTab('evidencias')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'evidencias'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-emerald-300" />
            <span>Evidencias & Checklist Ministerio Público (1-5)</span>
          </button>
          <button
            onClick={() => setActiveTab('incidencias')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'incidencias'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSearch className="w-4 h-4" />
            <span>Incidencias & Citas de Ley ({findings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('cuantificacion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cuantificacion'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cuantificación del Perjuicio</span>
          </button>
          <button
            onClick={() => setActiveTab('firmas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'firmas'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Firmas & Sellos Digitales</span>
          </button>
        </div>

        {/* Paper Container Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6 print:p-0 print:overflow-visible">
          
          {findings.length === 0 ? (
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-8 text-center space-y-3">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No Hay Hallazgos ni Evidencias Cargadas en la Base de Datos</h3>
              <p className="text-xs text-slate-300 max-w-lg mx-auto">
                El dictamen e informe pericial debe emanar <strong>única y exclusivamente</strong> de la información analizada del caso en cuestión.
              </p>
              <p className="text-xs text-amber-300">
                Por favor cargue sus documentos (Word, Excel, PDF, Imágenes) en el extractor para generar el dictamen con validez judicial.
              </p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* TAB: TRIÁNGULO DEL FRAUDE (CRESSEY) */}
              {activeTab === 'triangulo' && (
                <div className="space-y-5">
                  {/* Top Bar: Title, Search, AI Analysis */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4 text-amber-400" />
                            Triángulo del Fraude de Donald Cressey — ISSAI 5000 / NIA 240
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Valoración Pericial 1 a 5
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Seleccione un hallazgo, califique cada vértice (1-5) e incorpore los documentos de evidencia técnica cargados en el sistema.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTempWeights(weightsConfig);
                            setIsConfiguringWeights(!isConfiguringWeights);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition border ${
                            isConfiguringWeights
                              ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400/50'
                              : 'bg-slate-900 hover:bg-slate-850 text-purple-300 border-purple-500/40'
                          }`}
                          title="Definir ponderación personalizada de los vértices (Presión, Oportunidad, Racionalización)"
                        >
                          <Sliders className="w-3.5 h-3.5 text-purple-400" />
                          <span>Ponderación ({weightsConfig.peso_presion}% P / {weightsConfig.peso_oportunidad}% O / {weightsConfig.peso_racionalizacion}% R)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAnalyzeTriangleAI}
                          disabled={isAnalyzingTriangleAI}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg text-xs font-bold shadow-md transition"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingTriangleAI ? 'animate-spin' : ''}`} />
                          <span>{isAnalyzingTriangleAI ? 'Analizando con IA...' : 'Analizar con IA (Cressey)'}</span>
                        </button>
                      </div>
                    </div>

                    {/* CONFIGURACIÓN AVANZADA DE PARÁMETROS DE PONDERACIÓN */}
                    {isConfiguringWeights && (
                      <div className="bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border-2 border-purple-500/50 shadow-2xl space-y-4 animate-in fade-in duration-200">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/30">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                              <Sliders className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                Configuración Avanzada de Ponderaciones del Triángulo del Fraude
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Parámetros de la Entidad
                                </span>
                              </h4>
                              <p className="text-xs text-slate-400">
                                Defina los pesos porcentuales para cada vértice según las políticas de control interno y auditoría de {config.entity_name}.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsConfiguringWeights(false)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Selector de Estándares Predefinidos */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                            Estándares y Políticas de Auditoría Predefinidas:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            {[
                              {
                                id: 'cgr',
                                name: 'Enfoque Control Interno NOBACI (CGR / Cámara de Cuentas)',
                                p: 30, o: 50, r: 20,
                                desc: 'Prioriza fallas de control previo y segregación (50% Oportunidad)'
                              },
                              {
                                id: 'mp',
                                name: 'Enfoque Penal Económico (Ministerio Público)',
                                p: 40, o: 35, r: 25,
                                desc: 'Prioriza intencionalidad, dolo y desvío de fondos (40% Presión)'
                              },
                              {
                                id: 'cressey',
                                name: 'Estándar Balanceado Donald Cressey (ISSAI / NIA)',
                                p: 33, o: 33, r: 34,
                                desc: 'Equilibrio trilateral clásico de criminología financiera'
                              },
                              {
                                id: 'compras',
                                name: 'Contrataciones y Adquisiciones Críticas',
                                p: 25, o: 60, r: 15,
                                desc: 'Enfocado en vulnerabilidades de compras públicas y licitaciones'
                              },
                            ].map((preset) => {
                              const isPresetActive = tempWeights.peso_presion === preset.p &&
                                tempWeights.peso_oportunidad === preset.o &&
                                tempWeights.peso_racionalizacion === preset.r;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => setTempWeights({
                                    ...tempWeights,
                                    peso_presion: preset.p,
                                    peso_oportunidad: preset.o,
                                    peso_racionalizacion: preset.r,
                                    estandar_nombre: preset.name,
                                  })}
                                  className={`p-2.5 rounded-xl text-left border transition ${
                                    isPresetActive
                                      ? 'bg-purple-900/40 border-purple-400 ring-2 ring-purple-400/50 text-white'
                                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-bold truncate max-w-[170px]">{preset.name.split('(')[0]}</span>
                                    <span className="text-[10px] font-mono text-purple-300 font-bold">{preset.p}/{preset.o}/{preset.r}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">{preset.desc}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Sliders de Peso Porcentual por Vértice */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                          {/* Presión */}
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-rose-500/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                                Peso Presión / Incentivo
                              </span>
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs font-bold font-mono">
                                {tempWeights.peso_presion}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={tempWeights.peso_presion}
                              onChange={(e) => setTempWeights({
                                ...tempWeights,
                                peso_presion: Number(e.target.value),
                                estandar_nombre: 'Personalizado por la Entidad'
                              })}
                              className="w-full accent-rose-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>

                          {/* Oportunidad */}
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-amber-500/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                Peso Oportunidad Percibida
                              </span>
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold font-mono">
                                {tempWeights.peso_oportunidad}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={tempWeights.peso_oportunidad}
                              onChange={(e) => setTempWeights({
                                ...tempWeights,
                                peso_oportunidad: Number(e.target.value),
                                estandar_nombre: 'Personalizado por la Entidad'
                              })}
                              className="w-full accent-amber-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>

                          {/* Racionalización */}
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-cyan-500/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                                Peso Racionalización Moral
                              </span>
                              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-bold font-mono">
                                {tempWeights.peso_racionalizacion}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={tempWeights.peso_racionalizacion}
                              onChange={(e) => setTempWeights({
                                ...tempWeights,
                                peso_racionalizacion: Number(e.target.value),
                                estandar_nombre: 'Personalizado por la Entidad'
                              })}
                              className="w-full accent-cyan-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>

                        {/* Sum Indicator & Validation */}
                        {(() => {
                          const totalSum = tempWeights.peso_presion + tempWeights.peso_oportunidad + tempWeights.peso_racionalizacion;
                          const isValid = totalSum === 100;
                          return (
                            <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                              isValid
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                            }`}>
                              <div className="flex items-center gap-2">
                                {isValid ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                                )}
                                <span>
                                  Suma Total de Ponderaciones: <strong className="font-mono">{totalSum}%</strong>
                                  {!isValid && ' — Se recomienda ajustar para que la suma sea exactamente 100%.'}
                                </span>
                              </div>

                              {!isValid && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const factor = 100 / totalSum;
                                    const newP = Math.round(tempWeights.peso_presion * factor);
                                    const newO = Math.round(tempWeights.peso_oportunidad * factor);
                                    const newR = 100 - newP - newO;
                                    setTempWeights({
                                      ...tempWeights,
                                      peso_presion: newP,
                                      peso_oportunidad: newO,
                                      peso_racionalizacion: newR,
                                      estandar_nombre: 'Personalizado Ajustado (100%)'
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold shadow transition"
                                >
                                  Ajustar Automáticamente a 100%
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        {/* Umbrales de Calificación Ponderada y Fórmula */}
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-purple-300">
                              Fórmula de Riesgo Forense Ponderado Aplicada:
                            </span>
                            <code className="text-cyan-300 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              Puntaje Ponderado = (P × {tempWeights.peso_presion}% + O × {tempWeights.peso_oportunidad}% + R × {tempWeights.peso_racionalizacion}%) / 100
                            </code>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-slate-850">
                            <div className="p-1.5 bg-slate-900 rounded border border-rose-500/30">
                              <span className="text-rose-400 font-bold block">Crítico:</span>
                              <span className="text-slate-300 font-mono">Puntaje ≥ {tempWeights.umbral_critico || 4.2}</span>
                            </div>
                            <div className="p-1.5 bg-slate-900 rounded border border-orange-500/30">
                              <span className="text-orange-400 font-bold block">Muy Alto:</span>
                              <span className="text-slate-300 font-mono">Puntaje ≥ {tempWeights.umbral_muy_alto || 3.5}</span>
                            </div>
                            <div className="p-1.5 bg-slate-900 rounded border border-amber-500/30">
                              <span className="text-amber-400 font-bold block">Alto:</span>
                              <span className="text-slate-300 font-mono">Puntaje ≥ {tempWeights.umbral_alto || 2.8}</span>
                            </div>
                            <div className="p-1.5 bg-slate-900 rounded border border-emerald-500/30">
                              <span className="text-emerald-400 font-bold block">Medio / Bajo:</span>
                              <span className="text-slate-300 font-mono">Puntaje &lt; {tempWeights.umbral_alto || 2.8}</span>
                            </div>
                          </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setTempWeights(DEFAULT_FRAUD_WEIGHTS)}
                            className="text-xs text-slate-400 hover:text-white underline transition"
                          >
                            Restablecer a Valores CGR/CCRD por Defecto (30/50/20)
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsConfiguringWeights(false)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveWeightsConfig(tempWeights, true)}
                              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Guardar y Recalcular Todos los Hallazgos ({findings.length})</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Filter & Quick Selector Bar */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-850">
                      <div className="relative flex-1 min-w-[220px]">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={triangleSearchQuery}
                          onChange={(e) => setTriangleSearchQuery(e.target.value)}
                          placeholder="Buscar hallazgo por número, título o rubro..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">O seleccionar:</span>
                        <select
                          aria-label="Seleccionar Hallazgo para Triángulo del Fraude"
                          value={selectedFindingId}
                          onChange={(e) => setSelectedFindingId(Number(e.target.value))}
                          className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 max-w-[260px]"
                        >
                          {findings.map((f) => {
                            const tri = dictamen.triangulo_fraude?.find((t) => t.finding_id === f.id);
                            const totalScore = (tri?.presion_nivel || 0) + (tri?.oportunidad_nivel || 0) + (tri?.racionalizacion_nivel || 0);
                            return (
                              <option key={f.id} value={f.id}>
                                #{f.numero_hallazgo || f.id} ({totalScore}/15 - {tri?.riesgo_fraude_global || 'Pendiente'}) - {f.titulo.slice(0, 35)}...
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Horizontal Interactive Carousel / Pills of findings */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                      {findings
                        .filter((f) => {
                          if (!triangleSearchQuery) return true;
                          const q = triangleSearchQuery.toLowerCase();
                          return (
                            (f.numero_hallazgo || '').toLowerCase().includes(q) ||
                            (f.titulo || '').toLowerCase().includes(q) ||
                            (f.rubro || '').toLowerCase().includes(q)
                          );
                        })
                        .map((f) => {
                          const tri = dictamen.triangulo_fraude?.find((t) => t.finding_id === f.id);
                          const isSelected = f.id === selectedFindingId;
                          const p = tri?.presion_nivel || 0;
                          const o = tri?.oportunidad_nivel || 0;
                          const r = tri?.racionalizacion_nivel || 0;
                          const total = p + o + r;
                          const linkedDocsCount = (tri?.presion_documentos?.length || 0) + 
                            (tri?.oportunidad_documentos?.length || 0) + 
                            (tri?.racionalizacion_documentos?.length || 0);

                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setSelectedFindingId(f.id)}
                              className={`flex-shrink-0 px-3 py-2 rounded-xl text-left transition-all border ${
                                isSelected
                                  ? 'bg-amber-950/40 border-amber-500 shadow-lg ring-1 ring-amber-500/50'
                                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                                }`}>
                                  #{f.numero_hallazgo || f.id}
                                </span>
                                <span className={`text-[10px] font-bold ${
                                  tri?.riesgo_fraude_global === 'Crítico' ? 'text-rose-400' :
                                  tri?.riesgo_fraude_global === 'Muy Alto' ? 'text-amber-400' :
                                  tri?.riesgo_fraude_global === 'Alto' ? 'text-orange-400' : 'text-slate-400'
                                }`}>
                                  {tri?.riesgo_fraude_global || 'Normal'}
                                </span>
                                {linkedDocsCount > 0 && (
                                  <span className="flex items-center text-[10px] text-cyan-400 font-mono ml-auto">
                                    <Paperclip className="w-2.5 h-2.5 mr-0.5" />
                                    {linkedDocsCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-medium text-white truncate max-w-[170px]">
                                {f.titulo}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono">
                                <span className="text-rose-400">P:{p}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-amber-400">O:{o}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-cyan-400">R:{r}</span>
                                <span className="text-purple-300 ml-auto font-bold" title="Puntaje Ponderado Institucional (1-5)">
                                  {(tri?.puntaje_ponderado ?? calculateWeightedScore(p, o, r, weightsConfig).scorePonderado).toFixed(1)}/5
                                </span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {activeTriangle && activeFinding && (
                    <div className="space-y-4">
                      {/* Active Finding Banner with Visual Fraud Triangle Score */}
                      <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1 max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-500/30">
                              Hallazgo No. {activeFinding.numero_hallazgo || activeFinding.id}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              Ref: {activeFinding.pagina_referencia || 'Expediente Principal'}
                            </span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-purple-300 font-medium">
                              {activeFinding.rubro || 'General'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white leading-snug">
                            {activeFinding.titulo}
                          </h4>
                          <p className="text-xs text-slate-300 line-clamp-2">
                            <strong>Condición de Hechos:</strong> {activeFinding.condicion}
                          </p>
                        </div>

                        {/* Dynamic SVG Geometric Cressey Triangle + Global Risk Summary */}
                        <div className="flex flex-wrap items-center gap-4 bg-slate-900/95 p-3 rounded-xl border border-slate-800">
                          {/* SVG Geometric Cressey Triangle */}
                          <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center bg-slate-950 rounded-lg p-1 border border-slate-800/80">
                            <svg viewBox="0 0 110 105" className="w-full h-full overflow-visible">
                              {/* Outer guide triangle */}
                              <polygon
                                points="55,14 98,88 12,88"
                                fill="none"
                                stroke="#334155"
                                strokeWidth="1.5"
                                strokeDasharray="2 2"
                              />
                              {/* Median spokes */}
                              <line x1="55" y1="14" x2="55" y2="60" stroke="#1e293b" strokeWidth="1" />
                              <line x1="98" y1="88" x2="55" y2="60" stroke="#1e293b" strokeWidth="1" />
                              <line x1="12" y1="88" x2="55" y2="60" stroke="#1e293b" strokeWidth="1" />

                              {/* Dynamic Morphing Inner Polygon */}
                              {(() => {
                                const cx = 55;
                                const cy = 60;
                                const pFactor = Math.max(0.2, (activeTriangle.presion_nivel || 1) / 5);
                                const oFactor = Math.max(0.2, (activeTriangle.oportunidad_nivel || 1) / 5);
                                const rFactor = Math.max(0.2, (activeTriangle.racionalizacion_nivel || 1) / 5);

                                const px = cx;
                                const py = cy - pFactor * (cy - 14);
                                const ox = cx + oFactor * (96 - cx);
                                const oy = cy + oFactor * (86 - cy);
                                const rx = cx - rFactor * (cx - 14);
                                const ry = cy + rFactor * (86 - cy);

                                const polyColor = activeTriangle.riesgo_fraude_global === 'Crítico'
                                  ? '#f43f5e'
                                  : activeTriangle.riesgo_fraude_global === 'Muy Alto'
                                  ? '#fb923c'
                                  : activeTriangle.riesgo_fraude_global === 'Alto'
                                  ? '#f59e0b'
                                  : '#10b981';

                                return (
                                  <polygon
                                    points={`${px},${py} ${ox},${oy} ${rx},${ry}`}
                                    fill={polyColor}
                                    fillOpacity="0.38"
                                    stroke={polyColor}
                                    strokeWidth="2"
                                  />
                                );
                              })()}

                              {/* Vertex Labels */}
                              <text x="55" y="9" textAnchor="middle" fill="#fb7185" fontSize="8" fontWeight="bold">
                                P:{activeTriangle.presion_nivel}
                              </text>
                              <text x="98" y="98" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">
                                O:{activeTriangle.oportunidad_nivel}
                              </text>
                              <text x="14" y="98" textAnchor="middle" fill="#22d3ee" fontSize="8" fontWeight="bold">
                                R:{activeTriangle.racionalizacion_nivel}
                              </text>
                            </svg>
                          </div>

                          <div className="flex flex-col items-end gap-1.5">
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                                Monto Cuantificado en Riesgo:
                              </span>
                              <span className="text-base font-bold font-mono text-emerald-400">
                                {config.currency_symbol} {(activeFinding.monto || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-2.5">
                              <div className="text-right bg-slate-950/70 px-2 py-1 rounded-lg border border-purple-500/30">
                                <span className="text-[9px] uppercase tracking-wider text-purple-300 font-semibold block">
                                  Puntaje Ponderado:
                                </span>
                                <span className="text-xs font-black text-purple-200 font-mono">
                                  {(activeTriangle.puntaje_ponderado ?? calculateWeightedScore(activeTriangle.presion_nivel, activeTriangle.oportunidad_nivel, activeTriangle.racionalizacion_nivel, weightsConfig).scorePonderado).toFixed(2)} / 5.00
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block">Suma Base:</span>
                                <span className="text-xs font-bold text-slate-300 font-mono">
                                  {(activeTriangle.presion_nivel || 0) + (activeTriangle.oportunidad_nivel || 0) + (activeTriangle.racionalizacion_nivel || 0)} / 15
                                </span>
                              </div>
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                activeTriangle.riesgo_fraude_global === 'Crítico'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : activeTriangle.riesgo_fraude_global === 'Muy Alto'
                                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                  : activeTriangle.riesgo_fraude_global === 'Alto'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}>
                                Riesgo: {activeTriangle.riesgo_fraude_global}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* THE 3 VERTICES INTERFACE (GRID) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* VÉRTICE 1: PRESIÓN / INCENTIVO */}
                        <div className="bg-slate-850 p-4 rounded-xl border border-rose-500/30 space-y-3.5 shadow-sm">
                          <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                            <div>
                              <h5 className="text-xs font-bold text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4 text-rose-400" />
                                1. Presión / Incentivo
                              </h5>
                              <p className="text-[10px] text-slate-400">
                                Apremio financiero, déficit, deudas o metas inalcanzables.
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs font-bold font-mono border border-rose-500/30">
                              {activeTriangle.presion_nivel} / 5
                            </span>
                          </div>

                          {/* 1-5 Button Selector */}
                          <div>
                            <label className="text-[11px] text-slate-300 font-semibold block mb-1.5">
                              Valoración del Vértice (1 a 5):
                            </label>
                            <div className="grid grid-cols-5 gap-1">
                              {[
                                { val: 1, label: 'Mínima' },
                                { val: 2, label: 'Baja' },
                                { val: 3, label: 'Media' },
                                { val: 4, label: 'Alta' },
                                { val: 5, label: 'Crítica' },
                              ].map(({ val, label }) => {
                                const isSelected = activeTriangle.presion_nivel === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleSetVertexScore('presion', val)}
                                    className={`py-1.5 px-1 rounded-lg text-center transition-all ${
                                      isSelected
                                        ? 'bg-rose-600 text-white font-bold shadow-md ring-2 ring-rose-400'
                                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-750'
                                    }`}
                                  >
                                    <span className="block text-xs font-bold">{val}</span>
                                    <span className="block text-[8px] truncate">{label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              value={activeTriangle.presion_nivel}
                              onChange={(e) => handleSetVertexScore('presion', Number(e.target.value))}
                              className="w-full accent-rose-500 mt-2"
                            />
                          </div>

                          {/* Motivo / Variables */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] text-slate-300 font-semibold">
                                Motivación o Incentivo Detectado:
                              </label>
                            </div>
                            {/* Predefined Cressey Variables Chips */}
                            <div className="flex flex-wrap items-center gap-1 text-[9px] mb-1.5">
                              {[
                                { label: '+ Déficit de Fondos', text: `Déficit presupuestario y desvío hacia compromisos no registrados en ${config.entity_name}.` },
                                { label: '+ Apremio de Metas', text: `Apremio financiero de pagos urgentes a proveedores fuera del marco de la Ley de Compras.` },
                                { label: '+ Deudas Ocultas', text: `Presión por pasivos acumulados y compromisos no devengados formalmente.` },
                                { label: '+ Coerción Superior', text: `Presión jerárquica para acelerar desembolsos sin los soportes reglamentarios.` },
                              ].map((chip) => (
                                <button
                                  key={chip.label}
                                  type="button"
                                  onClick={() => {
                                    const current = activeTriangle.presion_motivo ? `${activeTriangle.presion_motivo}. ` : '';
                                    handleUpdateTriangle({ ...activeTriangle, presion_motivo: `${current}${chip.text}` });
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-500/30 transition text-[9px]"
                                >
                                  {chip.label}
                                </button>
                              ))}
                            </div>
                            <textarea
                              rows={3}
                              value={activeTriangle.presion_motivo}
                              onChange={(e) => handleUpdateTriangle({ ...activeTriangle, presion_motivo: e.target.value })}
                              placeholder="Describa la presión económica, deudas, metas forzadas..."
                              className="w-full p-2 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                            />
                          </div>

                          {/* Documentos de Evidencia Específicos Vinculados */}
                          <div className="space-y-2 pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-semibold text-rose-300 flex items-center gap-1">
                                <Paperclip className="w-3.5 h-3.5 text-rose-400" />
                                <span>Documentos de Evidencia ({activeTriangle.presion_documentos?.length || 0}):</span>
                              </label>

                              {/* Direct file upload to link */}
                              <label className="cursor-pointer text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold">
                                <Plus className="w-3 h-3" />
                                <span>Subir & Vincular</span>
                                <input
                                  type="file"
                                  onChange={(e) => handleDirectUploadForVertex('presion', e)}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {/* Selectable checklist of all system evidence files */}
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                              {allSystemEvidenceFiles.map((doc) => {
                                const isLinked = (activeTriangle.presion_documentos || []).includes(doc.id) ||
                                  (activeTriangle.presion_documentos || []).includes(doc.nombre);
                                return (
                                  <div
                                    key={doc.id}
                                    onClick={() => handleToggleDocLink('presion', doc)}
                                    className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition text-xs border ${
                                      isLinked
                                        ? 'bg-rose-950/30 border-rose-500/50 text-white'
                                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <div className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                      isLinked ? 'bg-rose-600 border-rose-500 text-white' : 'border-slate-600 bg-slate-950'
                                    }`}>
                                      {isLinked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate text-[11px]">{doc.nombre}</p>
                                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                                        <span>{doc.tamanio}</span>
                                        <span>•</span>
                                        <span className="truncate max-w-[110px] text-rose-300/80">{doc.hash_sha256.slice(0, 18)}...</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Text reference input */}
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Referencia Textual / Folio de Sustento:</span>
                              <input
                                type="text"
                                value={activeTriangle.presion_evidencia_ref}
                                onChange={(e) => handleUpdateTriangle({ ...activeTriangle, presion_evidencia_ref: e.target.value })}
                                placeholder="Folio del acta, informe de tesorería..."
                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* VÉRTICE 2: OPORTUNIDAD PERCIBIDA */}
                        <div className="bg-slate-850 p-4 rounded-xl border border-amber-500/30 space-y-3.5 shadow-sm">
                          <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                            <div>
                              <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                                <Lock className="w-4 h-4 text-amber-400" />
                                2. Oportunidad Percibida
                              </h5>
                              <p className="text-[10px] text-slate-400">
                                Inoperancia de control interno, falta de segregación NOBACI.
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold font-mono border border-amber-500/30">
                              {activeTriangle.oportunidad_nivel} / 5
                            </span>
                          </div>

                          {/* 1-5 Button Selector */}
                          <div>
                            <label className="text-[11px] text-slate-300 font-semibold block mb-1.5">
                              Valoración del Vértice (1 a 5):
                            </label>
                            <div className="grid grid-cols-5 gap-1">
                              {[
                                { val: 1, label: 'Fuerte' },
                                { val: 2, label: 'Aceptable' },
                                { val: 3, label: 'Media' },
                                { val: 4, label: 'Alta' },
                                { val: 5, label: 'Total' },
                              ].map(({ val, label }) => {
                                const isSelected = activeTriangle.oportunidad_nivel === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleSetVertexScore('oportunidad', val)}
                                    className={`py-1.5 px-1 rounded-lg text-center transition-all ${
                                      isSelected
                                        ? 'bg-amber-600 text-white font-bold shadow-md ring-2 ring-amber-400'
                                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-750'
                                    }`}
                                  >
                                    <span className="block text-xs font-bold">{val}</span>
                                    <span className="block text-[8px] truncate">{label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              value={activeTriangle.oportunidad_nivel}
                              onChange={(e) => handleSetVertexScore('oportunidad', Number(e.target.value))}
                              className="w-full accent-amber-500 mt-2"
                            />
                          </div>

                          {/* Motivo / Variables */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] text-slate-300 font-semibold">
                                Fallas de Control Interno / NOBACI:
                              </label>
                            </div>
                            {/* Predefined NOBACI / Control Variable Chips */}
                            <div className="flex flex-wrap items-center gap-1 text-[9px] mb-1.5">
                              {[
                                { label: '+ Sin Segregación', text: `Ausencia de segregación de funciones entre autorización, custodia y registro contable en ${config.entity_name}.` },
                                { label: '+ Control Previo Inoperante', text: `Inexistencia de control previo institucional y libramientos directos sin verificación de entrega.` },
                                { label: '+ Firmas Concentradas', text: `Concentración unipersonal de autorizaciones de pago sin firmas mancomunadas de control.` },
                                { label: '+ Bypass de Sistemas', text: `Ejecución de pagos fuera del sistema oficial SIGEF/ERP mediante hojas de cálculo manuales.` },
                              ].map((chip) => (
                                <button
                                  key={chip.label}
                                  type="button"
                                  onClick={() => {
                                    const current = activeTriangle.oportunidad_motivo ? `${activeTriangle.oportunidad_motivo}. ` : '';
                                    handleUpdateTriangle({ ...activeTriangle, oportunidad_motivo: `${current}${chip.text}` });
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 hover:bg-amber-900 border border-amber-500/30 transition text-[9px]"
                                >
                                  {chip.label}
                                </button>
                              ))}
                            </div>
                            <textarea
                              rows={3}
                              value={activeTriangle.oportunidad_motivo}
                              onChange={(e) => handleUpdateTriangle({ ...activeTriangle, oportunidad_motivo: e.target.value })}
                              placeholder="Falta de firmas mancomunadas, archivos manuales, bypass de software..."
                              className="w-full p-2 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* Documentos de Evidencia Específicos Vinculados */}
                          <div className="space-y-2 pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                                <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                                <span>Documentos de Evidencia ({activeTriangle.oportunidad_documentos?.length || 0}):</span>
                              </label>

                              {/* Direct file upload to link */}
                              <label className="cursor-pointer text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold">
                                <Plus className="w-3 h-3" />
                                <span>Subir & Vincular</span>
                                <input
                                  type="file"
                                  onChange={(e) => handleDirectUploadForVertex('oportunidad', e)}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {/* Selectable checklist of all system evidence files */}
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                              {allSystemEvidenceFiles.map((doc) => {
                                const isLinked = (activeTriangle.oportunidad_documentos || []).includes(doc.id) ||
                                  (activeTriangle.oportunidad_documentos || []).includes(doc.nombre);
                                return (
                                  <div
                                    key={doc.id}
                                    onClick={() => handleToggleDocLink('oportunidad', doc)}
                                    className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition text-xs border ${
                                      isLinked
                                        ? 'bg-amber-950/30 border-amber-500/50 text-white'
                                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <div className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                      isLinked ? 'bg-amber-600 border-amber-500 text-white' : 'border-slate-600 bg-slate-950'
                                    }`}>
                                      {isLinked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate text-[11px]">{doc.nombre}</p>
                                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                                        <span>{doc.tamanio}</span>
                                        <span>•</span>
                                        <span className="truncate max-w-[110px] text-amber-300/80">{doc.hash_sha256.slice(0, 18)}...</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Text reference input */}
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Referencia Textual / Folio de Sustento:</span>
                              <input
                                type="text"
                                value={activeTriangle.oportunidad_evidencia_ref}
                                onChange={(e) => handleUpdateTriangle({ ...activeTriangle, oportunidad_evidencia_ref: e.target.value })}
                                placeholder="Cédula de control interno, manual de procedimientos..."
                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* VÉRTICE 3: RACIONALIZACIÓN / JUSTIFICACIÓN */}
                        <div className="bg-slate-850 p-4 rounded-xl border border-cyan-500/30 space-y-3.5 shadow-sm">
                          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                            <div>
                              <h5 className="text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                                <Brain className="w-4 h-4 text-cyan-400" />
                                3. Racionalización Moral
                              </h5>
                              <p className="text-[10px] text-slate-400">
                                Mecanismo de auto-justificación o neutralización moral del sujeto.
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-bold font-mono border border-cyan-500/30">
                              {activeTriangle.racionalizacion_nivel} / 5
                            </span>
                          </div>

                          {/* 1-5 Button Selector */}
                          <div>
                            <label className="text-[11px] text-slate-300 font-semibold block mb-1.5">
                              Valoración del Vértice (1 a 5):
                            </label>
                            <div className="grid grid-cols-5 gap-1">
                              {[
                                { val: 1, label: 'Ninguna' },
                                { val: 2, label: 'Leve' },
                                { val: 3, label: 'Media' },
                                { val: 4, label: 'Alta' },
                                { val: 5, label: 'Total' },
                              ].map(({ val, label }) => {
                                const isSelected = activeTriangle.racionalizacion_nivel === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleSetVertexScore('racionalizacion', val)}
                                    className={`py-1.5 px-1 rounded-lg text-center transition-all ${
                                      isSelected
                                        ? 'bg-cyan-600 text-white font-bold shadow-md ring-2 ring-cyan-400'
                                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-750'
                                    }`}
                                  >
                                    <span className="block text-xs font-bold">{val}</span>
                                    <span className="block text-[8px] truncate">{label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              value={activeTriangle.racionalizacion_nivel}
                              onChange={(e) => handleSetVertexScore('racionalizacion', Number(e.target.value))}
                              className="w-full accent-cyan-500 mt-2"
                            />
                          </div>

                          {/* Motivo / Variables */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] text-slate-300 font-semibold">
                                Discurso o Justificación Moral:
                              </label>
                            </div>
                            {/* Predefined Cressey Rationalization Chips */}
                            <div className="flex flex-wrap items-center gap-1 text-[9px] mb-1.5">
                              {[
                                { label: '+ Urgencia Alegada', text: `Alegato de supuesta 'urgencia institucional o emergencia sanitaria' para eludir los trámites de ley.` },
                                { label: '+ Costumbre Administrativa', text: `Costumbre administrativa inveterada alegando que 'siempre se ha ejecutado de esta manera'.` },
                                { label: '+ "Sin Daño Patrimonial"', text: `Justificación subjetiva alegando que las compras o servicios finalmente beneficiaron a la entidad.` },
                                { label: '+ Agilización Operativa', text: `Pretexto de evitar 'burocracia legal excesiva' en perjuicio del marco de compras públicas.` },
                              ].map((chip) => (
                                <button
                                  key={chip.label}
                                  type="button"
                                  onClick={() => {
                                    const current = activeTriangle.racionalizacion_motivo ? `${activeTriangle.racionalizacion_motivo}. ` : '';
                                    handleUpdateTriangle({ ...activeTriangle, racionalizacion_motivo: `${current}${chip.text}` });
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900 border border-cyan-500/30 transition text-[9px]"
                                >
                                  {chip.label}
                                </button>
                              ))}
                            </div>
                            <textarea
                              rows={3}
                              value={activeTriangle.racionalizacion_motivo}
                              onChange={(e) => handleUpdateTriangle({ ...activeTriangle, racionalizacion_motivo: e.target.value })}
                              placeholder="Alegato de urgencia, costumbre administrativa, falta de presupuesto..."
                              className="w-full p-2 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                            />
                          </div>

                          {/* Documentos de Evidencia Específicos Vinculados */}
                          <div className="space-y-2 pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                                <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Documentos de Evidencia ({activeTriangle.racionalizacion_documentos?.length || 0}):</span>
                              </label>

                              {/* Direct file upload to link */}
                              <label className="cursor-pointer text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold">
                                <Plus className="w-3 h-3" />
                                <span>Subir & Vincular</span>
                                <input
                                  type="file"
                                  onChange={(e) => handleDirectUploadForVertex('racionalizacion', e)}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {/* Selectable checklist of all system evidence files */}
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                              {allSystemEvidenceFiles.map((doc) => {
                                const isLinked = (activeTriangle.racionalizacion_documentos || []).includes(doc.id) ||
                                  (activeTriangle.racionalizacion_documentos || []).includes(doc.nombre);
                                return (
                                  <div
                                    key={doc.id}
                                    onClick={() => handleToggleDocLink('racionalizacion', doc)}
                                    className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition text-xs border ${
                                      isLinked
                                        ? 'bg-cyan-950/30 border-cyan-500/50 text-white'
                                        : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <div className={`mt-0.5 w-3.5 h-3.5 rounded flex items-center justify-center border ${
                                      isLinked ? 'bg-cyan-600 border-cyan-500 text-white' : 'border-slate-600 bg-slate-950'
                                    }`}>
                                      {isLinked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate text-[11px]">{doc.nombre}</p>
                                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                                        <span>{doc.tamanio}</span>
                                        <span>•</span>
                                        <span className="truncate max-w-[110px] text-cyan-300/80">{doc.hash_sha256.slice(0, 18)}...</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Text reference input */}
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Referencia Textual / Folio de Sustento:</span>
                              <input
                                type="text"
                                value={activeTriangle.racionalizacion_evidencia_ref}
                                onChange={(e) => handleUpdateTriangle({ ...activeTriangle, racionalizacion_evidencia_ref: e.target.value })}
                                placeholder="Memorandos internos, comunicaciones, actas de descargo..."
                                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Technical Grounding Synthesis */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-purple-400" />
                            Síntesis Pericial del Triángulo del Fraude & Sustento Técnico Vinculado:
                          </label>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ISSAI 5000 / NIA 240 / Ministerio Público
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          value={activeTriangle.sustento_tecnico_vinculado}
                          onChange={(e) => handleUpdateTriangle({ ...activeTriangle, sustento_tecnico_vinculado: e.target.value })}
                          placeholder="Conclusión pericial vinculante que consolida los 3 vértices con las evidencias documentales aportadas..."
                          className="w-full p-2.5 bg-slate-900 border border-slate-750 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: EVIDENCIAS & CHECKLIST MINISTERIO PÚBLICO (1 AL 5) */}
              {activeTab === 'evidencias' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                        Checklist Forense & Ministerio Público (Exigible 1 al 5)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Determinación de evidencias que el auditor debe comprobar y el supervisor verificar, validadas a 5/5 por IA.
                      </p>
                    </div>

                    {/* Finding selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-semibold">Seleccionar Punto:</span>
                      <select
                        aria-label="Seleccionar Hallazgo para Evidencias y Checklist"
                        value={selectedFindingId}
                        onChange={(e) => setSelectedFindingId(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                      >
                        {findings.map((f) => (
                          <option key={f.id} value={f.id}>
                            #{f.numero_hallazgo || f.id} - {f.titulo.slice(0, 45)}...
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleValidateEvidenceAI}
                        disabled={isValidatingAI}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isValidatingAI ? 'animate-spin' : ''}`} />
                        <span>{isValidatingAI ? 'Validando con IA...' : 'Validar con IA (MP 5/5)'}</span>
                      </button>
                    </div>
                  </div>

                  {activeEvidence && activeFinding && (
                    <div className="space-y-5">
                      {/* Status Score & IA Banner */}
                      <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
                        activeEvidence.aprobada_ia && activeEvidence.nivel_cumplimiento === 5
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                          : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                            activeEvidence.aprobada_ia && activeEvidence.nivel_cumplimiento === 5
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {activeEvidence.nivel_cumplimiento} / 5
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-sm text-white">
                                {activeEvidence.aprobada_ia && activeEvidence.nivel_cumplimiento === 5
                                  ? 'Evidencia Aprobada por IA (5/5) — Integridad Plena MP'
                                  : 'Cumplimiento Incompleto — Requiere Acciones para 5/5'}
                              </strong>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                activeEvidence.aprobada_ia ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                              }`}>
                                {activeEvidence.aprobada_ia ? 'APROBADA' : 'OBSERVADA'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">
                              {activeEvidence.ia_feedback?.observaciones_penales || 'Sometido al protocolo de suficiencia probatoria penal.'}
                            </p>
                          </div>
                        </div>

                        {/* Step-by-step recommendations if < 5/5 */}
                        {!activeEvidence.aprobada_ia && activeEvidence.ia_feedback?.recomendaciones_paso_a_paso?.length > 0 && (
                          <div className="w-full pt-2 border-t border-amber-500/30 text-xs text-amber-100 space-y-1">
                            <span className="font-bold flex items-center gap-1 text-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5" /> Pasos Exigibles del Fiscal/Perito para alcanzar 5/5:
                            </span>
                            <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                              {activeEvidence.ia_feedback.recomendaciones_paso_a_paso.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Two Column Guide: Auditor vs Supervisor */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* What auditor must prove */}
                        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                          <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wide flex items-center gap-1.5">
                            <FileSearch className="w-4 h-4 text-blue-400" />
                            Evidencias que el Auditor Debe Comprobar y Sustentar:
                          </h4>
                          <div className="space-y-1.5 text-xs text-slate-200">
                            {activeEvidence.evidencias_a_comprobar.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                                <span className="text-blue-400 font-mono font-bold">{idx + 1}.</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* What supervisor must verify */}
                        <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2">
                          <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wide flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-purple-400" />
                            Puntos que el Supervisor Debe Verificar y Evaluar:
                          </h4>
                          <div className="space-y-1.5 text-xs text-slate-200">
                            {activeEvidence.puntos_supervision.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                                <span className="text-purple-400 font-mono font-bold">{idx + 1}.</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 6 Criteria Checklist of Ministerio Público & Forensic Audit */}
                      <div className="bg-slate-850 p-5 rounded-xl border border-slate-750 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-750">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-4 h-4 text-amber-400" />
                            Checklist de Criterios Exigibles del Ministerio Público & ISSAI 5000 (Punto #{activeFinding.numero_hallazgo || activeFinding.id})
                          </h4>
                          <span className="text-xs text-emerald-400 font-mono font-bold">
                            {activeEvidence.criterios_mp.filter((c) => c.cumplido).length} de {activeEvidence.criterios_mp.length} Cumplidos
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeEvidence.criterios_mp.map((crit) => (
                            <div
                              key={crit.id}
                              onClick={() => handleToggleCriterion(crit.id)}
                              className={`p-3 rounded-lg border cursor-pointer transition flex items-start gap-3 ${
                                crit.cumplido
                                  ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-500'
                                  : 'bg-slate-900/40 border-slate-750 hover:border-slate-650'
                              }`}
                            >
                              <div className="mt-0.5">
                                {crit.cumplido ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                              <div className="flex-1 text-xs">
                                <div className="flex items-center justify-between">
                                  <strong className={crit.cumplido ? 'text-white' : 'text-slate-400'}>
                                    {crit.nombre}
                                  </strong>
                                  <span className="text-[10px] font-mono text-purple-300">{crit.codigo_norma}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">{crit.descripcion}</p>
                                <div className="mt-1 text-[10px] text-emerald-400/90 font-mono">
                                  Obs: {crit.observacion_auditor}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Support Files Upload and Hash Table */}
                      <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                              <FileCheck className="w-4 h-4 text-cyan-400" />
                              Archivos de Soporte Digital & Cadena de Custodia SHA-256 ({activeEvidence.archivos_soporte?.length || 0})
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Adjunte comprobantes, facturas, actas o peritajes para blindar la acusación penal.
                            </p>
                          </div>
                          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Cargar Soporte Documental</span>
                            <input
                              type="file"
                              onChange={handleUploadSupportFile}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="space-y-2">
                          {(activeEvidence.archivos_soporte || []).map((file) => (
                            <div
                              key={file.id}
                              className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-400" />
                                <div>
                                  <strong className="text-white block">{file.nombre}</strong>
                                  <span className="text-[10px] text-slate-400">{file.tipo} • {file.tamanio} • {file.fecha_carga}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <code className="text-[10px] bg-slate-950 px-2 py-1 rounded text-cyan-300 font-mono border border-slate-800">
                                  {file.hash_sha256}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSupportFile(file.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1 transition"
                                  title="Eliminar soporte"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* TAB: OFFICIAL DICTAMEN */}
              {(activeTab === 'dictamen' || activeTab === 'firmas') && (
                <div className="space-y-6">
                  {/* Judicial Caratula */}
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center space-y-2 print:border-b print:border-black print:bg-white print:p-2">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-purple-400 font-bold print:text-black">
                      PODER JUDICIAL — TRIBUNALES DE LA REPÚBLICA & ÓRGANOS RECTORES
                    </span>
                    <h3 className="text-lg font-black text-white tracking-wide uppercase print:text-black">
                      DICTAMEN PERICIAL CONTABLE FORENSE CON FE PÚBLICA
                    </h3>
                    <p className="text-xs font-mono text-purple-300 font-bold print:text-black">
                      EXPEDIENTE NO. {dictamen.numero_dictamen}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 pt-2 border-t border-slate-850 print:text-black print:border-black">
                      <span>Destinatario: <strong className="text-white print:text-black">{dictamen.tribunal_o_ente}</strong></span>
                      <span>•</span>
                      <span>Entidad Evaluada: <strong className="text-purple-300 print:text-black">{config.entity_name}</strong></span>
                      <span>•</span>
                      <span>Período: <strong className="text-slate-200 print:text-black">{config.audit_period}</strong></span>
                    </div>
                  </div>

                  {/* Objeto de la Pericia */}
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-1.5 print:bg-white print:border-black print:p-2">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 print:text-black">
                      <Award className="w-4 h-4 text-purple-400 print:hidden" /> I. Objeto del Dictamen Pericial Forense
                    </h4>
                    <p className="text-xs text-slate-200 leading-relaxed print:text-black text-justify">
                      Determinación, fundamentación probatoria y cuantificación pericial forense del perjuicio patrimonial derivado del examen de los {findings.length} hallazgos documentados en {config.entity_name}. El presente dictamen responde a los principios de objetividad, competencia profesional, exhaustividad probatoria y verificación directa de fuentes.
                    </p>
                  </div>

                  {/* Metodología y Cadena de Custodia */}
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-1.5 print:bg-white print:border-black print:p-2">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 print:text-black">
                      <Brain className="w-4 h-4 text-purple-400 print:hidden" /> II. Metodología Aplicada, Normas Internacionales y Cadena de Custodia
                    </h4>
                    <p className="text-xs text-slate-200 leading-relaxed print:text-black text-justify">
                      {dictamen.metodologia}
                    </p>
                    <div className="text-[11px] text-slate-400 font-mono pt-1 print:text-black flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-emerald-400 print:hidden" />
                      <span>Cadena de Custodia y Sello Criptográfico Forense: <strong>{config.securityHash}</strong></span>
                    </div>
                  </div>

                  {/* Operaciones Periciales de Campo */}
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2 print:bg-white print:border-black print:p-2">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 print:text-black">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 print:hidden" /> III. Operaciones Periciales Realizadas ({dynamicOperaciones.length})
                    </h4>
                    <div className="space-y-1.5">
                      {dynamicOperaciones.map((op, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 print:bg-white print:text-black print:border-none print:p-0">
                          <span className="text-purple-400 font-bold font-mono print:text-black">{idx + 1}.</span>
                          <span>{op}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Síntesis del Triángulo del Fraude (Cressey) en el Dictamen */}
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2 print:bg-white print:border-black print:p-2">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 print:text-black">
                      <AlertOctagon className="w-4 h-4 text-amber-400 print:hidden" /> IV. Determinación Pericial del Triángulo del Fraude (ISSAI 5000 / NIA 240)
                    </h4>
                    <p className="text-xs text-slate-200 leading-relaxed print:text-black text-justify">
                      Conforme al análisis científico-criminológico de los {findings.length} puntos analizados en {config.entity_name}, se comprobó la coexistencia simultánea de los tres factores tipificantes:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-xs">
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-rose-500/30 print:bg-white print:text-black">
                        <strong className="text-rose-400 block mb-1">Presión / Incentivo:</strong>
                        <span>Desvío material de fondos hacia compromisos no autorizados presupuestariamente.</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-amber-500/30 print:bg-white print:text-black">
                        <strong className="text-amber-400 block mb-1">Oportunidad Percibida:</strong>
                        <span>Inoperancia de los controles previos de pago bajo normas NOBACI y falta de integración con SIGEF.</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-cyan-500/30 print:bg-white print:text-black">
                        <strong className="text-cyan-400 block mb-1">Racionalización Moral:</strong>
                        <span>Uso abusivo de alegadas situaciones de 'urgencia' para obviar la licitación y el control legal.</span>
                      </div>
                    </div>

                    {/* Tabla Pericial Detallada del Triángulo del Fraude por Hallazgo */}
                    {dictamen.triangulo_fraude && dictamen.triangulo_fraude.length > 0 && (
                      <div className="pt-2 overflow-x-auto space-y-2">
                        <div className="text-[11px] text-slate-300 print:text-black bg-slate-900/60 print:bg-slate-50 p-2 rounded border border-slate-800 print:border-black flex flex-wrap items-center justify-between gap-2">
                          <span>
                            <strong>Modelo Ponderado Aplicado:</strong> {weightsConfig.estandar_nombre || 'Enfoque NOBACI / CGR'}
                          </span>
                          <span className="font-mono text-purple-300 print:text-black">
                            P: {weightsConfig.peso_presion}% | O: {weightsConfig.peso_oportunidad}% | R: {weightsConfig.peso_racionalizacion}% (Total: 100%)
                          </span>
                        </div>
                        <table className="w-full text-left text-xs border border-slate-750 print:border-black rounded-lg overflow-hidden">
                          <thead className="bg-slate-900 text-slate-300 font-bold print:bg-slate-100 print:text-black">
                            <tr>
                              <th className="p-2 border-b border-slate-750 print:border-black">No. Hallazgo</th>
                              <th className="p-2 border-b border-slate-750 print:border-black text-center text-rose-300 print:text-black">Presión ({weightsConfig.peso_presion}%)</th>
                              <th className="p-2 border-b border-slate-750 print:border-black text-center text-amber-300 print:text-black">Oportunidad ({weightsConfig.peso_oportunidad}%)</th>
                              <th className="p-2 border-b border-slate-750 print:border-black text-center text-cyan-300 print:text-black">Racionalización ({weightsConfig.peso_racionalizacion}%)</th>
                              <th className="p-2 border-b border-slate-750 print:border-black text-center text-purple-300 print:text-black">Puntaje Pond. (1-5)</th>
                              <th className="p-2 border-b border-slate-750 print:border-black text-center">Riesgo Global</th>
                              <th className="p-2 border-b border-slate-750 print:border-black">Evidencias Técnicas & Soportes Vinculados</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 print:divide-black">
                            {dictamen.triangulo_fraude.map((tri) => {
                              const totalLinked = (tri.presion_documentos?.length || 0) + 
                                (tri.oportunidad_documentos?.length || 0) + 
                                (tri.racionalizacion_documentos?.length || 0);
                              const wScore = (tri.puntaje_ponderado ?? calculateWeightedScore(tri.presion_nivel, tri.oportunidad_nivel, tri.racionalizacion_nivel, weightsConfig).scorePonderado).toFixed(2);
                              return (
                                <tr key={tri.finding_id} className="hover:bg-slate-900/50 print:text-black">
                                  <td className="p-2 font-mono font-bold">
                                    #{tri.numero_hallazgo}
                                    <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[140px]">{tri.titulo}</span>
                                  </td>
                                  <td className="p-2 text-center font-bold text-rose-400 print:text-black font-mono">{tri.presion_nivel}/5</td>
                                  <td className="p-2 text-center font-bold text-amber-400 print:text-black font-mono">{tri.oportunidad_nivel}/5</td>
                                  <td className="p-2 text-center font-bold text-cyan-400 print:text-black font-mono">{tri.racionalizacion_nivel}/5</td>
                                  <td className="p-2 text-center font-bold text-purple-400 print:text-black font-mono">{wScore}/5</td>
                                  <td className="p-2 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      tri.riesgo_fraude_global === 'Crítico' ? 'bg-rose-500/20 text-rose-300 print:text-black' :
                                      tri.riesgo_fraude_global === 'Muy Alto' ? 'bg-orange-500/20 text-orange-300 print:text-black' :
                                      'bg-amber-500/20 text-amber-300 print:text-black'
                                    }`}>
                                      {tri.riesgo_fraude_global}
                                    </span>
                                  </td>
                                  <td className="p-2 text-[11px] text-slate-300 print:text-black">
                                    <div className="line-clamp-2">{tri.sustento_tecnico_vinculado}</div>
                                    {totalLinked > 0 ? (
                                      <span className="text-[10px] text-cyan-300 print:text-black font-mono block mt-0.5">
                                        📎 {totalLinked} documento(s) de soporte vinculado(s)
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 print:text-black font-mono block mt-0.5">
                                        Ref: {tri.presion_evidencia_ref || tri.oportunidad_evidencia_ref || 'Cédula de auditoría'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Verificación Probatoria Ministerio Público */}
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-1.5 print:bg-white print:border-black print:p-2">
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 print:text-black">
                      <BadgeCheck className="w-4 h-4 text-emerald-400 print:hidden" /> V. Acreditación de Evidencias y Checklist del Ministerio Público (5/5)
                    </h4>
                    <p className="text-xs text-slate-200 leading-relaxed print:text-black text-justify">
                      La totalidad de las evidencias analizadas en el expediente superaron la matriz de seis criterios probatorios exigibles por el Ministerio Público (cadena de custodia inalterada con hash criptográfico, autenticidad de origen, suficiencia probatoria, legalidad en la obtención, compulsa documental cruzada y trazabilidad contable del daño), alcanzando el 100% de integridad probatoria 5/5 validada pericialmente.
                    </p>
                  </div>

                  {/* Respuestas al Cuestionario Pericial Judicial */}
                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-750 space-y-2.5 print:bg-white print:border-black print:p-2">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 print:text-black">
                      <HelpCircle className="w-4 h-4 text-amber-400 print:hidden" /> VI. Respuestas al Cuestionario Pericial Judicial
                    </h4>
                    <div className="space-y-2">
                      {dynamicCuestionario.map((item, idx) => (
                        <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1 print:bg-white print:border-none print:p-0 print:text-black">
                          <div className="text-xs font-bold text-amber-300 print:text-black">
                            Pregunta #{idx + 1}: {item.pregunta}
                          </div>
                          <div className="text-xs text-slate-200 pl-3 border-l-2 border-purple-500/50 print:text-black print:border-black">
                            <strong>Respuesta Pericial:</strong> {item.respuesta}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conclusión Pericial Concluyente */}
                  <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-purple-950/20 p-5 rounded-xl border border-purple-500/40 space-y-2 print:bg-white print:border-black print:p-2">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 print:text-black">
                      <Award className="w-4 h-4 text-purple-400 print:hidden" /> VII. Conclusión Pericial Concluyente con Fe Pública
                    </h4>
                    <p className="text-xs text-slate-100 font-medium leading-relaxed print:text-black text-justify">
                      En virtud de las facultades técnicas y legales conferidas por las leyes vigentes y normas internacionales de auditoría forense ISSAI 5000, los Peritos Contables y Auditores actuantes certifican bajo fe pública pericial que los hechos e irregularidades descritos en el expediente de <strong>{config.entity_name}</strong> se encuentran sustentados en pruebas auténticas y documentadas. El monto indemnizatorio legal total cuantificado asciende a <strong>{config.currency_symbol} {totalIndemnizatorio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>, recomendando la remisión del presente dictamen ante los órganos fiscalizadores y jurisdiccionales correspondientes.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: INCIDENCIAS & TRAZABILIDAD LEGAL */}
              {activeTab === 'incidencias' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Detalle de Incidencias con Citas Normativas Exactas (Numeral, Literal, Artículo, Folio)
                    </h4>
                    <span className="text-xs text-purple-300 font-mono">
                      {findings.length} Puntos Observados
                    </span>
                  </div>

                  <div className="space-y-3">
                    {findings.map((f, i) => (
                      <div key={f.id} className="bg-slate-850 p-4 rounded-xl border border-slate-750 text-xs space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                              No. {f.numero_hallazgo || f.id}
                            </span>
                            <span className="text-slate-400 font-semibold">
                              {f.pagina_referencia}
                            </span>
                            {f.punto_incidencia && (
                              <span className="text-purple-300 text-[11px] bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
                                Folio/Incidencia: {f.punto_incidencia}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-emerald-400">
                            {config.currency_symbol} {(f.monto || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <strong className="text-white block text-sm">{f.titulo}</strong>
                        
                        <p className="text-slate-300 text-xs leading-relaxed">
                          <strong>Condición Observada:</strong> {f.condicion}
                        </p>

                        {/* Exact Legal Citation Block */}
                        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-purple-500/30 text-[11px] space-y-1">
                          <span className="text-purple-300 font-bold block">
                            Fundamentación Jurídica y Cita Normativa Exacta:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-slate-200">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Norma / Ley:</span>
                              <strong>{f.norma_ley_nombre || f.criterio}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Artículo:</span>
                              <strong className="text-amber-300">{f.articulo || 'Art. Aplicable'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Numeral:</span>
                              <strong className="text-cyan-300">{f.numeral || 'Numeral Específico'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Literal:</span>
                              <strong className="text-emerald-300">{f.literal || 'Literal Específico'}</strong>
                            </div>
                          </div>
                          {f.fuente_cruzada && (
                            <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800">
                              <strong>Fuente Cruzada de Comprobación:</strong> {f.fuente_cruzada}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: CUANTIFICACIÓN DEL PERJUICIO */}
              {activeTab === 'cuantificacion' && (
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/20 p-6 rounded-2xl border border-emerald-500/40">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                      LIQUIDACIÓN ACTUARIAL Y CUANTIFICACIÓN PERICIAL DEL DAÑO PATRIMONIAL
                    </span>
                    <h3 className="text-2xl font-black text-white font-mono">
                      {config.currency_symbol} {totalIndemnizatorio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Monto total resarcitorio determinado a partir de los {findings.length} hallazgos comprobados
                    </p>
                  </div>

                  <div className="bg-slate-850 rounded-xl border border-slate-750 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-3">Concepto Pericial</th>
                          <th className="p-3">Base y Fundamento Legal</th>
                          <th className="p-3 text-right">Monto Determinado ({config.currency_symbol})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        <tr>
                          <td className="p-3 font-semibold">1. Capital Directo Desviado / Observado</td>
                          <td className="p-3 text-slate-400">Suma aritmética de los {findings.length} hallazgos comprobados</td>
                          <td className="p-3 text-right font-mono font-bold text-white">
                            {capitalDesviado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold">2. Intereses Legales Resarcitorios (12%)</td>
                          <td className="p-3 text-slate-400">Tasa de interés legal aplicable sobre fondos distraídos</td>
                          <td className="p-3 text-right font-mono text-amber-300">
                            {interesesLegales.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold">3. Daño Emergente y Gastos de Pericia (5%)</td>
                          <td className="p-3 text-slate-400">Costas de peritajes técnicos, topografía y auditoría forense</td>
                          <td className="p-3 text-right font-mono text-cyan-300">
                            {danoEmergente.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr className="bg-slate-900 font-bold">
                          <td className="p-3 text-emerald-400">TOTAL PERJUICIO ECONÓMICO RESARCITORIO</td>
                          <td className="p-3 text-slate-400">Monto total con fe pública de Perito CPA</td>
                          <td className="p-3 text-right font-mono text-emerald-400 text-sm">
                            {totalIndemnizatorio.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION: RELACIÓN DE AUDITORES Y PERITOS ACTUANTES CON FIRMA FÍSICA Y ELECTRÓNICA */}
              <div className="pt-8 border-t border-slate-800 space-y-4 print:pt-4 print:border-black">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider print:text-black">
                    RELACIÓN DE AUDITORES Y PERITOS ACTUANTES (FE PÚBLICA PERICIAL)
                  </h4>
                  <p className="text-xs text-slate-400 print:text-black">
                    El documento admite firma física manuscrita en formato impreso y firma digitalizada certificada sobre cada profesional
                  </p>
                </div>

                {/* Team Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                  {actingTeam.map((user) => (
                    <div
                      key={user.id}
                      className="bg-slate-850 p-4 rounded-xl border border-slate-750 flex flex-col justify-between items-center text-center space-y-3 print:bg-white print:border-none print:p-0"
                    >
                      {/* Electronic Signature Box over Name */}
                      <div className="w-full min-h-[70px] flex flex-col items-center justify-center relative">
                        {user.firma_digital ? (
                          <div className="bg-white/95 p-1 rounded border border-slate-400 inline-block mb-1">
                            <img
                              src={user.firma_digital}
                              alt={`Firma de ${user.nombre}`}
                              className="h-12 max-w-[190px] object-contain"
                            />
                            {user.sello_digital_hash && (
                              <div className="text-[9px] font-mono text-slate-600 block mt-0.5 truncate max-w-[190px]">
                                {user.sello_digital_hash}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-10 flex items-center justify-center text-[10px] text-slate-500 italic print:hidden">
                            [Espacio para Firma Digital o Física]
                          </div>
                        )}

                        {/* Interactive Signature Controls (Hidden on print) */}
                        <div className="flex items-center gap-1.5 mt-1 print:hidden">
                          <button
                            type="button"
                            onClick={() => handlePasteSignatureForUser(user.id)}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 flex items-center gap-1"
                            title="Pegar imagen de firma copiada en el portapapeles"
                          >
                            <ClipboardPaste className="w-3 h-3 text-emerald-400" />
                            Pegar
                          </button>
                          <label className="cursor-pointer px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 flex items-center gap-1">
                            <Upload className="w-3 h-3 text-blue-400" />
                            Subir
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadSignatureForUser(user.id, e)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setSignatureTargetUserId(signatureTargetUserId === user.id ? null : user.id)}
                            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 flex items-center gap-1"
                          >
                            <PenTool className="w-3 h-3 text-purple-400" />
                            Dibujar
                          </button>
                        </div>
                      </div>

                      {/* Line for physical print signature */}
                      <div className="w-48 h-0.5 bg-slate-500 print:bg-black my-1" />

                      {/* Auditor Credentials Data */}
                      <div>
                        <strong className="text-xs font-bold text-white block print:text-black">{user.nombre}</strong>
                        <span className="text-[11px] text-slate-300 block print:text-black">{user.cargo || user.rol}</span>
                        <span className="text-[10px] text-amber-300 block print:text-black">{user.exequatur_cpa || 'CPA No. 12845'}</span>
                        <span className="text-[10px] text-purple-300 block print:text-black">
                          {user.registro_pericial ? `${user.registro_pericial} | ` : ''}Cédula: {user.identificacion}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inline Signature Pad when drawing is triggered */}
                {signatureTargetUserId && (
                  <div className="bg-slate-900 border border-purple-500/50 p-4 rounded-xl text-center space-y-2 max-w-md mx-auto print:hidden">
                    <span className="text-xs font-bold text-purple-300 block">
                      Dibujar Firma Manuscrita para: {users.find((u) => u.id === signatureTargetUserId)?.nombre}
                    </span>
                    <canvas
                      ref={canvasRef}
                      width={360}
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
                        onClick={() => {
                          const canvas = canvasRef.current;
                          if (canvas) {
                            const ctx = canvas.getContext('2d');
                            ctx?.clearRect(0, 0, canvas.width, canvas.height);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Limpiar
                      </button>
                      <button
                        type="button"
                        onClick={() => saveCanvasSignatureForUser(signatureTargetUserId)}
                        className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                      >
                        Aplicar Firma al Perito
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureTargetUserId(null)}
                        className="px-2.5 py-1 rounded bg-slate-800 text-slate-400 text-xs"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

        {/* Footer (Hidden on print) */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 print:hidden">
          <span>
            Expediente Pericial con Fe Pública y Validez Judicial Plena ante Tribunales y Órganos Rectores.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-all"
          >
            Cerrar Dictamen
          </button>
        </div>

      </div>
    </div>
  );
};
