import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Phone, 
  MessageCircle, 
  DollarSign, 
  X, 
  ChevronRight,
  Truck,
  Package,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MobileOrdersView({ onOpenOrderCapture }) {
  const { 
    orders, 
    advanceOrderStatus, 
    completeOrder, 
    cancelOrder, 
    whatsappNumber,
    refreshOrders
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('activos'); // 'activos', 'nuevo', 'preparado', 'por_entregar', 'completado'
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (refreshOrders) await refreshOrders();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Modal para liquidar pedido al entregar
  const [orderToComplete, setOrderToComplete] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [sendReceiptOnComplete, setSendReceiptOnComplete] = useState(true);
  const [receiptNoticeOrder, setReceiptNoticeOrder] = useState(null);

  // Contadores
  const countNew = orders.filter(o => o.status === 'nuevo').length;
  const countPreparing = orders.filter(o => o.status === 'preparado').length;
  const countToDeliver = orders.filter(o => o.status === 'por_entregar').length;
  const countCompleted = orders.filter(o => o.status === 'completado').length;
  const countActive = countNew + countPreparing + countToDeliver;

  // Filtrado reactivo
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      let matchesStatus = true;
      if (activeFilter === 'activos') {
        matchesStatus = ['nuevo', 'preparado', 'por_entregar'].includes(order.status);
      } else if (activeFilter === 'todos') {
        matchesStatus = true;
      } else {
        matchesStatus = order.status === activeFilter;
      }

      if (!matchesStatus) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      const matchFolio = (order.folio || '').toLowerCase().includes(q);
      const matchName = (order.customerName || '').toLowerCase().includes(q);
      const matchPhone = (order.customerPhone || '').includes(q);
      const matchItem = (order.items || []).some(i => (i.name || '').toLowerCase().includes(q));

      return matchFolio || matchName || matchPhone || matchItem;
    });
  }, [orders, activeFilter, searchTerm]);

  // Mensaje de estatus por WhatsApp
  const handleNotifyWhatsApp = (order) => {
    const cleanPhone = (order.customerPhone || '').replace(/\D/g, '');
    let text = '';

    if (order.status === 'nuevo') {
      text = `🧸 *¡Hola ${order.customerName}!* Tu pedido *${order.folio}* de squishys está confirmado y en preparación.\n\n` +
        `📦 *Artículos:*\n` + (order.items || []).map(i => `• ${i.quantity}x ${i.name}`).join('\n') +
        `\n💰 *Total:* $${order.totalAmount.toFixed(2)} MXN\n` +
        `📍 *Punto:* ${order.deliveryLocationName || 'Punto de Venta'}\n\n` +
        `¡Te avisamos en cuanto esté empacado! ✨`;
    } else if (order.status === 'preparado' || order.status === 'por_entregar') {
      text = `🎉 *¡Hola ${order.customerName}!* Tu pedido *${order.folio}* ya está listo para entregar en *${order.deliveryLocationName || 'Punto de Venta'}*.\n\n` +
        `💰 *Total a liquidar:* $${order.totalAmount.toFixed(2)} MXN\n` +
        `¿A qué hora pasas por ellos? ¡Te esperamos! ✨`;
    } else {
      text = `🧸 *¡Hola ${order.customerName}!* Muchas gracias por tu compra en SquishyTrack (Pedido *${order.folio}*). ¡Que disfrutes tus squishys! ✨`;
    }

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  // Generar y enviar comprobante formal de compra por WhatsApp
  const handleSendReceiptWhatsApp = (order, customPaymentMethod, customCashReceived) => {
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
      const unitP = Number(item.unitPrice ?? item.price ?? 0);
      text += `• *${item.quantity}x* ${item.name}${colorTxt} — $${(item.quantity * unitP).toFixed(2)} MXN\n`;
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

  // Confirmar cobro y despacho
  const handleFinalizeCompletion = () => {
    if (!orderToComplete) return;

    const cash = parseFloat(cashReceived) || orderToComplete.totalAmount;
    const completedInfo = {
      paymentMethod,
      cashReceived: cash
    };

    completeOrder(orderToComplete.id, completedInfo);

    const completedOrderData = {
      ...orderToComplete,
      paymentMethod,
      cashReceived: cash,
      completedAt: new Date().toISOString()
    };

    if (sendReceiptOnComplete) {
      handleSendReceiptWhatsApp(completedOrderData, paymentMethod, cash);
    }

    setReceiptNoticeOrder(completedOrderData);
    setOrderToComplete(null);
    setCashReceived('');
  };

  return (
    <div className="px-3 pt-3 pb-28 max-w-lg mx-auto space-y-3.5">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
            Despacho Móvil
          </span>
          <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>Control de Pedidos</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full">
              {countActive} activos
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all flex items-center justify-center border border-slate-200"
            title="Refrescar pedidos"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onOpenOrderCapture}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Pedido</span>
          </button>
        </div>
      </div>

      {/* Buscador Rápido */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por cliente, folio o squishy..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs font-semibold border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Chips de Filtro Horizontal */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'activos', label: `Activos (${countActive})` },
          { id: 'nuevo', label: `Nuevos (${countNew})` },
          { id: 'preparado', label: `Empacando (${countPreparing})` },
          { id: 'por_entregar', label: `Por Entregar (${countToDeliver})` },
          { id: 'completado', label: `Cobrados (${countCompleted})` },
          { id: 'todos', label: 'Todos' },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
              activeFilter === filter.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Lista de Pedidos */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-200 shadow-xs space-y-3">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            📋
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800">No hay pedidos en esta sección</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Toca el botón "+ Pedido" para registrar encargos y apartar piezas.
            </p>
          </div>
          <button
            onClick={onOpenOrderCapture}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Capturar Primer Pedido</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const isCompleted = order.status === 'completado';
            const isCancelled = order.status === 'cancelado';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2.5 transition-all"
              >
                {/* Header de Tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        {order.folio}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        order.status === 'nuevo' ? 'bg-amber-100 text-amber-800' :
                        order.status === 'preparado' ? 'bg-orange-100 text-orange-800' :
                        order.status === 'por_entregar' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'completado' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {order.status === 'nuevo' ? '🟡 Nuevo' :
                         order.status === 'preparado' ? '🟠 Empacando' :
                         order.status === 'por_entregar' ? '🔵 Listo Entrega' :
                         order.status === 'completado' ? '🟢 Cobrado' : 'Cancelado'}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900 mt-1">
                      {order.customerName}
                    </h4>
                  </div>

                  {/* Acciones de Contacto */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleNotifyWhatsApp(order)}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition-all"
                      title="Enviar mensaje de WhatsApp al cliente"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    {order.customerPhone && (
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition-all"
                        title="Llamar al cliente"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Lista de Squishys */}
                <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 space-y-1">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-black text-emerald-700 bg-emerald-100 px-1 rounded text-[10px]">
                          {item.quantity}x
                        </span>
                        <span className="text-slate-800 font-semibold truncate">{item.name}</span>
                        {item.color && (
                          <span className="text-[10px] font-extrabold text-pink-700 bg-pink-100 px-1 rounded shrink-0">
                            {item.color}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-700 shrink-0">
                        ${(item.quantity * Number(item.unitPrice ?? item.price ?? 0)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  
                  {order.deliveryNotes && (
                    <div className="pt-1 text-[11px] text-slate-500 italic border-t border-slate-200/60 mt-1">
                      📝 {order.deliveryNotes}
                    </div>
                  )}
                </div>

                {/* Selector directo de estatus (barra de pasos interactiva) */}
                {!isCompleted && !isCancelled && (
                  <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => advanceOrderStatus(order.id, 'nuevo')}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black transition-all ${
                        order.status === 'nuevo'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-white/60'
                      }`}
                    >
                      1. Recibido
                    </button>
                    <button
                      type="button"
                      onClick={() => advanceOrderStatus(order.id, 'preparado')}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black transition-all ${
                        order.status === 'preparado'
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-white/60'
                      }`}
                    >
                      2. Preparado
                    </button>
                    <button
                      type="button"
                      onClick={() => advanceOrderStatus(order.id, 'por_entregar')}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-black transition-all ${
                        order.status === 'por_entregar'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-white/60'
                      }`}
                    >
                      3. Listo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderToComplete(order);
                        setCashReceived(order.totalAmount.toString());
                      }}
                      className="py-1.5 px-1 rounded-lg text-[10px] font-black bg-emerald-600 text-white shadow-xs active:scale-95 transition-all"
                    >
                      💲 Cobrar
                    </button>
                  </div>
                )}

                {/* Resumen de Pago */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Total a Pagar</span>
                    <span className="text-base font-black text-slate-900">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* Botones de Cambio de Estatus */}
                  {isCompleted && (
                    <button
                      onClick={() => handleSendReceiptWhatsApp(order)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-extrabold text-xs active:scale-95 transition-all flex items-center gap-1.5"
                      title="Enviar comprobante detallado de compra por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Comprobante WA 📄</span>
                    </button>
                  )}

                  {!isCompleted && !isCancelled && (
                    <div className="flex items-center gap-1.5">
                      {order.status === 'nuevo' && (
                        <button
                          type="button"
                          onClick={() => advanceOrderStatus(order.id, 'preparado')}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-extrabold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Empacar</span>
                        </button>
                      )}

                      {order.status === 'preparado' && (
                        <button
                          type="button"
                          onClick={() => advanceOrderStatus(order.id, 'por_entregar')}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Listo</span>
                        </button>
                      )}

                      {order.status === 'por_entregar' && (
                        <button
                          type="button"
                          onClick={() => {
                            setOrderToComplete(order);
                            setCashReceived(order.totalAmount.toString());
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-sm shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cobrar & Entregar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Seguro que deseas cancelar el pedido ${order.folio}? Las piezas volverán al inventario.`)) {
                            cancelOrder(order.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                        title="Cancelar pedido"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cobro al Entregar */}
      {orderToComplete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom pb-safe">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900">Cobrar y Finalizar Entrega</h3>
                <p className="text-xs text-slate-400">Folio: {orderToComplete.folio}</p>
              </div>
              <button 
                onClick={() => setOrderToComplete(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-200">
              <span className="text-xs text-emerald-700 font-extrabold block">TOTAL A COBRAR</span>
              <span className="text-3xl font-black text-emerald-900">${orderToComplete.totalAmount.toFixed(2)}</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Método de Pago:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['Efectivo', 'Tarjeta', 'Transferencia'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      paymentMethod === m ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'Efectivo' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Efectivo Recibido:</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full p-2.5 bg-slate-100 rounded-xl text-center font-black text-lg outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
                {parseFloat(cashReceived) > orderToComplete.totalAmount && (
                  <p className="text-xs font-black text-emerald-600 text-center pt-1">
                    Cambio: ${(parseFloat(cashReceived) - orderToComplete.totalAmount).toFixed(2)}
                  </p>
                )}
              </div>
            )}

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
                <span>Enviar comprobante de compra por WhatsApp</span>
              </div>
            </label>

            <button
              onClick={handleFinalizeCompletion}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
            >
              ✅ Confirmar Cobro y Despacho
            </button>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Entrega y Envío de Comprobante */}
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
                onClick={() => handleSendReceiptWhatsApp(receiptNoticeOrder)}
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

    </div>
  );
}
