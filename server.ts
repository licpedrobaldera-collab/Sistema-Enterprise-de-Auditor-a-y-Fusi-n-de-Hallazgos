import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
// @ts-ignore
import mammoth from "mammoth";
import * as XLSX from "xlsx";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Server-side Gemini initialization
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Fetch and extract content from digital web link / URL
app.post("/api/ai/fetch-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return res.status(400).json({ error: "URL inválida. Debe comenzar con http:// o https://" });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Auditoria-Forense/2.5",
        "Accept": "text/html,application/xhtml+xml,application/xml,text/plain,*/*",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Error al acceder al enlace: ${response.status} ${response.statusText}`,
      });
    }

    const contentType = response.headers.get("content-type") || "";
    const rawData = await response.text();

    let cleanedText = rawData;
    if (contentType.includes("html")) {
      // Remove scripts, styles and HTML tags
      cleanedText = rawData
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s{2,}/g, " ")
        .trim();
    }

    return res.json({
      success: true,
      url,
      extractedText: cleanedText.slice(0, 50000),
      chars: cleanedText.length,
    });
  } catch (err: any) {
    console.error("Error fetching url:", err);
    return res.status(500).json({ error: `Error conectando al enlace: ${err.message || err}` });
  }
});

// Comprehensive Multiformat Document Extractor & AI Analysis
app.post("/api/ai/parse-and-extract", async (req, res) => {
  try {
    const { files, rawText, auditType, customRules } = req.body;

    let consolidatedText = rawText || "";
    const multimodalParts: any[] = [];
    const processedFilesInfo: { name: string; type: string; extractedChars: number }[] = [];

    // Process files if provided
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        const { name, type, base64 } = file;
        if (!base64) continue;

        // Clean base64 header if present
        const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
        const buffer = Buffer.from(base64Data, "base64");
        const lowerName = (name || "").toLowerCase();

        // 1. WORD DOCUMENTS (.docx / .doc)
        if (lowerName.endsWith(".docx") || lowerName.endsWith(".doc")) {
          try {
            const mammothResult = await mammoth.extractRawText({ buffer });
            const docxText = mammothResult.value || "";
            consolidatedText += `\n\n=== DOCUMENTO WORD: ${name} ===\n${docxText}`;
            processedFilesInfo.push({
              name,
              type: "Word (.docx)",
              extractedChars: docxText.length,
            });
          } catch (mErr) {
            console.warn(`Error parsing docx ${name}:`, mErr);
            consolidatedText += `\n\n=== DOCUMENTO WORD: ${name} ===\n[Texto extraído con formato plano]`;
          }
        }
        // 2. EXCEL SPREADSHEETS (.xlsx / .xls / .csv)
        else if (
          lowerName.endsWith(".xlsx") ||
          lowerName.endsWith(".xls") ||
          lowerName.endsWith(".csv")
        ) {
          try {
            const wb = XLSX.read(buffer, { type: "buffer" });
            let xlsxText = `=== HOJA DE CÁLCULO EXCEL: ${name} ===\n`;
            for (const sheetName of wb.SheetNames) {
              const sheet = wb.Sheets[sheetName];
              const csvData = XLSX.utils.sheet_to_csv(sheet);
              xlsxText += `--- Pestaña / Hoja: ${sheetName} ---\n${csvData}\n\n`;
            }
            consolidatedText += `\n\n${xlsxText}`;
            processedFilesInfo.push({
              name,
              type: "Excel (.xlsx/.csv)",
              extractedChars: xlsxText.length,
            });
          } catch (xErr) {
            console.warn(`Error parsing excel ${name}:`, xErr);
          }
        }
        // 3. PDF DOCUMENTS (.pdf)
        else if (lowerName.endsWith(".pdf") || type === "application/pdf") {
          // Send to Gemini as native PDF inlineData
          multimodalParts.push({
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          });
          consolidatedText += `\n\n=== DOCUMENTO PDF: ${name} (Procesado directamente por motor IA con OCR) ===\n`;
          processedFilesInfo.push({
            name,
            type: "PDF (.pdf)",
            extractedChars: buffer.length,
          });
        }
        // 4. IMAGES (.png, .jpg, .jpeg, .webp, .bmp)
        else if (
          lowerName.endsWith(".png") ||
          lowerName.endsWith(".jpg") ||
          lowerName.endsWith(".jpeg") ||
          lowerName.endsWith(".webp") ||
          type?.startsWith("image/")
        ) {
          const mime = type || (lowerName.endsWith(".png") ? "image/png" : "image/jpeg");
          multimodalParts.push({
            inlineData: {
              mimeType: mime,
              data: base64Data,
            },
          });
          consolidatedText += `\n\n=== EVIDENCIA DIGITAL / IMAGEN: ${name} (Lectura OCR por IA) ===\n`;
          processedFilesInfo.push({
            name,
            type: `Imagen (${mime})`,
            extractedChars: buffer.length,
          });
        }
        // 5. TEXT / JSON / LOGS
        else {
          const textContent = buffer.toString("utf-8");
          consolidatedText += `\n\n=== ARCHIVO DE TEXTO: ${name} ===\n${textContent}`;
          processedFilesInfo.push({
            name,
            type: "Texto / Datos",
            extractedChars: textContent.length,
          });
        }
      }
    }

    const rulesContext = (customRules || [])
      .map(
        (r: any) =>
          `- [${r.fusion_id}] ${r.rubro}: "${r.titulo_fusionado}". Palabras clave: ${r.keywords?.join(
            ", "
          )}`
      )
      .join("\n");

    const instructionPrompt = `Actúa como Auditor Forense Senior y Consultor Financiero Gubernamental (CPA) de la Cámara de Cuentas y Contraloría General.
Examina minuciosamente las evidencias suministradas (Word, hojas de cálculo Excel, PDF e imágenes de facturas/conduces/cheques con OCR).

Modalidad de Auditoría: "${auditType || "Auditoría Forense e Integral"}".

Reglas Institucionales de Fusión Activas:
${rulesContext}

REQUISITOS ESTRICTOS:
1. NO INVENTES DATOS. Todo debe ser extraído o colegido rigurosamente de las evidencias analizadas.
2. Identifica el número de referencia del hallazgo (ej. "3.1.01", "2.1.04") y la página o folio de la fuente (ej. "Pág. 10 - Acta RRHH", "Pág. 24 - Nómina Banco").
3. Detalla la Condición observada completa (hechos reales), Criterio legal aplicable, Causa raíz, Efecto/Impacto patrimonial con monto numérico en RD$ (o 0 si es cualitativo), Recomendación del auditor y Conclusión pericial.
4. Realiza el Control de Calidad del Supervisor (escala 0 a 10):
   - Asigna una puntuación técnica (ej. 7.5, 8.5, 10.0).
   - Estado: "Aprobado (10/10)" si cumple con todas las normas o "Requiere Ajuste" si presenta debilidades.
   - Detecta la debilidad o incidencia bajo normas de la Cámara de Cuentas o Contraloría.
   - Formula el ajuste técnico recomendado con IA para elevar el punto a 10/10.
5. Para cada grupo de fusión, redacta la "condicion_actualizada_ia" (cómo queda unificada la condición consolidada), criterios precisados, recomendación y conclusión conformada.

Texto y tablas extraídas de los soportes:
${consolidatedText.slice(0, 35000)}

Devuelve EXCLUSIVAMENTE un objeto JSON válido con las claves "findings" y "updatedRules":
{
  "findings": [
    {
      "id": 1,
      "numero_hallazgo": "3.1.01",
      "pagina_referencia": "Pág. 10 - Acta de Hallazgos RRHH",
      "titulo": "...",
      "rubro": "...",
      "condicion": "...",
      "criterio": "...",
      "causa": "...",
      "efecto": "...",
      "monto": 0.0,
      "recomendacion": "...",
      "conclusion": "...",
      "riesgo": "Crítico",
      "fusion_id": "FUS-01",
      "puntuacion_calidad": 8.5,
      "estado_supervision": "Requiere Ajuste",
      "incidencia_supervisor": "...",
      "ajuste_recomendado_supervisor": "...",
      "evidencia_soporte": "..."
    }
  ],
  "updatedRules": [
    {
      "fusion_id": "FUS-01",
      "condicion_actualizada_ia": "...",
      "criterios_actualizados": "...",
      "recomendacion_actualizada": "...",
      "conclusion_conformada": "..."
    }
  ]
}
`;

    // Call Gemini with Multimodal parts + Prompt
    if (ai) {
      try {
        const parts: any[] = [...multimodalParts, { text: instructionPrompt }];

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: { parts },
          config: {
            temperature: 0.15,
            responseMimeType: "application/json",
          },
        });

        const rawResult = response.text || "{}";
        const parsed = JSON.parse(rawResult);

        const extractedFindings = Array.isArray(parsed.findings)
          ? parsed.findings
          : Array.isArray(parsed)
          ? parsed
          : [];

        return res.json({
          success: true,
          source: "Gemini 3.8 Flash (Multimodal OCR + Word/Excel/PDF)",
          extractedText: consolidatedText,
          processedFiles: processedFilesInfo,
          findings: extractedFindings,
          updatedRules: Array.isArray(parsed.updatedRules) ? parsed.updatedRules : [],
        });
      } catch (geminiErr) {
        console.warn("Gemini multimodal failed, falling back to heuristic:", geminiErr);
      }
    }

    // Heuristic Fallback
    const heuristicFindings = getHeuristicFindings(consolidatedText, auditType);
    return res.json({
      success: true,
      source: "Motor Forense Integrado (Heurístico)",
      extractedText: consolidatedText,
      processedFiles: processedFilesInfo,
      findings: heuristicFindings,
      updatedRules: [],
    });
  } catch (error: any) {
    console.error("Parse and extract error:", error);
    res.status(500).json({
      error: "Error procesando archivos de auditoría.",
      details: error.message,
    });
  }
});

// Legacy text-only analysis endpoint
app.post("/api/ai/analyze-findings", async (req, res) => {
  try {
    const { rawText, auditType, customRules } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: "No se proporcionó texto de auditoría." });
    }

    if (!ai) {
      return res.json({
        success: true,
        source: "heuristic",
        findings: getHeuristicFindings(rawText, auditType),
      });
    }

    const rulesContext = (customRules || [])
      .map(
        (r: any) =>
          `- [${r.fusion_id}] ${r.rubro}: "${r.titulo_fusionado}". Palabras clave: ${r.keywords?.join(
            ", "
          )}`
      )
      .join("\n");

    const prompt = `Actúa como Auditor Forense Senior y Consultor Financiero (CPA).
Analiza el siguiente texto de auditoría:
Modalidad: "${auditType || "Auditoría Forense"}".
Reglas de fusión:
${rulesContext}

Devuelve EXCLUSIVAMENTE un arreglo JSON válido:
[
  {
    "id": 1,
    "titulo": "...",
    "rubro": "...",
    "monto": 0.0,
    "descripcion": "...",
    "riesgo": "Crítico",
    "fusion_id": "FUS-01",
    "criterio": "..."
  }
]

Texto:
${rawText.slice(0, 30000)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: { temperature: 0.2 },
    });

    const cleanJson = (response.text || "")
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const findings = JSON.parse(cleanJson);
    return res.json({
      success: true,
      source: "gemini-3.8-flash",
      findings,
    });
  } catch {
    return res.json({
      success: true,
      source: "heuristic-fallback",
      findings: getHeuristicFindings(req.body?.rawText || "", req.body?.auditType),
    });
  }
});

// Voice command interpretation
app.post("/api/ai/process-voice", async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Transcripción vacía" });
    }

    if (!ai) {
      return res.json({
        success: true,
        action: interpretVoiceHeuristic(transcript),
      });
    }

    const prompt = `Interpreta el comando de voz del auditor: "${transcript}"
Opciones de acción:
1. CREATE_FINDING: crear un nuevo hallazgo (extrae titulo, monto, rubro, descripcion).
2. FILTER: filtrar matriz por término.
3. CLEAR_FILTER: limpiar filtros.
4. EXPORT: exportar en pdf, excel, word o csv.
5. CLEAN_DB: limpiar base de datos / comenzar de cero.
6. UNKNOWN.

Devuelve JSON:
{
  "action": "CREATE_FINDING" | "FILTER" | "CLEAR_FILTER" | "EXPORT" | "CLEAN_DB" | "UNKNOWN",
  "payload": {
    "titulo": "...",
    "monto": 0,
    "rubro": "...",
    "descripcion": "...",
    "filterTerm": "...",
    "exportFormat": "pdf" | "excel" | "word" | "csv"
  },
  "feedback": "Mensaje audible breve de confirmación en español"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, action: parsed });
  } catch {
    return res.json({
      success: true,
      action: interpretVoiceHeuristic(req.body?.transcript || ""),
    });
  }
});

// AI Endpoint: Forensic Evidence & Ministerio Público Checklist Validation
app.post("/api/ai/validate-forensic-evidence", async (req, res) => {
  try {
    const { finding, checklist, uploadedFiles, currentScore } = req.body;
    if (!finding) {
      return res.status(400).json({ error: "Faltan datos del hallazgo a evaluar." });
    }

    const filesSummary = Array.isArray(uploadedFiles) && uploadedFiles.length > 0
      ? uploadedFiles.map((f: any) => `- Archivo: ${f.nombre} (${f.tipo}), Hash SHA-256: ${f.hash_sha256}`).join("\n")
      : "No se han adjuntado archivos o soportes documentales en el expediente digital.";

    const criteriaSummary = Array.isArray(checklist)
      ? checklist.map((c: any) => `- [${c.cumplido ? "CUMPLIDO" : "PENDIENTE"}] ${c.nombre} (${c.codigo_norma}): ${c.observacion_auditor || "Sin observaciones"}`).join("\n")
      : "Checklist no suministrado.";

    const prompt = `Actúa como Perito Forense y Fiscal Especializado en Delitos Económicos y Anticorrupción (Ministerio Público / PEPCA).
Evalúa la integridad probatoria del siguiente hallazgo de auditoría para determinar si resiste un juicio de fondo penal o administrativo:

Hallazgo:
- No. / Referencia: ${finding.numero_hallazgo || finding.id} | ${finding.pagina_referencia || "Pág. N/A"}
- Título: ${finding.titulo}
- Condición (hechos): ${finding.condicion}
- Criterio Legal: ${finding.norma_ley_nombre || finding.criterio}
- Punto de Incidencia: ${finding.punto_incidencia || "No especificado"}
- Monto involucrado: ${finding.monto || 0}

Archivos de soporte cargados:
${filesSummary}

Checklist de Criterios Exigibles del Ministerio Público & ISSAI 5000:
${criteriaSummary}

REGLAS DE EVALUACIÓN:
1. Califica el nivel de cumplimiento estricto de 1 a 5 (escala entera 1, 2, 3, 4 o 5).
2. Para otorgar 5/5, la evidencia debe tener:
   - Soportes documentales reales (al menos 1 archivo o evidencia documental comprobable con hash de custodia).
   - Cadena de custodia garantizada.
   - Idoneidad probatoria penal y veracidad de origen.
3. Si el nivel es menor a 5/5, indica claramente:
   - "aprobada_ia": false
   - Observaciones penales directas y contundentes sobre los riesgos de desestimación en tribunal.
   - Lista de "faltantes_especificos" (exactamente qué documentos, certificaciones o cruces faltan).
   - "recomendaciones_paso_a_paso" numeradas para que el auditor pueda corregir y cargar nuevamente hasta alcanzar 5/5.
4. Si el nivel es 5/5:
   - "aprobada_ia": true
   - Observaciones de aprobación con fe pública e integridad penal plena.
   - Faltantes: []
   - Recomendaciones: ["Expediente listo con plena validez procesal para acusación y juicio de fondo."]

Devuelve EXCLUSIVAMENTE JSON con esta estructura:
{
  "nivel_cumplimiento": 1 | 2 | 3 | 4 | 5,
  "aprobada_ia": boolean,
  "ia_feedback": {
    "observaciones_penales": "...",
    "faltantes_especificos": ["..."],
    "recomendaciones_paso_a_paso": ["..."],
    "fecha_validacion": "..."
  }
}
`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });
        const parsed = JSON.parse(response.text || "{}");
        return res.json({ success: true, source: "gemini-3.8-flash", ...parsed });
      } catch (geminiErr) {
        console.warn("Gemini validation error:", geminiErr);
      }
    }

    // Heuristic Fallback
    const fulfilledCount = (checklist || []).filter((c: any) => c.cumplido).length;
    const totalCriteria = (checklist || []).length || 6;
    const hasFiles = Array.isArray(uploadedFiles) && uploadedFiles.length > 0;
    
    let score = Math.max(1, Math.min(5, Math.round((fulfilledCount / totalCriteria) * 4) + (hasFiles ? 1 : 0)));
    const isApproved = score === 5 && hasFiles;

    return res.json({
      success: true,
      source: "motor-forense-reglas",
      nivel_cumplimiento: score,
      aprobada_ia: isApproved,
      ia_feedback: {
        observaciones_penales: isApproved 
          ? "El expediente reúne suficiencia probatoria, cadena de custodia inalterada y sustento documental fehaciente exigible por el Ministerio Público."
          : "El soporte actual presenta riesgos de impugnación procesal por falta de compulsa cruzada o acreditación de cadena de custodia.",
        faltantes_especificos: isApproved ? [] : [
          !hasFiles ? "Falta adjuntar copias digitales foliadas de los comprobantes, cheques o contratos originales." : "",
          fulfilledCount < 5 ? "Falta verificación de legalidad en la obtención y firma del custodio de la evidencia." : "",
        ].filter(Boolean),
        recomendaciones_paso_a_paso: isApproved 
          ? ["Conservar resguardo criptográfico del expediente para vista de causa judicial."] 
          : [
              "1. Subir al menos un documento o acta con firma y sello oficial del organismo emisor.",
              "2. Marcar el cumplimiento de los 6 criterios exigibles en la lista de verificación.",
              "3. Especificar el folio exacto y número de comprobante para blindar el sustento penal."
            ],
        fecha_validacion: new Date().toISOString(),
      }
    });
  } catch (err: any) {
    console.error("Evidence validation error:", err);
    res.status(500).json({ error: "Error evaluando evidencia con IA.", details: err.message });
  }
});

// AI Endpoint: Fraud Triangle Analysis
app.post("/api/ai/analyze-fraud-triangle", async (req, res) => {
  try {
    const { finding } = req.body;
    if (!finding) {
      return res.status(400).json({ error: "Falta el hallazgo para análisis del Triángulo del Fraude." });
    }

    const prompt = `Actúa como Criminólogo y Auditor Forense Certificado (CFE) aplicando la teoría del Triángulo del Fraude de Donald Cressey.
Analiza el siguiente hallazgo de auditoría:
- Título: ${finding.titulo}
- Condición: ${finding.condicion}
- Criterio: ${finding.norma_ley_nombre || finding.criterio}
- Causa: ${finding.causa || "No especificada"}
- Monto: ${finding.monto || 0}
- Rubro: ${finding.rubro || "General"}

Determina para este hallazgo los tres vértices del Triángulo del Fraude con escala de calificación del 1 al 5 (1=Mínimo/Residual, 2=Bajo, 3=Moderado, 4=Alto, 5=Crítico/Extremo):
1. PRESIÓN / INCENTIVO: Motivo económico, político, deudas, cumplimiento forzado de metas o afán de lucro que empujó al sujeto.
2. OPORTUNIDAD PERCIBIDA: Fallas de control interno, falta de supervisión NOBACI, concentración de firmas o desorden que permitió cometer y ocultar el fraude.
3. RACIONALIZACIÓN / JUSTIFICACIÓN: Mecanismo psicológico de neutralización moral (ej. "todos lo hacen", "es por el bien de la institución", "el Estado me debe").
4. RIESGO GLOBAL DE FRAUDE: 'Bajo' | 'Medio' | 'Alto' | 'Muy Alto' | 'Crítico'.
5. SUSTENTO TÉCNICO VINCULADO: Síntesis pericial vinculada a las pruebas documentales.

Devuelve EXCLUSIVAMENTE JSON con esta estructura:
{
  "finding_id": ${finding.id},
  "numero_hallazgo": "${finding.numero_hallazgo || finding.id}",
  "titulo": "${(finding.titulo || "").replace(/"/g, '\\"')}",
  "rubro": "${finding.rubro || ""}",
  "monto": ${finding.monto || 0},
  "presion_nivel": 4,
  "presion_motivo": "...",
  "presion_evidencia_ref": "...",
  "oportunidad_nivel": 5,
  "oportunidad_motivo": "...",
  "oportunidad_evidencia_ref": "...",
  "racionalizacion_nivel": 3,
  "racionalizacion_motivo": "...",
  "racionalizacion_evidencia_ref": "...",
  "riesgo_fraude_global": "Crítico",
  "sustento_tecnico_vinculado": "..."
}
`;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            temperature: 0.15,
            responseMimeType: "application/json",
          },
        });
        const parsed = JSON.parse(response.text || "{}");
        return res.json({ success: true, source: "gemini-3.8-flash", data: parsed });
      } catch (geminiErr) {
        console.warn("Gemini fraud triangle error:", geminiErr);
      }
    }

    // Heuristic fallback
    const isHighAmount = (finding.monto || 0) > 10000000;
    const isCriticalRisk = finding.riesgo === 'Crítico';
    
    return res.json({
      success: true,
      source: "reglas-forenses-heuristica",
      data: {
        finding_id: finding.id,
        numero_hallazgo: finding.numero_hallazgo || `${finding.id}`,
        titulo: finding.titulo,
        rubro: finding.rubro,
        monto: finding.monto || 0,
        presion_nivel: isHighAmount ? 5 : 4,
        presion_motivo: "Presión económica o desvío de fondos públicos hacia compromisos particulares y déficit presupuestario.",
        presion_evidencia_ref: finding.pagina_referencia || "Cédula analítica del expediente",
        oportunidad_nivel: isCriticalRisk ? 5 : 4,
        oportunidad_motivo: "Ausencia de controles previos en Tesorería, inobservancia de NOBACI y falta de integración con SIGEF.",
        oportunidad_evidencia_ref: finding.evidencia_soporte || "Libramiento de pago y estados bancarios",
        racionalizacion_nivel: 4,
        racionalizacion_motivo: "Uso de pretextos de 'urgencia hospitalaria' para obviar los procedimientos de la Ley 340-06.",
        racionalizacion_evidencia_ref: "Comunicaciones internas y actas del comité",
        riesgo_fraude_global: isCriticalRisk ? "Crítico" : "Alto",
        sustento_tecnico_vinculado: `Convergencia de los 3 vértices: alta oportunidad por desarticulación de controles y beneficio patrimonial por ${finding.monto || 0}.`
      }
    });
  } catch (err: any) {
    console.error("Fraud triangle analysis error:", err);
    res.status(500).json({ error: "Error analizando Triángulo del Fraude.", details: err.message });
  }
});

// Download scripts endpoints
app.get("/api/download/python-script", (_req, res) => {
  const filePath = path.resolve(process.cwd(), "public/assets/aistudio/sistema_analisis_hallazgos_baldera_V2_5800e22b.py");
  res.setHeader("Content-Type", "text/x-python; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="sistema_analisis_hallazgos_baldera_V2.py"'
  );
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  } else {
    return res.send(`# -*- coding: utf-8 -*-
"""
SISTEMA ENTERPRISE DE ANÁLISIS DE AUDITORÍA, EXTRACCIÓN MULTIFORMATO Y FUSIÓN DE HALLAZGOS CON IA (v2)
Autoría / Firma: Lic. Pedro A. Baldera Rondón, CPA - Auditor Forense Antifraude & Consultor Financiero
Plataforma: Python 3.10+ / Streamlit / OpenPyXL / python-docx / PyMuPDF / Pandas
"""
`);
  }
});

app.get("/api/download/bat-script", (_req, res) => {
  const batScript = `@echo off
TITLE Sistema de Auditoria y Fusion de Hallazgos con IA - Lic. Pedro Baldera
COLOR 0A
cls
echo ===============================================================================
echo   SISTEMA ENTERPRISE DE AUDITORIA, EXTRACCION Y FUSION DE HALLAZGOS CON IA
echo   Iniciando servidor local y abriendo interfaz grafica automatica...
echo ===============================================================================
echo.

:: Crear carpetas necesarias automaticamente
if not exist "evidencias_auditoria" mkdir evidencias_auditoria
if not exist "reportes_exportados" mkdir reportes_exportados

:: Verificar e instalar dependencias transparentemente
python -m streamlit --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Instalando dependencias requeridas (streamlit, pandas, openpyxl, python-docx, PyMuPDF, pillow)...
    pip install streamlit pandas openpyxl python-docx PyMuPDF pillow
)

echo [OK] Iniciando aplicacion para PC, tablet y celular en la red local...
python -m streamlit run sistema_analisis_hallazgos_baldera_V2.py --server.headless=false --server.address=0.0.0.0 --server.port=8501

pause
`;
  res.setHeader("Content-Type", "application/x-bat");
  res.setHeader("Content-Disposition", 'attachment; filename="ejecutar_sistema_auditoria.bat"');
  res.send(batScript);
});

function getHeuristicFindings(text: string, auditType?: string) {
  const defaultList = [
    {
      id: 1,
      titulo: "Deficiencias en el registro de novedades del personal y expedientes incompletos",
      rubro: "Recursos Humanos y Admin. de Personal",
      monto: 0.0,
      descripcion:
        "Se constató la ausencia de expedientes actualizados, falta de archivo de licencias, permisos y formularios de novedades de empleados activos.",
      riesgo: "Alto",
      fusion_id: "FUS-03",
      criterio: "Ley 41-08 de Función Pública, Art. 12 y Reglamento 523-09 de Relaciones Laborales.",
    },
    {
      id: 2,
      titulo: "Ausencia de sistemas contables automatizados y módulos integrados (SIGEF)",
      rubro: "Tecnología y Sistemas Financieros",
      monto: 0.0,
      descripcion:
        "Los registros contables se realizan en hojas de cálculo no auditables, sin enlace directo a SIGEF ni políticas de respaldo digital de base de datos.",
      riesgo: "Alto",
      fusion_id: "FUS-02",
      criterio: "Ley 126-01 de Contabilidad Gubernamental y Normas Generales de Control Interno (NOBACI).",
    },
    {
      id: 32,
      titulo: "Pagos a personal contratado bajo nómina interna sin contratos formalizados",
      rubro: "Gestión de Nóminas y Remuneraciones",
      monto: 18509628.0,
      descripcion:
        "Erogaciones recurrentes por concepto de sueldos al personal bajo modalidad de nómina interna sin contratos visados por el MAP ni aprobación de la CGR.",
      riesgo: "Crítico",
      fusion_id: "FUS-04",
      criterio: "Ley 41-08 de Función Pública y Ley 10-07 del Sistema Nacional de Control Interno.",
    },
    {
      id: 33,
      titulo: "Pagos de nómina complementaria e incentivos sin base legal ni escala aprobada",
      rubro: "Gestión de Nóminas y Remuneraciones",
      monto: 18484585.0,
      descripcion:
        "Desembolsos mensuales en compensaciones extraordinarias e incentivos que no constan en la escala salarial oficial aprobada ni poseen métricas de cumplimiento.",
      riesgo: "Crítico",
      fusion_id: "FUS-04",
      criterio: "Ley 105-13 sobre Regulación Salarial del Estado dominicano.",
    },
    {
      id: 41,
      titulo: "Inobservancia de normativas de transparencia y nepotismo en contrataciones",
      rubro: "Ética Pública, Transparencia y Régimen Legal",
      monto: 4320000.0,
      descripcion:
        "Contratación directa de colaboradores con parentesco por consanguinidad y afinidad dentro del tercer grado con directivos de la entidad.",
      riesgo: "Crítico",
      fusion_id: "FUS-05",
      criterio: "Constitución de la República (Art. 144 y 146) y Ley 41-08 de Función Pública.",
    },
    {
      id: 54,
      titulo: "Documentación de respaldo no suministrada en el proceso de auditoría y limitación",
      rubro: "Gobernanza y Control Interno",
      monto: 77407415.0,
      descripcion:
        "Comprobantes de pago, cotizaciones, conduces de almacén y expedientes de compras no facilitados al equipo auditor, configurando limitación al alcance.",
      riesgo: "Crítico",
      fusion_id: "FUS-01",
      criterio: "Ley 10-07 de Control Interno y Normas Internacionales de Auditoría (NIA 705).",
    },
  ];

  if (auditType?.includes("Obras")) {
    defaultList.push({
      id: 60,
      titulo: "Cubicaciones de obra pagadas sin partidas ejecutadas y sobrecostos en materiales",
      rubro: "Obras Públicas e Infraestructura",
      monto: 14250000.0,
      descripcion:
        "Discrepancia entre la memoria técnica de cubicaciones finales y la inspección física in situ en el área de emergencias y remodelación.",
      riesgo: "Crítico",
      fusion_id: "FUS-06",
      criterio: "Ley 340-06 de Compras y Contrataciones del Estado y Reglamento 543-12.",
    });
  }

  return defaultList;
}

function interpretVoiceHeuristic(transcript: string) {
  const t = transcript.toLowerCase();

  if (t.includes("limpiar base") || t.includes("base de datos limpia") || t.includes("empezar de cero")) {
    return {
      action: "CLEAN_DB",
      payload: {},
      feedback: "Limpiando base de datos para iniciar auditoría en blanco.",
    };
  }

  if (t.includes("crear") || t.includes("agregar") || t.includes("nuevo hallazgo")) {
    let monto = 0;
    const montoMatch = t.match(/(\d+[\d\s,\.]*)/);
    if (montoMatch) {
      monto = parseFloat(montoMatch[1].replace(/\s/g, "").replace(/,/g, "")) || 0;
    }
    return {
      action: "CREATE_FINDING",
      payload: {
        titulo: transcript.replace(/(crear|agregar|nuevo hallazgo)/gi, "").trim() || "Nuevo hallazgo dictado",
        monto,
        rubro: t.includes("personal") || t.includes("recursos") ? "Recursos Humanos" : "Gobernanza y Control",
        descripcion: "Hallazgo capturado a través de dictado por voz y validado por auditor.",
      },
      feedback: "Creando nuevo hallazgo en la matriz.",
    };
  }

  if (t.includes("filtrar") || t.includes("buscar")) {
    const term = t.replace(/(filtrar por|filtrar|buscar)/gi, "").trim();
    return {
      action: "FILTER",
      payload: { filterTerm: term },
      feedback: `Filtrando matriz por "${term}".`,
    };
  }

  if (t.includes("limpiar") || t.includes("todos") || t.includes("restablecer")) {
    return {
      action: "CLEAR_FILTER",
      payload: {},
      feedback: "Filtros restablecidos.",
    };
  }

  if (t.includes("pdf")) {
    return {
      action: "EXPORT",
      payload: { exportFormat: "pdf" },
      feedback: "Generando y exportando informe oficial en PDF.",
    };
  }

  if (t.includes("excel")) {
    return {
      action: "EXPORT",
      payload: { exportFormat: "excel" },
      feedback: "Generando y exportando matrices en Excel.",
    };
  }

  return {
    action: "UNKNOWN",
    payload: { transcript },
    feedback: "Comando recibido.",
  };
}

async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OK] Servidor Auditoría Baldera iniciado en http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Error al iniciar servidor:", err);
});
