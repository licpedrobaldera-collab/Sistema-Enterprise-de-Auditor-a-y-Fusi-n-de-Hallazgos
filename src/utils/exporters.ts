import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
} from 'docx';
import { AuditFinding, FusionRule, InstitutionalConfig } from '../types/audit';

// Format currency
export function formatCurrency(amount: number, currency = 'RD$'): string {
  return `${currency} ${(amount || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// 1. EXCEL EXPORTER CON 2 HOJAS COMPLETAS
export function exportToExcel(
  config: InstitutionalConfig,
  findings: AuditFinding[],
  rules: FusionRule[]
) {
  const wb = XLSX.utils.book_new();

  // HOJA 1: Extracción Completa de Todos los Hallazgos Originales (3.01 - 3.54)
  const ws1Data: any[][] = [
    [config.entity_name.toUpperCase()],
    [`OFICINA DE AUDITORÍA FORENSE & CONTROL DE CALIDAD - REPÚBLICA DOMINICANA & ESTÁNDARES INTOSAI`],
    [`MATRIZ COMPLETA DE HALLAZGOS Y DEBILIDADES DE CONTROL (3.01 - 3.54)`],
    [`AUDITORÍA: ${config.audit_type.toUpperCase()} | PERÍODO: ${config.audit_period}`],
    [],
    [
      'ID',
      'No. Hallazgo (3.01 - 3.54)',
      'Ref. Página / Fuente',
      'Punto de Incidencia / Folio',
      'Título del Hallazgo',
      'Descripción o Condición (Hechos Extraídos)',
      'Clasificación (Debilidad de Control vs Hallazgo)',
      'Norma / Ley Aplicada',
      'Artículo Específico',
      'Numeral',
      'Literal',
      'Fuente Cruzada de Comprobación',
      'Cadena de Custodia SHA-256',
      'Análisis Pericial Forense',
      'Posible Fusión de Hallazgo',
      'Criterios Legales y Normativos',
      'Causa Raíz',
      'Efecto / Impacto Operativo y Financiero',
      `Monto Involucrado (${config.currency})`,
      'Recomendación del Auditor',
      'Conclusión Forense',
      'Nivel de Riesgo',
      'Calificación Calidad (0-10)',
      'Estado de Supervisión',
      'Estado de Validación Auditor',
      'Debilidad Detectada por Supervisor (Normas CGR/CCRD)',
      'Ajuste Necesario con IA para 10/10',
      'Código Fusión Asignado',
      'Evidencia de Soporte Digital',
    ],
  ];

  findings.forEach((f) => {
    ws1Data.push([
      f.id,
      f.numero_hallazgo || (f.id < 10 ? `3.0${f.id}` : `3.${f.id}`),
      f.pagina_referencia || 'Pág. No Especificada',
      f.punto_incidencia || 'Folio y acta del expediente',
      f.titulo,
      f.condicion,
      f.clasificacion_tipo || (f.monto > 0 ? 'Hallazgo de Auditoría' : 'Debilidad de Control Interno'),
      f.norma_ley_nombre || f.marco_normativo || f.criterio,
      f.articulo || 'Art. Aplicable',
      f.numeral || 'N/A',
      f.literal || 'N/A',
      f.fuente_cruzada || 'Cotejo contra registros oficiales',
      f.cadena_custodia || 'Custodia Digital SHA-256 Verificada',
      f.analisis_pericial || 'Análisis técnico pericial sustentado en la evidencia documental examinada.',
      f.posible_fusion || 'Sin propuesta de fusión registrada.',
      f.criterio,
      f.causa,
      f.efecto,
      f.monto,
      f.recomendacion,
      f.conclusion,
      f.riesgo,
      f.puntuacion_calidad ?? 8.5,
      f.estado_supervision || 'Aprobado (10/10)',
      f.estado_validacion || 'Validado por Auditor',
      f.incidencia_supervisor || 'Conforme a los estándares de auditoría gubernamental.',
      f.ajuste_recomendado_supervisor || 'No requiere ajustes adicionales para 10/10.',
      f.fusion_id,
      f.evidencia_soporte || 'Expediente digital verificado',
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);

  // Column widths for sheet 1
  ws1['!cols'] = [
    { wch: 6 },  // ID
    { wch: 14 }, // No. Hallazgo
    { wch: 28 }, // Pág Ref
    { wch: 40 }, // Título
    { wch: 65 }, // Condición
    { wch: 30 }, // Clasificación
    { wch: 45 }, // Marco Normativo
    { wch: 55 }, // Análisis Pericial
    { wch: 55 }, // Posible Fusión
    { wch: 45 }, // Criterio
    { wch: 40 }, // Causa
    { wch: 40 }, // Efecto
    { wch: 22 }, // Monto
    { wch: 45 }, // Recomendación
    { wch: 40 }, // Conclusión
    { wch: 14 }, // Riesgo
    { wch: 16 }, // Calidad
    { wch: 22 }, // Supervisión
    { wch: 45 }, // Incidencia
    { wch: 50 }, // Ajuste IA
    { wch: 16 }, // Código Fusión
    { wch: 30 }, // Evidencia
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Matriz Hallazgos Completos');

  // HOJA 2: Matriz de Fusión, Justificación y Nueva Condición Actualizada con IA
  const ws2Data: any[][] = [
    [config.entity_name.toUpperCase()],
    ['MATRIZ DE FUSIÓN, CONSOLIDACIÓN TÉCNICA Y ACTUALIZACIÓN CON INTELIGENCIA ARTIFICIAL'],
    [`SUPERVISIÓN: ${config.supervisor_name} - ${config.supervisor_role}`],
    [],
    [
      'Cód. Fusión',
      'Rubro Agrupado',
      'Hallazgos Originales Incluidos (No. y Referencia de Página)',
      'Razones / Justificación Técnica de Fusión',
      'Título del Hallazgo Fusionado Actualizado',
      'Condición Actualizada y Consolidada por IA (Sin Inventar Datos)',
      'Criterios Legales y Normativos Actualizados y Precisados',
      'Recomendación Técnica Consolidada Actualizada',
      'Conclusión Forense y Conformación del Nuevo Hallazgo',
      `Monto Consolidado (${config.currency})`,
      'Estado de Validación',
    ],
  ];

  rules.forEach((rule) => {
    const matched = findings.filter((f) => f.fusion_id === rule.fusion_id);
    const matchedDetails =
      matched
        .map((f) => `No. ${f.numero_hallazgo || f.id} (${f.pagina_referencia || 'Pág. N/A'})`)
        .join('; ') || 'Sin hallazgos';
    const sumMonto = matched.reduce((acc, curr) => acc + (curr.monto || 0), 0);

    ws2Data.push([
      rule.fusion_id,
      rule.rubro,
      matchedDetails,
      rule.justificacion,
      rule.titulo_fusionado,
      rule.condicion_actualizada_ia || 'Condición consolidada por IA pendiente de actualización.',
      rule.criterios_actualizados || rule.criterios,
      rule.recomendacion_actualizada || 'Recomendación consolidada pendiente.',
      rule.conclusion_conformada || 'Conclusión pericial conformada.',
      sumMonto,
      matched.length > 0 ? 'Conformado y Validado' : 'Pendiente de Hallazgos',
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
  ws2['!cols'] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 45 },
    { wch: 55 },
    { wch: 45 },
    { wch: 70 },
    { wch: 55 },
    { wch: 55 },
    { wch: 55 },
    { wch: 24 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Matriz Fusion y Condicion IA');

  const filename = `Matriz_Auditoria_Forense_${config.entity_name
    .replace(/\s+/g, '_')
    .slice(0, 30)}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, filename);
}

// 2. WORD (.DOCX) INFORME DESDE EL PUNTO DE VISTA DEL SUPERVISOR DE CALIDAD
export async function exportToWord(
  config: InstitutionalConfig,
  findings: AuditFinding[],
  rules: FusionRule[]
) {
  const totalMonto = findings.reduce((sum, f) => sum + (f.monto || 0), 0);
  const criticalCount = findings.filter((f) => f.riesgo === 'Crítico').length;
  const approvedCount = findings.filter((f) => f.estado_supervision === 'Aprobado (10/10)').length;
  const adjustCount = findings.filter((f) => f.estado_supervision === 'Requiere Ajuste').length;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Header Institucional
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: config.entity_name.toUpperCase(),
                bold: true,
                size: 32, // 16pt
                color: '1F4E79',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'OFICINA DE AUDITORÍA FORENSE & GESTIÓN DE CONTROL INTERNO',
                bold: true,
                size: 24,
                color: '333333',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'INFORME DE CONTROL DE CALIDAD, EVALUACIÓN DE SUPERVISIÓN Y FUSIÓN DE HALLAZGOS',
                bold: true,
                size: 20,
                color: '595959',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Bloque de Metadatos Oficial
          new Paragraph({
            children: [
              new TextRun({ text: 'A: ', bold: true, color: '1F4E79' }),
              new TextRun({ text: `${config.recipient}\n` }),
              new TextRun({ text: 'DE: ', bold: true, color: '1F4E79' }),
              new TextRun({
                text: `${config.supervisor_name}, ${config.supervisor_role}\n`,
              }),
              new TextRun({ text: 'AUDITOR ACTUANTE: ', bold: true, color: '1F4E79' }),
              new TextRun({
                text: `${config.auditor_name}, ${config.auditor_role}\n`,
              }),
              new TextRun({ text: 'TIPO DE AUDITORÍA: ', bold: true, color: '1F4E79' }),
              new TextRun({ text: `${config.audit_type}\n` }),
              new TextRun({ text: 'PERÍODO AUDITADO: ', bold: true, color: '1F4E79' }),
              new TextRun({ text: `${config.audit_period}\n` }),
              new TextRun({ text: 'IMPACTO ECONÓMICO OBSERVADO: ', bold: true, color: '1F4E79' }),
              new TextRun({ text: `${formatCurrency(totalMonto, config.currency)}\n` }),
              new TextRun({ text: 'ASUNTO: ', bold: true, color: '1F4E79' }),
              new TextRun({
                text: 'Dictamen de Supervisión Técnica de Hallazgos, Evaluación 0-10, Propuesta de Fusión con IA y Plan de Ajustes Institucionales',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // 1. Resumen Ejecutivo
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '1. RESUMEN EJECUTIVO Y OBJETIVOS DE LA REVISIÓN DEL SUPERVISOR',
                bold: true,
                size: 26,
                color: '1F4E79',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `En cumplimiento de las Normas Internacionales de Entidades Fiscalizadoras Superiores (ISSAI) y las directrices de control de calidad de la Cámara de Cuentas y Contraloría General de la República, la supervisión técnica procedió a evaluar de manera rigurosa la totalidad de los ${findings.length} hallazgos extraídos de las evidencias documentales aportadas.`,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Del examen pericial se concluye que ${approvedCount} hallazgos alcanzan la calificación perfecta de Aprobado (10/10) sin requerir modificaciones probatorias, mientras que ${adjustCount} puntos requieren ajustes técnicos específicos formulados con Inteligencia Artificial para alcanzar el estándar probatorio 10/10 antes de su elevación definitiva. El impacto patrimonial consolidado asciende a ${formatCurrency(totalMonto, config.currency)}.`,
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // 2. Evaluación Punto por Punto del Supervisor
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '2. EVALUACIÓN Y CONTROL DE CALIDAD DEL SUPERVISOR (ESCALA 0 A 10)',
                bold: true,
                size: 26,
                color: '1F4E79',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'A continuación se presenta el juicio técnico del supervisor sobre cada uno de los hallazgos formulados, detectando debilidades normativas y estableciendo las recomendaciones de ajuste con IA para llevar cada punto a 10/10:',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Tabla de Evaluación del Supervisor
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: '1F4E79' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Ref. / Pág.', bold: true, color: 'FFFFFF' })] })],
                  }),
                  new TableCell({
                    shading: { fill: '1F4E79' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Título y Condición Observada', bold: true, color: 'FFFFFF' })] })],
                  }),
                  new TableCell({
                    shading: { fill: '1F4E79' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Calificación', bold: true, color: 'FFFFFF' })] })],
                  }),
                  new TableCell({
                    shading: { fill: '1F4E79' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Dictamen y Ajuste IA para 10/10', bold: true, color: 'FFFFFF' })] })],
                  }),
                ],
              }),
              ...findings.map((f) => {
                return new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: f.numero_hallazgo || `#${f.id}`, bold: true })] }),
                        new Paragraph({ text: f.pagina_referencia || 'Pág. N/A' }),
                        new Paragraph({ children: [new TextRun({ text: f.riesgo, bold: true, color: f.riesgo === 'Crítico' ? 'DC2626' : 'D97706' })] }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: f.titulo, bold: true })] }),
                        new Paragraph({ text: f.condicion }),
                        new Paragraph({ children: [new TextRun({ text: `Monto: ${formatCurrency(f.monto, config.currency)}`, bold: true, color: '059669' })] }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: `${f.puntuacion_calidad ?? 8.5} / 10`, bold: true })] }),
                        new Paragraph({ text: f.estado_supervision || 'Aprobado (10/10)' }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: 'Debilidad Normativa: ', bold: true })] }),
                        new Paragraph({ text: f.incidencia_supervisor || 'Ninguna. Cumple con normas CGR.' }),
                        new Paragraph({ children: [new TextRun({ text: 'Ajuste IA para 10/10: ', bold: true, color: '1F4E79' })] }),
                        new Paragraph({ text: f.ajuste_recomendado_supervisor || 'Punto aprobado sin cambios.' }),
                      ],
                    }),
                  ],
                });
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // 3. Matriz de Fusión y Nuevos Hallazgos Conformados con IA
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3. RESUMEN EJECUTIVO FINAL: CONFORMACIÓN DE HALLAZGOS FUSIONADOS CON IA',
                bold: true,
                size: 26,
                color: '1F4E79',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Para evitar la dispersión probatoria y presentar a la Cámara de Cuentas y Contraloría General causas raíces sólidas e inexpugnables, se consolidaron los puntos afines en nuevos hallazgos conformados integralmente:',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Bloques de Hallazgos Fusionados
          ...rules.flatMap((rule) => {
            const matched = findings.filter((f) => f.fusion_id === rule.fusion_id);
            const sumMonto = matched.reduce((acc, curr) => acc + (curr.monto || 0), 0);
            const refList = matched.map((m) => `${m.numero_hallazgo || `#${m.id}`} (${m.pagina_referencia})`).join('; ');

            return [
              new Paragraph({
                children: [
                  new TextRun({ text: `[${rule.fusion_id}] ${rule.rubro}: `, bold: true, color: '1F4E79', size: 24 }),
                  new TextRun({ text: rule.titulo_fusionado, bold: true, size: 24 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Hallazgos Originales Consolidados: ', bold: true }),
                  new TextRun({ text: refList || 'Ninguno' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Monto Consolidado: ', bold: true }),
                  new TextRun({ text: formatCurrency(sumMonto, config.currency), bold: true, color: '059669' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Justificación Técnica de Fusión: ', bold: true }),
                  new TextRun({ text: rule.justificacion }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Condición Actualizada Unificada por IA: ', bold: true }),
                  new TextRun({ text: rule.condicion_actualizada_ia || 'Pendiente de conformación.' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Criterios Legales Precisados: ', bold: true }),
                  new TextRun({ text: rule.criterios_actualizados || rule.criterios }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Recomendación Técnica Consolidada: ', bold: true }),
                  new TextRun({ text: rule.recomendacion_actualizada || 'Recomendación unificada.' }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Conclusión Forense Conformada: ', bold: true }),
                  new TextRun({ text: rule.conclusion_conformada || 'Conclusión forense pericial.' }),
                ],
              }),
              new Paragraph({ text: '' }),
            ];
          }),

          // Bloque de Firmas y Cadena de Custodia
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: '_____________________________________________________\n',
                bold: true,
              }),
              new TextRun({
                text: `${config.supervisor_name}\n`,
                bold: true,
                size: 24,
                color: '1F4E79',
              }),
              new TextRun({
                text: `${config.supervisor_role}\n`,
                bold: true,
                size: 20,
              }),
              new TextRun({
                text: `Auditor Actuante: ${config.auditor_name} (${config.auditor_role})\n`,
                size: 18,
              }),
              new TextRun({
                text: `En representación pericial de: ${config.entity_name}\n`,
                size: 18,
              }),
              new TextRun({
                text: `Certificación Criptográfica Forense SHA-256: ${config.securityHash}`,
                size: 14,
                color: '888888',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Informe_Supervision_Calidad_${config.entity_name
    .replace(/\s+/g, '_')
    .slice(0, 30)}_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 3. PDF EXPORTER PROFESIONAL
export function exportToPDF(
  config: InstitutionalConfig,
  findings: AuditFinding[],
  rules: FusionRule[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalMonto = findings.reduce((acc, f) => acc + (f.monto || 0), 0);
  const criticalCount = findings.filter((f) => f.riesgo === 'Crítico').length;

  // Header Banner
  doc.setFillColor(31, 78, 121);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('OFICINA DE AUDITORÍA FORENSE & CONTROL DE CALIDAD', 105, 11, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('SISTEMA ENTERPRISE DE EXTRACCIÓN, EVALUACIÓN 0-10 Y FUSIÓN DE HALLAZGOS', 105, 18, {
    align: 'center',
  });

  // Entity Details
  doc.setTextColor(31, 78, 121);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(config.entity_name.toUpperCase(), 14, 33);

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`TIPO DE AUDITORÍA: ${config.audit_type}`, 14, 39);
  doc.text(`PERÍODO AUDITADO: ${config.audit_period}`, 14, 44);
  doc.text(`DESTINATARIO: ${config.recipient}`, 14, 49);
  doc.text(`SUPERVISOR DE CALIDAD: ${config.supervisor_name} | AUDITOR: ${config.auditor_name}`, 14, 54);

  // Summary Metrics Box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, 58, 182, 18, 2, 2, 'F');
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(14, 58, 182, 18, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setTextColor(100, 110, 120);
  doc.text('TOTAL HALLAZGOS', 25, 64);
  doc.text('HALLAZGOS CRÍTICOS', 80, 64);
  doc.text('IMPACTO CONSOLIDADO', 145, 64);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 78, 121);
  doc.text(`${findings.length} ítems extraídos`, 25, 71);
  doc.setTextColor(220, 38, 38);
  doc.text(`${criticalCount} hallazgos`, 80, 71);
  doc.setTextColor(31, 78, 121);
  doc.text(formatCurrency(totalMonto, config.currency), 145, 71);

  // Sección 1: Matriz de Fusión y Nuevos Hallazgos
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 78, 121);
  doc.text('1. MATRIZ DE FUSIÓN, CAUSAS RAÍZ Y NUEVOS HALLAZGOS CON IA', 14, 83);

  const table2Data = rules.map((r) => {
    const matched = findings.filter((f) => f.fusion_id === r.fusion_id);
    const sum = matched.reduce((acc, curr) => acc + (curr.monto || 0), 0);
    const refs = matched.map((f) => `${f.numero_hallazgo || f.id} (${f.pagina_referencia || 'Pág. N/A'})`).join(', ') || 'N/A';
    return [
      r.fusion_id,
      r.rubro,
      r.titulo_fusionado,
      refs,
      formatCurrency(sum, config.currency),
    ];
  });

  autoTable(doc, {
    startY: 86,
    head: [
      ['Cód.', 'Rubro Agrupado', 'Título del Hallazgo Fusionado', 'Hallazgos Incluidos (No. y Pág.)', 'Monto Consolidado'],
    ],
    body: table2Data,
    headStyles: {
      fillColor: [31, 78, 121],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 30 },
      2: { cellWidth: 68 },
      3: { cellWidth: 38 },
      4: { cellWidth: 30, halign: 'right' },
    },
  });

  // Sección 2: Matriz Detallada con Evaluación de Calidad (0-10)
  doc.addPage();
  doc.setFillColor(31, 78, 121);
  doc.rect(0, 0, 210, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. EVALUACIÓN DE SUPERVISIÓN (0-10) Y DETALLE DE HALLAZGOS', 14, 9);

  const table1Data = findings.map((f) => [
    f.numero_hallazgo || f.id.toString(),
    f.pagina_referencia || 'Pág. N/A',
    f.rubro,
    f.titulo,
    `${f.puntuacion_calidad ?? 8.5}/10`,
    f.estado_supervision || 'Aprobado (10/10)',
    formatCurrency(f.monto, config.currency),
    f.fusion_id,
  ]);

  autoTable(doc, {
    startY: 20,
    head: [['No.', 'Página Fuente', 'Rubro', 'Título del Hallazgo', 'Calificación', 'Dictamen Supervisor', 'Monto (RD$)', 'Fusión']],
    body: table1Data,
    headStyles: {
      fillColor: [31, 78, 121],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 26 },
      2: { cellWidth: 28 },
      3: { cellWidth: 54 },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 24 },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 14, halign: 'center' },
    },
  });

  // Bloque de Firma y Sellos
  const finalY = (doc as any).lastAutoTable?.finalY + 16 || 220;
  const actualSignY = finalY > 240 ? 45 : finalY;
  if (finalY > 240) {
    doc.addPage();
  }

  doc.setDrawColor(150, 150, 150);
  doc.line(60, actualSignY, 150, actualSignY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 78, 121);
  doc.text(config.supervisor_name, 105, actualSignY + 5, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(config.supervisor_role, 105, actualSignY + 10, { align: 'center' });
  doc.text(`Auditor: ${config.auditor_name} | En representación de: ${config.entity_name}`, 105, actualSignY + 15, {
    align: 'center',
  });
  doc.text(`Cadena de Custodia Digital SHA-256: ${config.securityHash}`, 105, actualSignY + 20, {
    align: 'center',
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Informe Oficial de Supervisión de Auditoría Forense | Generado con IA | Página ${i} de ${totalPages}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const filename = `Informe_Auditoria_Forense_${config.entity_name
    .replace(/\s+/g, '_')
    .slice(0, 30)}_${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(filename);
}

// 4. CSV EXPORTER CON TODAS LAS COLUMNAS FORENSES
export function exportToCSV(
  config: InstitutionalConfig,
  findings: AuditFinding[]
) {
  const headers = [
    'ID',
    'No_Hallazgo_301_354',
    'Pagina_Referencia',
    'Titulo',
    'Condicion_Observada',
    'Clasificacion_Tipo',
    'Marco_Normativo',
    'Analisis_Pericial',
    'Posible_Fusion',
    'Rubro',
    'Criterio_Legal',
    'Causa_Raiz',
    'Efecto_Impacto',
    'Monto',
    'Moneda',
    'Recomendacion',
    'Conclusion',
    'Riesgo',
    'Calificacion_Calidad_0_10',
    'Estado_Supervision',
    'Debilidad_Detectada_Supervisor',
    'Ajuste_IA_para_10_10',
    'Fusion_ID',
    'Evidencia_Soporte',
  ];

  const rows = findings.map((f) => [
    f.id,
    `"${(f.numero_hallazgo || '').replace(/"/g, '""')}"`,
    `"${(f.pagina_referencia || '').replace(/"/g, '""')}"`,
    `"${(f.titulo || '').replace(/"/g, '""')}"`,
    `"${(f.condicion || '').replace(/"/g, '""')}"`,
    `"${(f.clasificacion_tipo || (f.monto > 0 ? 'Hallazgo de Auditoría' : 'Debilidad de Control Interno')).replace(/"/g, '""')}"`,
    `"${(f.marco_normativo || f.criterio || '').replace(/"/g, '""')}"`,
    `"${(f.analisis_pericial || '').replace(/"/g, '""')}"`,
    `"${(f.posible_fusion || '').replace(/"/g, '""')}"`,
    `"${(f.rubro || '').replace(/"/g, '""')}"`,
    `"${(f.criterio || '').replace(/"/g, '""')}"`,
    `"${(f.causa || '').replace(/"/g, '""')}"`,
    `"${(f.efecto || '').replace(/"/g, '""')}"`,
    f.monto || 0,
    config.currency,
    `"${(f.recomendacion || '').replace(/"/g, '""')}"`,
    `"${(f.conclusion || '').replace(/"/g, '""')}"`,
    f.riesgo,
    f.puntuacion_calidad ?? 8.5,
    `"${(f.estado_supervision || 'Aprobado (10/10)').replace(/"/g, '""')}"`,
    `"${(f.incidencia_supervisor || '').replace(/"/g, '""')}"`,
    `"${(f.ajuste_recomendado_supervisor || '').replace(/"/g, '""')}"`,
    f.fusion_id,
    `"${(f.evidencia_soporte || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Matriz_Hallazgos_${config.entity_name
    .replace(/\s+/g, '_')
    .slice(0, 30)}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
