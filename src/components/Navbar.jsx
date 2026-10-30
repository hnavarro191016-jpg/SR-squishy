import React from 'react';
import { 
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
  Share2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar({ activeTab, setActiveTab, onOpenMobileModal, onOpenAddProduct, onOpenShareCatalog }) {
  const { locations, activeLocationId, setActiveLocationId, clearAllData, whatsappNumber, setWhatsappNumber, orders } = useApp();

  const activeOrdersCount = (orders || []).filter(o => ['nuevo', 'preparado', 'por_entregar'].includes(o.status)).length;

  const handleClear = () => {
    if (window.confirm('¿Quieres vaciar todos los datos y dejar el sistema completamente en blanco para tus pruebas?')) {
      clearAllData();
    }
  };

  const handlePromptWhatsApp = () => {
    const num = window.prompt(
      'Ingresa tu número de WhatsApp para recibir pedidos directos de clientes (con código de país, ej. 5215512345678):', 
      whatsappNumber
    );
    if (num !== null) setWhatsappNumber(num.trim());
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo y Branding Sr. Squishy */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-400 to-amber-300 flex items-center justify-center shadow-md shadow-pink-500/20 text-2xl transform hover:scale-105 transition-transform">
              🧸
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">SquishyTrack</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 uppercase tracking-wider">PRO</span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Sr. Squishy • Máxima Utilidad</p>
            </div>
          </div>

          {/* Selector de Punto de Venta Activo */}
          <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Store className="w-4 h-4 text-pink-600" />
            <span className="text-xs text-slate-500 font-medium">Punto:</span>
            <select
              value={activeLocationId}
              onChange={(e) => setActiveLocationId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              {locations.filter(l => !l.isWarehouse).map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Botones de Navegación */}
          <nav className="flex items-center gap-1 sm:gap-2">
            
            {/* Botón Subir Squishy */}
            <button
              onClick={onOpenAddProduct}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-pink-500 text-white shadow-md shadow-pink-500/20 hover:bg-pink-600 transition-all hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Subir Squishy</span>
            </button>

            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'pos'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-pink-50 hover:text-pink-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Punto de Venta</span>
              <span className="sm:hidden">POS</span>
            </button>

            {/* Pestaña Pedidos WhatsApp */}
            <button
              onClick={() => setActiveTab('orders')}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'orders'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">Pedidos</span>
              {activeOrdersCount > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'purchases'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="hidden lg:inline">Compras x Caja</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'inventory'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Store className="w-4 h-4" />
              <span className="hidden lg:inline">Inventario</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'simulator'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden lg:inline">Simulador</span>
            </button>

            {/* Enlazar Celular */}
            <button
              onClick={onOpenMobileModal}
              title="Abrir en celular"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors ml-1"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Celular</span>
            </button>

            {/* WhatsApp para Pedidos */}
            <button
              onClick={handlePromptWhatsApp}
              title={whatsappNumber ? `Pedidos van a: ${whatsappNumber}` : 'Conectar tu WhatsApp para recibir pedidos'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs border transition-colors ml-1 ${
                whatsappNumber 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xl:inline">{whatsappNumber ? 'WhatsApp ON' : 'WhatsApp'}</span>
            </button>

            {/* Compartir Catálogo Protegido a Clientes */}
            <button
              onClick={onOpenShareCatalog}
              title="Obtener liga protegida y QR para enviar a clientes"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-pink-700 transition-all hover:scale-105 ml-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Catálogo Clientes</span>
            </button>

            {/* Botón Vaciar Todo */}
            <button
              onClick={handleClear}
              title="Dejar en blanco"
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors ml-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>

          </nav>
        </div>
      </div>
    </header>
  );
}
