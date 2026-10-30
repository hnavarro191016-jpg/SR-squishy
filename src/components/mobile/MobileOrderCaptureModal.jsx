import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Minus, 
  ShoppingBag, 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  MessageCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MobileOrderCaptureModal({ isOpen, onClose }) {
  const { 
    products, 
    locations, 
    activeLocationId, 
    getStock, 
    createOrder,
    whatsappNumber 
  } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryLocationId, setDeliveryLocationId] = useState(activeLocationId || 'loc-2');
  const [advanceAmount, setAdvanceAmount] = useState('0');
  
  // Selección de artículos para el pedido
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [cart, setCart] = useState([]); // [{ productId, name, price, quantity, image, emoji }]

  // Categorías disponibles
  const categories = ['Todas', ...new Set(products.map(p => p.category))];

  // Productos filtrados
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'Todas' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Cálculos reactivos de totales
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const advanceNum = parseFloat(advanceAmount) || 0;
  const remainingBalance = Math.max(0, totalAmount - advanceNum);

  if (!isOpen) return null;

  // Manejador de incremento / decremento en carrito
  const handleUpdateQty = (product, delta) => {
    const stock = getStock(deliveryLocationId, product.id);
    const existing = cart.find(c => c.productId === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + delta;

    if (newQty > stock) {
      alert(`¡Solo quedan ${stock} piezas disponibles de "${product.name}"!`);
      return;
    }

    if (newQty <= 0) {
      setCart(cart.filter(c => c.productId !== product.id));
    } else if (existing) {
      setCart(cart.map(c => c.productId === product.id ? { ...c, quantity: newQty } : c));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.salePrice,
        costPrice: product.costPrice,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        emoji: product.emoji || '🧸',
        quantity: 1
      }]);
    }
  };

  // Crear y Enviar WhatsApp
  const handleConfirmOrder = () => {
    if (!customerName.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }
    if (cart.length === 0) {
      alert('Por favor agrega al menos 1 squishy al pedido');
      return;
    }

    const targetLocation = locations.find(l => l.id === deliveryLocationId) || { name: 'Punto de Venta' };
    const cleanPhone = customerPhone.replace(/\D/g, '');

    const result = createOrder({
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      deliveryLocationId: deliveryLocationId,
      deliveryType: 'Punto de Venta',
      deliveryNotes: deliveryNotes.trim() + (advanceNum > 0 ? ` [Anticipo: $${advanceNum.toFixed(2)}]` : ''),
      cartItems: cart,
      paymentMethod: advanceNum >= totalAmount ? 'Pagado Total' : (advanceNum > 0 ? `Anticipo $${advanceNum}` : 'Cobro al Entregar')
    });

    if (result.success) {
      const order = result.order;

      // Generar ticket de WhatsApp
      let msg = `🧸 *¡Hola ${customerName.trim()}!* Confirmamos tu pedido de Squishys:\n\n`;
      msg += `📋 *Folio:* ${order.folio}\n`;
      msg += `📍 *Lugar de Entrega:* ${targetLocation.name}\n`;
      if (deliveryNotes.trim()) {
        msg += `📝 *Horario / Notas:* ${deliveryNotes.trim()}\n`;
      }
      msg += `------------------------------------\n`;
      cart.forEach(item => {
        msg += `• *${item.quantity}x* ${item.name} ($${(item.quantity * item.price).toFixed(2)})\n`;
      });
      msg += `------------------------------------\n`;
      msg += `💰 *TOTAL:* $${totalAmount.toFixed(2)} MXN\n`;
      if (advanceNum > 0) {
        msg += `🟢 *Anticipo Recibido:* $${advanceNum.toFixed(2)} MXN\n`;
        msg += `⏳ *Saldo por Liquidar al Recibir:* $${remainingBalance.toFixed(2)} MXN\n`;
      } else {
        msg += `⏳ *Total a Cobrar al Entregar:* $${totalAmount.toFixed(2)} MXN\n`;
      }
      msg += `\n✨ *Tus piezas ya están separadas y listas para empacar con el folio ${order.folio}.* ¡Muchas gracias! 😊`;

      // Enviar directamente al WhatsApp del cliente si tiene, o al propio para reenviar
      const sendPhone = cleanPhone || (whatsappNumber || '').replace(/\D/g, '');
      const whatsappUrl = sendPhone
        ? `https://api.whatsapp.com/send?phone=${sendPhone}&text=${encodeURIComponent(msg)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

      window.open(whatsappUrl, '_blank');

      // Limpiar y cerrar
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryNotes('');
      setAdvanceAmount('0');
      onClose();
    } else {
      alert(result.message || 'Error al guardar el pedido');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Modal Dialog */}
      <div className="relative w-full sm:max-w-xl max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg">Capturar Pedido Rápido</h2>
              <p className="text-emerald-100 text-xs">Aparta inventario al instante y genera ticket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          
          {/* 1. Datos del Cliente */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              1. Datos del Cliente
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nombre del cliente *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="WhatsApp (ej. 5512345678)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={deliveryLocationId}
                onChange={(e) => setDeliveryLocationId(e.target.value)}
                className="w-1/2 py-2 px-3 bg-white rounded-xl text-xs font-bold text-slate-700 border border-slate-200 outline-none cursor-pointer"
              >
                {locations.filter(l => !l.isWarehouse).map(loc => (
                  <option key={loc.id} value={loc.id}>📍 {loc.name}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Notas (ej. Pasa a las 5pm)"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-1/2 py-2 px-3 bg-white rounded-xl text-xs font-medium border border-slate-200 outline-none"
              />
            </div>
          </div>

          {/* 2. Selector de Squishys */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                2. Seleccionar Squishys ({cart.reduce((a, b) => a + b.quantity, 0)} piezas)
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-[10px] text-red-500 font-bold hover:underline"
                >
                  Vaciar
                </button>
              )}
            </div>

            {/* Buscador y chips */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar squishy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>

            {categories.length > 1 && (
              <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
                {categories.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCategory(c)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                      selectedCategory === c
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Lista compacta de squishys para tocar y agregar */}
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 no-scrollbar border rounded-2xl p-2 bg-slate-50/50">
              {filteredProducts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No se encontraron squishys con ese nombre.
                </div>
              ) : (
                filteredProducts.map(p => {
                  const stock = getStock(deliveryLocationId, p.id);
                  const inCart = cart.find(c => c.productId === p.id);
                  const qty = inCart ? inCart.quantity : 0;
                  const isOutOfStock = stock <= 0;

                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                        qty > 0 
                          ? 'bg-emerald-50/80 border-emerald-300' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* Imagen y nombre */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center overflow-hidden shrink-0">
                          {p.images && p.images.length > 0 ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-base">{p.emoji || '🧸'}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 truncate">{p.name}</p>
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="font-black text-pink-600">${p.salePrice}</span>
                            <span className={`font-semibold ${isOutOfStock ? 'text-red-500' : 'text-slate-400'}`}>
                              • {stock} disp
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botones + / - */}
                      <div className="flex items-center gap-1 shrink-0">
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(p, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-90"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {qty > 0 && (
                          <span className="w-6 text-center text-xs font-black text-slate-900">
                            {qty}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(p, 1)}
                          disabled={isOutOfStock}
                          className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-all ${
                            isOutOfStock
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-90'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 3. Anticipo & Finanzas */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              3. Cobro & Anticipo
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setAdvanceAmount('0')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  advanceNum === 0 ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'
                }`}
              >
                Sin anticipo ($0)
              </button>
              {totalAmount > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount((totalAmount * 0.5).toFixed(0))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      advanceNum === Math.round(totalAmount * 0.5) ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    50% (${(totalAmount * 0.5).toFixed(0)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount(totalAmount.toString())}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      advanceNum === totalAmount ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'
                    }`}
                  >
                    Total Pagado (${totalAmount})
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 font-medium">Anticipo Recibido:</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-400">$</span>
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-20 py-1 px-2 bg-white rounded-lg border text-right font-bold text-xs outline-none"
                />
              </div>
            </div>

            {/* Resumen Total */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold block">Total Pedido</span>
                <span className="text-lg font-black text-slate-900">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold block">Saldo por Cobrar</span>
                <span className="text-lg font-black text-emerald-600">${remainingBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Action Button */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 pb-safe">
          <button
            type="button"
            onClick={handleConfirmOrder}
            disabled={cart.length === 0 || !customerName.trim()}
            className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${
              cart.length === 0 || !customerName.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 text-white shadow-emerald-500/25 hover:opacity-95'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span>Crear Pedido y Abrir WhatsApp (${totalAmount.toFixed(2)})</span>
          </button>
        </div>

      </div>
    </div>
  );
}
