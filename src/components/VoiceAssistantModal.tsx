import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { AuditFinding, RiskLevel } from '../types/audit';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFinding: (finding: AuditFinding) => void;
  onFilterText: (text: string) => void;
  onTriggerExport: (format: 'pdf' | 'excel' | 'word' | 'csv') => void;
  onAddNotification: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'danger') => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onAddFinding,
  onFilterText,
  onTriggerExport,
  onAddNotification,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [hasSupport, setHasSupport] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setHasSupport(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'es-DO'; // Spanish / Dominican Republic / Latin America

    recognition.onresult = (event: any) => {
      let currentText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentText += event.results[i][0].transcript;
      }
      setTranscript(currentText);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      setProcessingStatus(`Estado de voz: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setProcessingStatus('Escuchando dictado de voz del auditor...');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const speakFeedback = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  const executeVoiceCommand = async () => {
    if (!transcript.trim()) return;

    setProcessingStatus('Interpretando comando con IA...');

    try {
      const res = await fetch('/api/ai/process-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();
      const action = data.action;

      if (!action) {
        setProcessingStatus('No se pudo procesar la instrucción.');
        return;
      }

      const feedback = action.feedback || 'Comando procesado.';
      speakFeedback(feedback);
      setProcessingStatus(feedback);

      if (action.action === 'CREATE_FINDING') {
        const payload = action.payload || {};
        const newFinding: AuditFinding = {
          id: Date.now() % 10000,
          titulo: payload.titulo || transcript,
          rubro: payload.rubro || 'Gobernanza y Control Interno',
          descripcion: payload.descripcion || 'Hallazgo registrado mediante dictado por voz.',
          monto: Number(payload.monto) || 0,
          riesgo: (payload.riesgo as RiskLevel) || 'Medio',
          fusion_id: payload.fusion_id || 'FUS-01',
          criterio: payload.criterio || 'Normativa de Control Interno Vigente',
          fecha_registro: new Date().toISOString().slice(0, 10),
          estado: 'Confirmado',
        };
        onAddFinding(newFinding);
        onAddNotification(
          'Hallazgo Creado por Voz',
          `"${newFinding.titulo}" agregado exitosamente a la matriz.`,
          'success'
        );
      } else if (action.action === 'FILTER') {
        const term = action.payload?.filterTerm || '';
        onFilterText(term);
        onAddNotification('Filtro por Voz Aplicado', `Mostrando hallazgos con "${term}"`, 'info');
      } else if (action.action === 'CLEAR_FILTER') {
        onFilterText('');
        onAddNotification('Filtros Limpiados', 'Se han restablecido los filtros de la matriz.', 'info');
      } else if (action.action === 'EXPORT') {
        const fmt = (action.payload?.exportFormat || 'pdf') as 'pdf' | 'excel' | 'word' | 'csv';
        onTriggerExport(fmt);
        onAddNotification('Exportación por Voz', `Exportando informe en formato ${fmt.toUpperCase()}`, 'success');
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      setProcessingStatus('Error al comunicar con el servidor.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-950/80 border border-blue-800/60 px-3 py-1 rounded-full text-xs text-blue-300 font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Módulo de Comandos & Dictado por Voz</span>
          </div>
          <h3 className="text-lg font-bold text-white">Asistente Vocal de Auditoría</h3>
          <p className="text-xs text-slate-400 mt-1">
            Dicta nuevos hallazgos, aplica filtros o ejecuta exportaciones sin usar el teclado
          </p>
        </div>

        {/* Microphone Button with Pulsing Wave */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="relative">
            {isListening && (
              <>
                <div className="absolute -inset-4 rounded-full bg-rose-500/20 animate-ping" />
                <div className="absolute -inset-8 rounded-full bg-rose-500/10 animate-pulse" />
              </>
            )}

            <button
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition relative z-10 ${
                isListening
                  ? 'bg-rose-600 text-white ring-4 ring-rose-400/40 animate-pulse'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
              }`}
            >
              {isListening ? <Mic className="w-9 h-9" /> : <MicOff className="w-9 h-9" />}
            </button>
          </div>

          <span className="text-xs font-semibold text-slate-300 mt-4">
            {isListening ? 'Escuchando... Habla ahora' : 'Toca el micrófono para iniciar dictado'}
          </span>
        </div>

        {/* Transcript Box */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">Transcripción en Tiempo Real:</span>
            {transcript && (
              <button
                onClick={() => setTranscript('')}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                Limpiar
              </button>
            )}
          </div>
          <p className="min-h-[50px] font-mono text-slate-200 text-xs italic">
            {transcript || 'Esperando voz del auditor...'}
          </p>
        </div>

        {/* Status */}
        {processingStatus && (
          <div className="mt-3 text-center text-xs text-blue-300 flex items-center justify-center gap-1.5 font-medium">
            <Volume2 className="w-4 h-4 text-blue-400" />
            <span>{processingStatus}</span>
          </div>
        )}

        {/* Execute button */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={executeVoiceCommand}
            disabled={!transcript.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg transition"
          >
            Ejecutar Acción por Voz
          </button>
        </div>

        {/* Guide / Available commands */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300 block mb-1">Ejemplos de comandos:</span>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-950/40 p-2 rounded border border-slate-800">
              <span className="text-blue-300 font-bold block">Crear hallazgo:</span>
              "Crear hallazgo sobre compras de insumos sin cotizaciones monto 3500000 pesos"
            </div>
            <div className="bg-slate-950/40 p-2 rounded border border-slate-800">
              <span className="text-emerald-300 font-bold block">Exportar reporte:</span>
              "Exportar informe en formato PDF" o "Exportar matriz en Excel"
            </div>
            <div className="bg-slate-950/40 p-2 rounded border border-slate-800">
              <span className="text-amber-300 font-bold block">Filtrar tabla:</span>
              "Filtrar por nóminas" o "Buscar nepotismo"
            </div>
            <div className="bg-slate-950/40 p-2 rounded border border-slate-800">
              <span className="text-indigo-300 font-bold block">Restablecer:</span>
              "Limpiar filtros" o "Mostrar todos"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
