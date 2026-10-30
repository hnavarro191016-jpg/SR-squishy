import React, { useState, useEffect } from 'react';
import { 
  Menu,
  X,
  Smartphone, 
  LayoutDashboard, 
  Package, 
  Store, 
  Calculator, 
  Wifi,
  PlusCircle,
  Trash2,
  MessageCircle,
  ShoppingBag,
  Share2,
  LogOut,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenMobileModal, 
  onOpenAddProduct, 
  onOpenShareCatalog,
  onSwitchToMobile,
  onLogout
}) {
  const { locations, activeLocationId, setActiveLocationId, clearAllData, whatsappNumber, setWhatsappNumber, orders } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeOrdersCount = (orders || []).filter(o => ['nuevo', 'preparado', 'por_entregar'].includes(o.status)).length;

  // Cerrar el drawer con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    if (isMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleClear = () => {
    if (window.confirm('¿Quieres vaciar todos los datos y dejar el sistema completamente en blanco para tus pruebas?')) {
      clearAllData();
      setIsMenuOpen(false);
    }
  };

  const handlePromptWhatsApp = () => {
    const num = window.prompt(
      'Ingresa tu número de WhatsApp para recibir pedidos directos de clientes (con código de país, ej. 528123739027):', 
      whatsappNumber || '528123739027'
    );
    if (num !== null) setWhatsappNumber(num.trim());
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs pt-safe w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* Logo y Branding Sr. Squishy (Izquierda limpia) */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer select-none shrink-0" 
              onClick={() => setActiveTab('pos')}
              title="Ir al Punto de Venta"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 flex items-center justify-center shadow-md shadow-pink-500/20 text-xl sm:text-2xl transform hover:scale-105 transition-transform shrink-0">
                🧸
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight leading-none">SquishyTrack</span>
                  <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 uppercase tracking-wider">PRO</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Sr. Squishy • Control Total</p>
              </div>
            </div>

            {/* Selector de Punto de Venta Activo (Desktop / Pantallas medianas) */}
            <div className="hidden md:flex items-center gap-2 bg-slate-100/90 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors">
              <Store className="w-4 h-4 text-pink-600 shrink-0" />
              <span className="text-xs text-slate-500 font-medium">Punto:</span>
              <select
                value={activeLocationId}
                onChange={(e) => setActiveLocationId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer max-w-[150px] truncate"
              >
                {locations.filter(l => !l.isWarehouse).map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Extremo Derecho: Botón rápido en desktop + Botón Menú Hamburguesa */}
            <div className="flex items-center gap-2 shrink-0">
              
              {/* Botón Subir Squishy: Solo en pantallas medianas hacia arriba para no amontonar en móvil */}
              <button
                onClick={onOpenAddProduct}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20 hover:from-pink-600 hover:to-rose-600 transition-all hover:scale-105 active:scale-95"
                title="Registrar nuevo producto o squishy"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Subir Squishy</span>
              </button>

              {/* BOTÓN MENÚ HAMBURGUESA PRINCIPAL (Al extremo derecho, limpio y con alerta si hay pedidos) */}
              <button
                onClick={() => setIsMenuOpen(true)}
                aria-label="Abrir menú de navegación"
                className="relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-900 text-white font-extrabold text-xs sm:text-sm shadow-md hover:bg-slate-800 transition-all active:scale-95 shrink-0 border border-slate-800"
                title="Abrir menú de paneles y opciones"
              >
                <Menu className="w-5 h-5 text-pink-400 shrink-0" />
                <span className="font-black">Menú</span>
                {activeOrdersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse border-2 border-white">
                    {activeOrdersCount}
                  </span>
                )}
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* DRAWER LATERAL / MENÚ HAMBURGUESA DESPLEGABLE */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          
          {/* Backdrop con desenfoque suave */}
          <div 
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Panel Lateral Drawer */}
          <div className="relative w-84 max-w-[88vw] h-full bg-white shadow-2xl flex flex-col z-10 pt-safe animate-in slide-in-from-right duration-200">
            
            {/* Header del Menú */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-amber-300 flex items-center justify-center text-lg shadow-sm">
                  🧸
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-tight">Menú de Navegación</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">SquishyTrack PRO</p>
                </div>
              </div>

              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                title="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Punto en Móvil / Tablet dentro del Menú */}
            <div className="p-3.5 bg-pink-50/50 border-b border-pink-100/60">
              <label className="block text-[10px] font-black uppercase tracking-wider text-pink-700 mb-1">
                Punto de Venta Activo
              </label>
              <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-pink-200 shadow-xs">
                <Store className="w-4 h-4 text-pink-600 shrink-0" />
                <select
                  value={activeLocationId}
                  onChange={(e) => setActiveLocationId(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                >
                  {locations.filter(l => !l.isWarehouse).map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contenido scrolleable con categorías limpias */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              
              {/* Sección 1: Paneles y Módulos */}
              <div>
                <p className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Módulos de Control
                </p>
                <div className="space-y-1">
                  
                  {/* Punto de Venta */}
                  <button
                    onClick={() => handleSelectTab('pos')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-left transition-all ${
                      activeTab === 'pos'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'pos' ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-600'}`}>
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="leading-tight">Punto de Venta (POS)</div>
                        <div className={`text-[10px] font-normal ${activeTab === 'pos' ? 'text-slate-300' : 'text-slate-400'}`}>
                          Cobro rápido en mostrador
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${activeTab === 'pos' ? 'text-pink-400' : 'text-slate-300'}`} />
                  </button>

                  {/* Pedidos WhatsApp */}
                  <button
                    onClick={() => handleSelectTab('orders')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-left transition-all ${
                      activeTab === 'orders'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-emerald-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="leading-tight flex items-center gap-2">
                          <span>Pedidos WhatsApp</span>
                          {activeOrdersCount > 0 && (
                            <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                              {activeOrdersCount} nuevos
                            </span>
                          )}
                        </div>
                        <div className={`text-[10px] font-normal ${activeTab === 'orders' ? 'text-slate-300' : 'text-slate-400'}`}>
                          Atención, preparación y cobro
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${activeTab === 'orders' ? 'text-emerald-400' : 'text-slate-300'}`} />
                  </button>

                  {/* Dashboard */}
                  <button
                    onClick={() => handleSelectTab('dashboard')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-left transition-all ${
                      activeTab === 'dashboard'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'dashboard' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="leading-tight">Dashboard & Métricas</div>
                        <div className={`text-[10px] font-normal ${activeTab === 'dashboard' ? 'text-slate-300' : 'text-slate-400'}`}>
                          Ganancias reales y utilidades
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-300'}`} />
                  </button>

                  {/* Compras x Caja */}
                  <button
                    onClick={() => handleSelectTab('purchases')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-left transition-all ${
                      activeTab === 'purchases'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'purchases' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'}`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="leading-tight">Compras x Caja</div>
                        <div className={`text-[10px] font-normal ${activeTab === 'purchases' ? 'text-slate-300' : 'text-slate-400'}`}>
                          Costos por lote y desempacado
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${activeTab === 'purchases' ? 'text-purple-400' : 'text-slate-300'}`} />
                  </button>

                  {/* Inventario */}
                  <button
                    onClick={() => handleSelectTab('inventory')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-left transition-all ${
                      activeTab === 'inventory'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'}`}>
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="leading-tight">Inventario & Stock</div>
                        <div className={`text-[10px] font-normal ${activeTab === 'inventory' ? 'text-slate-300' : 'text-slate-400'}`}>
                          Existencias por sucursal
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-amber-400' : 'text-slate-300'}`} />
                  </button>

                  {/* Simulador */}
                  <button
                    onClick={() => handleSelectTab('simulator')}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-left transition-all ${
                      activeTab === 'simulator'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'simulator' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-600'}`}>
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="leading-tight">Simulador de Precios</div>
                        <div className={`text-[10px] font-normal ${activeTab === 'simulator' ? 'text-slate-300' : 'text-slate-400'}`}>
                          Cálculo de margen y sugeridos
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${activeTab === 'simulator' ? 'text-teal-400' : 'text-slate-300'}`} />
                  </button>

                </div>
              </div>

              {/* Sección 2: Herramientas Rápidas */}
              <div>
                <p className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Herramientas y Accesos
                </p>
                <div className="space-y-1">
                  
                  {/* Subir Squishy (Botón destacado en menú) */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAddProduct();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-pink-900 bg-pink-50 hover:bg-pink-100 border border-pink-200 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-xs">
                        <PlusCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-pink-950">+ Subir Nuevo Squishy</div>
                        <div className="text-[10px] font-normal text-pink-700">Agregar foto, precio y existencias</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-pink-400" />
                  </button>

                  {/* Compartir Catálogo a Clientes */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenShareCatalog();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div>Catálogo Clientes (Liga + QR)</div>
                        <div className="text-[10px] font-normal text-purple-600">Compartir sin precios de costo</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-purple-400" />
                  </button>

                  {/* Modo App Móvil */}
                  {onSwitchToMobile && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onSwitchToMobile();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-pink-900 bg-pink-50 hover:bg-pink-100 border border-pink-200 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <div>Activar Modo App Móvil</div>
                          <div className="text-[10px] font-normal text-pink-600">Interfaz táctil para teléfono</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-pink-400" />
                    </button>
                  )}

                  {/* Enlazar Celular en Red Local */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenMobileModal();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                        <Wifi className="w-4 h-4" />
                      </div>
                      <div>
                        <div>Enlazar Celular en Red</div>
                        <div className="text-[10px] font-normal text-amber-600">QR para conectar teléfono local</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </button>

                  {/* Configurar WhatsApp para Pedidos */}
                  <button
                    onClick={handlePromptWhatsApp}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div>WhatsApp de Pedidos</div>
                        <div className="text-[10px] font-normal text-emerald-700">
                          {whatsappNumber ? `Activo: ${whatsappNumber}` : 'Configurar número'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 font-black px-1.5 py-0.5 rounded">
                      Editar
                    </span>
                  </button>

                </div>
              </div>

              {/* Sección 3: Sesión & Peligro */}
              <div>
                <p className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Sesión y Sistema
                </p>
                <div className="space-y-1">
                  
                  {/* Cerrar Sesión Admin */}
                  {onLogout && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-rose-100 flex items-center justify-center text-slate-600">
                          <LogOut className="w-4 h-4 text-rose-500" />
                        </div>
                        <div>
                          <div>Cerrar Sesión Admin</div>
                          <div className="text-[10px] font-normal text-slate-400">Ver tienda como cliente</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  )}

                  {/* Vaciar Todos los Datos */}
                  <button
                    onClick={handleClear}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl font-bold text-xs text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div>Vaciar Todos los Datos</div>
                        <div className="text-[10px] font-normal text-red-400">Reiniciar base para pruebas</div>
                      </div>
                    </div>
                  </button>

                </div>
              </div>

            </div>

            {/* Footer del Drawer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400">
              SquishyTrack PRO • v2.6 Cloud Ready
            </div>

          </div>
        </div>
      )}
    </>
  );
}
