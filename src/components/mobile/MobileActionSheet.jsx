import React from 'react';
import { 
  X, 
  ShoppingBag, 
  Package, 
  Camera, 
  Share2, 
  Download, 
  Sparkles,
  Smartphone
} from 'lucide-react';

export default function MobileActionSheet({
  isOpen,
  onClose,
  onOpenOrderCapture,
  onOpenAddProduct,
  onGoToPurchases,
  onOpenShareCatalog,
  onOpenInstallGuide
}) {
  if (!isOpen) return null;

  const actions = [
    {
      title: 'Capturar Pedido Rápido',
      subtitle: 'Crear pedido, apartar stock y mandar ticket WhatsApp',
      icon: ShoppingBag,
      gradient: 'from-emerald-500 to-teal-600',
      badge: 'Más Usado',
      onClick: () => {
        onClose();
        onOpenOrderCapture();
      }
    },
    {
      title: 'Ingresar Compra de Cajas',
      subtitle: 'Registrar lote nuevo con costo, flete y piezas',
      icon: Package,
      gradient: 'from-indigo-500 to-blue-600',
      onClick: () => {
        onClose();
        onGoToPurchases();
      }
    },
    {
      title: 'Subir Squishy con Fotos',
      subtitle: 'Tomar foto con la cámara y asignar precio',
      icon: Camera,
      gradient: 'from-pink-500 to-rose-600',
      onClick: () => {
        onClose();
        onOpenAddProduct();
      }
    },
    {
      title: 'Compartir Catálogo a Clientes',
      subtitle: 'Liga blindada sin costos ni márgenes para clientes',
      icon: Share2,
      gradient: 'from-purple-500 to-indigo-600',
      onClick: () => {
        onClose();
        onOpenShareCatalog();
      }
    },
    {
      title: 'Instalar App en el Celular',
      subtitle: 'Agregar a la pantalla de inicio sin usar tienda',
      icon: Smartphone,
      gradient: 'from-amber-500 to-orange-600',
      onClick: () => {
        onClose();
        onOpenInstallGuide();
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Action Sheet Card */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-5 shadow-2xl z-10 pb-safe animate-in slide-in-from-bottom duration-300">
        
        {/* Drag handle pill */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">Acciones Rápidas</h3>
            <p className="text-xs text-slate-400 font-medium">Selecciona lo que deseas hacer</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 mb-3">
          {actions.map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                onClick={act.onClick}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 active:scale-[0.98] transition-all text-left group"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${act.gradient} text-white flex items-center justify-center shadow-md shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-slate-800 group-hover:text-pink-600 transition-colors">
                      {act.title}
                    </span>
                    {act.badge && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        {act.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {act.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-200/70 text-slate-700 font-bold text-xs active:scale-95 transition-all"
        >
          Cerrar
        </button>

      </div>
    </div>
  );
}
