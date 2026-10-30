import React, { useState } from 'react';
import { 
  Store, 
  ArrowRightLeft, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  Edit3, 
  Package, 
  Sparkles,
  MapPin
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function InventoryManager({ onEditProduct }) {
  const { 
    locations, 
    products, 
    inventory, 
    getStock, 
    getTotalStock, 
    transferStock, 
    updateProduct
  } = useApp();

  // Estados para traspaso
  const [fromLocation, setFromLocation] = useState('loc-1'); // Bodega por defecto
  const [toLocation, setToLocation] = useState('loc-2');
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState('10');
  const [transferMsg, setTransferMsg] = useState(null);

  // Estados para nuevo punto de venta
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState('bazaar');

  // Estados para edición rápida de precio
  const [editingProductId, setEditingProductId] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  const handleTransfer = (e) => {
    e.preventDefault();
    if (fromLocation === toLocation) {
      alert('La ubicación de origen y destino deben ser diferentes.');
      return;
    }

    const res = transferStock(fromLocation, toLocation, selectedProduct, quantity);
    if (res.success) {
      setTransferMsg('¡Traspaso realizado con éxito!');
      setTimeout(() => setTransferMsg(null), 4000);
    } else {
      alert(res.message);
    }
  };

  const handleAddLocation = (e) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;
    addLocation(newLocationName.trim(), newLocationType);
    setNewLocationName('');
    setIsAddingLocation(false);
  };

  const handleSavePrice = (product) => {
    const parsed = parseFloat(newPrice);
    if (parsed && parsed > 0) {
      updateProduct({
        ...product,
        salePrice: parsed
      });
    }
    setEditingProductId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-pink-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Distribución Multisede & Logística</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Inventario Central & Puntos de Venta
          </h1>
          <p className="text-slate-600 text-sm">
            Controla las existencias en tu bodega matriz y reparte stock a tus islas, bazares y vendedores en campo.
          </p>
        </div>

        <button
          onClick={() => setIsAddingLocation(!isAddingLocation)}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>{isAddingLocation ? 'Cancelar' : 'Nuevo Punto de Venta'}</span>
        </button>
      </div>

      {/* Formulario para agregar punto de venta si está abierto */}
      {isAddingLocation && (
        <form onSubmit={handleAddLocation} className="bg-white p-5 rounded-3xl border border-pink-200 shadow-sm animate-in fade-in space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Registrar Nuevo Punto de Venta</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Ej. Stand Plaza Mayor, Puesto Tianguis Domingo..."
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white"
              required
            />
            <select
              value={newLocationType}
              onChange={(e) => setNewLocationType(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none"
            >
              <option value="mall">Isla / Centro Comercial</option>
              <option value="bazaar">Bazar / Puesto Evento</option>
              <option value="store">Tienda Física</option>
              <option value="online">Envíos / Redes Sociales</option>
            </select>
            <button
              type="submit"
              className="px-5 py-2 bg-pink-600 text-white font-bold text-xs rounded-xl hover:bg-pink-700"
            >
              Guardar Ubicación
            </button>
          </div>
        </form>
      )}

      {/* MÓDULO DE TRASPASO DE MERCANCÍA */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft className="w-5 h-5 text-pink-200" />
          <h2 className="text-lg font-black tracking-tight">Traspasar Squishys a un Punto de Venta</h2>
        </div>

        {transferMsg && (
          <div className="bg-white/20 border border-white/30 text-white p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-300" />
            <span>{transferMsg}</span>
          </div>
        )}

        <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-pink-100 block mb-1">
              Origen (De dónde sale)
            </label>
            <select
              value={fromLocation}
              onChange={(e) => setFromLocation(e.target.value)}
              className="w-full px-3 py-2.5 bg-white text-slate-800 rounded-xl font-bold text-xs outline-none cursor-pointer"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-pink-100 block mb-1">
              Destino (A dónde va)
            </label>
            <select
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              className="w-full px-3 py-2.5 bg-white text-slate-800 rounded-xl font-bold text-xs outline-none cursor-pointer"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-pink-100 block mb-1">
              Squishy
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2.5 bg-white text-slate-800 rounded-xl font-bold text-xs outline-none cursor-pointer"
            >
              {products.map(p => {
                const avail = getStock(fromLocation, p.id);
                return (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.name} (Disp: {avail})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-pink-100 block mb-1">
              Cantidad a Mover
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2.5 bg-white text-slate-800 rounded-xl font-black text-xs outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
          >
            Ejecutar Traspaso 🚀
          </button>
        </form>
      </div>

      {/* MATRIZ DE INVENTARIO: SQUISHYS VS PUNTOS DE VENTA */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Matriz de Existencias & Márgenes</h2>
            <p className="text-xs text-slate-500 font-medium">Visualiza cuánto producto tienes en cada ubicación y ajusta tus precios.</p>
          </div>
          <span className="text-xs font-bold text-slate-400">Auditoría en Tiempo Real</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-extrabold">
                <th className="pb-3 pl-2">Squishy / Modelo</th>
                <th className="pb-3 text-right">Costo Unit.</th>
                <th className="pb-3 text-right">Precio Venta</th>
                <th className="pb-3 text-right">Margen %</th>
                {locations.map(loc => (
                  <th key={loc.id} className="pb-3 text-center">
                    <span className="truncate max-w-[120px] block" title={loc.name}>
                      {loc.name}
                    </span>
                  </th>
                ))}
                <th className="pb-3 text-right pr-2">Total Global</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5 + locations.length} className="text-center py-8 text-slate-500 font-medium text-xs">
                    No hay artículos en inventario todavía. Presiona <strong>"+ Subir Squishy"</strong> arriba para registrar tu primer producto.
                  </td>
                </tr>
              ) : (
                products.map(p => {
                const profit = p.salePrice - p.costPrice;
                const margin = p.salePrice > 0 ? ((profit / p.salePrice) * 100).toFixed(1) : '0.0';
                const totalStock = getTotalStock(p.id);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Modelo & Nombre con Foto */}
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-2.5">
                        {p.images && p.images.length > 0 ? (
                          <img 
                            src={p.images[0]} 
                            alt={p.name} 
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm flex-shrink-0" 
                          />
                        ) : p.emoji ? (
                          <span className="text-2xl">{p.emoji}</span>
                        ) : (
                          <span className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 font-extrabold flex items-center justify-center text-xs shadow-sm border border-pink-200 flex-shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {onEditProduct && (
                              <button
                                onClick={() => onEditProduct(p)}
                                className="text-slate-400 hover:text-pink-600 transition-colors p-0.5"
                                title="Editar fotos, precio, costo o existencias"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{p.category}</div>
                        </div>
                      </div>
                    </td>

                    {/* Costo Unitario */}
                    <td className="py-3.5 text-right font-bold text-slate-600">
                      ${p.costPrice.toFixed(2)}
                    </td>

                    {/* Precio de Venta (Editable) */}
                    <td className="py-3.5 text-right">
                      {editingProductId === p.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            step="1"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            className="w-16 px-1.5 py-0.5 text-right text-xs font-black border border-pink-400 rounded outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(p)}
                            className="text-[10px] bg-pink-600 text-white px-1.5 py-0.5 rounded font-bold"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => { setEditingProductId(p.id); setNewPrice(p.salePrice.toString()); }}
                          className="font-black text-slate-900 hover:text-pink-600 cursor-pointer flex items-center justify-end gap-1 group"
                          title="Click para cambiar precio de venta"
                        >
                          <span>${p.salePrice.toFixed(2)}</span>
                          <Edit3 className="w-3 h-3 text-slate-300 group-hover:text-pink-500" />
                        </div>
                      )}
                    </td>

                    {/* Margen */}
                    <td className="py-3.5 text-right">
                      <span className="px-2 py-0.5 rounded-full font-extrabold text-[11px] bg-emerald-50 text-emerald-700">
                        {margin}%
                      </span>
                    </td>

                    {/* Existencias por cada Punto */}
                    {locations.map(loc => {
                      const stockInLoc = getStock(loc.id, p.id);
                      return (
                        <td key={loc.id} className="py-3.5 text-center">
                          <span className={`font-black text-xs ${
                            stockInLoc === 0 
                              ? 'text-slate-300' 
                              : stockInLoc <= 5 
                              ? 'text-amber-600' 
                              : 'text-slate-800'
                          }`}>
                            {stockInLoc}
                          </span>
                        </td>
                      );
                    })}

                    {/* Stock Total */}
                    <td className="py-3.5 text-right pr-2">
                      <span className="font-black text-sm text-slate-900">
                        {totalStock} pzs
                      </span>
                    </td>

                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
