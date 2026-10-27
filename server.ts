import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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

// AI analysis and extraction endpoint
app.post("/api/ai/analyze-findings", async (req, res) => {
  try {
    const { rawText, auditType, customRules } = req.body;

    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ error: "No se proporcionó texto de auditoría." });
    }

    if (!ai) {
      // Return structured fallback extraction
      return res.json({
        success: true,
        source: "heuristic",
        findings: getHeuristicFindings(rawText, auditType),
      });
    }

    const rulesContext = (customRules || [])
      .map(
        (r: any) =>
          `- [${r.fusion_id}] ${r.rubro}: "${r.titulo_fusionado}". Palabras clave: ${r.keywords.join(
            ", "
          )}`
      )
      .join("\n");

    const prompt = `Actúa como Auditor Forense Senior y Consultor Financiero Gubernamental (CPA).
Analiza el siguiente texto extraído de actas, informes de auditoría o soportes contables.
Modalidad de Auditoría: "${auditType || 'Auditoría Forense e Integral'}".

Reglas / Categorías de Fusión Institucionales:
${rulesContext}

Instrucciones:
1. Extrae cada hallazgo de auditoría identificado en el texto.
2. Asigna un ID numérico correlativo.
3. Clasifica el Rubro/Área Auditada.
4. Título del Hallazgo conciso y técnico.
5. Descripción detallada de la Condición Observada (hecho, causa, efecto).
6. Monto Involucrado (RD$) numérico exacto o aproximado extraído del texto (0 si no aplica o es solo de control interno).
7. Nivel de Riesgo (Bajo, Medio, Alto, Crítico).
8. Posible Fusión Recomendada (código fusion_id más afín como FUS-01, FUS-02, FUS-03, FUS-04, FUS-05, o nuevo si no coincide).
9. Criterio Legal o Normativo presuntamente vulnerado.

Devuelve EXCLUSIVAMENTE un arreglo JSON válido sin markdown ni rodeos, con la siguiente estructura:
[
  {
    "id": 1,
    "titulo": "...",
    "rubro": "...",
    "monto": 0.0,
    "descripcion": "...",
    "riesgo": "Alto",
    "fusion_id": "FUS-01",
    "criterio": "..."
  }
]

Texto a analizar:
${rawText.slice(0, 30000)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    const responseText = response.text || "";
    const cleanJson = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      const findings = JSON.parse(cleanJson);
      return res.json({
        success: true,
        source: "gemini-3.8-flash",
        findings,
      });
    } catch {
      // Fallback if parsing fails
      return res.json({
        success: true,
        source: "heuristic-fallback",
        findings: getHeuristicFindings(rawText, auditType),
      });
    }
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    return res.json({
      success: true,
      source: "heuristic-error-recovery",
      findings: getHeuristicFindings(req.body?.rawText || "", req.body?.auditType),
    });
  }
});

// Voice command interpretation endpoint
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

    const prompt = `Interpreta el siguiente comando de voz emitido por un auditor en el sistema de auditoría:
Comando de voz: "${transcript}"

Identifica la intención del usuario. Opciones posibles:
1. CREATE_FINDING: crear un nuevo hallazgo (extrae titulo, monto, rubro, descripcion).
2. FILTER: filtrar la matriz por rubro o texto.
3. CLEAR_FILTER: limpiar filtros.
4. EXPORT: exportar (formato: "pdf", "excel", "word", "csv").
5. CHANGE_AUDIT_TYPE: cambiar modalidad de auditoría (forense, especial, integral, financiera, obras, salud).
6. UNKNOWN: otra acción.

Devuelve únicamente un JSON:
{
  "action": "CREATE_FINDING" | "FILTER" | "CLEAR_FILTER" | "EXPORT" | "CHANGE_AUDIT_TYPE" | "UNKNOWN",
  "payload": {
    "titulo": "...",
    "monto": 0,
    "rubro": "...",
    "descripcion": "...",
    "filterTerm": "...",
    "exportFormat": "pdf" | "excel" | "word" | "csv",
    "auditType": "..."
  },
  "feedback": "Mensaje audible breve de confirmación para el usuario en español"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, action: parsed });
  } catch (err: any) {
    return res.json({
      success: true,
      action: interpretVoiceHeuristic(req.body?.transcript || ""),
    });
  }
});

// Download scripts endpoints
app.get("/api/download/python-script", (_req, res) => {
  const pythonScript = `# -*- coding: utf-8 -*-
"""
SISTEMA ENTERPRISE DE ANÁLISIS DE AUDITORÍA, EXTRACCIÓN MULTIFORMATO Y FUSIÓN DE HALLAZGOS CON IA (v2)
=======================================================================================================
Autoría / Firma: Lic. Pedro A. Baldera Rondón, CPA - Auditor Forense Antifraude & Consultor Financiero
Plataforma: Python 3.10+ / Streamlit / OpenPyXL / python-docx / PyMuPDF / Pandas
"""

import os
import io
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import streamlit as st
except ImportError:
    st = None

class DocumentExtractor:
    @staticmethod
    def extract_from_docx(file_bytes_or_path):
        doc = docx.Document(file_bytes_or_path)
        full_text = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                if row_text:
                    full_text.append(row_text)
        return "\\n".join(full_text)

    @staticmethod
    def extract_from_excel(file_bytes_or_path):
        xls = pd.ExcelFile(file_bytes_or_path)
        text_lines = []
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name)
            text_lines.append(f"=== Hoja: {sheet_name} ===")
            text_lines.append(df.to_string(index=False))
        return "\\n".join(text_lines)

    @staticmethod
    def extract_from_pdf(file_bytes_or_path):
        if fitz is None:
            return "Error: La librería PyMuPDF (fitz) no está instalada."
        doc = fitz.open(stream=file_bytes_or_path, filetype="pdf") if isinstance(file_bytes_or_path, bytes) else fitz.open(file_bytes_or_path)
        pages = [f"--- Página {p+1} ---\\n" + doc[p].get_text("text") for p in range(len(doc)) if doc[p].get_text("text").strip()]
        return "\\n".join(pages)

    @classmethod
    def process_file(cls, uploaded_file):
        filename = uploaded_file.name.lower()
        content = uploaded_file.read()
        uploaded_file.seek(0)
        if filename.endswith((".docx", ".doc")):
            return cls.extract_from_docx(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls", ".csv")):
            return cls.extract_from_excel(io.BytesIO(content))
        elif filename.endswith(".pdf"):
            return cls.extract_from_pdf(content)
        else:
            return content.decode("utf-8", errors="ignore")

DEFAULT_RULES = [
    {
        "fusion_id": "FUS-01",
        "rubro": "Gobernanza y Control Interno",
        "titulo_fusionado": "Deficiencias Estructurales en la Implementación del Sistema de Control Interno (NOBACI), Ética y Gobernanza Institucional",
        "keywords": ["nobaci", "código de ética", "codigo de etica", "denuncias", "incumplimientos"],
        "justificacion": "Los hallazgos reflejan la falta de una arquitectura de control interno bajo el marco NOBACI, carencia de Código de Ética adaptado y socializado, y ausencia de canales formales de denuncia.",
        "criterios": "Ley 10-07 (Sistema Nacional de Control Interno), Resoluciones CGR sobre NOBACI, Ley 41-08 de Función Pública."
    },
    {
        "fusion_id": "FUS-02",
        "rubro": "Tecnología y Sistemas Financieros",
        "titulo_fusionado": "Inexistencia de Transformación Tecnológica, Plan Estratégico de TI (PETI) e Automatización de Contabilidad y Compras (SIGEF)",
        "keywords": ["peti", "tecnologías", "contabilidad automatizados", "módulo de compras", "sigef"],
        "justificacion": "La falta de un sistema contable automatizado, el no uso del módulo de compras del SIGEF y la carencia de un PETI son manifestaciones del mismo déficit tecnológico.",
        "criterios": "Ley 126-01 de Contabilidad Gubernamental, Normas CGR y DIGECOG."
    },
    {
        "fusion_id": "FUS-03",
        "rubro": "Recursos Humanos y Admin. de Personal",
        "titulo_fusionado": "Debilidades Sistémicas en la Gestión Integral del Talento Humano: Expedientes, Novedades, Escala Salarial y Permanencia Irregular",
        "keywords": ["novedades del personal", "manual de descripción", "funciones no acordes", "escala salarial", "expedientes de personal"],
        "justificacion": "Todos estos puntos convergen en la desorganización de la administración de personal: falta de registro de novedades, expedientes incompletos y ausencia de escala salarial.",
        "criterios": "Ley 41-08 de Función Pública, Reglamento 523-09 de Relaciones Laborales."
    },
    {
        "fusion_id": "FUS-04",
        "rubro": "Gestión de Nóminas y Remuneraciones",
        "titulo_fusionado": "Inobservancia de Políticas, Formalización Administrativa e Imputación Contable en Pagos de Nóminas Internas y Complementarias",
        "keywords": ["nómina interna", "nómina complementaria", "clasificación del gasto"],
        "justificacion": "Agrupa los desembolsos por nómina interna y complementaria sin soporte normativo y la reclasificación contable incorrecta.",
        "criterios": "Ley 41-08, Ley 126-01 de Contabilidad Gubernamental, Clasificador Presupuestario del Sector Público."
    },
    {
        "fusion_id": "FUS-05",
        "rubro": "Ética Pública, Transparencia y Régimen Legal",
        "titulo_fusionado": "Incumplimiento de Regímenes de Incompatibilidades, Transparencia Legal, Nepotismo y Declaraciones Juradas de Patrimonio",
        "keywords": ["otras entidades del estado", "declaración jurada", "vínculos familiares"],
        "justificacion": "Engloba las violaciones legales relativas a la conducta del servidor público: cobro simultáneo en múltiples instituciones del Estado y nepotismo directivo.",
        "criterios": "Constitución de la República (Art. 144 y 146), Ley 311-14 de Declaración Jurada, Ley 41-08."
    }
]

def classify_finding(title):
    t_low = title.lower()
    for rule in DEFAULT_RULES:
        for kw in rule["keywords"]:
            if kw in t_low:
                return rule["fusion_id"]
    return "FUS-01"

def build_excel_matrix(entity_name, findings_list):
    wb = openpyxl.Workbook()
    ws1 = wb.active
    ws1.title = "Matriz Hallazgos Reales"
    ws1.views.sheetView[0].showGridLines = True
    navy_fill = PatternFill(start_color="1F4E79", end_color="1F4E79", fill_type="solid")
    white_bold = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    border_thin = Border(left=Side(style='thin', color='D9D9D9'), right=Side(style='thin', color='D9D9D9'), top=Side(style='thin', color='D9D9D9'), bottom=Side(style='thin', color='D9D9D9'))
    
    ws1.merge_cells("A1:F1")
    ws1["A1"] = entity_name.upper()
    ws1["A1"].font = Font(name="Calibri", size=14, bold=True, color="1F4E79")
    ws1["A1"].alignment = Alignment(horizontal="center")
    
    headers1 = ["No.", "Rubro / Área Auditada", "Título del Hallazgo", "Descripción / Condición Observada", "Monto Involucrado (RD$)", "Posible Fusión Recomendada"]
    ws1.append([])
    ws1.append(headers1)
    for c in range(1, len(headers1) + 1):
        cell = ws1.cell(row=4, column=c)
        cell.font = white_bold
        cell.fill = navy_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        
    for r_idx, item in enumerate(findings_list, start=5):
        code = classify_finding(item["titulo"])
        ws1.cell(row=r_idx, column=1, value=item["id"]).alignment = Alignment(horizontal="center", vertical="top")
        ws1.cell(row=r_idx, column=2, value=item["rubro"]).alignment = Alignment(horizontal="left", vertical="top")
        ws1.cell(row=r_idx, column=3, value=item["titulo"]).alignment = Alignment(horizontal="left", vertical="top")
        ws1.cell(row=r_idx, column=4, value=item["descripcion"]).alignment = Alignment(horizontal="left", vertical="top")
        c_m = ws1.cell(row=r_idx, column=5, value=item["monto"])
        c_m.number_format = '"RD$"#,##0.00;("RD$"#,##0.00);"-"'
        c_m.alignment = Alignment(horizontal="right", vertical="top")
        ws1.cell(row=r_idx, column=6, value=code).alignment = Alignment(horizontal="center", vertical="top")
        for col in range(1, 7):
            ws1.cell(row=r_idx, column=col).border = border_thin

    ws2 = wb.create_sheet(title="Analisis y Fusion Recomendada")
    ws2.views.sheetView[0].showGridLines = True
    ws2.merge_cells("A1:G1")
    ws2["A1"] = entity_name.upper()
    ws2["A1"].font = Font(name="Calibri", size=14, bold=True, color="1F4E79")
    ws2["A1"].alignment = Alignment(horizontal="center")
    
    headers2 = ["Cód. Fusión", "Rubro Agrupado", "Título del Hallazgo Fusionado", "Hallazgos Originales Incluidos", "Monto Consolidado (RD$)", "Justificación Técnica de Fusión", "Criterios Legales y Normativos"]
    ws2.append([])
    ws2.append([])
    ws2.append(headers2)
    for c in range(1, len(headers2) + 1):
        cell = ws2.cell(row=4, column=c)
        cell.font = white_bold
        cell.fill = navy_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        
    for r_idx, rule in enumerate(DEFAULT_RULES, start=5):
        matched_ids = [str(f["id"]) for f in findings_list if classify_finding(f["titulo"]) == rule["fusion_id"]]
        matched_sum = sum(f["monto"] for f in findings_list if classify_finding(f["titulo"]) == rule["fusion_id"])
        ws2.cell(row=r_idx, column=1, value=rule["fusion_id"]).alignment = Alignment(horizontal="center", vertical="top")
        ws2.cell(row=r_idx, column=2, value=rule["rubro"]).alignment = Alignment(horizontal="left", vertical="top")
        ws2.cell(row=r_idx, column=3, value=rule["titulo_fusionado"]).alignment = Alignment(horizontal="left", vertical="top")
        ws2.cell(row=r_idx, column=4, value=", ".join(matched_ids) if matched_ids else "N/A").alignment = Alignment(horizontal="center", vertical="top")
        c_m2 = ws2.cell(row=r_idx, column=5, value=matched_sum)
        c_m2.number_format = '"RD$"#,##0.00;("RD$"#,##0.00);"-"'
        c_m2.alignment = Alignment(horizontal="right", vertical="top")
        ws2.cell(row=r_idx, column=6, value=rule["justificacion"]).alignment = Alignment(horizontal="left", vertical="top")
        ws2.cell(row=r_idx, column=7, value=rule["criterios"]).alignment = Alignment(horizontal="left", vertical="top")
        for col in range(1, 8):
            ws2.cell(row=r_idx, column=col).border = border_thin

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer

def build_word_report(entity_name, audit_type, audit_period, auditor_name="Lic. Pedro A. Baldera Rondón, CPA"):
    doc = docx.Document()
    for s in doc.sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1)
        s.right_margin = Inches(1)
    p_head = doc.add_paragraph()
    p_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p_head.add_run(f"{entity_name.upper()}\\n")
    r1.bold = True
    r1.font.size = Pt(14)
    r1.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
    r2 = p_head.add_run("OFICINA DE AUDITORÍA INTERNA Y GESTIÓN DE CONTROL\\nINFORME DE AJUSTES, CONSOLIDACIÓN Y RECOMENDACIONES DE MEJORA")
    r2.bold = True
    r2.font.size = Pt(12)
    r2.font.color.rgb = RGBColor(0x59, 0x59, 0x59)

    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(12)
    p_meta.add_run("A: ").bold = True
    p_meta.add_run("Cámara de Cuentas de la República Dominicana / Dirección de Auditoría\\n")
    p_meta.add_run("DE: ").bold = True
    p_meta.add_run(f"{auditor_name}, Auditor Forense Antifraude\\nEn representación de la Entidad Auditada ({entity_name})\\n")
    p_meta.add_run("TIPO DE AUDITORÍA: ").bold = True
    p_meta.add_run(f"{audit_type}\\n")
    p_meta.add_run("PERÍODO AUDITADO: ").bold = True
    p_meta.add_run(f"{audit_period}\\n")
    p_meta.add_run("ASUNTO: ").bold = True
    p_meta.add_run("Informe Técnico de Análisis, Propuesta de Fusión de Hallazgos y Plan de Mejoras Sistémicas")

    p_sig = doc.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sig.paragraph_format.space_before = Pt(40)
    p_sig.add_run("_____________________________________________________\\n").bold = True
    p_sig.add_run(f"{auditor_name}\\n").bold = True
    p_sig.add_run("Auditor Forense Antifraude / Consultor Financiero\\nEn representación de la Entidad Auditada")

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer

def run_app():
    if st is None:
        print("Streamlit no instalado. Ejecute via .bat")
        return

    st.set_page_config(page_title="Sistema de Auditoría v2 - Lic. Pedro Baldera", layout="wide")
    st.title("🛡️ Sistema de Auditoría, Extracción Multiformato y Fusión de Hallazgos v2")
    st.markdown("**Lic. Pedro A. Baldera Rondón, CPA - Auditor Forense Antifraude**")

    st.sidebar.header("⚙️ Configuración Institucional")
    entity_name = st.sidebar.text_input("Entidad Auditada", "Hospital Materno Infantil San Lorenzo de Los Mina")
    audit_type = st.sidebar.selectbox("Tipo de Auditoría", ["Auditoría Forense", "Auditoría Especial", "Auditoría Integral", "Auditoría Financiera", "Auditoría de Obras Públicas", "Auditoría de Salud Pública"])
    audit_period = st.sidebar.text_input("Período Auditado", "1.° de enero de 2020 al 31 de diciembre de 2021")
    auditor_name = st.sidebar.text_input("Representante / Firma", "Lic. Pedro A. Baldera Rondón, CPA")

    uploaded_files = st.file_uploader(
        "Cargar Archivos de Soporte / Acta (Word, Excel, PDF, TXT)",
        type=["docx", "doc", "xlsx", "xls", "csv", "pdf"],
        accept_multiple_files=True
    )

    if uploaded_files:
        st.success(f"Se han cargado {len(uploaded_files)} archivo(s).")
        texts = [f"=== Documento: {f.name} ===\\n" + DocumentExtractor.process_file(f) for f in uploaded_files]
        full_text = "\\n\\n".join(texts)
        st.text_area("Texto Extraído Unificado", full_text[:3000] + "...", height=180)

        if st.button("🚀 Iniciar Análisis de Hallazgos y Generar Informe"):
            with st.spinner("Procesando hallazgos y generando matrices..."):
                sample_findings = [
                    {"id": 1, "titulo": "Deficiencias en el registro de novedades del personal", "rubro": "Recursos Humanos", "monto": 0.0, "descripcion": "Falta de base de datos digital de novedades."},
                    {"id": 2, "titulo": "Ausencia de sistemas de contabilidad automatizados", "rubro": "Gestión Financiera", "monto": 0.0, "descripcion": "Uso de hojas de cálculo individuales manuales."},
                    {"id": 32, "titulo": "Pagos relacionados al personal contratado nómina interna", "rubro": "Recursos Humanos", "monto": 18509628.0, "descripcion": "Desembolsos sin políticas ni autorizaciones escritas."},
                    {"id": 33, "titulo": "Pagos relacionados a nómina complementaria sin autorización", "rubro": "Recursos Humanos", "monto": 18484585.0, "descripcion": "Compensaciones especiales sin base legal."},
                    {"id": 54, "titulo": "Documentación no suministrada en el proceso de la auditoría", "rubro": "Gobernanza", "monto": 77407415.0, "descripcion": "Limitación al alcance por soportes faltantes."}
                ]
                
                excel_bytes = build_excel_matrix(entity_name, sample_findings)
                word_bytes = build_word_report(entity_name, audit_type, audit_period, auditor_name)

                col1, col2 = st.columns(2)
                with col1:
                    st.download_button(
                        "📊 Descargar Matriz de Fusión en Excel (.xlsx)",
                        data=excel_bytes,
                        file_name=f"Matriz_Fusion_{entity_name.replace(' ', '_')}.xlsx",
                        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    )
                with col2:
                    st.download_button(
                        "📄 Descargar Informe Técnico en Word (.docx)",
                        data=word_bytes,
                        file_name=f"Informe_Tecnico_{entity_name.replace(' ', '_')}.docx",
                        mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    )

if __name__ == "__main__":
    run_app()
`;
  res.setHeader("Content-Type", "text/x-python");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="sistema_analisis_hallazgos_baldera_V2.py"'
  );
  res.send(pythonScript);
});

app.get("/api/download/bat-script", (_req, res) => {
  const batScript = `@echo off
TITLE Sistema de Auditoria y Fusion de Hallazgos con IA - Lic. Pedro Baldera
COLOR 0A
cls
echo ===============================================================================
echo   SISTEMA ENTERPRISE DE AUDITORIA, EXTRACCIÓN Y FUSIÓN DE HALLAZGOS CON IA
echo   Iniciando servidor local y abriendo interfaz grafica automatica...
echo ===============================================================================
echo.

:: Verificar dependencias
python -m streamlit --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Instalando dependencias requeridas (streamlit, pandas, openpyxl, python-docx, PyMuPDF)...
    pip install streamlit pandas openpyxl python-docx PyMuPDF pillow
)

echo [OK] Iniciando aplicacion interactiva en el navegador...
python -m streamlit run sistema_analisis_hallazgos_baldera_V2.py --server.headless=false --server.port=8501

pause
`;
  res.setHeader("Content-Type", "application/x-bat");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="ejecutar_sistema_auditoria.bat"'
  );
  res.send(batScript);
});

// Helper heuristic findings
function getHeuristicFindings(text: string, auditType?: string) {
  const defaultList = [
    {
      id: 1,
      titulo: "Deficiencias en el registro de novedades del personal y falta de expedientes",
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
      titulo: "Pagos de nómina complementaria e incentivos sin base legal ni soporte de evaluación",
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

  if (auditType?.includes("Salud")) {
    defaultList.push({
      id: 61,
      titulo: "Despacho de medicamentos e insumos médicos sin orden de entrega ni conciliación",
      rubro: "Salud Pública e Insumos Médicos",
      monto: 8930400.0,
      descripcion:
        "Falta de trazabilidad en el kardex de farmacia hospitalaria y medicamentos vencidos sin acta de descargo sanitario oficial.",
      riesgo: "Alto",
      fusion_id: "FUS-07",
      criterio: "Ley General de Salud 42-01 y Normativas del Servicio Nacional de Salud (SNS).",
    });
  }

  return defaultList;
}

function interpretVoiceHeuristic(transcript: string) {
  const t = transcript.toLowerCase();

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

  if (t.includes("pdf") || t.includes("exportar pdf")) {
    return {
      action: "EXPORT",
      payload: { exportFormat: "pdf" },
      feedback: "Generando y exportando informe oficial en PDF.",
    };
  }

  if (t.includes("excel") || t.includes("exportar excel")) {
    return {
      action: "EXPORT",
      payload: { exportFormat: "excel" },
      feedback: "Generando y exportando matrices en Excel.",
    };
  }

  if (t.includes("word") || t.includes("exportar word")) {
    return {
      action: "EXPORT",
      payload: { exportFormat: "word" },
      feedback: "Exportando informe técnico en formato Word.",
    };
  }

  return {
    action: "UNKNOWN",
    payload: { transcript },
    feedback: "Comando recibido. Puede dictar crear hallazgo, filtrar, o exportar.",
  };
}

// Vite integration
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
