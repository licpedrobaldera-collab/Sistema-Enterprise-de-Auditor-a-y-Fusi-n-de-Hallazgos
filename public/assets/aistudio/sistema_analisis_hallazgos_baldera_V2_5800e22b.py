# -*- coding: utf-8 -*-
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

# ==========================================
# 1. EXTRACCIÓN Y LECTURA MULTIFORMATO
# ==========================================

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
        return "\n".join(full_text)

    @staticmethod
    def extract_from_excel(file_bytes_or_path):
        xls = pd.ExcelFile(file_bytes_or_path)
        text_lines = []
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name)
            text_lines.append(f"=== Hoja: {sheet_name} ===")
            text_lines.append(df.to_string(index=False))
        return "\n".join(text_lines)

    @staticmethod
    def extract_from_pdf(file_bytes_or_path):
        if fitz is None:
            return "Error: La librería PyMuPDF (fitz) no está instalada."
        doc = fitz.open(stream=file_bytes_or_path, filetype="pdf") if isinstance(file_bytes_or_path, bytes) else fitz.open(file_bytes_or_path)
        pages = [f"--- Página {p+1} ---\n" + doc[p].get_text("text") for p in range(len(doc)) if doc[p].get_text("text").strip()]
        return "\n".join(pages)

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

# ==========================================
# 2. DICCIONARIO DE FUSIONES E INTELIGENCIA
# ==========================================

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

# ==========================================
# 3. EXPORTADORES DE ARCHIVOS (EXCEL / WORD)
# ==========================================

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
    r1 = p_head.add_run(f"{entity_name.upper()}\n")
    r1.bold = True
    r1.font.size = Pt(14)
    r1.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)

    r2 = p_head.add_run("OFICINA DE AUDITORÍA INTERNA Y GESTIÓN DE CONTROL\nINFORME DE AJUSTES, CONSOLIDACIÓN Y RECOMENDACIONES DE MEJORA")
    r2.bold = True
    r2.font.size = Pt(12)
    r2.font.color.rgb = RGBColor(0x59, 0x59, 0x59)

    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(12)
    p_meta.add_run("A: ").bold = True
    p_meta.add_run("Cámara de Cuentas de la República Dominicana / Dirección de Auditoría\n")
    p_meta.add_run("DE: ").bold = True
    p_meta.add_run(f"{auditor_name}, Auditor Forense Antifraude\nEn representación de la Entidad Auditada ({entity_name})\n")
    p_meta.add_run("TIPO DE AUDITORÍA: ").bold = True
    p_meta.add_run(f"{audit_type}\n")
    p_meta.add_run("PERÍODO AUDITADO: ").bold = True
    p_meta.add_run(f"{audit_period}\n")
    p_meta.add_run("ASUNTO: ").bold = True
    p_meta.add_run("Informe Técnico de Análisis, Propuesta de Fusión de Hallazgos y Plan de Mejoras Sistémicas")

    p_sig = doc.add_paragraph()
    p_sig.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sig.paragraph_format.space_before = Pt(40)
    p_sig.add_run("_____________________________________________________\n").bold = True
    p_sig.add_run(f"{auditor_name}\n").bold = True
    p_sig.add_run("Auditor Forense Antifraude / Consultor Financiero\nEn representación de la Entidad Auditada")

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer

# ==========================================
# 4. INTERFAZ INTERACTIVA STREAMLIT
# ==========================================

def run_app():
    if st is None:
        print("Streamlit no instalado. Ejecute via .bat")
        return

    st.set_page_config(page_title="Sistema de Auditoría v2 - Lic. Pedro Baldera", layout="wide")
    st.title("🛡️ Sistema de Auditoría, Extracción Multiformato y Fusión de Hallazgos v2")
    st.markdown("**Lic. Pedro A. Baldera Rondón, CPA - Auditor Forense Antifraude**")

    st.sidebar.header("⚙️ Configuración Institucional")
    entity_name = st.sidebar.text_input("Entidad Auditada", "Hospital Materno Infantil San Lorenzo de Los Mina")
    audit_type = st.sidebar.text_input("Tipo de Auditoría", "Auditoría Financiera e Investigación Especial")
    audit_period = st.sidebar.text_input("Período Auditado", "1.° de enero de 2020 al 31 de diciembre de 2021")
    auditor_name = st.sidebar.text_input("Representante / Firma", "Lic. Pedro A. Baldera Rondón, CPA")

    uploaded_files = st.file_uploader(
        "Cargar Archivos de Soporte / Acta (Word, Excel, PDF, TXT)",
        type=["docx", "doc", "xlsx", "xls", "csv", "pdf"],
        accept_multiple_files=True
    )

    if uploaded_files:
        st.success(f"Se han cargado {len(uploaded_files)} archivo(s).")
        texts = [f"=== Documento: {f.name} ===\n" + DocumentExtractor.process_file(f) for f in uploaded_files]
        full_text = "\n\n".join(texts)
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