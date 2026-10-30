import { supabase, isSupabaseConfigured } from '../supabaseClient';

export async function fetchAllFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const [prodsRes, invRes, ordersRes, salesRes, purchasesRes, locsRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('inventory').select('*'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('sales').select('*').order('created_at', { ascending: false }),
      supabase.from('purchases').select('*').order('created_at', { ascending: false }),
      supabase.from('locations').select('*')
    ]);

    const prods = (prodsRes.data || []).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      images: p.images || [],
      emoji: p.emoji || '🧸',
      costPrice: Number(p.cost_price) || 0,
      salePrice: Number(p.sale_price) || 0,
      minStock: p.min_stock || 5,
      boxCostReference: Number(p.box_cost_reference) || 0,
      unitsPerBoxReference: Number(p.units_per_box_reference) || 0
    }));

    const inv = {};
    (invRes.data || []).forEach(item => {
      inv[item.id] = Number(item.quantity) || 0;
    });

    const ords = (ordersRes.data || []).map(o => ({
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

    const sls = (salesRes.data || []).map(s => ({
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

    const purs = (purchasesRes.data || []).map(pur => ({
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

    const locs = (locsRes.data || []).map(l => ({
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

export async function syncProductToSupabase(p) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('products').upsert({
      id: p.id,
      name: p.name,
      category: p.category,
      images: p.images || [],
      emoji: p.emoji || '🧸',
      cost_price: p.costPrice || 0,
      sale_price: p.salePrice || 0,
      min_stock: p.minStock || 5,
      box_cost_reference: p.boxCostReference || 0,
      units_per_box_reference: p.unitsPerBoxReference || 0
    });
  } catch (e) {
    console.warn('Sync product to Supabase failed:', e);
  }
}

export async function deleteProductFromSupabase(productId) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('products').delete().eq('id', productId);
  } catch (e) {
    console.warn('Delete product from Supabase failed:', e);
  }
}

export async function syncOrderToSupabase(order) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('orders').upsert({
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
    await supabase.from('sales').upsert({
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
    await supabase.from('purchases').upsert({
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

export async function syncInventoryKeyToSupabase(key, quantity) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const parts = key.split('_');
    const locationId = parts[0];
    const productId = parts.slice(1).join('_');
    await supabase.from('inventory').upsert({
      id: key,
      location_id: locationId,
      product_id: productId,
      quantity: Number(quantity) || 0,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Sync inventory to Supabase failed:', e);
  }
}
