import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import {
  fetchAllFromSupabase,
  fetchProductImagesBatchFromSupabase,
  syncProductToSupabase,
  deleteProductFromSupabase,
  syncOrderToSupabase,
  syncSaleToSupabase,
  syncPurchaseToSupabase,
  syncInventoryKeyToSupabase
} from '../services/supabaseSync';
import {
  getCachedImagesMap,
  setCachedProductImages,
  setCachedProductsImagesBulk
} from '../utils/imageCache';

const AppContext = createContext();

const STORAGE_VERSION = 'v3_clean_cloud';

function ensureCleanStorageVersion() {
  if (typeof window === 'undefined') return;
  try {
    const currentVer = localStorage.getItem('sq_version');
    if (currentVer !== STORAGE_VERSION) {
      localStorage.removeItem('sq_products');
      localStorage.removeItem('sq_inventory');
      localStorage.setItem('sq_version', STORAGE_VERSION);
    }
  } catch (e) {}
}

const DEFAULT_LOCATIONS = [
  { id: 'loc-1', name: 'Bodega Central', type: 'warehouse', isWarehouse: true },
  { id: 'loc-2', name: 'Punto de Venta Principal', type: 'store', isWarehouse: false },
];

export const DEFAULT_WHATSAPP_NUMBER = '528123739027';

export function AppProvider({ children }) {
  // Purgar caché viejo de prueba antes de inicializar estados
  ensureCleanStorageVersion();

  const pendingProductIdsRef = useRef(new Set());
  const imagesCacheRef = useRef({});
  const loadedImageIdsRef = useRef(new Set());
  const isFetchingImagesRef = useRef(false);

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
    const saved = localStorage.getItem('sq_whatsapp');
    return (saved && saved.trim().length > 5) ? saved.trim() : DEFAULT_WHATSAPP_NUMBER;
  });

  const [isLoadingCloud, setIsLoadingCloud] = useState(() => Boolean(isSupabaseConfigured));

  // Cargar fotos guardadas en IndexedDB al arrancar (instantáneo, <15ms)
  useEffect(() => {
    getCachedImagesMap().then(cachedMap => {
      if (cachedMap && Object.keys(cachedMap).length > 0) {
        imagesCacheRef.current = { ...imagesCacheRef.current, ...cachedMap };
        Object.keys(cachedMap).forEach(id => {
          if (Array.isArray(cachedMap[id]) && cachedMap[id].length > 0) {
            loadedImageIdsRef.current.add(id);
          }
        });
        setProducts(prev => prev.map(p => {
          if ((!p.images || p.images.length === 0) && cachedMap[p.id]?.length > 0) {
            return { ...p, images: cachedMap[p.id] };
          }
          return p;
        }));
      }
    });
  }, []);

  // Descarga progresiva en lotes de 4 para las fotos que aún no están en memoria ni en IndexedDB
  const loadMissingProductImages = async (productList) => {
    if (isFetchingImagesRef.current || !Array.isArray(productList)) return;
    const missingIds = productList
      .filter(p => (!p.images || p.images.length === 0) && !loadedImageIdsRef.current.has(p.id))
      .map(p => p.id);

    if (missingIds.length === 0) return;
    isFetchingImagesRef.current = true;

    try {
      const BATCH_SIZE = 4;
      for (let i = 0; i < missingIds.length; i += BATCH_SIZE) {
        const batchIds = missingIds.slice(i, i + BATCH_SIZE);
        const batchResults = await fetchProductImagesBatchFromSupabase(batchIds);
        batchIds.forEach(id => loadedImageIdsRef.current.add(id));

        if (batchResults.length > 0) {
          const batchMap = {};
          batchResults.forEach(item => {
            batchMap[item.id] = item.images || [];
            imagesCacheRef.current[item.id] = item.images || [];
          });
          setCachedProductsImagesBulk(batchResults);

          setProducts(prev => prev.map(p => {
            if (batchMap[p.id] && batchMap[p.id].length > 0) {
              return { ...p, images: batchMap[p.id] };
            }
            return p;
          }));
        }
      }
    } finally {
      isFetchingImagesRef.current = false;
    }
  };

  const applyCloudProducts = (cloudProducts) => {
    if (!Array.isArray(cloudProducts)) return;
    setProducts(prev => {
      const cloudIds = new Set(cloudProducts.map(p => p.id));
      // Solo conservar productos locales si se están subiendo en este preciso instante
      const pendingLocal = prev.filter(p => !cloudIds.has(p.id) && pendingProductIdsRef.current.has(p.id));
      const merged = cloudProducts.map(cp => {
        const localMatch = prev.find(p => p.id === cp.id);
        const cachedImgs = imagesCacheRef.current[cp.id];
        const resolvedImages =
          (Array.isArray(cp.images) && cp.images.length > 0)
            ? cp.images
            : (Array.isArray(localMatch?.images) && localMatch.images.length > 0)
            ? localMatch.images
            : (Array.isArray(cachedImgs) && cachedImgs.length > 0)
            ? cachedImgs
            : [];

        return {
          ...cp,
          images: resolvedImages,
          initialStock: localMatch?.initialStock ?? cp.initialStock
        };
      });
      const result = [...merged, ...pendingLocal];
      try {
        const lightProducts = result.map(p => ({ ...p, images: [] }));
        localStorage.setItem('sq_products', JSON.stringify(lightProducts));
      } catch(e) {}
      setTimeout(() => loadMissingProductImages(result), 10);
      return result;
    });
  };

  const applyCloudInventory = (cloudInventory) => {
    if (!cloudInventory || typeof cloudInventory !== 'object') return;
    setInventory(prev => {
      const merged = { ...cloudInventory };
      // Solo conservar llaves locales si pertenecen a un producto que sigue subiéndose
      Object.keys(prev).forEach(k => {
        const prodId = k.split('_').slice(1).join('_');
        if (merged[k] === undefined && pendingProductIdsRef.current.has(prodId)) {
          merged[k] = prev[k];
        }
      });
      try {
        localStorage.setItem('sq_inventory', JSON.stringify(merged));
      } catch(e) {}
      return merged;
    });
  };

  // Sincronización Inicial con Supabase (Carga de datos en tiempo real)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoadingCloud(false);
      return;
    }

    let isMounted = true;
    async function loadCloudData() {
      try {
        const cloudData = await fetchAllFromSupabase(false);
        if (!cloudData || !isMounted) return;

        // 1. Inventario primero (existencias exactas en <400ms)
        if (cloudData.inventory !== null) {
          applyCloudInventory(cloudData.inventory);
        }

        // 2. Productos de la nube (elimina cualquier producto fantasma viejo)
        if (cloudData.products !== null) {
          applyCloudProducts(cloudData.products);
        }

        // 3. Pedidos, Ventas, Compras y Ubicaciones
        if (cloudData.orders !== null) {
          setOrders(cloudData.orders);
          try { localStorage.setItem('sq_orders', JSON.stringify(cloudData.orders)); } catch(e) {}
        }

        if (cloudData.sales !== null) {
          setSales(cloudData.sales);
          try { localStorage.setItem('sq_sales', JSON.stringify(cloudData.sales)); } catch(e) {}
        }

        if (cloudData.purchases !== null) {
          setPurchases(cloudData.purchases);
          try { localStorage.setItem('sq_purchases', JSON.stringify(cloudData.purchases)); } catch(e) {}
        }

        if (cloudData.locations !== null && cloudData.locations.length > 0) {
          setLocations(cloudData.locations);
        }
      } catch (err) {
        console.error('Error al sincronizar con la nube:', err);
      } finally {
        if (isMounted) setIsLoadingCloud(false);
      }
    }

    loadCloudData();

    // Suscripción en Tiempo Real (Realtime WebSockets)
    const channel = supabase
      .channel('squishy_cloud_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sq_orders' }, async () => {
        const fresh = await fetchAllFromSupabase(false);
        if (fresh?.orders !== null && isMounted) setOrders(fresh.orders);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sq_inventory' }, async () => {
        const fresh = await fetchAllFromSupabase(false);
        if (fresh?.inventory !== null && isMounted) applyCloudInventory(fresh.inventory);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sq_products' }, async () => {
        const fresh = await fetchAllFromSupabase(false);
        if (fresh?.products !== null && isMounted) applyCloudProducts(fresh.products);
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Persistencia en LocalStorage protegida contra saturación de almacenamiento
  useEffect(() => {
    try {
      localStorage.setItem('sq_version', STORAGE_VERSION);
      localStorage.setItem('sq_locations', JSON.stringify(locations));
      localStorage.setItem('sq_inventory', JSON.stringify(inventory));
      localStorage.setItem('sq_purchases', JSON.stringify(purchases));
      localStorage.setItem('sq_sales', JSON.stringify(sales));
      localStorage.setItem('sq_orders', JSON.stringify(orders));
      localStorage.setItem('sq_active_location', activeLocationId);
      localStorage.setItem('sq_whatsapp', whatsappNumber);
    } catch (err) {
      console.warn('Error al guardar estado base en LocalStorage:', err);
    }

    try {
      // Guardar metadatos de productos en LocalStorage (ligero, 4 KB) mientras las fotos viven en IndexedDB
      const lightProducts = products.map(p => ({ ...p, images: [] }));
      localStorage.setItem('sq_products', JSON.stringify(lightProducts));
    } catch (e) {}
  }, [locations, products, inventory, purchases, sales, orders, activeLocationId, whatsappNumber]);

  // Helper para comparar listas de pedidos y evitar re-renders innecesarios
  const areOrdersEqual = (listA, listB) => {
    if (!listA || !listB) return listA === listB;
    if (listA.length !== listB.length) return false;
    for (let i = 0; i < listA.length; i++) {
      if (
        listA[i].id !== listB[i].id || 
        listA[i].status !== listB[i].status || 
        listA[i].paymentStatus !== listB[i].paymentStatus ||
        listA[i].totalAmount !== listB[i].totalAmount
      ) {
        return false;
      }
    }
    return true;
  };

  // FUNCIÓN UNIVERSAL DE AUTO-REFRESH Y SINCRONIZACIÓN DE PEDIDOS
  const refreshOrders = async () => {
    try {
      // 1. Cargar pedidos desde LocalStorage (detecta pedidos hechos desde otra pestaña o modo catálogo)
      const savedOrders = localStorage.getItem('sq_orders');
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed)) {
          setOrders(prev => areOrdersEqual(prev, parsed) ? prev : parsed);
        }
      }
    } catch (e) {
      console.warn('Error al leer pedidos de localStorage:', e);
    }

    // 2. Si Supabase está configurado en la nube, traer los pedidos y existencias más frescos (consulta ligera ~7 KB)
    if (isSupabaseConfigured && supabase) {
      try {
        const cloudData = await fetchAllFromSupabase(false);
        if (cloudData && cloudData.orders !== null) {
          setOrders(prev => {
            if (areOrdersEqual(prev, cloudData.orders)) return prev;
            try {
              localStorage.setItem('sq_orders', JSON.stringify(cloudData.orders));
            } catch(e) {}
            return cloudData.orders;
          });
        }
        if (cloudData && cloudData.inventory !== null) {
          applyCloudInventory(cloudData.inventory);
        }
        if (cloudData && cloudData.products !== null) {
          applyCloudProducts(cloudData.products);
        }
      } catch (err) {
        console.warn('Error al sincronizar pedidos de Supabase:', err);
      }
    }
  };

  // 1. Escuchar evento 'storage' para sincronizar pedidos entre pestañas en tiempo real (0 ms de delay)
  useEffect(() => {
    const handleStorageEvent = (e) => {
      if (e.key === 'sq_orders' && e.newValue) {
        try {
          const freshOrders = JSON.parse(e.newValue);
          if (Array.isArray(freshOrders)) {
            setOrders(freshOrders);
          }
        } catch (err) {}
      }
      if (e.key === 'sq_inventory' && e.newValue) {
        try {
          const freshInv = JSON.parse(e.newValue);
          if (freshInv) setInventory(freshInv);
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  // 2. Auto-refresco inmediato al regresar a la app (ej. tras mandar WhatsApp o cambiar de pestaña)
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshOrders();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [isSupabaseConfigured]);

  // 3. Heartbeat de auto-refresco cíclico cada 4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshOrders();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isSupabaseConfigured]);

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
    // 1. Stock directo en esta ubicación (si es positivo)
    const directKey = `${locationId}_${productId}`;
    if (typeof inventory[directKey] === 'number' && inventory[directKey] > 0) {
      return inventory[directKey];
    }

    // 2. Si en esta ubicación es 0 o no existe, buscar si hay existencias en cualquier otro punto (ej. Punto de Venta Principal o Bodega)
    const otherKeys = Object.keys(inventory).filter(
      k => k.endsWith(`_${productId}`) && typeof inventory[k] === 'number' && inventory[k] > 0
    );
    if (otherKeys.length > 0) {
      return otherKeys.reduce((sum, k) => sum + inventory[k], 0);
    }

    // Si existe la llave directa en 0 y ninguna otra ubicación tiene stock, es 0
    if (typeof inventory[directKey] === 'number') {
      return 0;
    }

    const prod = products.find(p => p.id === productId);

    // 3. Stock inicial guardado en el producto
    if (prod && typeof prod.initialStock === 'number' && prod.initialStock > 0) {
      return prod.initialStock;
    }

    // 4. Fallback Infalible: Compras registradas menos Ventas y Pedidos activos
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
  const setQuickStock = async (productId, newQuantity, locationId = activeLocationId) => {
    const qty = Math.max(0, parseInt(newQuantity) || 0);
    const key = `${locationId}_${productId}`;
    setInventory(prev => {
      const updated = {
        ...prev,
        [key]: qty
      };
      try { localStorage.setItem('sq_inventory', JSON.stringify(updated)); } catch(e) {}
      return updated;
    });
    await syncInventoryKeyToSupabase(key, qty);
  };

  // AGREGAR ARTÍCULO CON FOTOS Y STOCK
  const addProductWithStock = async ({
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
    const qty = Number(initialStock) || 0;
    const locId = targetLocationId || activeLocationId || 'loc-2';
    const prodId = `sq-${Date.now()}`;
    const key = `${locId}_${prodId}`;
    const validImages = Array.isArray(images) ? images : [];

    pendingProductIdsRef.current.add(prodId);
    if (validImages.length > 0) {
      imagesCacheRef.current[prodId] = validImages;
      loadedImageIdsRef.current.add(prodId);
      setCachedProductImages(prodId, validImages);
    }

    const newProd = {
      id: prodId,
      name: name.trim(),
      category: category.trim() || 'General',
      images: validImages,
      emoji: emoji || '',
      costPrice: Number(parseFloat(costPrice) || 0),
      salePrice: Number(parseFloat(salePrice) || 0),
      initialStock: qty,
      minStock: 5,
      boxCostReference: Number(boxCost) || 0,
      unitsPerBoxReference: Number(unitsPerBox) || 0
    };

    // 1. Guardar de inmediato en estado local y LocalStorage (0 ms de espera en pantalla)
    setProducts(prev => {
      const updated = [...prev.filter(p => p.id !== newProd.id), newProd];
      try {
        const light = updated.map(p => ({ ...p, images: [] }));
        localStorage.setItem('sq_products', JSON.stringify(light));
      } catch(e) {}
      return updated;
    });

    if (qty > 0) {
      setInventory(prev => {
        const updated = {
          ...prev,
          [key]: qty
        };
        try { localStorage.setItem('sq_inventory', JSON.stringify(updated)); } catch(e) {}
        return updated;
      });
    }

    // 2. Sincronizar en orden estricto con Supabase: PRIMERO el producto, LUEGO el inventario
    try {
      const pRes = await syncProductToSupabase(newProd);
      if (pRes?.error) {
        console.warn('Error en syncProductToSupabase, reintentando:', pRes.error);
        await new Promise(r => setTimeout(r, 600));
        await syncProductToSupabase(newProd);
      }
      if (qty > 0) {
        await syncInventoryKeyToSupabase(key, qty);
      }
    } catch (syncErr) {
      console.warn('Error sincronizando nuevo producto a Supabase:', syncErr);
    } finally {
      pendingProductIdsRef.current.delete(prodId);
    }

    return newProd;
  };

  // MODIFICAR PRODUCTO
  const updateProduct = async ({ id, name, category, images, costPrice, salePrice, boxCost, unitsPerBox, newStock, locationId }) => {
    let updatedProd = null;
    if (Array.isArray(images) && images.length > 0) {
      imagesCacheRef.current[id] = images;
      loadedImageIdsRef.current.add(id);
      setCachedProductImages(id, images);
    }
    setProducts(prev => {
      const updatedList = prev.map(p => {
        if (p.id === id) {
          updatedProd = {
            ...p,
            name: name.trim(),
            category: category.trim() || 'General',
            images: Array.isArray(images) ? images : (p.images || []),
            costPrice: Number(parseFloat(costPrice) || 0),
            salePrice: Number(parseFloat(salePrice) || 0),
            boxCostReference: Number(boxCost) || 0,
            unitsPerBoxReference: Number(unitsPerBox) || 0
          };
          return updatedProd;
        }
        return p;
      });
      try {
        const light = updatedList.map(p => ({ ...p, images: [] }));
        localStorage.setItem('sq_products', JSON.stringify(light));
      } catch(e) {}
      return updatedList;
    });

    if (newStock !== undefined && locationId) {
      const key = `${locationId}_${id}`;
      const qty = Math.max(0, Number(newStock) || 0);
      setInventory(prev => {
        const updated = {
          ...prev,
          [key]: qty
        };
        try { localStorage.setItem('sq_inventory', JSON.stringify(updated)); } catch(e) {}
        return updated;
      });
      try {
        if (updatedProd) await syncProductToSupabase(updatedProd);
        await syncInventoryKeyToSupabase(key, qty);
      } catch (err) {
        console.warn('Error al actualizar en Supabase:', err);
      }
    } else if (updatedProd) {
      try {
        await syncProductToSupabase(updatedProd);
      } catch (err) {
        console.warn('Error al actualizar producto en Supabase:', err);
      }
    }
  };

  // ELIMINAR PRODUCTO
  const deleteProduct = (productId) => {
    deleteProductFromSupabase(productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    setInventory(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key.endsWith(`_${productId}`)) {
          syncInventoryKeyToSupabase(key, 0);
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
    syncPurchaseToSupabase(newPurchase);

    if (product) {
      const updatedProd = { ...product, costPrice: calculatedUnitCost, boxCostReference: Number(costPerBox), unitsPerBoxReference: Number(unitsPerBox) };
      syncProductToSupabase(updatedProd);
      setProducts(prev =>
        prev.map(p =>
          p.id === productId ? updatedProd : p
        )
      );
    }

    const destinationId = targetLocationId || activeLocationId || 'loc-2';
    setInventory(prev => {
      const key = `${destinationId}_${productId}`;
      const nextQty = (prev[key] || 0) + totalUnits;
      syncInventoryKeyToSupabase(key, nextQty);
      return {
        ...prev,
        [key]: nextQty
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
        syncInventoryKeyToSupabase(directKey, updated[directKey]);

        // Descontar también de otros almacenes para no dejar unidades fantasma
        let remainder = item.quantity;
        Object.keys(updated).forEach(k => {
          if (k.endsWith(`_${item.productId}`) && k !== directKey && typeof updated[k] === 'number' && updated[k] > 0) {
            const avail = updated[k];
            const deduct = Math.min(avail, remainder);
            updated[k] = avail - deduct;
            remainder -= deduct;
            syncInventoryKeyToSupabase(k, updated[k]);
          }
        });
      });
      return updated;
    });

    setSales(prev => [newSale, ...prev]);
    syncSaleToSupabase(newSale);

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
        syncInventoryKeyToSupabase(directKey, updated[directKey]);

        // Descontar también de otros almacenes para no dejar unidades fantasma
        let remainder = item.quantity;
        Object.keys(updated).forEach(k => {
          if (k.endsWith(`_${item.productId}`) && k !== directKey && typeof updated[k] === 'number' && updated[k] > 0) {
            const avail = updated[k];
            const deduct = Math.min(avail, remainder);
            updated[k] = avail - deduct;
            remainder -= deduct;
            syncInventoryKeyToSupabase(k, updated[k]);
          }
        });
      });
      return updated;
    });

    setOrders(prev => [newOrder, ...prev]);
    syncOrderToSupabase(newOrder);

    return { success: true, order: newOrder };
  };

  // 2. AVANZAR ESTADO DEL PEDIDO (Preparado, Por Entregar, etc.)
  const advanceOrderStatus = (orderId, nextStatus) => {
    setOrders(prev => {
      const updatedList = prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o);
      const target = updatedList.find(o => o.id === orderId);
      if (target) syncOrderToSupabase(target);
      return updatedList;
    });
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
    syncSaleToSupabase(newSale);

    // Marcar el pedido como completado
    setOrders(prev => {
      const updatedList = prev.map(o => 
        o.id === orderId 
          ? { ...o, status: 'completado', paymentStatus: 'pagado', paymentMethod, completedAt: formattedDate } 
          : o
      );
      const target = updatedList.find(o => o.id === orderId);
      if (target) syncOrderToSupabase(target);
      return updatedList;
    });

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
          syncInventoryKeyToSupabase(key, updated[key]);
        });
        return updated;
      });
    }

    setOrders(prev => {
      const updatedList = prev.map(o => o.id === orderId ? { ...o, status: 'cancelado' } : o);
      const target = updatedList.find(o => o.id === orderId);
      if (target) syncOrderToSupabase(target);
      return updatedList;
    });

    return { success: true };
  };

  // VACIAR DATOS DE PRUEBA CONSERVANDO PRODUCTOS Y TIENDAS
  const clearTestDataKeepProducts = async () => {
    setInventory({});
    setOrders([]);
    setSales([]);
    setPurchases([]);
    localStorage.setItem('sq_inventory', JSON.stringify({}));
    localStorage.setItem('sq_orders', JSON.stringify([]));
    localStorage.setItem('sq_sales', JSON.stringify([]));
    localStorage.setItem('sq_purchases', JSON.stringify([]));

    if (isSupabaseConfigured && supabase) {
      try {
        await Promise.all([
          supabase.from('sq_orders').delete().neq('id', 'dummy_keep'),
          supabase.from('sq_inventory').delete().neq('id', 'dummy_keep'),
          supabase.from('sq_sales').delete().neq('id', 'dummy_keep'),
          supabase.from('sq_purchases').delete().neq('id', 'dummy_keep')
        ]);
      } catch (err) {
        console.warn('Error al vaciar pruebas en Supabase:', err);
      }
    }
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
        clearAllData,
        clearTestDataKeepProducts,
        refreshOrders,
        isLoadingCloud
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
