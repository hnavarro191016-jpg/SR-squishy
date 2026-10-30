import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  PieChart, 
  Store, 
  ArrowUpRight, 
  Package, 
  Sparkles,
  BarChart3,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Dashboard({ onGoToPOS }) {
  const { sales, products, locations, inventory, getStock } = useApp();

  // Métricas Globales
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalUnitsSold = 0;

    sales.forEach(sale => {
      totalRevenue += sale.totalAmount;
      totalCost += sale.totalCost;
      sale.items.forEach(item => {
        totalUnitsSold += item.quantity;
      });
    });

    const totalProfit = totalRevenue - totalCost;
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgMarkup = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    // Valuación de Inventario en Bodega + Puntos
    let inventoryCostValue = 0;
    let inventoryRetailValue = 0;
    let totalStockUnits = 0;

    products.forEach(p => {
      locations.forEach(loc => {
        const qty = getStock(loc.id, p.id);
        totalStockUnits += qty;
        inventoryCostValue += qty * p.costPrice;
        inventoryRetailValue += qty * p.salePrice;
      });
    });

    const potentialInventoryProfit = inventoryRetailValue - inventoryCostValue;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      avgMargin,
      avgMarkup,
      totalUnitsSold,
      totalStockUnits,
      inventoryCostValue,
      inventoryRetailValue,
      potentialInventoryProfit
    };
  }, [sales, products, locations, inventory]);

  // Rendimiento por Punto de Venta
  const locationPerformance = useMemo(() => {
    const map = {};

    locations.filter(l => !l.isWarehouse).forEach(loc => {
      map[loc.id] = {
        name: loc.name,
        type: loc.type,
        salesCount: 0,
        revenue: 0,
        cost: 0,
        profit: 0
      };
    });

    sales.forEach(sale => {
      if (map[sale.locationId]) {
        map[sale.locationId].salesCount += 1;
        map[sale.locationId].revenue += sale.totalAmount;
        map[sale.locationId].cost += sale.totalCost;
        map[sale.locationId].profit += sale.totalProfit;
      }
    });

    return Object.values(map).map(loc => ({
      ...loc,
      margin: loc.revenue > 0 ? ((loc.profit / loc.revenue) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.revenue - a.revenue);
  }, [sales, locations]);

  // Top Squishys Más Vendidos
  const topProducts = useMemo(() => {
    const map = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!map[item.productId]) {
          const prod = products.find(p => p.id === item.productId);
          map[item.productId] = {
            name: item.name,
            emoji: prod?.emoji || '🧸',
            unitsSold: 0,
            revenue: 0,
            profit: 0
          };
        }
        map[item.productId].unitsSold += item.quantity;
        map[item.productId].revenue += item.subtotal;
        map[item.productId].profit += item.profit;
      });
    });

    return Object.values(map).sort((a, b) => b.unitsSold - a.unitsSold);
  }, [sales, products]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Banner de Bienvenida y Acción Rápida */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Centro de Mando de Ganancias</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Panel Ejecutivo de Ventas & Márgenes
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Cada squishy vendido es dinero líquido. Monitorea en vivo tus compras a costo de caja y el rendimiento de tus puntos de venta.
          </p>
        </div>

        <button
          onClick={onGoToPOS}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold text-sm shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Abrir Punto de Venta en Celular</span>
        </button>
      </div>

      {/* Tarjetas KPI Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Ventas Totales */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ingresos Totales</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              ${metrics.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              {metrics.totalUnitsSold} squishys vendidos en total
            </div>
          </div>
        </div>

        {/* Ganancia Neta Real */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200 bg-gradient-to-b from-white to-emerald-50/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Utilidad Neta Real</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              💸
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              ${metrics.totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Dinero limpio directo a tu bolsa</span>
            </div>
          </div>
        </div>

        {/* Margen Promedio */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margen Bruto %</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-purple-600">
              {metrics.avgMargin.toFixed(1)}%
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Markup sobre costo: +{metrics.avgMarkup.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Valuación del Inventario */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Disponible</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {metrics.totalStockUnits} <span className="text-base font-semibold text-slate-500">pzs</span>
            </div>
            <div className="text-xs font-semibold text-amber-700 mt-1">
              Valor de venta: ${metrics.inventoryRetailValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

      </div>

      {/* Sección Secundaria: Rendimiento por Punto de Venta & Top Squishys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Rendimiento por Punto de Venta */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-pink-600" />
              <h2 className="font-extrabold text-slate-900 text-lg">Rendimiento por Punto de Venta</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">¿Dónde está la mina de oro?</span>
          </div>

          <div className="space-y-3 pt-2">
            {locationPerformance.map((loc, idx) => (
              <div 
                key={loc.name}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{loc.name}</span>
                  </div>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {loc.margin}% margen
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-600 font-semibold block">Ventas</span>
                    <span className="font-extrabold text-slate-900">${loc.revenue.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block">Tickets</span>
                    <span className="font-extrabold text-slate-900">{loc.salesCount} ventas</span>
                  </div>
                  <div>
                    <span className="text-emerald-800 font-semibold block">Utilidad Real</span>
                    <span className="font-black text-emerald-700">+${loc.profit.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Squishys Más Vendidos */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="font-extrabold text-slate-900 text-lg">Top Squishys (Vacas Lecheras)</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">Rotación y Utilidad</span>
          </div>

          <div className="space-y-3 pt-2">
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-8 font-medium">Aún no hay ventas registradas.</p>
            ) : (
              topProducts.map((p, idx) => (
                <div 
                  key={p.name}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {p.emoji ? (
                      <span className="text-3xl">{p.emoji}</span>
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-lg text-pink-600 border border-pink-100">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                      <p className="text-xs text-slate-600 font-medium">{p.unitsSold} piezas vendidas</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-slate-900 text-sm">${p.revenue.toFixed(2)}</div>
                    <div className="text-xs font-extrabold text-emerald-700">+${p.profit.toFixed(2)} ganancia</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Historial Reciente de Ventas */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h2 className="font-extrabold text-slate-900 text-lg">Últimas Ventas Registradas</h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Auditoría en Vivo</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold">
                <th className="pb-3 pl-2">Ticket / Fecha</th>
                <th className="pb-3">Punto de Venta</th>
                <th className="pb-3">Artículos</th>
                <th className="pb-3">Método</th>
                <th className="pb-3 text-right">Total</th>
                <th className="pb-3 text-right pr-2">Utilidad Neta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 font-medium text-xs">
                    Aún no se han registrado ventas. ¡Haz tu primera venta desde el celular en el Punto de Venta! 🚀
                  </td>
                </tr>
              ) : (
                sales.slice(0, 6).map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 pl-2">
                    <div className="font-extrabold text-slate-900">#{sale.id}</div>
                    <div className="text-slate-600 text-[11px] font-medium">{sale.date}</div>
                  </td>
                  <td className="py-3 font-semibold text-slate-700">
                    {sale.locationName}
                  </td>
                  <td className="py-3">
                    <div className="text-slate-800 font-medium truncate max-w-xs">
                      {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-700">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 text-right font-black text-slate-900">
                    ${sale.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3 text-right pr-2">
                    <span className="font-extrabold text-emerald-600">
                      +${sale.totalProfit.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-600 font-bold block">
                      ({sale.profitMarginPercent}%)
                    </span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
