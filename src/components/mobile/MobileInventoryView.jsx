import React, { useState, useMemo } from 'react';
import { 
  Store, 
  Search, 
  Plus, 
  Minus, 
  ArrowRightLeft, 
  DollarSign, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  Sparkles,
  Edit3
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getColorVisual } from '../../utils/colorHelper';

export default function MobileInventoryView({ onEditProduct }) {
  const { 
    products, 
    locations, 
    activeLocationId, 
    getStock, 
    getTotalStock,
    setQuickStock, 
    transferStock,
    sales 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocFilter, setSelectedLocFilter] = useState(activeLocationId || 'all');

  // Ventas de hoy
  const todaySummary = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => (s.date || '').startsWith(today));

    let revenue = 0;
    let profit = 0;
    let units = 0;

    todaySales.forEach(s => {
      revenue += s.totalAmount;
      profit += (s.totalAmount - s.totalCost);
      (s.items || []).forEach(i => units += i.quantity);
    });

    return { revenue, profit, units, count: todaySales.length };
  }, [sales]);

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      return p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             p.category.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [products, searchTerm]);

  return (
    <div className="px-3 pt-3 pb-28 max-w-lg mx-auto space-y-3.5">
      
      {/* Resumen Diario Móvil */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
          <span className="font-extrabold text-pink-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Métricas Rápidas de Hoy</span>
          </span>
          <span className="text-[10px] text-slate-400 font-bold">
            {todaySummary.count} ventas realizadas
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-white/5 p-2 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-bold">Venta Total</span>
            <span className="text-base font-black text-white">${todaySummary.revenue.toFixed(0)}</span>
          </div>

          <div className="bg-white/5 p-2 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-bold">Ganancia Neta</span>
            <span className="text-base font-black text-emerald-400">+${todaySummary.profit.toFixed(0)}</span>
          </div>

          <div className="bg-white/5 p-2 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-bold">Pzas Vendidas</span>
            <span className="text-base font-black text-amber-300">{todaySummary.units}</span>
          </div>
        </div>
      </div>

      {/* Buscador de Stock */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar squishy en inventario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs font-semibold border border-slate-200 outline-none shadow-xs"
        />
      </div>

      {/* Lista de Existencias */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Ajuste Rápido de Stock ({filteredProducts.length} modelos)
          </span>
        </div>

        {filteredProducts.map(prod => {
          const storeStock = getStock('loc-2', prod.id);
          const warehouseStock = getStock('loc-1', prod.id);
          const totalStock = getTotalStock(prod.id);

          return (
            <div
              key={prod.id}
              className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center overflow-hidden shrink-0">
                    {prod.images && prod.images.length > 0 ? (
                      <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{prod.emoji || '🧸'}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                      {prod.name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400">
                      Venta: <span className="text-pink-600 font-black">${prod.salePrice}</span> • Costo: ${prod.costPrice}
                    </p>
                    {/* Variantes de colores si tiene */}
                    {prod.colors && prod.colors.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {prod.colors.map((c, i) => {
                          const visual = getColorVisual(c.name);
                          const isOut = (Number(c.stock) || 0) <= 0;
                          return (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md border ${
                                isOut
                                  ? 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-50'
                                  : visual.badge
                              }`}
                            >
                              <span>{visual.emoji}</span>
                              <span>{c.name}</span>
                              <span className="opacity-75">({c.stock || 0})</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {onEditProduct && (
                  <button
                    onClick={() => onEditProduct(prod)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                    title="Editar producto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Contadores por ubicación */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                
                {/* Punto de Venta */}
                <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Mostrador</span>
                    <span className={`font-black ${storeStock <= 3 ? 'text-red-600' : 'text-slate-800'}`}>
                      {storeStock} pzs
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQuickStock(prod.id, Math.max(0, storeStock - 1), 'loc-2')}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-bold flex items-center justify-center active:scale-90"
                    >
                      <Minus className="w-3 h-3 text-slate-600" />
                    </button>
                    <button
                      onClick={() => setQuickStock(prod.id, storeStock + 1, 'loc-2')}
                      className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center active:scale-90"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Bodega Central */}
                <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Bodega</span>
                    <span className="font-black text-slate-800">
                      {warehouseStock} pzs
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQuickStock(prod.id, Math.max(0, warehouseStock - 1), 'loc-1')}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-bold flex items-center justify-center active:scale-90"
                    >
                      <Minus className="w-3 h-3 text-slate-600" />
                    </button>
                    <button
                      onClick={() => setQuickStock(prod.id, warehouseStock + 1, 'loc-1')}
                      className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center active:scale-90"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Botón Traspaso rápido de Bodega a Mostrador */}
              {warehouseStock > 0 && (
                <button
                  onClick={() => {
                    const qty = window.prompt(`¿Cuántas piezas de "${prod.name}" deseas pasar de Bodega a Mostrador? (Máx ${warehouseStock})`, '6');
                    if (qty && parseInt(qty) > 0) {
                      transferStock('loc-1', 'loc-2', prod.id, parseInt(qty));
                    }
                  }}
                  className="w-full py-1.5 rounded-xl bg-pink-50 text-pink-700 font-bold text-[11px] border border-pink-200 hover:bg-pink-100 flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Cargar piezas de Bodega al Mostrador</span>
                </button>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
