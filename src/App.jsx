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

// Componentes exclusivos de la experiencia App Móvil
import MobileAppHeader from './components/mobile/MobileAppHeader';
import MobileBottomBar from './components/mobile/MobileBottomBar';
import MobileActionSheet from './components/mobile/MobileActionSheet';
import MobileOrderCaptureModal from './components/mobile/MobileOrderCaptureModal';
import MobileOrdersView from './components/mobile/MobileOrdersView';
import MobilePurchasesView from './components/mobile/MobilePurchasesView';
import MobileInventoryView from './components/mobile/MobileInventoryView';
import MobilePwaInstallModal from './components/mobile/MobilePwaInstallModal';

import { Shield } from 'lucide-react';

function AppContent() {
  const { orders } = useApp();
  const [activeTab, setActiveTab] = useState('pos');
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isShareCatalogOpen, setIsShareCatalogOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Modales móviles
  const [isOrderCaptureOpen, setIsOrderCaptureOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Escuchar evento de instalación nativa para Android Chrome
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallGuideOpen(true);
    }
  };

  // Detección automática de Modo Móvil
  const checkIsMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    const savedMode = localStorage.getItem('sq_view_mode');
    if (savedMode === 'mobile') return true;
    if (savedMode === 'desktop') return false;
    const isMobileWidth = window.innerWidth < 768;
    const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isMobileWidth || isMobileAgent;
  };

  const [isMobileView, setIsMobileView] = useState(checkIsMobileDevice);

  // Escuchar cambios de tamaño de pantalla si no hay preferencia manual forzada
  useEffect(() => {
    const handleResize = () => {
      const savedMode = localStorage.getItem('sq_view_mode');
      if (!savedMode) {
        setIsMobileView(window.innerWidth < 768);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleViewMode = (mode) => {
    localStorage.setItem('sq_view_mode', mode);
    setIsMobileView(mode === 'mobile');
  };

  // Detección de Modo Catálogo para Clientes (URL ?catalogo=1 o ?cliente=1)
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

  // Título de la pestaña dinámico según modo
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = isCustomerMode 
        ? 'Catálogo Oficial de Squishys 🧸' 
        : 'SquishyTrack Pro — App Móvil & Control de Márgenes';
    }
  }, [isCustomerMode]);

  useEffect(() => {
    const handleUrlCheck = () => {
      setIsCustomerMode(isClientUrl());
    };
    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, []);

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

  // Salir del modo cliente y regresar al panel de control
  const handleExitCustomerMode = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('catalogo');
    url.searchParams.delete('cliente');
    url.searchParams.delete('modo');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    setIsCustomerMode(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-pink-500 selection:text-white">
      
      {/* 
        CASO 1: MODO CATÁLOGO CLIENTES (?catalogo=1)
        Vista 100% blindada para compras públicas por WhatsApp sin costos ni márgenes
      */}
      {isCustomerMode ? (
        <>
          <CustomerCatalogHeader />
          <main className="flex-1 pb-16">
            <MobilePOS isCustomerCatalogMode={true} />
            <footer className="py-8 text-center text-xs text-slate-400">
              <button
                onClick={handleExitCustomerMode}
                className="text-slate-400 hover:text-slate-600 underline font-medium inline-flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>¿Eres el administrador? Ingresar al panel de control</span>
              </button>
            </footer>
          </main>
        </>
      ) : isMobileView ? (
        /* 
          CASO 2: EXPERIENCIA APP MÓVIL DEDICADA
          Diseñada para smartphone: navegación inferior, captura ágil de pedidos y compras
        */
        <>
          <MobileAppHeader
            onOpenActionSheet={() => setIsActionSheetOpen(true)}
            onSwitchToDesktop={() => toggleViewMode('desktop')}
            activeTab={activeTab}
            onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
            onTriggerInstall={handleTriggerInstall}
          />

          <main className="flex-1">
            {activeTab === 'pos' && (
              <MobilePOS
                isMobileAppMode={true}
                onOpenAddProduct={handleOpenAdd}
                onEditProduct={handleOpenEdit}
                onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
                onOpenOrderCapture={() => setIsOrderCaptureOpen(true)}
                onCartChange={setCartCount}
              />
            )}
            {activeTab === 'orders' && (
              <MobileOrdersView
                onOpenOrderCapture={() => setIsOrderCaptureOpen(true)}
              />
            )}
            {activeTab === 'purchases' && (
              <MobilePurchasesView />
            )}
            {activeTab === 'inventory' && (
              <MobileInventoryView
                onEditProduct={handleOpenEdit}
              />
            )}
          </main>

          {/* Barra de Navegación Inferior Móvil: Se oculta automáticamente cuando hay productos en el carrito para dejar 100% libre el botón de Pedir y Cobrar */}
          {!(activeTab === 'pos' && cartCount > 0) && (
            <MobileBottomBar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}

          {/* Menú de Acciones Rápidas (Bottom Sheet) */}
          <MobileActionSheet
            isOpen={isActionSheetOpen}
            onClose={() => setIsActionSheetOpen(false)}
            onOpenOrderCapture={() => setIsOrderCaptureOpen(true)}
            onOpenAddProduct={handleOpenAdd}
            onGoToPurchases={() => setActiveTab('purchases')}
            onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
            onOpenInstallGuide={handleTriggerInstall}
          />

          {/* Modal de Captura Rápida de Pedidos */}
          <MobileOrderCaptureModal
            isOpen={isOrderCaptureOpen}
            onClose={() => setIsOrderCaptureOpen(false)}
          />

          {/* Guía de Instalación PWA (Agregar a Pantalla de Inicio) */}
          <MobilePwaInstallModal
            isOpen={isInstallGuideOpen}
            onClose={() => setIsInstallGuideOpen(false)}
          />
        </>
      ) : (
        /* 
          CASO 3: PANEL DE ESCRITORIO COMPLETO
          Con tablas anchas, dashboard financiero y simulador
        */
        <>
          <Navbar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onOpenMobileModal={() => setIsMobileModalOpen(true)}
            onOpenAddProduct={handleOpenAdd}
            onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
            onSwitchToMobile={() => toggleViewMode('mobile')}
          />

          <main className="flex-1 pb-10">
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
          </main>
        </>
      )}

      {/* Modales Compartidos de Administración */}
      {!isCustomerMode && (
        <>
          <ProductModal
            isOpen={isAddProductOpen}
            onClose={handleCloseModal}
            productToEdit={editingProduct}
          />

          <MobileAccessModal
            isOpen={isMobileModalOpen}
            onClose={() => setIsMobileModalOpen(false)}
          />

          <ShareCatalogModal
            isOpen={isShareCatalogOpen}
            onClose={() => setIsShareCatalogOpen(false)}
          />
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
