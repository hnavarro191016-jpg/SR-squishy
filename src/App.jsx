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
import AdminLoginModal from './components/AdminLoginModal';

// Componentes exclusivos de la experiencia App Móvil
import MobileAppHeader from './components/mobile/MobileAppHeader';
import MobileBottomBar from './components/mobile/MobileBottomBar';
import MobileActionSheet from './components/mobile/MobileActionSheet';
import MobileOrderCaptureModal from './components/mobile/MobileOrderCaptureModal';
import MobileOrdersView from './components/mobile/MobileOrdersView';
import MobilePurchasesView from './components/mobile/MobilePurchasesView';
import MobileInventoryView from './components/mobile/MobileInventoryView';
import MobilePwaInstallModal from './components/mobile/MobilePwaInstallModal';

import { Lock, Shield } from 'lucide-react';

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

  // AUTENTICACIÓN DE ADMINISTRADOR (Por defecto el visitante entra como CLIENTE)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sq_admin_authenticated') === 'true';
  });

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isCustomerPreviewMode, setIsCustomerPreviewMode] = useState(false);

  // Abrir login si se accede con ?admin=1 o ?login=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1' || params.get('login') === '1') {
        if (!isAdminAuthenticated) {
          setIsAdminLoginOpen(true);
        }
      }
    }
  }, [isAdminAuthenticated]);

  const handleAdminLoginSuccess = () => {
    localStorage.setItem('sq_admin_authenticated', 'true');
    setIsAdminAuthenticated(true);
    setIsCustomerPreviewMode(false);
    setIsAdminLoginOpen(false);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('sq_admin_authenticated');
    setIsAdminAuthenticated(false);
    setIsCustomerPreviewMode(false);
  };

  // Modo Catálogo Protegido de Clientes:
  // Es TRUE si NO está autenticado como admin O si el admin presionó "Ver como Cliente"
  const isCustomerMode = !isAdminAuthenticated || isCustomerPreviewMode;

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

  // Título de la pestaña dinámico según modo
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = isCustomerMode 
        ? 'Catálogo Oficial de Squishys 🧸' 
        : 'SquishyTrack Pro — App Móvil & Control de Márgenes';
    }
  }, [isCustomerMode]);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-pink-500 selection:text-white">
      
      {/* 
        CASO 1: MODO CATÁLOGO CLIENTES (Por Defecto para cualquier visitante público)
        Vista 100% blindada para compras públicas por WhatsApp:
        - SIN costos
        - SIN márgenes
        - SIN botón de cobrar
        - Pedidos directos al WhatsApp 81 2373 9027
      */}
      {isCustomerMode ? (
        <>
          <CustomerCatalogHeader 
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          />
          
          <main className="flex-1 pb-16">
            <MobilePOS isCustomerCatalogMode={true} />

            <footer className="py-8 text-center text-xs text-slate-400 space-y-2">
              {isAdminAuthenticated && (
                <div className="bg-amber-50 text-amber-900 py-1.5 px-3 rounded-full max-w-xs mx-auto border border-amber-200 text-xs font-bold inline-flex items-center gap-2">
                  <span>Modo Vista Previa de Cliente</span>
                  <button
                    onClick={() => setIsCustomerPreviewMode(false)}
                    className="underline text-pink-600 font-black"
                  >
                    Regresar al Panel
                  </button>
                </div>
              )}

              <div>
                <button
                  onClick={() => isAdminAuthenticated ? setIsCustomerPreviewMode(false) : setIsAdminLoginOpen(true)}
                  className="text-slate-400 hover:text-pink-600 font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isAdminAuthenticated ? 'Volver al Panel de Administrador' : '¿Eres el administrador? Iniciar sesión con PIN'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Atención y Pedidos por WhatsApp: <b>81 2373 9027</b>
              </p>
            </footer>
          </main>
        </>
      ) : isMobileView ? (
        /* 
          CASO 2: EXPERIENCIA APP MÓVIL DEDICADA PARA EL ADMINISTRADOR
          Desbloqueada tras iniciar sesión: Cobrar en mostrador, Compras, Pedidos, Stock
        */
        <>
          <MobileAppHeader
            onOpenActionSheet={() => setIsActionSheetOpen(true)}
            onSwitchToDesktop={() => toggleViewMode('desktop')}
            activeTab={activeTab}
            onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
            onTriggerInstall={handleTriggerInstall}
            onLogout={handleAdminLogout}
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

          {/* Barra de Navegación Inferior Móvil: Se oculta cuando hay productos en el carrito */}
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

          {/* Guía de Instalación PWA */}
          <MobilePwaInstallModal
            isOpen={isInstallGuideOpen}
            onClose={() => setIsInstallGuideOpen(false)}
          />
        </>
      ) : (
        /* 
          CASO 3: PANEL DE ESCRITORIO PARA ADMINISTRADOR
          Tablas anchas, dashboard financiero y simulador
        */
        <>
          <Navbar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onOpenMobileModal={() => setIsMobileModalOpen(true)}
            onOpenAddProduct={handleOpenAdd}
            onOpenShareCatalog={() => setIsShareCatalogOpen(true)}
            onSwitchToMobile={() => toggleViewMode('mobile')}
            onLogout={handleAdminLogout}
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

      {/* Modal de Login para Administradores */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

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
