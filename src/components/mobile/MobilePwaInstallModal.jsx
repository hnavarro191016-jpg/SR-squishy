import React from 'react';
import { 
  X, 
  Smartphone, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  Download, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function MobilePwaInstallModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom pb-safe">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-xl text-white shadow-md shadow-pink-500/30">
              🧸
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Instalar SquishyApp</h3>
              <p className="text-[11px] text-slate-400 font-semibold">Usa como app nativa en tu celular</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Beneficios */}
        <div className="bg-pink-50/70 rounded-2xl p-3 border border-pink-100 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-pink-900">
            <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
            <span>Pantalla completa sin barra de navegación</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-pink-900">
            <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
            <span>Acceso instantáneo con 1 toque desde tu pantalla</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-pink-900">
            <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
            <span>Captura de pedidos y compras súper ágil</span>
          </div>
        </div>

        {/* Instrucciones iPhone & Android */}
        <div className="space-y-3 pt-1">
          {/* iOS Safari */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <span>🍎 En iPhone / iPad (Safari)</span>
            </span>
            <p className="text-xs text-slate-700 leading-relaxed">
              1. Toca el botón <b>Compartir</b> <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" /> en la barra inferior de Safari.<br />
              2. Baja y pulsa <b>"Agregar a pantalla de inicio"</b> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5" />.<br />
              3. Toca <b>"Agregar"</b> arriba a la derecha. ¡Listo!
            </p>
          </div>

          {/* Android Chrome */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <span>🤖 En Android (Chrome)</span>
            </span>
            <p className="text-xs text-slate-700 leading-relaxed">
              1. Toca los <b>3 puntos</b> <MoreVertical className="w-3.5 h-3.5 inline mx-0.5" /> arriba a la derecha.<br />
              2. Selecciona <b>"Instalar aplicación"</b> o <b>"Agregar a la pantalla principal"</b>.<br />
              3. Confirma y el ícono 🧸 aparecerá en tu menú de apps.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black text-xs active:scale-95 transition-all"
        >
          ¡Entendido, gracias!
        </button>

      </div>
    </div>
  );
}
