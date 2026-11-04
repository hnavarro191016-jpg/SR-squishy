import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  MessageCircle, 
  DollarSign, 
  User, 
  MapPin, 
  Package, 
  Plus, 
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  Search,
  LayoutList,
  LayoutGrid,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function OrdersManager() {
  const { 
    orders, 
    products, 
    locations, 
    activeLocationId, 
    createOrder, 
    advanceOrderStatus, 
    completeOrder, 
    cancelOrder,
    whatsappNumber,
    refreshOrders
  } = useApp();

  const [activeTab, setActiveTab] = useState('activos'); // 'activos', 'nuevo', 'preparado', 'por_entregar', 'completado', 'cancelado', 'todos'
  const [viewMode, setViewMode] = useState('list'); // 'list' (compacta) o 'cards' (tarjetas)
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Estados para Auto-refresh en tiempo real
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [autoRefreshSecs, setAutoRefreshSecs] = useState(4);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [sendReceiptOnComplete, setSendReceiptOnComplete] = useState(true);
  const [receiptNoticeOrder, setReceiptNoticeOrder] = useState(null);

  // Sonido sintetizado "Ding!" para avisar nuevo pedido sin requerir archivos mp3
  const playOrderDing = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch (e) {
      // Navegadores pueden requerir primer click para reproducir
    }
  };

  // Registro de pedidos ya conocidos para que el sonido suene UNA SOLA VEZ al llegar
  const knownOrderIdsRef = React.useRef(new Set(orders.map(o => o.id)));
  const isInitialMount = React.useRef(true);

  // Detectar cuando llega un pedido auténticamente NUEVO mientras la pantalla está abierta
  React.useEffect(() => {
    if (isInitialMount.current) {
      // Al abrir la pantalla, marcar todos los pedidos existentes como conocidos (no sonar por pedidos viejos)
      orders.forEach(o => knownOrderIdsRef.current.add(o.id));
      isInitialMount.current = false;
      return;
    }

    // Buscar pedidos recién llegados cuyo ID no conocíamos y que tengan status 'nuevo'
    const trulyNewOrder = orders.find(o => !knownOrderIdsRef.current.has(o.id) && o.status === 'nuevo');
    
    // Registrar todos los IDs actuales en el Set
    orders.forEach(o => knownOrderIdsRef.current.add(o.id));

    if (trulyNewOrder) {
      setNewOrderAlert(trulyNewOrder);
      playOrderDing(); // Suena EXACTAMENTE UNA VEZ
    }
  }, [orders]);

  // Si el pedido alertado ya fue cobrado, empacado o avanzado de estado, quitar el globo de inmediato
  React.useEffect(() => {
    if (newOrderAlert) {
      const matching = orders.find(o => o.id === newOrderAlert.id);
      if (!matching || matching.status !== 'nuevo') {
        setNewOrderAlert(null);
      }
    }
  }, [orders, newOrderAlert]);

  // Temporizador para desvanecer el globo tras 7 segundos (no se interrumpe por el auto-refresh)
  React.useEffect(() => {
    if (!newOrderAlert) return;
    const timer = setTimeout(() => {
      setNewOrderAlert(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [newOrderAlert]);

  // Función de refresco manual o automático
  const handleTriggerRefresh = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    if (refreshOrders) {
      await refreshOrders();
    }
    setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    if (isManual) {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Timer de cuenta regresiva de auto-refresco (cada 4 segundos)
  React.useEffect(() => {
    const ticker = setInterval(() => {
      setAutoRefreshSecs(prev => {
        if (prev <= 1) {
          handleTriggerRefresh(false);
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(ticker);
  }, [refreshOrders]);

  // Modal para captura manual de pedido
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [manualCustomer, setManualCustomer] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualCart, setManualCart] = useState([]);

  // Conteo por estado
  const countNew = orders.filter(o => o.status === 'nuevo').length;
  const countPreparing = orders.filter(o => o.status === 'preparado').length;
  const countToDeliver = orders.filter(o => o.status === 'por_entregar').length;
  const countCompleted = orders.filter(o => o.status === 'completado').length;
  const countCancelled = orders.filter(o => o.status === 'cancelado').length;
  const countActiveTotal = countNew + countPreparing + countToDeliver;

  // Filtrado reactivo de pedidos (pestaña + buscador)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Filtro por pestaña
      let matchesTab = true;
      if (activeTab === 'activos') {
        matchesTab = ['nuevo', 'preparado', 'por_entregar'].includes(order.status);
      } else if (activeTab === 'todos') {
        matchesTab = true;
      } else {
        matchesTab = order.status === activeTab;
      }

      if (!matchesTab) return false;

      // 2. Filtro por buscador (folio, cliente, teléfono o squishys)
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchesFolio = (order.folio || '').toLowerCase().includes(q);
      const matchesCustomer = (order.customerName || '').toLowerCase().includes(q);
      const matchesPhone = (order.customerPhone || '').toLowerCase().includes(q);
      const matchesItems = (order.items || []).some(item => (item.name || '').toLowerCase().includes(q));

      return matchesFolio || matchesCustomer || matchesPhone || matchesItems;
    });
  }, [orders, activeTab, searchQuery]);

  // Generar y enviar comprobante formal de compra por WhatsApp
  const sendWhatsAppReceipt = (order, customPaymentMethod, customCashReceived) => {
    const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
    const pMethod = customPaymentMethod || order.paymentMethod || 'Efectivo';
    const total = order.totalAmount || 0;
    const cash = parseFloat(customCashReceived || order.cashReceived || total);
    const change = Math.max(0, cash - total);

    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let text = `🧸 *¡GRACIAS POR TU COMPRA EN SR. SQUISHY!* ✨\n\n`;
    text += `📄 *COMPROBANTE DE COMPRA Y ENTREGA*\n`;
    text += `------------------------------------\n`;
    text += `📋 *Folio de Pedido:* ${order.folio}\n`;
    text += `📅 *Fecha y Hora de Entrega:* ${formattedDate}\n`;
    text += `👤 *Cliente:* ${order.customerName}\n`;
    text += `📍 *Lugar de Entrega:* ${order.deliveryLocationName || 'Punto de Venta Principal'}\n`;
    text += `------------------------------------\n`;
    text += `🛍️ *ARTÍCULOS ENTREGADOS:*\n`;
    (order.items || []).forEach(item => {
      const colorTxt = item.color ? ` (Color: *${item.color}*)` : '';
      text += `• *${item.quantity}x* ${item.name}${colorTxt} — $${(item.quantity * (item.unitPrice || item.price || 0)).toFixed(2)} MXN\n`;
    });
    text += `------------------------------------\n`;
    text += `💰 *TOTAL PAGADO: $${total.toFixed(2)} MXN*\n`;
    text += `💳 *Método de Pago:* ${pMethod}\n`;
    if (pMethod === 'Efectivo' && cash > total) {
      text += `💵 *Efectivo Recibido:* $${cash.toFixed(2)} MXN\n`;
      text += `🪙 *Cambio Devuelto:* $${change.toFixed(2)} MXN\n`;
    }
    text += `✅ *Estado:* ENTREGADO Y COBRADO\n`;
    text += `------------------------------------\n`;
    text += `¡Esperamos que disfrutes mucho tus squishys! Si te gustaron, ¡recomiéndanos con tus amigos! 😊🧸✨`;

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  // Finalizar cobro y entrega
  const handleConfirmCompletion = () => {
    if (!selectedOrderForPayment) return;

    const cash = parseFloat(cashReceived) || selectedOrderForPayment.totalAmount;
    const paymentInfo = {
      paymentMethod,
      cashReceived: cash
    };

    completeOrder(selectedOrderForPayment.id, paymentInfo);

    const orderData = {
      ...selectedOrderForPayment,
      paymentMethod,
      cashReceived: cash,
      completedAt: new Date().toISOString()
    };

    if (sendReceiptOnComplete) {
      sendWhatsAppReceipt(orderData, paymentMethod, cash);
    }

    if (newOrderAlert && newOrderAlert.id === selectedOrderForPayment.id) {
      setNewOrderAlert(null);
    }

    setReceiptNoticeOrder(orderData);
    setSelectedOrderForPayment(null);
    setCashReceived('');
  };

  // Enviar mensaje de estatus por WhatsApp al cliente
  const sendWhatsAppUpdate = (order, customMsg) => {
    const phone = (order.customerPhone || '').replace(/\D/g, '');
    let text = '';

    if (order.status === 'nuevo') {
      text = `🧸 *¡Hola ${order.customerName}!* Hemos recibido tu pedido *${order.folio}* de squishys.\n\n` +
        `📦 *Artículos:*\n` + order.items.map(i => `• ${i.quantity}x ${i.name}`).join('\n') +
        `\n💰 *Total:* $${order.totalAmount.toFixed(2)} MXN\n` +
        `📍 *Punto de Entrega:* ${order.deliveryLocationName}\n\n` +
        `¡Tus piezas ya están apartadas y comenzamos a prepararlas! Te avisamos en cuanto estén listas. 😊`;
    } else if (order.status === 'preparado' || order.status === 'por_entregar') {
      text = `🎉 *¡Buenas noticias ${order.customerName}!* Tu pedido *${order.folio}* ya está listo para entregar.\n\n` +
        `📍 *Punto:* ${order.deliveryLocationName}\n` +
        `💰 *Total a pagar:* $${order.totalAmount.toFixed(2)} MXN (${order.paymentStatus === 'pagado' ? 'PAGADO' : 'Cobro al entregar'})\n\n` +
        `¿A qué hora pasas por ellos? ¡Te esperamos con gusto! ✨`;
    }

    if (customMsg) text = customMsg;

    const url = phone 
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-4">
      
      {/* Encabezado y Acciones Principales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-pink-600 font-extrabold text-xs uppercase tracking-wider mb-0.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Centro de Despacho & Control de Pedidos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Seguimiento de Pedidos</span>
            <span className="text-xs font-black bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full">
              {orders.length} pedidos
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          
          {/* Botón de Refresco y Estado de Auto-Sync Activo */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleTriggerRefresh(true)}
              disabled={isRefreshing}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
              title={`Última sincronización: ${lastRefreshedAt}. Clic para refrescar de inmediato.`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-pink-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto {autoRefreshSecs}s</span>
              </span>
            </button>

            {/* Toggle de sonido para alerta de nuevos pedidos */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs transition-all ${
                soundEnabled 
                  ? 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100' 
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
              title={soundEnabled ? 'Aviso sonoro activado al llegar pedidos' : 'Sonido desactivado'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Alternador de Vista (Lista Compacta vs Tarjetas) */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 border border-slate-300/60">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista de lista compacta (Recomendada para muchos pedidos)"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista en tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
          </div>

          <button
            onClick={() => setIsManualOrderOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Captura Manual</span>
          </button>
        </div>
      </div>

      {/* Alerta animada cuando llega un nuevo pedido en vivo */}
      {newOrderAlert && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-3 sm:p-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300 border border-emerald-400/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-tight truncate">
                  ¡Nuevo Pedido Recibido! {newOrderAlert.folio}
                </span>
                <span className="bg-white/20 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  WhatsApp
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 truncate">
                {newOrderAlert.customerName} • {newOrderAlert.items?.length || 0} squishy(s) • ${newOrderAlert.totalAmount?.toFixed(2)} MXN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setActiveTab('nuevo');
                setExpandedOrderId(newOrderAlert.id);
                setNewOrderAlert(null);
              }}
              className="px-2.5 py-1 rounded-xl bg-white text-emerald-800 font-black text-xs hover:bg-emerald-50 transition-colors shadow-xs"
            >
              Ver Pedido
            </button>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="p-1 text-white/80 hover:text-white rounded-lg transition-colors"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Franja Compacta de Métricas del Embudo (KPIs Rápidos) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveTab('nuevo')}
          className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
            activeTab === 'nuevo' 
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">1. Nuevos</span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:block">Apartados</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600">{countNew}</div>
        </button>

        <button
          onClick={() => setActiveTab('preparado')}
          className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
            activeTab === 'preparado' 
              ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-400/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-orange-200'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block">2. Empacando</span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:block">En proceso</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-orange-600">{countPreparing}</div>
        </button>

        <button
          onClick={() => setActiveTab('por_entregar')}
          className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
            activeTab === 'por_entregar' 
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-blue-200'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">3. Por Entregar</span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:block">En mostrador</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600">{countToDeliver}</div>
        </button>

        <button
          onClick={() => setActiveTab('completado')}
          className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
            activeTab === 'completado' 
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20 shadow-sm' 
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">4. Cobrados</span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:block">Entregados</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">{countCompleted}</div>
        </button>
      </div>

      {/* Barra de Búsqueda y Pestañas de Estado */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          
          {/* Pestañas Rápidas con Contador */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            {[
              { id: 'activos', label: `En Proceso (${countActiveTotal})` },
              { id: 'nuevo', label: `Nuevos (${countNew})` },
              { id: 'preparado', label: `Preparando (${countPreparing})` },
              { id: 'por_entregar', label: `Por Entregar (${countToDeliver})` },
              { id: 'completado', label: `Cobrados (${countCompleted})` },
              { id: 'cancelado', label: `Cancelados (${countCancelled})` },
              { id: 'todos', label: `Todos (${orders.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Buscador Rápido (Folio, Cliente, Teléfono, Squishy) */}
          <div className="relative min-w-[220px] sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar #PED, cliente o squishy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Contenedor de Pedidos (Lista o Tarjetas) */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm space-y-2">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mx-auto">
            📋
          </div>
          <h3 className="text-base font-black text-slate-800">
            {searchQuery ? `No se encontraron pedidos con "${searchQuery}"` : 'No hay pedidos en esta sección'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? 'Prueba con otro folio, nombre o teléfono.' : 'Los pedidos que hagan por WhatsApp o captures aparecerán aquí organizados.'}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        
        /* ============================================================== */
        /* VISTA 1: LISTA COMPACTA DE DESPACHO RÁPIDO (Ideal 50-100 pedidos) */
        /* ============================================================== */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {filteredOrders.map(order => {
            const isCompleted = order.status === 'completado';
            const isCancelled = order.status === 'cancelado';
            const isExpanded = expandedOrderId === order.id;

            return (
              <div 
                key={order.id} 
                className={`transition-colors ${
                  isCompleted 
                    ? 'bg-emerald-50/15' 
                    : isCancelled 
                    ? 'opacity-60 bg-slate-50/60' 
                    : order.status === 'nuevo'
                    ? 'bg-amber-50/20'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Fila Principal Compacta */}
                <div className="p-3 sm:px-4 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  
                  {/* Izquierda: Folio + Cliente */}
                  <div className="flex items-center gap-2.5 min-w-[210px]">
                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                      {order.folio}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 font-black text-slate-900 text-xs sm:text-sm truncate">
                        <span className="truncate">{order.customerName}</span>
                        {order.customerPhone && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); sendWhatsAppUpdate(order); }}
                            className="text-emerald-600 hover:text-emerald-700 shrink-0"
                            title={`Contactar a ${order.customerPhone}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {order.date}
                      </div>
                    </div>
                  </div>

                  {/* Centro: Squishys en mini-pills */}
                  <div className="flex-1 flex flex-wrap items-center gap-1.5">
                    {order.items.map((item, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200"
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-4 h-4 rounded object-cover" />
                        ) : (
                          <span>{item.emoji || '🧸'}</span>
                        )}
                        <span>{item.quantity}x {item.name}</span>
                        {item.color && (
                          <span className="text-[10px] font-extrabold text-pink-700 bg-pink-100/80 px-1 rounded">
                            {item.color}
                          </span>
                        )}
                      </span>
                    ))}
                    {order.deliveryNotes && (
                      <span 
                        className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg italic truncate max-w-xs" 
                        title={order.deliveryNotes}
                      >
                        "{order.deliveryNotes}"
                      </span>
                    )}
                  </div>

                  {/* Derecha: Total, Margen y Botones de Acción */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-100">
                    
                    {/* Monto y Ganancia */}
                    <div className="text-right pr-1">
                      <div className="text-sm font-black text-slate-900">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600">
                        +${order.totalProfit.toFixed(2)}
                      </div>
                    </div>

                    {/* Botones de Acción Operativa Compactos */}
                    <div className="flex items-center gap-1.5">
                      {order.status === 'nuevo' && (
                        <>
                          <button
                            onClick={() => advanceOrderStatus(order.id, 'preparado')}
                            className="px-2.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
                            title="Comenzar a empacar pedido"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Empacar</span>
                          </button>
                          <button
                            onClick={() => sendWhatsAppUpdate(order)}
                            className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            title="Confirmar por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {order.status === 'preparado' && (
                        <>
                          <button
                            onClick={() => advanceOrderStatus(order.id, 'por_entregar')}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95"
                            title="Marcar como listo en mostrador"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Listo</span>
                          </button>
                          <button
                            onClick={() => sendWhatsAppUpdate(order)}
                            className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            title="Avisar que está listo por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {order.status === 'por_entregar' && (
                        <>
                          <button
                            onClick={() => setSelectedOrderForPayment(order)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs flex items-center gap-1 shadow-sm shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition-all active:scale-95"
                            title="Cobrar entrega y registrar en ventas"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Cobrar ${order.totalAmount.toFixed(0)}</span>
                          </button>
                          <button
                            onClick={() => sendWhatsAppUpdate(order)}
                            className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            title="Contactar al cliente por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <span className="px-2 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Cobrado</span>
                        </span>
                      )}

                      {isCancelled && (
                        <span className="px-2 py-1 rounded-xl bg-red-100 text-red-800 text-[11px] font-black">
                          Cancelado
                        </span>
                      )}

                      {/* Botón Detalles / Acordeón */}
                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title={isExpanded ? 'Ocultar detalles' : 'Ver desglose completo'}
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Cancelar si está activo */}
                      {!isCompleted && !isCancelled && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Cancelar pedido ${order.folio} y devolver el stock a mostrador?`)) {
                              cancelOrder(order.id);
                            }
                          }}
                          className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancelar pedido y liberar piezas"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>

                </div>

                {/* Acordeón Desplegable (Detalles adicionales) */}
                {isExpanded && (
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-150">
                    <div className="space-y-0.5">
                      <div>
                        <span className="font-bold text-slate-700">Punto de Entrega: </span>
                        <span>{order.deliveryLocationName}</span>
                      </div>
                      {order.deliveryNotes && (
                        <div>
                          <span className="font-bold text-slate-700">Notas de entrega: </span>
                          <span className="italic">"{order.deliveryNotes}"</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ID interno: {order.id} • {order.items.reduce((sum, i) => sum + i.quantity, 0)} squishys en total
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (

        /* ============================================================== */
        /* VISTA 2: TARJETAS COMPACTAS (Rediseñadas sin botones gigantes) */
        /* ============================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredOrders.map(order => {
            const isCompleted = order.status === 'completado';
            const isCancelled = order.status === 'cancelado';

            return (
              <div 
                key={order.id}
                className={`bg-white rounded-2xl p-4 border shadow-sm transition-all flex flex-col justify-between ${
                  isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/15' 
                    : isCancelled 
                    ? 'border-slate-200 opacity-60 bg-slate-50' 
                    : order.status === 'nuevo'
                    ? 'border-amber-300 ring-2 ring-amber-400/10'
                    : 'border-slate-200 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Encabezado */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                        {order.folio}
                      </span>
                      <span className="text-[10px] text-slate-400">{order.date}</span>
                    </div>

                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      order.status === 'nuevo'
                        ? 'bg-amber-100 text-amber-800'
                        : order.status === 'preparado'
                        ? 'bg-orange-100 text-orange-800'
                        : order.status === 'por_entregar'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'completado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {order.status === 'nuevo' && '🟡 Nuevo'}
                      {order.status === 'preparado' && '🟠 Empacando'}
                      {order.status === 'por_entregar' && '🔵 Por Entregar'}
                      {order.status === 'completado' && '🟢 Cobrado'}
                      {order.status === 'cancelado' && '🔴 Cancelado'}
                    </span>
                  </div>

                  {/* Cliente */}
                  <div className="py-2 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                        <span className="truncate">{order.customerName}</span>
                      </div>
                      {order.customerPhone && (
                        <button
                          onClick={() => sendWhatsAppUpdate(order)}
                          className="text-[11px] text-emerald-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>{order.customerPhone}</span>
                        </button>
                      )}
                    </div>
                    {order.deliveryNotes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded-lg italic">
                        "{order.deliveryNotes}"
                      </p>
                    )}
                  </div>

                  {/* Squishys */}
                  <div className="bg-slate-50 rounded-xl p-2 space-y-1 text-xs mb-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate pr-2 flex items-center gap-1">
                          <span>{item.quantity}x {item.name}</span>
                          {item.color && (
                            <span className="text-[10px] font-extrabold text-pink-700 bg-pink-100/80 px-1 rounded">
                              {item.color}
                            </span>
                          )}
                        </span>
                        <span className="font-extrabold text-slate-900 shrink-0">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total y Ganancia */}
                  <div className="flex items-baseline justify-between py-1">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total</span>
                      <span className="text-lg font-black text-slate-900">${order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Ganancia</span>
                      <span className="text-xs font-black text-emerald-600">+${order.totalProfit.toFixed(2)} ({order.profitMarginPercent}%)</span>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción de Tarjeta (Compactos y tipo Pill) */}
                <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                  {order.status === 'nuevo' && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => advanceOrderStatus(order.id, 'preparado')}
                        className="py-2 px-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Empacar</span>
                      </button>
                      <button
                        onClick={() => sendWhatsAppUpdate(order)}
                        className="py-2 px-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Confirmar WA</span>
                      </button>
                    </div>
                  )}

                  {order.status === 'preparado' && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => advanceOrderStatus(order.id, 'por_entregar')}
                        className="py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Listo</span>
                      </button>
                      <button
                        onClick={() => sendWhatsAppUpdate(order)}
                        className="py-2 px-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Avisar WA</span>
                      </button>
                    </div>
                  )}

                  {order.status === 'por_entregar' && (
                    <button
                      onClick={() => setSelectedOrderForPayment(order)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-md shadow-emerald-500/20 hover:from-emerald-600 transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>COBRAR Y ENTREGAR (${order.totalAmount.toFixed(0)})</span>
                    </button>
                  )}

                  {isCompleted && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 p-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-center font-bold text-xs flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Cobrado con {order.paymentMethod}</span>
                      </div>
                      <button
                        onClick={() => sendWhatsAppReceipt(order)}
                        className="p-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Enviar comprobante de compra por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ticket WA</span>
                      </button>
                    </div>
                  )}

                  {/* Cancelar pedido */}
                  {!isCompleted && !isCancelled && (
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Cancelar pedido ${order.folio}? Se devolverá el stock a mostrador.`)) {
                          cancelOrder(order.id);
                        }
                      }}
                      className="w-full py-1 text-[10px] text-slate-400 hover:text-red-500 font-bold transition-colors"
                    >
                      Cancelar pedido y devolver stock
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL PARA COBRO DEL PEDIDO (Al momento de entregar) */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Cobro de Entrega</h3>
                <p className="text-xs text-slate-400">Pedido {selectedOrderForPayment.folio} • {selectedOrderForPayment.customerName}</p>
              </div>
              <button
                onClick={() => setSelectedOrderForPayment(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total a Cobrar */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 text-white text-center shadow-lg shadow-pink-500/25">
              <span className="text-xs uppercase font-bold text-pink-100 block">Total a Cobrar</span>
              <div className="text-3xl font-black">${selectedOrderForPayment.totalAmount.toFixed(2)} MXN</div>
              <span className="text-xs text-pink-100 font-medium block mt-1">
                Ganancia neta a registrar: +${selectedOrderForPayment.totalProfit.toFixed(2)}
              </span>
            </div>

            {/* Método de Pago */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                ¿Cómo pagó el cliente?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Efectivo', icon: Banknote, label: 'Efectivo' },
                  { id: 'Transferencia', icon: Smartphone, label: 'Transfer/CoDi' },
                  { id: 'Tarjeta', icon: CreditCard, label: 'Tarjeta' },
                ].map(m => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === m.id
                          ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Si es efectivo */}
              {paymentMethod === 'Efectivo' && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Efectivo recibido:</span>
                    <input
                      type="number"
                      placeholder={selectedOrderForPayment.totalAmount.toString()}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-24 text-right font-black text-slate-900 bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none"
                    />
                  </div>
                  {parseFloat(cashReceived) > selectedOrderForPayment.totalAmount && (
                    <div className="flex items-center justify-between text-xs font-extrabold text-emerald-700 border-t border-slate-200 pt-1.5">
                      <span>Cambio a devolver:</span>
                      <span className="text-sm">${(parseFloat(cashReceived) - selectedOrderForPayment.totalAmount).toFixed(2)} MXN</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Opción Enviar Comprobante WhatsApp */}
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 cursor-pointer text-xs font-bold text-emerald-900 select-none">
              <input
                type="checkbox"
                checked={sendReceiptOnComplete}
                onChange={(e) => setSendReceiptOnComplete(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
              />
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Enviar comprobante de compra por WhatsApp al cliente</span>
              </div>
            </label>

            <button
              onClick={handleConfirmCompletion}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 active:scale-98 transition-all"
            >
              CONFIRMAR COBRO Y REGISTRAR EN VENTAS 🚀
            </button>

          </div>
        </div>
      )}

      {/* Modal Confirmación de Entrega y Envío de Comprobante Desktop */}
      {receiptNoticeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-500/20">
              🎉
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                ¡Cobro y Entrega Exitosa!
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                Pedido {receiptNoticeOrder.folio}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Cliente: <b>{receiptNoticeOrder.customerName}</b> • Total: <b>${receiptNoticeOrder.totalAmount?.toFixed(2)} MXN</b>
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Método de Pago:</span>
                <span className="font-bold text-slate-800">{receiptNoticeOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Lugar de Entrega:</span>
                <span className="font-bold text-slate-800">{receiptNoticeOrder.deliveryLocationName || 'Punto de Venta'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <span className="text-slate-600">Total Liquidado:</span>
                <span className="text-emerald-700">${receiptNoticeOrder.totalAmount?.toFixed(2)} MXN</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => sendWhatsAppReceipt(receiptNoticeOrder)}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar / Reenviar Comprobante WhatsApp 📲</span>
              </button>

              <button
                type="button"
                onClick={() => setReceiptNoticeOrder(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 active:scale-95 transition-all"
              >
                Listo, Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA CAPTURA MANUAL DE PEDIDO */}
      {isManualOrderOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Capturar Pedido Manual</h3>
                <p className="text-xs text-slate-500">Para pedidos que te pidan por WhatsApp, llamada o mensaje</p>
              </div>
              <button
                onClick={() => setIsManualOrderOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Datos del Cliente */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sofía Morales"
                  value={manualCustomer}
                  onChange={(e) => setManualCustomer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. 5512345678"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Lugar de Entrega
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Punto Principal, Metro..."
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Selector de Squishys a incluir */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Seleccionar Squishys del Catálogo
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {products.map(p => {
                  const inCart = manualCart.find(c => c.productId === p.id);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => {
                        if (inCart) {
                          setManualCart(manualCart.map(c => c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c));
                        } else {
                          setManualCart([...manualCart, { productId: p.id, name: p.name, price: p.salePrice, image: p.images?.[0] || null, quantity: 1 }]);
                        }
                      }}
                      className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs cursor-pointer hover:border-pink-400 active:scale-95"
                    >
                      <div className="truncate pr-1">
                        <div className="font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-pink-600 font-extrabold">${p.salePrice.toFixed(2)}</div>
                      </div>
                      {inCart ? (
                        <span className="w-5 h-5 rounded-full bg-pink-600 text-white font-black text-[10px] flex items-center justify-center">
                          {inCart.quantity}
                        </span>
                      ) : (
                        <Plus className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen del Pedido Manual */}
            {manualCart.length > 0 && (
              <div className="p-3 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-pink-900 block">Total del Pedido:</span>
                  <span className="text-base font-black text-pink-600">
                    ${manualCart.reduce((sum, i) => sum + (i.quantity * i.price), 0).toFixed(2)} MXN
                  </span>
                </div>
                <button
                  onClick={() => setManualCart([])}
                  className="text-xs text-red-500 font-bold hover:underline"
                >
                  Vaciar
                </button>
              </div>
            )}

            <button
              onClick={() => {
                if (manualCart.length === 0) {
                  alert('Selecciona al menos un squishy para el pedido');
                  return;
                }
                const res = createOrder({
                  customerName: manualCustomer || 'Cliente WhatsApp',
                  customerPhone: manualPhone,
                  deliveryNotes: manualNotes,
                  cartItems: manualCart
                });
                if (res.success) {
                  setIsManualOrderOpen(false);
                  setManualCustomer('');
                  setManualPhone('');
                  setManualNotes('');
                  setManualCart([]);
                  setActiveTab('nuevo');
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-extrabold text-sm shadow-lg shadow-pink-500/25 hover:from-pink-600 active:scale-98 transition-all"
            >
              GUARDAR PEDIDO Y APARTAR STOCK 📦
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
