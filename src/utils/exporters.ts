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
  return `${currency} ${amount.toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// 1. EXCEL EXPORTER
export function exportToExcel(
  config: InstitutionalConfig,
  findings: AuditFinding[],
  rules: FusionRule[]
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Matriz Hallazgos Reales
  const ws1Data: any[][] = [
    [config.entity_name.toUpperCase()],
    [`INFORME DE AUDITORÍA: ${config.audit_type.toUpperCase()}`],
    [`PERÍODO: ${config.audit_period}`],
    [],
    [
      'No.',
      'Rubro / Área Auditada',
      'Título del Hallazgo',
      'Descripción / Condición Observada',
      `Monto Involucrado (${config.currency})`,
      'Nivel de Riesgo',
      'Posible Fusión Recomendada',
      'Criterio Legal / Normativo',
    ],
  ];

  findings.forEach((f) => {
    ws1Data.push([
      f.id,
      f.rubro,
      f.titulo,
      f.descripcion,
      f.monto,
      f.riesgo,
      f.fusion_id,
      f.criterio || 'Normativa de Control Interno Vigente',
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);

  // Set column widths
  ws1['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 45 },
    { wch: 60 },
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Matriz Hallazgos Reales');

  // Sheet 2: Analisis y Fusion Recomendada
  const ws2Data: any[][] = [
    [config.entity_name.toUpperCase()],
    ['MATRIZ DE ANÁLISIS TÉCNICO Y FUSIÓN DE HALLAZGOS CON IA'],
    [`RESPONSABLE: ${config.auditor_name} - ${config.auditor_role}`],
    [],
    [
      'Cód. Fusión',
      'Rubro Agrupado',
      'Título del Hallazgo Fusionado',
      'Hallazgos Originales Incluidos',
      `Monto Consolidado (${config.currency})`,
      'Justificación Técnica de Fusión',
      'Criterios Legales y Normativos',
    ],
  ];

  rules.forEach((rule) => {
    const matched = findings.filter((f) => f.fusion_id === rule.fusion_id);
    const matchedIds = matched.map((f) => `#${f.id}`).join(', ') || 'Sin hallazgos';
    const sumMonto = matched.reduce((acc, curr) => acc + curr.monto, 0);

    ws2Data.push([
      rule.fusion_id,
      rule.rubro,
      rule.titulo_fusionado,
      matchedIds,
      sumMonto,
      rule.justificacion,
      rule.criterios,
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
  ws2['!cols'] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 45 },
    { wch: 25 },
    { wch: 24 },
    { wch: 55 },
    { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Analisis y Fusion Recomendada');

  const filename = `Matriz_Auditoria_${config.entity_name
    .replace(/\s+/g, '_')
    .slice(0, 30)}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, filename);
}

// 2. WORD (.DOCX) EXPORTER
export async function exportToWord(
  config: InstitutionalConfig,
  findings: AuditFinding[],
  rules: FusionRule[]
) {
  const totalMonto = findings.reduce((sum, f) => sum + f.monto, 0);
  const criticalCount = findings.filter((f) => f.riesgo === 'Crítico').length;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Header
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
                text: 'OFICINA DE AUDITORÍA INTERNA Y GESTIÓN DE CONTROL',
                bold: true,
                size: 24, // 12pt
                color: '333333',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'INFORME DE AJUSTES, CONSOLIDACIÓN Y RECOMENDACIONES DE MEJORA',
                bold: true,
                size: 22,
                color: '595959',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Metadata block
          new Paragraph({
            children: [
              new TextRun({ text: 'A: ', bold: true, color: '1F4E79' }),
              new TextRun({ text: `${config.recipient}\n` }),
              new TextRun({ text: 'DE: ', bold: true, color: '1F4E79' }),
              new TextRun({
                text: `${config.auditor_name}, ${config.auditor_role}\nEn representación de la Entidad Auditada (${config.entity_name})\n`,
              }),
              new TextRun({ text: 'TIPO DE AUDITORÍA: ', bold: true, color: '1F4E79' }),
              new TextRun({ text: `${config.audit_type}\n` }),
              new TextRun({ text: 'PERÍODO AUDITADO: ', bold: true, color: '1F4E79' }),
              new TextRun({ text: `${config.audit_period}\n` }),
              new TextRun({ text: 'MONTO TOTAL OBSERVADO: ', bold: true, color: '1F4E79' }),
              new TextRun({ text: `${formatCurrency(totalMonto, config.currency)}\n` }),
              new TextRun({ text: 'ASUNTO: ', bold: true, color: '1F4E79' }),
              new TextRun({
                text: 'Informe Técnico de Análisis, Propuesta de Fusión de Hallazgos y Plan de Mejoras Sistémicas',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Executive Summary Heading
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '1. RESUMEN EJECUTIVO Y OBJETIVO DEL INFORME',
                bold: true,
                size: 26,
                color: '1F4E79',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `El presente documento tiene como finalidad exponer los resultados de la auditoría especializada practicada a ${config.entity_name}, cubriendo el período ${config.audit_period}. Mediante la aplicación de técnicas avanzadas de auditoría forense, minería de datos y análisis de fusiones con Inteligencia Artificial, se identificaron un total de ${findings.length} hallazgos originales, de los cuales ${criticalCount} revisten una condición de riesgo Crítico con un impacto patrimonial consolidado de ${formatCurrency(totalMonto, config.currency)}.`,
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Section 2: Fusion Matrix
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '2. MATRIZ DE FUSIÓN Y CONSOLIDACIÓN DE HALLAZGOS',
                bold: true,
                size: 26,
                color: '1F4E79',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'A continuación se presenta la correlación técnica de hallazgos para evitar dispersión probatoria y concentrar las debilidades en causas raíces estructuradas conforme a la Ley 10-07 (NOBACI) y normativas conexas:',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Table of Fused Findings
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: '1F4E79' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Cód.', bold: true, color: 'FFFFFF' })] })],
                  }),
                  new TableCell({
                    shading: { fill: '1F4E79' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Rubro / Título Fusionado', bold: true, color: 'FFFFFF' })] })],
                  }),
                  new TableCell({
                    shading: { fill: '1F4E79' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Hallazgos Incluidos', bold: true, color: 'FFFFFF' })] })],
                  }),
                  new TableCell({
                    shading: { fill: '1F4E79' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Monto Consolidado', bold: true, color: 'FFFFFF' })] })],
                  }),
                ],
              }),
              ...rules.map((rule) => {
                const matched = findings.filter((f) => f.fusion_id === rule.fusion_id);
                const sumMonto = matched.reduce((acc, curr) => acc + curr.monto, 0);
                const ids = matched.map((f) => `#${f.id}`).join(', ') || 'N/A';
                return new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: rule.fusion_id })],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: rule.rubro, bold: true })] }),
                        new Paragraph({ text: rule.titulo_fusionado }),
                      ],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: ids })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: formatCurrency(sumMonto, config.currency) })],
                    }),
                  ],
                });
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Section 3: Detailed Findings
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3. DETALLE DE HALLAZGOS Y EVIDENCIAS DE AUDITORÍA',
                bold: true,
                size: 26,
                color: '1F4E79',
              }),
            ],
          }),
          ...findings.flatMap((f) => [
            new Paragraph({
              children: [
                new TextRun({ text: `Hallazgo No. ${f.id}: `, bold: true, color: '1F4E79' }),
                new TextRun({ text: f.titulo, bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Rubro: ', bold: true }),
                new TextRun({ text: `${f.rubro} | ` }),
                new TextRun({ text: 'Riesgo: ', bold: true }),
                new TextRun({ text: `${f.riesgo} | ` }),
                new TextRun({ text: 'Monto Observado: ', bold: true }),
                new TextRun({ text: formatCurrency(f.monto, config.currency) }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Condición Observada: ', bold: true }),
                new TextRun({ text: f.descripcion }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Criterio Normativo: ', bold: true }),
                new TextRun({ text: f.criterio || 'Normativas Generales de Control Interno.' }),
              ],
            }),
            new Paragraph({ text: '' }),
          ]),

          // Signature block
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
                text: `${config.auditor_name}\n`,
                bold: true,
                size: 24,
                color: '1F4E79',
              }),
              new TextRun({
                text: `${config.auditor_role}\nEn representación de la Entidad Auditada\n`,
                size: 20,
              }),
              new TextRun({
                text: `Cadena de Custodia Digital SHA-256: ${config.securityHash.slice(0, 36)}...`,
                size: 16,
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
  a.download = `Informe_Tecnico_${config.entity_name
    .replace(/\s+/g, '_')
    .slice(0, 30)}_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 3. PDF EXPORTER
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

  const primaryColor = [31, 78, 121]; // #1F4E79
  const totalMonto = findings.reduce((acc, f) => acc + f.monto, 0);
  const criticalCount = findings.filter((f) => f.riesgo === 'Crítico').length;

  // Header Banner
  doc.setFillColor(31, 78, 121);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('OFICINA DE AUDITORÍA FORENSE & CONTROL INTERNO', 105, 11, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('SISTEMA ENTERPRISE DE AUDITORÍA, EXTRACCIÓN Y FUSIÓN DE HALLAZGOS', 105, 18, {
    align: 'center',
  });

  // Entity Details
  doc.setTextColor(31, 78, 121);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(config.entity_name.toUpperCase(), 14, 34);

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`TIPO DE AUDITORÍA: ${config.audit_type}`, 14, 40);
  doc.text(`PERÍODO AUDITADO: ${config.audit_period}`, 14, 45);
  doc.text(`DESTINATARIO: ${config.recipient}`, 14, 50);
  doc.text(`AUDITOR RESPONSABLE: ${config.auditor_name} (${config.auditor_role})`, 14, 55);

  // Summary Metrics Box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, 60, 182, 18, 2, 2, 'F');
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(14, 60, 182, 18, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setTextColor(100, 110, 120);
  doc.text('TOTAL HALLAZGOS', 25, 66);
  doc.text('HALLAZGOS CRÍTICOS', 80, 66);
  doc.text('MONTO TOTAL OBSERVADO', 145, 66);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 78, 121);
  doc.text(`${findings.length} ítems`, 25, 73);
  doc.setTextColor(220, 38, 38);
  doc.text(`${criticalCount} hallazgos`, 80, 73);
  doc.setTextColor(31, 78, 121);
  doc.text(formatCurrency(totalMonto, config.currency), 145, 73);

  // Section 1: Matriz de Fusión Recomendada Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 78, 121);
  doc.text('1. MATRIZ DE ANÁLISIS Y FUSIÓN RECOMENDADA (CONSOLIDADA)', 14, 85);

  const table2Data = rules.map((r) => {
    const matched = findings.filter((f) => f.fusion_id === r.fusion_id);
    const sum = matched.reduce((acc, curr) => acc + curr.monto, 0);
    const ids = matched.map((f) => `#${f.id}`).join(', ') || 'N/A';
    return [
      r.fusion_id,
      r.rubro,
      r.titulo_fusionado,
      ids,
      formatCurrency(sum, config.currency),
    ];
  });

  autoTable(doc, {
    startY: 88,
    head: [
      ['Cód.', 'Rubro Agrupado', 'Título del Hallazgo Fusionado', 'Hallazgos', 'Monto Consolidado'],
    ],
    body: table2Data,
    headStyles: {
      fillColor: [31, 78, 121],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 32 },
      2: { cellWidth: 78 },
      3: { cellWidth: 22 },
      4: { cellWidth: 34, halign: 'right' },
    },
  });

  // Section 2: Matriz de Hallazgos Individuales
  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  doc.addPage();
  doc.setFillColor(31, 78, 121);
  doc.rect(0, 0, 210, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. MATRIZ DETALLADA DE HALLAZGOS OBSERVADOS', 14, 9);

  const table1Data = findings.map((f) => [
    f.id.toString(),
    f.rubro,
    f.titulo,
    f.riesgo,
    formatCurrency(f.monto, config.currency),
    f.fusion_id,
  ]);

  autoTable(doc, {
    startY: 20,
    head: [['No.', 'Rubro / Área', 'Título del Hallazgo', 'Riesgo', 'Monto (RD$)', 'Fusión']],
    body: table1Data,
    headStyles: {
      fillColor: [31, 78, 121],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 85 },
      3: { cellWidth: 18 },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 16, halign: 'center' },
    },
  });

  // Auditor Signature block
  const signY = (doc as any).lastAutoTable?.finalY + 18 || 220;
  if (signY > 240) {
    doc.addPage();
  }

  const actualSignY = signY > 240 ? 50 : signY;

  doc.setDrawColor(150, 150, 150);
  doc.line(65, actualSignY, 145, actualSignY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 78, 121);
  doc.text(config.auditor_name, 105, actualSignY + 5, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(config.auditor_role, 105, actualSignY + 10, { align: 'center' });
  doc.text(`En representación de: ${config.entity_name}`, 105, actualSignY + 15, {
    align: 'center',
  });
  doc.text(`Cifrado y Cadena de Custodia: ${config.securityHash}`, 105, actualSignY + 20, {
    align: 'center',
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Documento oficial de auditoría corporativa | Generado por Sistema Baldera v2 | Página ${i} de ${totalPages}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const filename = `Informe_Auditoria_${config.entity_name
    .replace(/\s+/g, '_')
    .slice(0, 30)}_${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(filename);
}

// 4. CSV EXPORTER
export function exportToCSV(
  config: InstitutionalConfig,
  findings: AuditFinding[]
) {
  const headers = [
    'ID',
    'Rubro',
    'Titulo',
    'Descripcion',
    'Monto',
    'Moneda',
    'Riesgo',
    'Fusion_ID',
    'Criterio_Legal',
    'Fecha_Registro',
    'Estado',
  ];

  const rows = findings.map((f) => [
    f.id,
    `"${(f.rubro || '').replace(/"/g, '""')}"`,
    `"${(f.titulo || '').replace(/"/g, '""')}"`,
    `"${(f.descripcion || '').replace(/"/g, '""')}"`,
    f.monto,
    config.currency,
    f.riesgo,
    f.fusion_id,
    `"${(f.criterio || '').replace(/"/g, '""')}"`,
    f.fecha_registro || new Date().toISOString().slice(0, 10),
    f.estado || 'Confirmado',
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Hallazgos_${config.entity_name
    .replace(/\s+/g, '_')
    .slice(0, 30)}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
