import { supabase, isSupabaseConfigured } from '../supabaseClient';

export function computeImagesSignature(images) {
  if (!Array.isArray(images) || images.length === 0) return '0';
  const first = images[0] || '';
  const last = images[images.length - 1] || '';
  return `${images.length}_${first.length}_${last.length}_${first.slice(-8)}${last.slice(-8)}`;
}

export async function fetchAllFromSupabase(includeImages = false) {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const productColumns = includeImages
      ? '*'
      : 'id,name,category,emoji,cost_price,sale_price,min_stock,box_cost_reference,units_per_box_reference';

    const [prodsRes, invRes, ordersRes, salesRes, purchasesRes, locsRes] = await Promise.all([
      supabase.from('sq_products').select(productColumns),
      supabase.from('sq_inventory').select('*'),
      supabase.from('sq_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('sq_sales').select('*').order('created_at', { ascending: false }),
      supabase.from('sq_purchases').select('*').order('created_at', { ascending: false }),
      supabase.from('sq_locations').select('*')
    ]);

    if (prodsRes.error) console.error('Error al cargar sq_products:', prodsRes.error);
    if (invRes.error) console.error('Error al cargar sq_inventory:', invRes.error);
    if (ordersRes.error) console.error('Error al cargar sq_orders:', ordersRes.error);
    if (salesRes.error) console.error('Error al cargar sq_sales:', salesRes.error);
    if (purchasesRes.error) console.error('Error al cargar sq_purchases:', purchasesRes.error);
    if (locsRes.error) console.error('Error al cargar sq_locations:', locsRes.error);

    const prods = prodsRes.error ? null : (prodsRes.data || []).map(p => {
      const rawEmoji = p.emoji || '🧸';
      const [cleanEmoji, imageSignature] = rawEmoji.split('|');
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        images: Array.isArray(p.images) ? p.images : null,
        emoji: cleanEmoji || '🧸',
        imageSignature: imageSignature || null,
        costPrice: Number(p.cost_price) || 0,
        salePrice: Number(p.sale_price) || 0,
        minStock: p.min_stock || 5,
        boxCostReference: Number(p.box_cost_reference) || 0,
        unitsPerBoxReference: Number(p.units_per_box_reference) || 0
      };
    });

    let inv = null;
    if (!invRes.error && invRes.data) {
      inv = {};
      invRes.data.forEach(item => {
        inv[item.id] = Number(item.quantity) || 0;
      });
    }

    const ords = ordersRes.error ? null : (ordersRes.data || []).map(o => ({
      id: o.id,
      folio: o.folio,
      date: o.date,
      timestamp: Number(o.timestamp) || Date.now(),
      customerName: o.customer_name,
      customerPhone: o.customer_phone || '',
      deliveryLocationId: o.delivery_location_id,
      deliveryLocationName: o.delivery_location_name,
      deliveryType: o.delivery_type,
      deliveryNotes: o.delivery_notes || '',
      items: o.items || [],
      totalAmount: Number(o.total_amount) || 0,
      totalCost: Number(o.total_cost) || 0,
      totalProfit: Number(o.total_profit) || 0,
      profitMarginPercent: Number(o.profit_margin_percent) || 0,
      status: o.status || 'nuevo',
      paymentStatus: o.payment_status || 'pendiente',
      paymentMethod: o.payment_method || 'Por Cobrar'
    }));

    const sls = salesRes.error ? null : (salesRes.data || []).map(s => ({
      id: s.id,
      orderId: s.order_id,
      date: s.date,
      timestamp: Number(s.timestamp) || Date.now(),
      locationId: s.location_id,
      locationName: s.location_name,
      items: s.items || [],
      totalAmount: Number(s.total_amount) || 0,
      totalCost: Number(s.total_cost) || 0,
      totalProfit: Number(s.total_profit) || 0,
      profitMarginPercent: Number(s.profit_margin_percent) || 0,
      paymentMethod: s.payment_method || 'Efectivo',
      cashReceived: Number(s.cash_received) || 0,
      changeGiven: Number(s.change_given) || 0,
      paymentStatus: s.payment_status || 'Completado'
    }));

    const purs = purchasesRes.error ? null : (purchasesRes.data || []).map(pur => ({
      id: pur.id,
      date: pur.date,
      supplier: pur.supplier,
      productId: pur.product_id,
      productName: pur.product_name,
      boxCount: Number(pur.box_count) || 1,
      costPerBox: Number(pur.cost_per_box) || 0,
      unitsPerBox: Number(pur.units_per_box) || 1,
      shippingCost: Number(pur.shipping_cost) || 0,
      totalCost: Number(pur.total_cost) || 0,
      totalUnits: Number(pur.total_units) || 0,
      calculatedUnitCost: Number(pur.calculated_unit_cost) || 0,
      notes: pur.notes || ''
    }));

    const locs = locsRes.error ? null : (locsRes.data || []).map(l => ({
      id: l.id,
      name: l.name,
      type: l.type,
      isWarehouse: Boolean(l.is_warehouse)
    }));

    return {
      products: prods,
      inventory: inv,
      orders: ords,
      sales: sls,
      purchases: purs,
      locations: locs.length > 0 ? locs : null
    };
  } catch (err) {
    console.error('Error al cargar datos desde Supabase:', err);
    return null;
  }
}

export async function fetchProductImagesBatchFromSupabase(productIds) {
  if (!isSupabaseConfigured || !supabase || !Array.isArray(productIds) || productIds.length === 0) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('sq_products')
      .select('id,images')
      .in('id', productIds);
    if (error) {
      console.warn('Error al cargar lote de fotos de productos:', error);
      return [];
    }
    return (data || []).map(row => ({
      id: row.id,
      images: Array.isArray(row.images) ? row.images : []
    }));
  } catch (err) {
    console.warn('Error en fetchProductImagesBatchFromSupabase:', err);
    return [];
  }
}

export async function syncProductToSupabase(p) {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const cleanEmoji = ((p.emoji || '🧸').split('|')[0]) || '🧸';
    const sig = computeImagesSignature(p.images || []);
    const { error } = await supabase.from('sq_products').upsert({
      id: p.id,
      name: p.name,
      category: p.category,
      images: p.images || [],
      emoji: `${cleanEmoji}|${sig}`,
      cost_price: p.costPrice || 0,
      sale_price: p.salePrice || 0,
      min_stock: p.minStock || 5,
      box_cost_reference: p.boxCostReference || 0,
      units_per_box_reference: p.unitsPerBoxReference || 0
    });
    if (error) {
      console.error('Error al sincronizar producto a Supabase:', error);
      return { error };
    }
    return { success: true };
  } catch (e) {
    console.warn('Sync product to Supabase failed:', e);
    return { error: e };
  }
}

export async function deleteProductFromSupabase(productId) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('sq_products').delete().eq('id', productId);
  } catch (e) {
    console.warn('Delete product from Supabase failed:', e);
  }
}

export async function syncOrderToSupabase(order) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('sq_orders').upsert({
      id: order.id,
      folio: order.folio,
      date: order.date,
      timestamp: order.timestamp,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      delivery_location_id: order.deliveryLocationId,
      delivery_location_name: order.deliveryLocationName,
      delivery_type: order.deliveryType,
      delivery_notes: order.deliveryNotes,
      items: order.items,
      total_amount: order.totalAmount,
      total_cost: order.totalCost,
      total_profit: order.totalProfit,
      profit_margin_percent: order.profitMarginPercent,
      status: order.status,
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod
    });
  } catch (e) {
    console.warn('Sync order to Supabase failed:', e);
  }
}

export async function syncSaleToSupabase(sale) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('sq_sales').upsert({
      id: sale.id,
      order_id: sale.orderId || null,
      date: sale.date,
      timestamp: sale.timestamp,
      location_id: sale.locationId,
      location_name: sale.locationName,
      items: sale.items,
      total_amount: sale.totalAmount,
      total_cost: sale.totalCost,
      total_profit: sale.totalProfit,
      profit_margin_percent: sale.profitMarginPercent,
      payment_method: sale.paymentMethod,
      cash_received: sale.cashReceived,
      change_given: sale.changeGiven,
      payment_status: sale.paymentStatus
    });
  } catch (e) {
    console.warn('Sync sale to Supabase failed:', e);
  }
}

export async function syncPurchaseToSupabase(pur) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('sq_purchases').upsert({
      id: pur.id,
      date: pur.date,
      supplier: pur.supplier,
      product_id: pur.productId,
      product_name: pur.productName,
      box_count: pur.boxCount,
      cost_per_box: pur.costPerBox,
      units_per_box: pur.unitsPerBox,
      shipping_cost: pur.shippingCost,
      total_cost: pur.totalCost,
      total_units: pur.totalUnits,
      calculated_unit_cost: pur.calculatedUnitCost,
      notes: pur.notes
    });
  } catch (e) {
    console.warn('Sync purchase to Supabase failed:', e);
  }
}

export async function syncInventoryKeyToSupabase(key, quantity, retries = 3) {
  if (!isSupabaseConfigured || !supabase) return { success: true };
  try {
    const parts = key.split('_');
    const locationId = parts[0];
    const productId = parts.slice(1).join('_');
    const { error } = await supabase.from('sq_inventory').upsert({
      id: key,
      location_id: locationId,
      product_id: productId,
      quantity: Number(quantity) || 0,
      updated_at: new Date().toISOString()
    });

    if (error) {
      if (retries > 0) {
        // Si falló por constraint de clave foránea porque las fotos pesadas del producto tardan en subir, reintentar
        await new Promise(res => setTimeout(res, 600));
        return syncInventoryKeyToSupabase(key, quantity, retries - 1);
      }
      console.warn('Sync inventory to Supabase error:', error);
      return { error };
    }
    return { success: true };
  } catch (e) {
    if (retries > 0) {
      await new Promise(res => setTimeout(res, 600));
      return syncInventoryKeyToSupabase(key, quantity, retries - 1);
    }
    console.warn('Sync inventory to Supabase failed:', e);
    return { error: e };
  }
}
