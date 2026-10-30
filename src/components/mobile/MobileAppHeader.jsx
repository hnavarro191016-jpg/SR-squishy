import React from 'react';
import { 
  Store, 
  Wifi, 
  Plus, 
  Monitor, 
  Share2, 
  Sparkles,
  ShoppingBag,
  Package,
  Layers,
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isSupabaseConfigured } from '../../supabaseClient';

export default function MobileAppHeader({ 
  onOpenActionSheet, 
  onSwitchToDesktop,
  activeTab,
  onOpenShareCatalog,
  onTriggerInstall,
  onLogout
}) {
  const { locations, activeLocationId, setActiveLocationId, orders } = useApp();

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true
  );

  const activeOrdersCount = (orders || []).filter(o => 
    ['nuevo', 'preparado', 'por_entregar'].includes(o.status)
  ).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs pt-safe">
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
        
        {/* Brand & Store Selector */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-300 flex items-center justify-center text-xl shadow-md shadow-pink-500/20 shrink-0">
            🧸
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-slate-900 tracking-tight">SquishyApp</span>
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-pink-100 text-pink-700">
                PRO
              </span>
              {/* Online Cloud indicator */}
              <span 
                className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" 
                title={isSupabaseConfigured ? "Sincronizado con Supabase en la nube" : "Modo local rápido"}
              />
            </div>
            
            {/* Quick Location Dropdown Pill */}
            <div className="flex items-center gap-1 text-slate-600">
              <Store className="w-3 h-3 text-pink-600 shrink-0" />
              <select
                value={activeLocationId}
                onChange={(e) => setActiveLocationId(e.target.value)}
                className="text-[11px] font-bold text-slate-700 bg-transparent outline-none truncate max-w-[130px] cursor-pointer"
              >
                {locations.filter(l => !l.isWarehouse).map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Botón Instalar App (Solo visible cuando se navega dentro del navegador web para quitar la barra) */}
          {!isStandalone && onTriggerInstall && (
            <button
              onClick={onTriggerInstall}
              aria-label="Instalar como App para pantalla completa"
              className="h-9 px-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-extrabold text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow-xs"
              title="Instalar en pantalla de inicio (Quita las barras del navegador)"
            >
              <span className="text-xs">📲</span>
              <span>Instalar</span>
            </button>
          )}

          {/* Share Catalog Button */}
          {onOpenShareCatalog && (
            <button
              onClick={onOpenShareCatalog}
              aria-label="Compartir catálogo"
              className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center active:scale-95 transition-all"
              title="Compartir catálogo blindado a clientes"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {/* Switch to Desktop view */}
          <button
            onClick={onSwitchToDesktop}
            aria-label="Cambiar a vista de escritorio"
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center active:scale-95 transition-all"
            title="Ver versión completa de escritorio"
          >
            <Monitor className="w-4 h-4" />
          </button>

          {/* Botón Salir / Ver como Cliente */}
          {onLogout && (
            <button
              onClick={onLogout}
              aria-label="Cerrar sesión y ver como cliente"
              className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:text-rose-600 flex items-center justify-center active:scale-95 transition-all"
              title="Cerrar sesión y volver al catálogo público de clientes"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Quick Action Button (FAB Trigger) */}
          <button
            onClick={onOpenActionSheet}
            className="h-9 px-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-extrabold text-xs shadow-md shadow-pink-500/25 flex items-center gap-1 active:scale-95 transition-all"
            title="Acciones Rápidas (+ Pedido, + Compra, + Squishy)"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Acción</span>
          </button>
        </div>

      </div>
    </header>
  );
}
