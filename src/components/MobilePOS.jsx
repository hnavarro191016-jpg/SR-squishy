import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Store, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Share2, 
  Sparkles,
  AlertTriangle,
  X,
  PlusCircle,
  Camera,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  Edit3,
  Eye,
  SlidersHorizontal,
  Palette
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getColorVisual } from '../utils/colorHelper';

function playSaleSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {}
}

function triggerSaleConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 45 }).map(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    vx: (Math.random() - 0.5) * 16,
    vy: (Math.random() - 0.8) * 18,
    color: ['#FF6B8B', '#FFA07A', '#FFD166', '#06D6A0', '#4D96FF', '#A06CD5'][Math.floor(Math.random() * 6)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 10
  }));

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.5;
      p.rotation += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    frame++;
    if (frame < 65) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }
  animate();
}

export default function MobilePOS({ 
  onOpenAddProduct, 
  onEditProduct, 
  isCustomerCatalogMode = false, 
  onOpenShareCatalog,
  isMobileAppMode = false,
  onOpenOrderCapture,
  onCartChange
}) {
  const { 
    locations, 
    products, 
    inventory,
    activeLocationId, 
    setActiveLocationId, 
    getStock, 
    getTotalStock,
    setQuickStock,
    recordSale,
    createOrder,
    transferStock,
    deleteProduct,
    whatsappNumber,
    setWhatsappNumber,
    isLoadingCloud
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in_stock' | 'out_of_stock'
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashAmount, setCashAmount] = useState('');
  const [completedSale, setCompletedSale] = useState(null);

  // Estados de Pedidos por WhatsApp
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderCustomerName, setOrderCustomerName] = useState('');
  const [orderCustomerPhone, setOrderCustomerPhone] = useState('');
  const [orderDeliveryNotes, setOrderDeliveryNotes] = useState('');
  const [orderSuccessNotice, setOrderSuccessNotice] = useState(null);

  // Modo Vista: Si viene por URL de catálogo, siempre es modo cliente (costos y botones admin ocultos)
  const [isCustomerViewLocal, setIsCustomerViewLocal] = useState(false);
  const isCustomerView = isCustomerCatalogMode || isCustomerViewLocal;

  // Estados para visor de fotos (Lightbox)
  const [previewProduct, setPreviewProduct] = useState(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  // Modal para configurar número de WhatsApp si falta
  const [isWhatsAppConfigOpen, setIsWhatsAppConfigOpen] = useState(false);
  const [tempWhatsApp, setTempWhatsApp] = useState(whatsappNumber || '');
  const [customerName, setCustomerName] = useState('');

  // Modal de Selección de Color para el Carrito
  const [colorModalProduct, setColorModalProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorQuantity, setColorQuantity] = useState(1);

  const getCartKey = (productId, color) => `${productId}_${color || ''}`;

  // Notificar al contenedor principal cuando hay artículos en el carrito para ocultar menús
  React.useEffect(() => {
    if (onCartChange) {
      onCartChange(cart.length);
    }
  }, [cart.length, onCartChange]);

  const currentLocation = locations.find(l => l.id === activeLocationId) || locations[0] || { name: 'Punto de Venta' };

  // Categorías
  const categories = ['Todas', ...new Set(products.map(p => p.category))];

  // Conteo de existencias para los botones de filtro
  const stockCounts = useMemo(() => {
    let inStock = 0;
    let outOfStock = 0;
    products.forEach(p => {
      const s = isCustomerView ? getTotalStock(p.id) : getStock(activeLocationId, p.id);
      if (s > 0) inStock++;
      else outOfStock++;
    });
    return { inStock, outOfStock, total: products.length };
  }, [products, isCustomerView, activeLocationId, getTotalStock, getStock, inventory]);

  // Productos filtrados por categoría, búsqueda y filtro de existencia
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = selectedCategory === 'Todas' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const s = isCustomerView ? getTotalStock(p.id) : getStock(activeLocationId, p.id);
      let matchesStock = true;
      if (stockFilter === 'in_stock') {
        matchesStock = s > 0;
      } else if (stockFilter === 'out_of_stock') {
        matchesStock = s <= 0;
      }

      return matchesCat && matchesSearch && matchesStock;
    });
  }, [products, selectedCategory, searchTerm, stockFilter, isCustomerView, activeLocationId, getTotalStock, getStock, inventory]);

  // Totales de carrito
  const cartTotals = useMemo(() => {
    let totalItems = 0;
    let totalAmount = 0;
    let totalCost = 0;

    cart.forEach(item => {
      totalItems += item.quantity;
      totalAmount += item.quantity * item.price;
      totalCost += item.quantity * item.costPrice;
    });

    const totalProfit = totalAmount - totalCost;
    const profitMargin = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

    return { totalItems, totalAmount, totalCost, totalProfit, profitMargin };
  }, [cart]);

  const handleInitiateAddToCart = (product) => {
    const available = isCustomerView ? getTotalStock(product.id) : getStock(activeLocationId, product.id);
    if (available <= 0) return;

    if (Array.isArray(product.colors) && product.colors.length > 0) {
      setColorModalProduct(product);
      const firstInStock = product.colors.find(c => (Number(c.stock) || 0) > 0) || product.colors[0];
      setSelectedColor(firstInStock);
      setColorQuantity(1);
    } else {
      addToCart(product, null, 1);
    }
  };

  const addToCart = (product, chosenColorName = null, chosenQty = 1) => {
    const totalStock = isCustomerView ? getTotalStock(product.id) : getStock(activeLocationId, product.id);
    let maxAvail = totalStock;

    if (chosenColorName && Array.isArray(product.colors)) {
      const colObj = product.colors.find(c => c.name.toLowerCase() === chosenColorName.toLowerCase());
      if (colObj) {
        maxAvail = Number(colObj.stock) || 0;
      }
    }

    const targetKey = getCartKey(product.id, chosenColorName);
    const existing = cart.find(item => getCartKey(item.productId, item.color) === targetKey);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (currentQtyInCart + chosenQty > maxAvail) {
      alert(`¡Solo quedan ${maxAvail} piezas disponibles${chosenColorName ? ` en color "${chosenColorName}"` : ''}${isCustomerView ? '' : ` en ${currentLocation.name}`}!`);
      return;
    }

    if (existing) {
      setCart(cart.map(item => 
        getCartKey(item.productId, item.color) === targetKey
          ? { ...item, quantity: item.quantity + chosenQty }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        color: chosenColorName || null,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        emoji: product.emoji,
        price: product.salePrice,
        costPrice: product.costPrice,
        quantity: chosenQty
      }]);
    }
  };

  const updateQuantity = (productId, delta, color = null) => {
    const prod = products.find(p => p.id === productId);
    let maxAvail = isCustomerView ? getTotalStock(productId) : getStock(activeLocationId, productId);
    if (color && prod && Array.isArray(prod.colors)) {
      const colObj = prod.colors.find(c => c.name.toLowerCase() === color.toLowerCase());
      if (colObj) {
        maxAvail = Number(colObj.stock) || 0;
      }
    }

    const targetKey = getCartKey(productId, color);

    setCart(prev => {
      return prev.map(item => {
        if (getCartKey(item.productId, item.color) === targetKey) {
          const newQty = item.quantity + delta;
          if (newQty > maxAvail) {
            alert(`Stock máximo alcanzado (${maxAvail} piezas)`);
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleFinalizeSale = () => {
    const received = paymentMethod === 'Efectivo' 
      ? (parseFloat(cashAmount) || cartTotals.totalAmount) 
      : cartTotals.totalAmount;

    if (paymentMethod === 'Efectivo' && received < cartTotals.totalAmount) {
      alert('El monto recibido en efectivo es menor al total de la venta.');
      return;
    }

    const result = recordSale({
      locationId: activeLocationId,
      cartItems: cart,
      paymentMethod,
      cashReceived: received
    });

    if (result.success) {
      playSaleSound();
      triggerSaleConfetti();
      setCompletedSale(result.sale);
      setCart([]);
      setIsCheckoutOpen(false);
      setCashAmount('');
    } else {
      alert(result.message || 'Error al registrar la venta');
    }
  };

  // ABRIR DIÁLOGO DE PEDIDO POR WHATSAPP (Directo a WhatsApp de la tienda 81 2373 9027)
  const handleSendWhatsAppOrder = () => {
    setIsOrderModalOpen(true);
  };

  // CONFIRMAR PEDIDO, APARTAR STOCK DE INMEDIATO Y MANDAR MENSAJE
  const handleConfirmAndSendOrder = () => {
    if (cart.length === 0) return;

    const finalCustomerName = orderCustomerName.trim() || customerName.trim() || 'Cliente WhatsApp';

    const result = createOrder({
      customerName: finalCustomerName,
      customerPhone: orderCustomerPhone.trim(),
      deliveryLocationId: activeLocationId,
      deliveryType: 'Punto de Venta',
      deliveryNotes: orderDeliveryNotes.trim(),
      cartItems: cart,
      paymentMethod: 'Por Cobrar al Entregar'
    });

    if (result.success) {
      playSaleSound();
      triggerSaleConfetti();

      const order = result.order;

      let message = `🧸 *¡Hola! Quiero confirmar este pedido de Squishys:*\n`;
      message += `📋 *Folio de Pedido:* ${order.folio}\n`;
      message += `👤 *Cliente:* ${finalCustomerName}\n`;
      if (orderCustomerPhone.trim()) {
        message += `📱 *Teléfono:* ${orderCustomerPhone.trim()}\n`;
      }
      message += `📍 *Punto de Entrega:* ${currentLocation.name}\n`;
      if (orderDeliveryNotes.trim()) {
        message += `📝 *Notas:* ${orderDeliveryNotes.trim()}\n`;
      }
      message += `------------------------------------\n`;

      cart.forEach(item => {
        const colorTag = item.color ? ` (Color: *${item.color}*)` : '';
        message += `• *${item.quantity}x* ${item.name}${colorTag} ($${(item.quantity * item.price).toFixed(2)})\n`;
      });

      message += `------------------------------------\n`;
      message += `💰 *TOTAL A PAGAR: $${cartTotals.totalAmount.toFixed(2)} MXN*\n\n`;
      message += `✨ *El stock ya quedó apartado en sistema con el folio ${order.folio}.*\n`;
      message += `¿A qué hora puedo pasar por él? ¡Muchas gracias! 😊`;

      const cleanNumber = (whatsappNumber || '528123739027').replace(/\D/g, '') || '528123739027';
      const url = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;

      window.open(url, '_blank');

      setCart([]);
      setIsOrderModalOpen(false);
      setIsCheckoutOpen(false);
      setOrderSuccessNotice(order);

      // Limpiar datos temporales
      setOrderCustomerName('');
      setOrderCustomerPhone('');
      setOrderDeliveryNotes('');
    } else {
      alert(result.message || 'Error al apartar stock del pedido');
    }
  };

  const saveWhatsAppNumber = (e) => {
    e.preventDefault();
    if (!tempWhatsApp.trim()) return;
    setWhatsappNumber(tempWhatsApp.trim());
    setIsWhatsAppConfigOpen(false);
    setTimeout(() => setIsOrderModalOpen(true), 300);
  };

  const quickBills = [50, 100, 200, 500];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-32">
      
      {/* Barra Superior con Selector de Punto y Alternador de Vistas */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {isCustomerCatalogMode ? (
            /* Encabezado limpio para el Cliente (Sin botones de control interno) */
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 block">Catálogo Oficial</span>
                <span className="font-black text-slate-800 text-sm sm:text-base">Squishys Disponibles</span>
              </div>
            </div>
          ) : (
            /* Controles del Vendedor / Administrador */
            <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-100 text-pink-700 rounded-xl">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Punto de Venta</span>
                  <select
                    value={activeLocationId}
                    onChange={(e) => setActiveLocationId(e.target.value)}
                    className="font-bold text-slate-800 bg-transparent text-sm sm:text-base outline-none cursor-pointer"
                  >
                    {locations.filter(l => !l.isWarehouse).map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Alternador Modo Cliente / Modo Vendedor */}
              <button
                onClick={() => setIsCustomerViewLocal(!isCustomerViewLocal)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  isCustomerView 
                    ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title={isCustomerView ? 'Cambiar a modo vendedor' : 'Ver como catálogo de clientes'}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isCustomerView ? 'Vista Cliente' : 'Vista Vendedor'}</span>
              </button>

              {/* Botón Compartir Catálogo a Clientes */}
              {onOpenShareCatalog && (
                <button
                  onClick={onOpenShareCatalog}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-extrabold text-xs border border-purple-200 hover:bg-purple-100 flex items-center gap-1.5 transition-all"
                  title="Compartir catálogo blindado a tus clientes"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Compartir Catálogo</span>
                </button>
              )}

              {/* Botón Subir Squishy (Solo visible en modo vendedor) */}
              {!isCustomerView && (
                <button
                  onClick={onOpenAddProduct}
                  className="px-3 py-1.5 rounded-xl bg-pink-50 text-pink-600 font-bold text-xs border border-pink-200 hover:bg-pink-100 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Subir</span>
                </button>
              )}
            </div>
          )}

          {/* Buscador */}
          {products.length > 0 && (
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar squishy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

        </div>

        {/* Barra de Filtros: Categorías y Existencias */}
        {products.length > 0 && (
          <div className="pt-2 pb-1 space-y-2.5 border-t border-slate-100">
            {/* Chips de Categorías */}
            {categories.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-pink-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Selector de Existencia (Todos / Con Existencia / Sin Existencia) */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-2xl text-xs font-bold gap-1 border border-slate-200/60 shadow-inner">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    stockFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Todos</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    stockFilter === 'all' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200/70 text-slate-500'
                  }`}>
                    {stockCounts.total}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStockFilter('in_stock')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    stockFilter === 'in_stock'
                      ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-white/60'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${stockFilter === 'in_stock' ? 'bg-white' : 'bg-emerald-500'}`}></span>
                  <span>Con Existencia</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    stockFilter === 'in_stock' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {stockCounts.inStock}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStockFilter('out_of_stock')}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    stockFilter === 'out_of_stock'
                      ? 'bg-rose-600 text-white shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-rose-700 hover:bg-white/60'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${stockFilter === 'out_of_stock' ? 'bg-white' : 'bg-rose-500'}`}></span>
                  <span>Sin Existencia</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    stockFilter === 'out_of_stock' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {stockCounts.outOfStock}
                  </span>
                </button>
              </div>

              {/* Indicador sutil de almacén/tienda */}
              {!isCustomerView && (
                <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Existencias en: <b className="text-slate-600">{currentLocation.name}</b>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ESTADO DE CARGA O EN BLANCO */}
      {isLoadingCloud ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h3 className="text-base font-black text-slate-800">Cargando tus squishys desde la nube...</h3>
          <p className="text-xs text-slate-400 font-medium">Sincronizando fotos, precios y existencias en tiempo real ☁️</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed border-pink-200 shadow-sm space-y-4">
          <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-inner">
            {isCustomerView ? '🧸' : '📸'}
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-black text-slate-900">
              {isCustomerView ? '¡Bienvenido a nuestro catálogo!' : '¡Tu catálogo está listo para fotos!'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {isCustomerView
                ? 'Estamos preparando y agregando nuevos modelos de squishys. Si buscas un modelo en específico, escríbenos directamente a WhatsApp.'
                : 'Sube tus squishys con fotos reales desde tu celular o computadora. Podrás modificarlos, eliminarlos y recibir pedidos directos a tu WhatsApp.'}
            </p>
          </div>

          {!isCustomerView && onOpenAddProduct && (
            <button
              onClick={onOpenAddProduct}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-sm shadow-lg shadow-pink-500/25 hover:from-pink-600 hover:to-rose-700 active:scale-95 transition-all inline-flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>+ Subir Squishy con Fotos</span>
            </button>
          )}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed border-slate-200 shadow-sm space-y-3">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            {stockFilter === 'in_stock' ? '📦' : stockFilter === 'out_of_stock' ? '✨' : '🔍'}
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-base font-black text-slate-800">
              {stockFilter === 'in_stock' 
                ? 'No hay squishys con existencia' 
                : stockFilter === 'out_of_stock' 
                ? '¡No hay squishys agotados!' 
                : 'No se encontraron squishys'}
            </h3>
            <p className="text-xs text-slate-500">
              {stockFilter === 'in_stock'
                ? 'Todos los modelos en esta categoría o búsqueda están agotados actualmente.'
                : stockFilter === 'out_of_stock'
                ? '¡Excelente! Todos los modelos mostrados tienen existencias disponibles.'
                : 'Prueba cambiando de categoría o borrando el término de búsqueda.'}
            </p>
          </div>
          <button
            onClick={() => { setStockFilter('all'); setSelectedCategory('Todas'); setSearchTerm(''); }}
            className="px-4 py-2 rounded-xl bg-pink-50 text-pink-600 font-bold text-xs hover:bg-pink-100 transition-colors"
          >
            Mostrar todos los squishys
          </button>
        </div>
      ) : (
        /* Grid de Productos */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {filteredProducts.map(product => {
            const stock = isCustomerView ? getTotalStock(product.id) : getStock(activeLocationId, product.id);
            const inCartItems = cart.filter(c => c.productId === product.id);
            const totalInCartForProduct = inCartItems.reduce((sum, item) => sum + item.quantity, 0);
            const isOutOfStock = stock <= 0;
            const profit = product.salePrice - product.costPrice;
            const margin = product.salePrice > 0 ? ((profit / product.salePrice) * 100).toFixed(0) : '0';
            const hasImages = product.images && product.images.length > 0;

            return (
              <div
                key={product.id}
                className={`relative bg-white rounded-2xl p-3 sm:p-4 border transition-all duration-150 select-none flex flex-col justify-between group ${
                  isOutOfStock 
                    ? 'opacity-65 border-slate-200 bg-slate-50' 
                    : totalInCartForProduct > 0
                    ? 'border-pink-500 ring-2 ring-pink-500/20 shadow-md'
                    : 'border-slate-200 shadow-sm hover:shadow-md hover:border-pink-300'
                }`}
              >
                {/* Badge en Carrito */}
                {totalInCartForProduct > 0 && (
                  <div className="absolute -top-2 -left-2 bg-pink-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce z-20">
                    {totalInCartForProduct}
                  </div>
                )}

                <div>
                  {/* FOTO REAL O INICIAL */}
                  <div 
                    onClick={() => {
                      if (hasImages) {
                        setPreviewProduct(product);
                        setPreviewImageIndex(0);
                      } else if (!isOutOfStock) {
                        handleInitiateAddToCart(product);
                      }
                    }}
                    className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center mb-2.5 cursor-pointer"
                  >
                    {hasImages ? (
                      <>
                        <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                        {product.images.length > 1 && (
                          <span className="absolute bottom-1.5 right-1.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                            <ImageIcon className="w-3 h-3" />
                            <span>{product.images.length}</span>
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-pink-50 shadow-sm flex items-center justify-center font-black text-2xl text-pink-600 border border-pink-200">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info Producto */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 block truncate">
                        {product.category || 'General'}
                      </span>

                      {/* BOTONES DE EDITAR Y ELIMINAR (Solo en Modo Vendedor, fuera de la foto) */}
                      {!isCustomerView && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditProduct(product);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                            title="Modificar este squishy (fotos, precio, existencias)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${product.name}"?`)) {
                                deleteProduct(product.id);
                              }
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar este squishy"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Variantes de colores disponibles */}
                    {product.colors && product.colors.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {product.colors.map((c, i) => {
                          const visual = getColorVisual(c.name);
                          const isColorOut = (Number(c.stock) || 0) <= 0;
                          return (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border ${
                                isColorOut
                                  ? 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-50'
                                  : visual.badge
                              }`}
                              title={`${c.name}: ${c.stock || 0} disponibles`}
                            >
                              <span>{visual.emoji}</span>
                              <span>{c.name}</span>
                              <span className="opacity-75">({c.stock || 0})</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Precio y Margen */}
                    <div className="flex items-baseline justify-between pt-1">
                      <div className="text-base sm:text-lg font-black text-slate-900">
                        ${product.salePrice.toFixed(2)}
                      </div>
                      {/* Margen solo visible para el vendedor */}
                      {!isCustomerView && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                          +{margin}% mrg
                        </span>
                      )}
                    </div>

                    {/* EXISTENCIA / STOCK EN VIVO ULTRA CLARO */}
                    <div className="pt-1.5">
                      {isOutOfStock ? (
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              if (!isCustomerView) {
                                e.stopPropagation();
                                if (product.colors && product.colors.length > 0 && onEditProduct) {
                                  onEditProduct(product);
                                } else {
                                  const val = window.prompt(`Ingresa las existencias para "${product.name}":`, '6');
                                  if (val !== null) setQuickStock(product.id, val, activeLocationId);
                                }
                              }
                            }}
                            className={`inline-flex items-center gap-1 text-[11px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg ${
                              !isCustomerView ? 'cursor-pointer hover:bg-red-100' : ''
                            }`}
                            title={!isCustomerView ? (product.colors?.length > 0 ? 'Click para editar existencias por color' : 'Click para asignar existencias manualmente') : ''}
                          >
                            <span>🔴 Agotado</span>
                            {!isCustomerView && <span className="text-[9px] underline ml-1 text-red-500 font-normal">Ajustar</span>}
                          </button>
                          {getStock('loc-1', product.id) > 0 && !isCustomerView && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                transferStock('loc-1', activeLocationId, product.id, getStock('loc-1', product.id));
                              }}
                              className="w-full text-[10px] font-bold text-pink-700 bg-pink-100 hover:bg-pink-200 px-2 py-1 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                              title="Traspasar de Bodega Central a este punto"
                            >
                              <span>📥 Cargar {getStock('loc-1', product.id)} pzs de Bodega</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            if (!isCustomerView) {
                              e.stopPropagation();
                              if (product.colors && product.colors.length > 0 && onEditProduct) {
                                onEditProduct(product);
                              } else {
                                const val = window.prompt(`Modificar existencias de "${product.name}":`, stock.toString());
                                if (val !== null) setQuickStock(product.id, val, activeLocationId);
                              }
                            }
                          }}
                          className={`${
                            stock <= 5 
                              ? 'inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg animate-pulse' 
                              : 'inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg'
                          } ${!isCustomerView ? 'cursor-pointer hover:opacity-80' : ''}`}
                          title={!isCustomerView ? (product.colors?.length > 0 ? 'Click para editar existencias por color' : 'Click para cambiar existencia rápidamente') : ''}
                        >
                          <span>{stock <= 5 ? (stock === 1 ? '🔥 ¡Solo queda 1 pieza!' : `🔥 ¡Solo quedan ${stock} piezas!`) : `🟢 ${stock} disponibles`}</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>

                {/* Botón de Agregar / Pedir */}
                <button
                  onClick={() => !isOutOfStock && handleInitiateAddToCart(product)}
                  disabled={isOutOfStock}
                  className={`w-full mt-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-pink-600 text-white shadow-sm active:scale-95'
                  }`}
                >
                  {product.colors && product.colors.length > 0 ? (
                    <>
                      <Palette className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Sin Existencia' : 'Elegir Color'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{isOutOfStock ? 'Sin Existencia' : 'Agregar'}</span>
                    </>
                  )}
                </button>

              </div>
            );
          })}
        </div>
      )}

      {/* BARRA FLOTANTE DE CARRITO: Se coloca en bottom-0 ocupando todo el ancho sin estorbar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/98 backdrop-blur-md border-t border-slate-200 shadow-2xl z-40 pb-safe animate-in slide-in-from-bottom duration-200">
          <div className="max-w-4xl mx-auto space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
            
            {/* Fila 1: Resumen de Artículos, Total y Botón Vaciar */}
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-pink-500/30">
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-slate-900 text-white font-black text-[10px] sm:text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cartTotals.totalItems}
                  </span>
                </div>

                <div>
                  <div className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                    ${cartTotals.totalAmount.toFixed(2)}
                  </div>
                  {!isCustomerView && (
                    <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-600">
                      <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Ganancia: +${cartTotals.totalProfit.toFixed(0)} ({cartTotals.profitMargin.toFixed(0)}%)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón Vaciar */}
              <button
                type="button"
                onClick={() => setCart([])}
                title="Vaciar carrito"
                className="px-2.5 py-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-bold"
              >
                <Trash2 className="w-4 h-4" />
                <span className="sm:hidden">Vaciar</span>
              </button>
            </div>

            {/* Fila 2: Botones de Acción Grandes y Fáciles de Tocar */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Botón Pedido por WhatsApp */}
              <button
                type="button"
                onClick={handleSendWhatsAppOrder}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                title="Mandar pedido directo a WhatsApp"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Pedir por WhatsApp</span>
              </button>

              {/* Botón Cobrar POS (Para Vendedor) */}
              {!isCustomerView && (
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="flex-1 sm:flex-none px-4 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-black text-xs sm:text-sm shadow-md shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Cobrar</span>
                  <span className="bg-white/20 px-1.5 py-0.5 rounded-lg text-xs font-black">${cartTotals.totalAmount.toFixed(0)}</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* VISOR DE FOTOS / LIGHTBOX */}
      {previewProduct && previewProduct.images && previewProduct.images.length > 0 && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl relative text-center">
            
            <button
              onClick={() => setPreviewProduct(null)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-3 text-left">
              <span className="text-[11px] font-bold uppercase text-pink-600">{previewProduct.category}</span>
              <h3 className="text-lg font-black text-slate-900">{previewProduct.name}</h3>
              <p className="text-base font-black text-slate-900">${previewProduct.salePrice.toFixed(2)} MXN</p>
              
              {/* Existencias en Lightbox */}
              <div className="mt-1">
                {getStock(activeLocationId, previewProduct.id) > 0 ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    🟢 En existencia: {getStock(activeLocationId, previewProduct.id)} piezas
                  </span>
                ) : (
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                    🔴 Agotado temporalmente
                  </span>
                )}
              </div>
            </div>

            {/* Imagen Principal Grande */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner mb-3">
              <img
                src={previewProduct.images[previewImageIndex]}
                alt={`Vista ${previewImageIndex + 1}`}
                className="w-full h-full object-contain"
              />

              {previewProduct.images.length > 1 && (
                <>
                  <button
                    onClick={() => setPreviewImageIndex((prev) => (prev > 0 ? prev - 1 : previewProduct.images.length - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPreviewImageIndex((prev) => (prev < previewProduct.images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Carrusel de Miniaturas */}
            {previewProduct.images.length > 1 && (
              <div className="flex gap-2 justify-center mb-4 overflow-x-auto py-1">
                {previewProduct.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setPreviewImageIndex(i)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                      previewImageIndex === i ? 'border-pink-500 scale-105 shadow' : 'border-slate-200 opacity-60'
                    }`}
                  >
                    <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {(() => {
              const previewStock = isCustomerView
                ? getTotalStock(previewProduct.id)
                : getStock(activeLocationId, previewProduct.id);
              const isPreviewOutOfStock = previewStock <= 0;

              return (
                <button
                  type="button"
                  onClick={() => {
                    const prod = previewProduct;
                    setPreviewProduct(null);
                    handleInitiateAddToCart(prod);
                  }}
                  disabled={isPreviewOutOfStock}
                  className={`w-full py-3.5 text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isPreviewOutOfStock
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-pink-500 to-rose-600 shadow-pink-500/25 hover:from-pink-600 hover:to-rose-700 active:scale-95'
                  }`}
                >
                  {isPreviewOutOfStock ? (
                    <span>🔴 Sin Existencia (Agotado)</span>
                  ) : previewProduct.colors && previewProduct.colors.length > 0 ? (
                    <>
                      <Palette className="w-5 h-5" />
                      <span>Elegir Color y Agregar (${previewProduct.salePrice.toFixed(2)})</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Agregar al Pedido (${previewProduct.salePrice.toFixed(2)})</span>
                    </>
                  )}
                </button>
              );
            })()}

          </div>
        </div>
      )}

      {/* MODAL PARA SELECCIONAR COLOR Y DISPONIBILIDAD */}
      {colorModalProduct && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            {/* Botón cerrar */}
            <button
              onClick={() => setColorModalProduct(null)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabecera con foto y nombre */}
            <div className="flex items-center gap-3 pr-8">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                {colorModalProduct.images && colorModalProduct.images.length > 0 ? (
                  <img src={colorModalProduct.images[0]} alt={colorModalProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-2xl">{colorModalProduct.emoji || '🧸'}</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 block truncate">
                  {colorModalProduct.category || 'Squishy'}
                </span>
                <h3 className="font-black text-sm text-slate-900 leading-tight truncate">
                  {colorModalProduct.name}
                </h3>
                <span className="text-base font-black text-slate-900">
                  ${colorModalProduct.salePrice.toFixed(2)} <span className="text-xs text-slate-400 font-normal">MXN</span>
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-pink-600" />
                  <span>¿Qué color deseas?</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  Elige tu modelo
                </span>
              </div>

              {/* Lista de colores disponibles */}
              <div className="space-y-2">
                {colorModalProduct.colors.map((c, i) => {
                  const visual = getColorVisual(c.name);
                  const isSelected = selectedColor?.name?.toLowerCase() === c.name.toLowerCase();
                  const stockNum = Number(c.stock) || 0;
                  const isOut = stockNum <= 0;

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isOut}
                      onClick={() => {
                        setSelectedColor(c);
                        setColorQuantity(1);
                      }}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isOut
                          ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-pink-50/70 border-pink-500 ring-2 ring-pink-500/20 shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{visual.emoji}</span>
                        <div>
                          <span className={`font-black text-xs block ${isSelected ? 'text-pink-900' : 'text-slate-800'}`}>
                            {c.name}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            isOut ? 'text-red-500' : stockNum <= 3 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {isOut ? '🔴 Agotado' : stockNum <= 3 ? `🔥 ¡Solo quedan ${stockNum}!` : `🟢 ${stockNum} disponibles`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'border-pink-600 bg-pink-600 text-white' 
                            : 'border-slate-300'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stepper de cantidad para el color elegido */}
            {selectedColor && (Number(selectedColor.stock) || 0) > 0 && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Cantidad:</span>
                  <span className="text-[10px] text-slate-400">Máx: {selectedColor.stock} piezas</span>
                </div>
                <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setColorQuantity(Math.max(1, colorQuantity - 1))}
                    disabled={colorQuantity <= 1}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-pink-100 text-slate-700 hover:text-pink-600 font-black flex items-center justify-center disabled:opacity-30 active:scale-95"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-black text-sm text-slate-900">
                    {colorQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setColorQuantity(Math.min(Number(selectedColor.stock) || 1, colorQuantity + 1))}
                    disabled={colorQuantity >= (Number(selectedColor.stock) || 1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-pink-100 text-slate-700 hover:text-pink-600 font-black flex items-center justify-center disabled:opacity-30 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Botón Confirmar Agregar al Carrito */}
            <button
              type="button"
              disabled={!selectedColor || (Number(selectedColor.stock) || 0) <= 0}
              onClick={() => {
                if (selectedColor && (Number(selectedColor.stock) || 0) > 0) {
                  addToCart(colorModalProduct, selectedColor.name, colorQuantity);
                  setColorModalProduct(null);
                }
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-700 text-white font-black text-sm shadow-lg shadow-pink-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {!selectedColor || (Number(selectedColor.stock) || 0) <= 0 
                  ? 'Color No Disponible' 
                  : `Agregar ${colorQuantity > 1 ? `${colorQuantity} ` : ''}(${selectedColor.name}) • $${(colorQuantity * colorModalProduct.salePrice).toFixed(2)}`}
              </span>
            </button>

          </div>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN NÚMERO DE WHATSAPP */}
      {isWhatsAppConfigOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center space-y-4">
            
            <button
              onClick={() => setIsWhatsAppConfigOpen(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-md shadow-emerald-500/20">
              <MessageCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">¿A qué WhatsApp llegarán los pedidos?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ingresa tu número de teléfono con código de país para que los clientes te manden sus pedidos con un solo clic.
              </p>
            </div>

            <form onSubmit={saveWhatsAppNumber} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1 text-left">
                  Número de WhatsApp (ej. 5215512345678)
                </label>
                <input
                  type="tel"
                  placeholder="Ej. 5215512345678"
                  value={tempWhatsApp}
                  onChange={(e) => setTempWhatsApp(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 active:scale-98 transition-all"
              >
                Guardar y Enviar Pedido 📲
              </button>
            </form>

          </div>
        </div>
      )}

      {/* MODAL PARA CONFIRMAR PEDIDO POR WHATSAPP Y APARTAR STOCK */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Apartar y Pedir x WhatsApp</h3>
                  <p className="text-[11px] text-slate-400 font-medium">El stock se descuenta de inmediato para apartar tu pedido</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOrderModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen de Artículos */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-36 overflow-y-auto">
              {cart.map((item, idx) => (
                <div key={`${item.productId}_${item.color || ''}_${idx}`} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-7 h-7 rounded-lg object-cover" />
                    ) : (
                      <span className="text-sm">{item.emoji || '🧸'}</span>
                    )}
                    <div>
                      <span className="font-bold text-slate-800">{item.quantity}x {item.name}</span>
                      {item.color && (
                        <span className="ml-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-pink-100 text-pink-700 border border-pink-200">
                          {item.color}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-900">${(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-md shadow-emerald-500/20">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 block">Total a Pagar</span>
                <span className="text-2xl font-black">${cartTotals.totalAmount.toFixed(2)} MXN</span>
              </div>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
                {cartTotals.totalItems} piezas
              </span>
            </div>

            {/* Campos Opcionales del Cliente */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Nombre de quien pide (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sofía, Carlos, etc."
                  value={orderCustomerName}
                  onChange={(e) => setOrderCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Teléfono / WhatsApp (Opcional)
                </label>
                <input
                  type="tel"
                  placeholder="Ej. 5512345678"
                  value={orderCustomerPhone}
                  onChange={(e) => setOrderCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Notas de Entrega / Horario
                </label>
                <input
                  type="text"
                  placeholder="Ej. Paso a recoger hoy a las 5:00 PM..."
                  value={orderDeliveryNotes}
                  onChange={(e) => setOrderDeliveryNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Botón Acción Principal */}
            <button
              onClick={handleConfirmAndSendOrder}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>APARTAR STOCK Y ENVIAR A WHATSAPP</span>
            </button>

            <p className="text-[10px] text-center text-slate-400 font-medium">
              Al hacer clic, el stock se descuenta para garantizar la existencia y se abre WhatsApp con el resumen listo para enviar.
            </p>

          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN DE PEDIDO APARTADO */}
      {orderSuccessNotice && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4">
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-500/20">
              📦
            </div>

            <div>
              <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 inline-block mb-1">
                {orderSuccessNotice.folio}
              </span>
              <h3 className="text-xl font-black text-slate-900">¡Stock Apartado con Éxito!</h3>
              <p className="text-xs text-slate-500 mt-1">
                El pedido de <span className="font-bold text-slate-800">{orderSuccessNotice.customerName}</span> está registrado en la pestaña <span className="font-bold text-pink-600">Pedidos</span>.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-left space-y-1.5">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Total del Pedido:</span>
                <span className="font-black text-slate-900">${orderSuccessNotice.totalAmount.toFixed(2)} MXN</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estatus inicial:</span>
                <span className="font-bold text-amber-600">🟡 Nuevo / En Espera</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Inventario:</span>
                <span className="font-bold text-emerald-600">✓ Piezas apartadas</span>
              </div>
            </div>

            <button
              onClick={() => setOrderSuccessNotice(null)}
              className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-extrabold text-sm hover:bg-slate-800 active:scale-98 transition-all"
            >
              ¡Entendido, Continuar! 👍
            </button>

          </div>
        </div>
      )}

      {/* MODAL DE COBRO POS */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <h3 className="text-lg font-black text-slate-900">Finalizar Venta</h3>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Artículos en Carrito */}
            <div className="py-3 max-h-40 overflow-y-auto space-y-2">
              {cart.map((item, idx) => (
                <div key={`${item.productId}_${item.color || ''}_${idx}`} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover shadow-sm border border-slate-200" />
                    ) : (
                      <span className="w-8 h-8 rounded-lg bg-pink-100 text-pink-700 font-extrabold flex items-center justify-center text-xs">
                        {item.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <span>{item.name}</span>
                        {item.color && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-pink-100 text-pink-700 border border-pink-200">
                            {item.color}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500">${item.price.toFixed(2)} c/u</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateQuantity(item.productId, -1, item.color)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 active:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="font-black text-slate-900 w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId, 1, item.color)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 active:bg-slate-100"
                    >
                      +
                    </button>
                    <span className="font-extrabold text-slate-900 ml-2 w-12 text-right">
                      ${(item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4 text-white my-3 shadow-lg shadow-pink-500/25">
              <div className="text-xs uppercase font-bold tracking-wider text-pink-100">Total a Pagar</div>
              <div className="text-3xl font-black">${cartTotals.totalAmount.toFixed(2)} <span className="text-sm font-normal">MXN</span></div>
              <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
                <span>Tu ganancia neta en este cobro:</span>
                <span className="bg-white/25 px-2 py-0.5 rounded-full font-bold">
                  +${cartTotals.totalProfit.toFixed(2)} ({cartTotals.profitMargin.toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Opción Enviar por WhatsApp desde el checkout */}
            <button
              type="button"
              onClick={handleSendWhatsAppOrder}
              className="w-full mb-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Enviar Resumen a WhatsApp</span>
            </button>

            {/* Método de Pago */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Método de Pago</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Efectivo', icon: Banknote, label: 'Efectivo' },
                  { id: 'Tarjeta', icon: CreditCard, label: 'Tarjeta' },
                  { id: 'Transferencia', icon: Smartphone, label: 'Transfer/CoDi' },
                ].map(method => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                        paymentMethod === method.id
                          ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Si es Efectivo */}
              {paymentMethod === 'Efectivo' && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Efectivo Recibido:</span>
                    <input
                      type="number"
                      placeholder={cartTotals.totalAmount.toFixed(2)}
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-28 text-right font-black text-slate-900 bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => setCashAmount(cartTotals.totalAmount.toString())}
                      className="text-[11px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100"
                    >
                      Exacto
                    </button>
                    {quickBills.filter(b => b >= cartTotals.totalAmount).map(bill => (
                      <button
                        key={bill}
                        onClick={() => setCashAmount(bill.toString())}
                        className="text-[11px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100"
                      >
                        ${bill}
                      </button>
                    ))}
                  </div>

                  {parseFloat(cashAmount) > cartTotals.totalAmount && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-emerald-700 font-extrabold text-sm">
                      <span>Cambio a devolver:</span>
                      <span className="text-base">${(parseFloat(cashAmount) - cartTotals.totalAmount).toFixed(2)} MXN</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleFinalizeSale}
              className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-base shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>CONFIRMAR COBRO Y ENTREGAR</span>
            </button>

          </div>
        </div>
      )}

      {/* MODAL TICKET */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4">
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">
              🎉
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">¡Venta Registrada con Éxito!</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ticket #{completedSale.id} • {completedSale.locationName}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300 text-left space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Total Cobrado ({completedSale.paymentMethod}):</span>
                <span className="text-sm font-black text-slate-900">${completedSale.totalAmount.toFixed(2)}</span>
              </div>
              {completedSale.changeGiven > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Cambio devuelto:</span>
                  <span className="font-bold">${completedSale.changeGiven.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-emerald-600">
                <span>Tu Utilidad Neta:</span>
                <span>+${completedSale.totalProfit.toFixed(2)} ({completedSale.profitMarginPercent}%)</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  const text = `🧸 *Ticket SquishyTrack Pro*\n📍 ${completedSale.locationName}\n💰 Total: $${completedSale.totalAmount.toFixed(2)} MXN\n¡Gracias por tu compra!`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar Comprobante por WhatsApp</span>
              </button>

              <button
                onClick={() => setCompletedSale(null)}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-extrabold text-sm hover:bg-slate-800 transition-colors"
              >
                Siguiente Venta 🚀
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
