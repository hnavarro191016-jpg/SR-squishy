import React from 'react';
import { MessageCircle, Sparkles, Store, ShieldCheck, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function CustomerCatalogHeader({ onOpenAdminLogin }) {
  const { whatsappNumber } = useApp();

  const handleContactWhatsApp = () => {
    const cleanNumber = (whatsappNumber || '528123739027').replace(/\D/g, '') || '528123739027';
    const text = '🧸 ¡Hola! Estoy viendo tu catálogo de Squishys y me gustaría más información 😊';
    const url = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-sm pt-safe">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between">
        
        {/* Logo de la Tienda de Squishys */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 flex items-center justify-center text-2xl shadow-md shadow-pink-500/20">
            🧸
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg text-slate-900 tracking-tight">Catálogo de Squishys</span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>En Línea</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Fotos reales • Aparta tu squishy directo por WhatsApp
            </p>
          </div>
        </div>

        {/* Botones de Cabecera */}
        <div className="flex items-center gap-2">
          {/* Botón WhatsApp de Atención */}
          <button
            onClick={handleContactWhatsApp}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
            title="Escríbenos directamente a WhatsApp (81 2373 9027)"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          {/* Acceso Administrador */}
          {onOpenAdminLogin && (
            <button
              onClick={onOpenAdminLogin}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-black text-xs flex items-center gap-1.5 transition-all active:scale-95"
              title="Acceso exclusivo para el administrador"
            >
              <Lock className="w-3.5 h-3.5 text-pink-600" />
              <span>Admin</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
