import React, { useState } from 'react';
import { 
  Package, 
  DollarSign, 
  PlusCircle, 
  Truck, 
  Calculator, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function PurchasesManager() {
  const { products, purchases, addPurchase, addProductWithStock, locations, activeLocationId } = useApp();

  // Estado del formulario
  const [supplier, setSupplier] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [destinationLocationId, setDestinationLocationId] = useState(activeLocationId || 'loc-2');
  const [isCreatingNewProduct, setIsCreatingNewProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Animalitos');
  const [newProductEmoji, setNewProductEmoji] = useState('🧸');
  const [newProductSalePrice, setNewProductSalePrice] = useState('45');

  const [boxCount, setBoxCount] = useState('2');
  const [costPerBox, setCostPerBox] = useState('1200');
  const [unitsPerBox, setUnitsPerBox] = useState('100');
  const [shippingCost, setShippingCost] = useState('100');
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);

  // Sincronizar destino con la ubicación activa
  React.useEffect(() => {
    if (activeLocationId) {
      setDestinationLocationId(activeLocationId);
    }
  }, [activeLocationId]);

  // Cálculos reactivos en vivo
  const numBoxes = Math.max(1, parseFloat(boxCount) || 1);
  const boxCost = Math.max(0, parseFloat(costPerBox) || 0);
  const unitsPer = Math.max(1, parseFloat(unitsPerBox) || 1);
  const shipping = Math.max(0, parseFloat(shippingCost) || 0);

  const totalInvestment = (numBoxes * boxCost) + shipping;
  const totalUnits = numBoxes * unitsPer;
  const calculatedCostPerPiece = totalUnits > 0 ? (totalInvestment / totalUnits) : 0;

  const isCreating = isCreatingNewProduct || products.length === 0;

  // Producto seleccionado para referencia
  const currentProduct = products.find(p => p.id === selectedProductId);
  const activeSalePrice = isCreating 
    ? (parseFloat(newProductSalePrice) || 45) 
    : (currentProduct?.salePrice || 45);

  const profitPerPiece = activeSalePrice - calculatedCostPerPiece;
  const marginPercent = activeSalePrice > 0 ? (profitPerPiece / activeSalePrice) * 100 : 0;
  const totalProjectedProfit = profitPerPiece * totalUnits;

  const handleSubmit = (e) => {
    e.preventDefault();

    let targetProductId = selectedProductId;

    // Si está creando un squishy nuevo junto con la compra
    if (isCreating) {
      if (!newProductName.trim()) {
        alert('Por favor escribe el nombre del nuevo squishy');
        return;
      }
      const newProd = addProductWithStock({
        name: newProductName.trim(),
        category: newProductCategory,
        emoji: newProductEmoji || '🧸',
        costPrice: Number(calculatedCostPerPiece.toFixed(2)),
        salePrice: Number(activeSalePrice),
        initialStock: 0,
        targetLocationId: destinationLocationId,
        boxCost: boxCost,
        unitsPerBox: unitsPer
      });
      targetProductId = newProd.id;
    }

    const created = addPurchase({
      supplier: supplier.trim() || 'Proveedor Mayorista',
      productId: targetProductId,
      boxCount: numBoxes,
      costPerBox: boxCost,
      unitsPerBox: unitsPer,
      shippingCost: shipping,
      notes,
      targetLocationId: destinationLocationId
    });

    const destLoc = locations.find(l => l.id === destinationLocationId);
    setSuccessMessage(`¡Lote ingresado con éxito! Se añadieron ${totalUnits} piezas a "${destLoc ? destLoc.name : 'Punto de Venta'}" y ya están disponibles para vender.`);
    setTimeout(() => setSuccessMessage(null), 5000);

    // Reset fields
    setSupplier('');
    setNotes('');
    setIsCreatingNewProduct(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Encabezado */}
      <div>
        <div className="flex items-center gap-2 text-pink-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Package className="w-4 h-4" />
          <span>Cadena de Suministro & Costeo de Lotes</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Compras a Proveedores & Costo x Caja
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Documenta con precisión el costo por caja, fletes y unidades recibidas. El sistema calcula automáticamente el costo unitario exacto por pieza para garantizar tu margen.
        </p>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid: Formulario de Compra + Simulador en Vivo de Costeo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Formulario de Compra (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-pink-600" />
            <span>Registrar Nueva Compra x Caja</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Proveedor */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Proveedor / Importadora
              </label>
              <input
                type="text"
                placeholder="Ej. Mayorista Squishy CDMX, Importadora Dragón, etc."
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none"
              />
            </div>

            {/* Selección de Producto / O Crear Nuevo */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Modelo de Squishy a Ingresar
                </span>
                {products.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewProduct(!isCreatingNewProduct)}
                    className="text-xs font-bold text-pink-600 hover:text-pink-700"
                  >
                    {isCreating ? '← Elegir de catálogo existente' : '+ Crear nuevo modelo'}
                  </button>
                )}
              </div>

              {!isCreating ? (
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 outline-none cursor-pointer"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.name} (Venta actual: ${p.salePrice.toFixed(2)})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Nombre del Squishy</label>
                    <input
                      type="text"
                      placeholder="Ej. Bola Pelusa, Panda, Dona..."
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Categoría</label>
                    <input
                      type="text"
                      placeholder="Ej. Pelusas, Antiestrés..."
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Precio de Venta Sugerido ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newProductSalePrice}
                      onChange={(e) => setNewProductSalePrice(e.target.value)}
                      placeholder="45"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-emerald-600 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Datos Clave: Cajas, Costo x Caja, Unidades x Caja, Flete */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Cajas
                </label>
                <input
                  type="number"
                  min="1"
                  value={boxCount}
                  onChange={(e) => setBoxCount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Costo x Caja ($)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={costPerBox}
                  onChange={(e) => setCostPerBox(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Pzas x Caja
                </label>
                <input
                  type="number"
                  min="1"
                  value={unitsPerBox}
                  onChange={(e) => setUnitsPerBox(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Flete/Envío ($)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* Destino de la mercancía */}
            <div className="p-3.5 bg-pink-50/50 rounded-2xl border border-pink-200 space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-pink-700 block">
                ¿A dónde cargar las piezas compradas?
              </label>
              <select
                value={destinationLocationId}
                onChange={(e) => setDestinationLocationId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-pink-300 rounded-xl text-xs font-black text-slate-800 outline-none cursor-pointer focus:ring-2 focus:ring-pink-500"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.isWarehouse 
                      ? `🏢 ${loc.name} (Almacén Central / Reserva)` 
                      : `🏪 ${loc.name} (Directo para Vender al Público)`}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 font-medium pt-0.5">
                Al seleccionar tu punto de venta, las piezas aparecerán de inmediato listas para cobrarse en el celular.
              </p>
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Notas del Lote / Calidad / Factura
              </label>
              <input
                type="text"
                placeholder="Ej. Aroma fresa, bolsas individuales incluidas, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white"
              />
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-sm shadow-lg shadow-pink-500/25 hover:from-pink-600 hover:to-rose-700 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              <span>GUARDAR COMPRA Y CARGAR A EXISTENCIAS</span>
            </button>

          </form>
        </div>

        {/* Simulador Financiero en Tiempo Real (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                ⚡ Desglose Financiero del Lote
              </span>
              <span className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                En Tiempo Real
              </span>
            </div>

            {/* Costo Unitario Resultante */}
            <div className="text-center py-3 bg-white/5 rounded-2xl border border-white/10 mb-4">
              <span className="text-xs font-semibold text-slate-400 block">COSTO REAL POR PIEZA</span>
              <div className="text-4xl font-black text-pink-400 tracking-tight my-1">
                ${calculatedCostPerPiece.toFixed(2)} <span className="text-xs font-semibold text-white">MXN</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                (Total ${totalInvestment.toFixed(2)} ÷ {totalUnits} unidades)
              </span>
            </div>

            {/* Tabla de Rendimiento Proyectado */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-slate-400 font-medium">Inversión Total del Lote:</span>
                <span className="font-extrabold text-white">${totalInvestment.toFixed(2)} MXN</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-slate-400 font-medium">Squishys a recibir:</span>
                <span className="font-extrabold text-white">{totalUnits} piezas</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-slate-400 font-medium">Precio de Venta Proyectado:</span>
                <span className="font-extrabold text-emerald-400">${activeSalePrice.toFixed(2)} MXN</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-slate-400 font-medium">Ganancia Neta por Pieza:</span>
                <span className="font-extrabold text-emerald-400">+${profitPerPiece.toFixed(2)} MXN</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/10">
                <span className="text-slate-400 font-medium">Margen de Ganancia:</span>
                <span className="font-black text-amber-300 text-sm">{marginPercent.toFixed(1)}%</span>
              </div>

              <div className="pt-2 flex justify-between items-baseline font-black">
                <span className="text-pink-300">UTILIDAD TOTAL PROYECTADA:</span>
                <span className="text-lg text-emerald-300">+${totalProjectedProfit.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-[11px] text-pink-200 font-medium">
              💡 <strong>Regla del Sr. Squishy:</strong> Con un costo de ${calculatedCostPerPiece.toFixed(2)} y vendiendo a ${activeSalePrice.toFixed(2)}, por cada peso que inviertes en la caja recuperas tu peso y te llevas ${(profitPerPiece / calculatedCostPerPiece).toFixed(2)} pesos limpios. ¡Así se construye riqueza!
            </div>
          </div>
        </div>

      </div>

      {/* Historial de Compras */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span>Historial de Lotes Comprados a Proveedores</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold">
                <th className="pb-3 pl-2">Fecha / ID</th>
                <th className="pb-3">Proveedor</th>
                <th className="pb-3">Producto</th>
                <th className="pb-3 text-center">Cajas x Pzas</th>
                <th className="pb-3 text-right">Costo x Caja</th>
                <th className="pb-3 text-right">Costo x Pieza</th>
                <th className="pb-3 text-right pr-2">Total Invertido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map(pur => (
                <tr key={pur.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 pl-2">
                    <div className="font-bold text-slate-900">{pur.date}</div>
                    <div className="text-[10px] text-slate-600 font-mono">{pur.id}</div>
                  </td>
                  <td className="py-3 font-semibold text-slate-700">
                    {pur.supplier}
                  </td>
                  <td className="py-3 font-bold text-slate-900">
                    {pur.productName}
                  </td>
                  <td className="py-3 text-center font-medium text-slate-700">
                    {pur.boxCount} cajas ({pur.totalUnits} pzs)
                  </td>
                  <td className="py-3 text-right font-bold text-slate-800">
                    ${pur.costPerBox.toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-black text-pink-600">
                    ${pur.calculatedUnitCost.toFixed(2)}
                  </td>
                  <td className="py-3 text-right pr-2 font-black text-slate-900">
                    ${pur.totalCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
