import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const STORAGE_VERSION = 'v2_blank';

const DEFAULT_LOCATIONS = [
  { id: 'loc-1', name: 'Bodega Central', type: 'warehouse', isWarehouse: true },
  { id: 'loc-2', name: 'Punto de Venta Principal', type: 'store', isWarehouse: false },
];

export function AppProvider({ children }) {
  const [locations, setLocations] = useState(() => {
    const saved = localStorage.getItem('sq_locations');
    return saved ? JSON.parse(saved) : DEFAULT_LOCATIONS;
  });

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('sq_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('sq_inventory');
    return saved ? JSON.parse(saved) : {};
  });

  const [purchases, setPurchases] = useState(() => {
    const saved = localStorage.getItem('sq_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState(() => {
    const saved = localStorage.getItem('sq_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('sq_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeLocationId, setActiveLocationId] = useState(() => {
    return localStorage.getItem('sq_active_location') || 'loc-2';
  });

  const [whatsappNumber, setWhatsappNumber] = useState(() => {
    return localStorage.getItem('sq_whatsapp') || '';
  });

  // Persistencia en LocalStorage
  useEffect(() => {
    localStorage.setItem('sq_version', STORAGE_VERSION);
    localStorage.setItem('sq_locations', JSON.stringify(locations));
    localStorage.setItem('sq_products', JSON.stringify(products));
    localStorage.setItem('sq_inventory', JSON.stringify(inventory));
    localStorage.setItem('sq_purchases', JSON.stringify(purchases));
    localStorage.setItem('sq_sales', JSON.stringify(sales));
    localStorage.setItem('sq_orders', JSON.stringify(orders));
    localStorage.setItem('sq_active_location', activeLocationId);
    localStorage.setItem('sq_whatsapp', whatsappNumber);
  }, [locations, products, inventory, purchases, sales, orders, activeLocationId, whatsappNumber]);

  // Auto-sincronización de IDs entre compras y catálogo
  useEffect(() => {
    if (products.length > 0 && purchases.length > 0) {
      let purchasesUpdated = false;
      const updatedPurchases = purchases.map(pur => {
        const matchingProd = products.find(
          p => (p.name || '').trim().toLowerCase() === (pur.productName || '').trim().toLowerCase()
        );
        if (matchingProd && pur.productId !== matchingProd.id) {
          purchasesUpdated = true;
          return { ...pur, productId: matchingProd.id };
        }
        return pur;
      });

      if (purchasesUpdated) {
        setPurchases(updatedPurchases);
      }
    }
  }, [products]);

  // CÁLCULO INTELIGENTE DE STOCK EN EXISTENCIA
  const getStock = (locationId, productId) => {
    // 1. Stock directo en esta ubicación
    const directKey = `${locationId}_${productId}`;
    if (typeof inventory[directKey] === 'number') {
      return Math.max(0, inventory[directKey]);
    }

    // 2. Si no hay stock directo en este punto, ver si hay en bodega u otra sucursal
    const otherKeys = Object.keys(inventory).filter(
      k => k.endsWith(`_${productId}`) && typeof inventory[k] === 'number' && inventory[k] > 0
    );
    if (otherKeys.length > 0) {
      return otherKeys.reduce((sum, k) => sum + inventory[k], 0);
    }

    // 3. Fallback Infalible: Compras registradas menos Ventas y Pedidos activos
    const prod = products.find(p => p.id === productId);
    if (prod) {
      const prodName = (prod.name || '').trim().toLowerCase();

      // Total de compras
      const totalPurchased = purchases
        .filter(pur => pur.productId === productId || ((pur.productName || '').trim().toLowerCase() === prodName))
        .reduce((sum, pur) => sum + (Number(pur.totalUnits) || 0), 0);

      // Total de ventas directas
      const totalSold = sales
        .flatMap(s => s.items || [])
        .filter(item => item.productId === productId || ((item.name || '').trim().toLowerCase() === prodName))
        .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

      // Restar pedidos activos que ya apartaron mercancía (nuevo, preparado, por_entregar)
      const totalReserved = orders
        .filter(o => ['nuevo', 'preparado', 'por_entregar'].includes(o.status))
        .flatMap(o => o.items || [])
        .filter(item => item.productId === productId || ((item.name || '').trim().toLowerCase() === prodName))
        .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

      const calculated = totalPurchased - totalSold - totalReserved;
      return Math.max(0, calculated);
    }

    return 0;
  };

  const getTotalStock = (productId) => {
    return Math.max(
      locations.reduce((sum, loc) => sum + (inventory[`${loc.id}_${productId}`] || 0), 0),
      getStock(activeLocationId, productId)
    );
  };

  // Ajuste rápido de existencias
  const setQuickStock = (productId, newQuantity, locationId = activeLocationId) => {
    const qty = Math.max(0, parseInt(newQuantity) || 0);
    setInventory(prev => ({
      ...prev,
      [`${locationId}_${productId}`]: qty
    }));
  };

  // AGREGAR ARTÍCULO CON FOTOS Y STOCK
  const addProductWithStock = ({
    name,
    category = 'General',
    images = [],
    emoji = '',
    costPrice,
    salePrice,
    initialStock = 0,
    targetLocationId = activeLocationId,
    boxCost = 0,
    unitsPerBox = 0
  }) => {
    const newProd = {
      id: `sq-${Date.now()}`,
      name: name.trim(),
      category: category.trim() || 'General',
      images: Array.isArray(images) ? images : [],
      emoji: emoji || '',
      costPrice: Number(parseFloat(costPrice) || 0),
      salePrice: Number(parseFloat(salePrice) || 0),
      minStock: 5,
      boxCostReference: Number(boxCost) || 0,
      unitsPerBoxReference: Number(unitsPerBox) || 0
    };

    setProducts(prev => [...prev, newProd]);

    if (Number(initialStock) > 0) {
      const key = `${targetLocationId}_${newProd.id}`;
      setInventory(prev => ({
        ...prev,
        [key]: (prev[key] || 0) + Number(initialStock)
      }));
    }

    return newProd;
  };

  // MODIFICAR PRODUCTO
  const updateProduct = ({ id, name, category, images, costPrice, salePrice, boxCost, unitsPerBox, newStock, locationId }) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          name: name.trim(),
          category: category.trim() || 'General',
          images: Array.isArray(images) ? images : (p.images || []),
          costPrice: Number(parseFloat(costPrice) || 0),
          salePrice: Number(parseFloat(salePrice) || 0),
          boxCostReference: Number(boxCost) || 0,
          unitsPerBoxReference: Number(unitsPerBox) || 0
        };
      }
      return p;
    }));

    if (newStock !== undefined && locationId) {
      setInventory(prev => ({
        ...prev,
        [`${locationId}_${id}`]: Math.max(0, Number(newStock) || 0)
      }));
    }
  };

  // ELIMINAR PRODUCTO
  const deleteProduct = (productId) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setInventory(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.endsWith(`_${productId}`)) {
          delete updated[key];
        }
      });
      return updated;
    });
  };

  // REGISTRAR COMPRA POR CAJA
  const addPurchase = ({
    supplier,
    productId,
    boxCount,
    costPerBox,
    unitsPerBox,
    shippingCost = 0,
    notes = '',
    targetLocationId = null
  }) => {
    const totalUnits = Number(boxCount) * Number(unitsPerBox);
    const totalBoxCost = Number(boxCount) * Number(costPerBox);
    const totalInvestment = totalBoxCost + Number(shippingCost);
    const calculatedUnitCost = totalUnits > 0 ? Number((totalInvestment / totalUnits).toFixed(2)) : 0;

    const product = products.find(p => p.id === productId);

    const newPurchase = {
      id: `pur-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      supplier: supplier || 'Proveedor Mayorista',
      productId,
      productName: product ? product.name : 'Squishy',
      boxCount: Number(boxCount),
      costPerBox: Number(costPerBox),
      unitsPerBox: Number(unitsPerBox),
      shippingCost: Number(shippingCost),
      totalCost: totalInvestment,
      totalUnits,
      calculatedUnitCost,
      notes
    };

    setPurchases(prev => [newPurchase, ...prev]);

    if (product) {
      setProducts(prev =>
        prev.map(p =>
          p.id === productId
            ? { ...p, costPrice: calculatedUnitCost, boxCostReference: Number(costPerBox), unitsPerBoxReference: Number(unitsPerBox) }
            : p
        )
      );
    }

    const destinationId = targetLocationId || activeLocationId || 'loc-2';
    setInventory(prev => {
      const key = `${destinationId}_${productId}`;
      return {
        ...prev,
        [key]: (prev[key] || 0) + totalUnits
      };
    });

    return newPurchase;
  };

  // TRASPASO ENTRE PUNTOS
  const transferStock = (fromLocationId, toLocationId, productId, quantity) => {
    const qty = Number(quantity);
    const fromKey = `${fromLocationId}_${productId}`;
    const toKey = `${toLocationId}_${productId}`;

    const currentFrom = inventory[fromKey] || 0;
    if (currentFrom < qty) {
      return { success: false, message: 'Stock insuficiente en la ubicación de origen' };
    }

    setInventory(prev => ({
      ...prev,
      [fromKey]: currentFrom - qty,
      [toKey]: (prev[toKey] || 0) + qty
    }));

    return { success: true };
  };

  // REGISTRAR VENTA DIRECTA (POS)
  const recordSale = ({ locationId, cartItems, paymentMethod = 'Efectivo', cashReceived = 0 }) => {
    if (!cartItems || cartItems.length === 0) return { success: false, message: 'El carrito está vacío' };

    let totalAmount = 0;
    let totalCost = 0;

    const saleItems = cartItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const unitCost = prod ? prod.costPrice : 0;
      const unitPrice = item.price || (prod ? prod.salePrice : 0);
      const subtotal = unitPrice * item.quantity;
      const itemCost = unitCost * item.quantity;
      const profit = subtotal - itemCost;

      totalAmount += subtotal;
      totalCost += itemCost;

      return {
        productId: item.productId,
        name: item.name || (prod ? prod.name : 'Squishy'),
        image: item.image || (prod?.images?.[0] || null),
        emoji: prod?.emoji || '🧸',
        quantity: item.quantity,
        unitCost,
        unitPrice,
        subtotal,
        profit
      };
    });

    const totalProfit = totalAmount - totalCost;
    const profitMarginPercent = totalAmount > 0 ? Number(((totalProfit / totalAmount) * 100).toFixed(1)) : 0;

    const loc = locations.find(l => l.id === locationId);
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newSale = {
      id: `sal-${Date.now().toString().slice(-6)}`,
      date: formattedDate,
      timestamp: Date.now(),
      locationId,
      locationName: loc ? loc.name : 'Punto de Venta',
      items: saleItems,
      totalAmount,
      totalCost,
      totalProfit,
      profitMarginPercent,
      paymentMethod,
      cashReceived: Number(cashReceived) || totalAmount,
      changeGiven: Math.max(0, (Number(cashReceived) || totalAmount) - totalAmount),
      paymentStatus: 'Completado'
    };

    // Descontar inventario (del punto de venta y sincronizar con bodega si provenía de allí)
    setInventory(prev => {
      const updated = { ...prev };
      saleItems.forEach(item => {
        const directKey = `${locationId}_${item.productId}`;
        const currentDirect = typeof updated[directKey] === 'number' 
          ? updated[directKey] 
          : getStock(locationId, item.productId);
        
        updated[directKey] = Math.max(0, currentDirect - item.quantity);

        // Descontar también de otros almacenes para no dejar unidades fantasma
        let remainder = item.quantity;
        Object.keys(updated).forEach(k => {
          if (k.endsWith(`_${item.productId}`) && k !== directKey && typeof updated[k] === 'number' && updated[k] > 0) {
            const avail = updated[k];
            const deduct = Math.min(avail, remainder);
            updated[k] = avail - deduct;
            remainder -= deduct;
          }
        });
      });
      return updated;
    });

    setSales(prev => [newSale, ...prev]);

    return { success: true, sale: newSale };
  };

  // ==========================================
  // 📦 MOTOR DE GESTIÓN DE PEDIDOS (WHATSAPP)
  // ==========================================

  // 1. CREAR PEDIDO (Aparta el stock de inmediato)
  const createOrder = ({
    customerName = 'Cliente',
    customerPhone = '',
    deliveryLocationId = activeLocationId,
    deliveryType = 'Punto de Venta',
    deliveryNotes = '',
    cartItems = [],
    paymentMethod = 'Por Definir'
  }) => {
    if (!cartItems || cartItems.length === 0) return { success: false, message: 'El pedido está vacío' };

    let totalAmount = 0;
    let totalCost = 0;

    const orderItems = cartItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const unitCost = prod ? prod.costPrice : 0;
      const unitPrice = item.price || (prod ? prod.salePrice : 0);
      const subtotal = unitPrice * item.quantity;
      const itemCost = unitCost * item.quantity;
      const profit = subtotal - itemCost;

      totalAmount += subtotal;
      totalCost += itemCost;

      return {
        productId: item.productId,
        name: item.name || (prod ? prod.name : 'Squishy'),
        image: item.image || (prod?.images?.[0] || null),
        emoji: prod?.emoji || '🧸',
        quantity: item.quantity,
        unitCost,
        unitPrice,
        subtotal,
        profit
      };
    });

    const totalProfit = totalAmount - totalCost;
    const profitMarginPercent = totalAmount > 0 ? Number(((totalProfit / totalAmount) * 100).toFixed(1)) : 0;
    const loc = locations.find(l => l.id === deliveryLocationId);

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newOrder = {
      id: `ped-${Date.now().toString().slice(-6)}`,
      folio: `PED-#${(orders.length + 1).toString().padStart(3, '0')}`,
      date: formattedDate,
      timestamp: Date.now(),
      customerName: customerName.trim() || 'Cliente WhatsApp',
      customerPhone: customerPhone.trim(),
      deliveryLocationId,
      deliveryLocationName: loc ? loc.name : 'Punto de Venta',
      deliveryType,
      deliveryNotes,
      items: orderItems,
      totalAmount,
      totalCost,
      totalProfit,
      profitMarginPercent,
      status: 'nuevo', // nuevo -> preparado -> por_entregar -> completado -> cancelado
      paymentStatus: 'pendiente', // pendiente -> pagado
      paymentMethod
    };

    // APARTAR EL STOCK DE INMEDIATO (Se descuenta del inventario para no sobrevender)
    setInventory(prev => {
      const updated = { ...prev };
      orderItems.forEach(item => {
        const directKey = `${deliveryLocationId}_${item.productId}`;
        const currentDirect = typeof updated[directKey] === 'number' 
          ? updated[directKey] 
          : getStock(deliveryLocationId, item.productId);

        updated[directKey] = Math.max(0, currentDirect - item.quantity);

        // Descontar también de otros almacenes para no dejar unidades fantasma
        let remainder = item.quantity;
        Object.keys(updated).forEach(k => {
          if (k.endsWith(`_${item.productId}`) && k !== directKey && typeof updated[k] === 'number' && updated[k] > 0) {
            const avail = updated[k];
            const deduct = Math.min(avail, remainder);
            updated[k] = avail - deduct;
            remainder -= deduct;
          }
        });
      });
      return updated;
    });

    setOrders(prev => [newOrder, ...prev]);

    return { success: true, order: newOrder };
  };

  // 2. AVANZAR ESTADO DEL PEDIDO (Preparado, Por Entregar, etc.)
  const advanceOrderStatus = (orderId, nextStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
  };

  // 3. COMPLETAR Y COBRAR PEDIDO (El cliente recibe y paga -> se registra como venta en Dashboard)
  const completeOrder = (orderId, { paymentMethod = 'Efectivo', cashReceived = 0 }) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Pedido no encontrado' };

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Registrar en Sales del Dashboard
    const newSale = {
      id: `sal-${order.id.replace('ped-', '')}`,
      orderId: order.id,
      date: formattedDate,
      timestamp: Date.now(),
      locationId: order.deliveryLocationId,
      locationName: order.deliveryLocationName,
      items: order.items,
      totalAmount: order.totalAmount,
      totalCost: order.totalCost,
      totalProfit: order.totalProfit,
      profitMarginPercent: order.profitMarginPercent,
      paymentMethod,
      cashReceived: Number(cashReceived) || order.totalAmount,
      changeGiven: Math.max(0, (Number(cashReceived) || order.totalAmount) - order.totalAmount),
      paymentStatus: 'Completado'
    };

    setSales(prev => [newSale, ...prev]);

    // Marcar el pedido como completado
    setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { ...o, status: 'completado', paymentStatus: 'pagado', paymentMethod, completedAt: formattedDate } 
        : o
    ));

    return { success: true, sale: newSale };
  };

  // 4. CANCELAR PEDIDO (Regresa el stock apartado al inventario disponible)
  const cancelOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Pedido no encontrado' };

    // Solo devolver stock si no estaba ya completado o cancelado
    if (['nuevo', 'preparado', 'por_entregar'].includes(order.status)) {
      setInventory(prev => {
        const updated = { ...prev };
        order.items.forEach(item => {
          const key = `${order.deliveryLocationId}_${item.productId}`;
          updated[key] = (updated[key] || 0) + item.quantity;
        });
        return updated;
      });
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelado' } : o));

    return { success: true };
  };

  // REINICIAR TODO
  const clearAllData = () => {
    setProducts([]);
    setInventory({});
    setPurchases([]);
    setSales([]);
    setOrders([]);
    setLocations(DEFAULT_LOCATIONS);
    setActiveLocationId('loc-2');
    localStorage.clear();
    localStorage.setItem('sq_version', STORAGE_VERSION);
  };

  return (
    <AppContext.Provider
      value={{
        locations,
        products,
        inventory,
        purchases,
        sales,
        orders,
        activeLocationId,
        setActiveLocationId,
        whatsappNumber,
        setWhatsappNumber,
        getStock,
        getTotalStock,
        setQuickStock,
        addPurchase,
        transferStock,
        recordSale,
        createOrder,
        advanceOrderStatus,
        completeOrder,
        cancelOrder,
        updateProduct,
        deleteProduct,
        addProductWithStock,
        clearAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de un AppProvider');
  }
  return context;
}
