import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import CustomerCatalogHeader from './components/CustomerCatalogHeader';
import Dashboard from './components/Dashboard';
import MobilePOS from './components/MobilePOS';
import PurchasesManager from './components/PurchasesManager';
import InventoryManager from './components/InventoryManager';
import PriceSimulator from './components/PriceSimulator';
import OrdersManager from './components/OrdersManager';
import MobileAccessModal from './components/MobileAccessModal';
import ShareCatalogModal from './components/ShareCatalogModal';
import ProductModal from './components/ProductModal';
import { Smartphone, LayoutDashboard, Package, Store, Calculator, PlusCircle, ShoppingBag, Shield } from 'lucide-react';

function AppContent() {
  const { orders } = useApp();
  const [activeTab, setActiveTab] = useState('pos');
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isShareCatalogOpen, setIsShareCatalogOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Detección automática de Modo Catálogo para Clientes (URL ?catalogo=1 o ?cliente=1)
  const isClientUrl = () => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('catalogo');
    const cli = params.get('cliente');
    const modo = params.get('modo');
    const hash = (window.location.hash || '').toLowerCase();
    return (
      cat === '1' || cat === 'true' ||
      cli === '1' || cli === 'true' ||
      modo === 'catalogo' || modo === 'cliente' ||
      hash.includes('catalogo') || hash.includes('cliente')
    );
  };

  const [isCustomerMode, setIsCustomerMode] = useState(isClientUrl);

  // Escuchar cambios en la URL
  useEffect(() => {
    const handleUrlCheck = () => {
      setIsCustomerMode(isClientUrl());
    };

    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, []);

  const activeOrdersCount = (orders || []).filter(o => ['nuevo', 'preparado', 'por_entregar'].includes(o.status)).length;

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsAddProductOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsAddProductOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddProductOpen(false);
    setEditingProduct(null);
  };

  // Salir del modo cliente y regresar al panel de control de administrador
  const handleExitCustomerMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('catalogo');
    url.searchParams.delete('cliente');
    url.searchParams.delete('modo');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    setIsCustomerMode(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 
        Si entra un cliente con ?catalogo=1:
        Se muestra el encabezado exclusivo de tienda y SE OCULTA todo el menú interno (Dashboard, Compras, etc.)
      */}
      {isCustomerMode ? (
        <CustomerCatalogHeader />
      ) : (
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenMobileModal={() => setIsMobileModalOpen(true)}
          onOpenAddProduct={handleOpenAdd}
          onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
        />
      )}

      {/* Contenido según el modo */}
      <main className="flex-1 pb-20 sm:pb-6">
        {isCustomerMode ? (
          /* MODO CLIENTE: Catálogo protegido, sin costos, sin márgenes, solo compras por WhatsApp */
          <div className="space-y-4">
            <MobilePOS 
              isCustomerCatalogMode={true}
            />
            {/* Acceso para el dueño si está probando en su propio teléfono */}
            <footer className="py-8 text-center text-xs text-slate-400">
              <button
                onClick={handleExitCustomerMode}
                className="text-slate-400 hover:text-slate-600 underline font-medium inline-flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>¿Eres el administrador? Ingresar al panel de control</span>
              </button>
            </footer>
          </div>
        ) : (
          /* MODO ADMINISTRADOR: Acceso completo a todas las herramientas de negocio */
          <>
            {activeTab === 'pos' && (
              <MobilePOS 
                onOpenAddProduct={handleOpenAdd} 
                onEditProduct={handleOpenEdit}
                onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
              />
            )}
            {activeTab === 'dashboard' && (
              <Dashboard onGoToPOS={() => setActiveTab('pos')} />
            )}
            {activeTab === 'purchases' && (
              <PurchasesManager />
            )}
            {activeTab === 'inventory' && (
              <InventoryManager onEditProduct={handleOpenEdit} />
            )}
            {activeTab === 'simulator' && (
              <PriceSimulator />
            )}
            {activeTab === 'orders' && (
              <OrdersManager />
            )}
          </>
        )}
      </main>

      {/* Modales Administrativos */}
      {!isCustomerMode && (
        <>
          {/* Modal para Subir o Modificar Squishy */}
          <ProductModal
            isOpen={isAddProductOpen}
            onClose={handleCloseModal}
            productToEdit={editingProduct}
          />

          {/* Modal de Conexión Móvil / QR para Vendedor */}
          <MobileAccessModal
            isOpen={isMobileModalOpen}
            onClose={() => setIsMobileModalOpen(false)}
          />

          {/* Modal de Compartir Catálogo a Clientes (100% Blindado) */}
          <ShareCatalogModal
            isOpen={isShareCatalogOpen}
            onClose={() => setIsShareCatalogOpen(false)}
          />

          {/* Barra de Navegación Inferior exclusiva para Móviles (Solo Administrador) */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 z-40 flex items-center justify-around shadow-lg">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
                activeTab === 'pos' ? 'text-pink-600 scale-105' : 'text-slate-400'
              }`}
            >
              <Smartphone className="w-5 h-5 mb-0.5" />
              <span>Vender</span>
            </button>

            <button
              onClick={() => setIsAddProductOpen(true)}
              className="flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-extrabold text-pink-500"
            >
              <PlusCircle className="w-5 h-5 mb-0.5" />
              <span>+ Squishy</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`relative flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
                activeTab === 'orders' ? 'text-emerald-600 scale-105' : 'text-slate-400'
              }`}
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 mb-0.5" />
                {activeOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {activeOrdersCount}
                  </span>
                )}
              </div>
              <span>Pedidos</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
                activeTab === 'dashboard' ? 'text-slate-900 scale-105' : 'text-slate-400'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span>Métricas</span>
            </button>

            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
                activeTab === 'purchases' ? 'text-slate-900 scale-105' : 'text-slate-400'
              }`}
            >
              <Package className="w-5 h-5 mb-0.5" />
              <span>Compras</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold ${
                activeTab === 'inventory' ? 'text-slate-900 scale-105' : 'text-slate-400'
              }`}
            >
              <Store className="w-5 h-5 mb-0.5" />
              <span>Stock</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
