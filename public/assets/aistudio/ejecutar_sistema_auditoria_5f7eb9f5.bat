@echo off
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