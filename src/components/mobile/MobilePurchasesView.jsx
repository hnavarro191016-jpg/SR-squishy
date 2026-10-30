import React, { useState, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Minus, 
  Truck, 
  Calculator, 
  CheckCircle2, 
  TrendingUp, 
  Camera, 
  Calendar,
  Layers,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { compressImage } from '../../utils/imageHelper';

export default function MobilePurchasesView() {
  const { 
    products, 
    purchases, 
    addPurchase, 
    addProductWithStock, 
    locations, 
    activeLocationId,
    getStock 
  } = useApp();

  // Modo: Squishy existente vs Nuevo squishy
  const [isNewProductMode, setIsNewProductMode] = useState(products.length === 0);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');

  // Campos para nuevo producto al vuelo
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Animalitos');
  const [newProductImages, setNewProductImages] = useState([]);
  const [newProductSalePrice, setNewProductSalePrice] = useState('45');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Parámetros del lote
  const [boxCount, setBoxCount] = useState('2');
  const [unitsPerBox, setUnitsPerBox] = useState('100');
  const [costPerBox, setCostPerBox] = useState('1200');
  const [shippingCost, setShippingCost] = useState('100');
  const [supplier, setSupplier] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState(activeLocationId || 'loc-1');
  const [successBanner, setSuccessBanner] = useState(null);

  // Cálculos reactivos instantáneos
  const boxes = Math.max(1, parseFloat(boxCount) || 1);
  const unitsPer = Math.max(1, parseFloat(unitsPerBox) || 1);
  const costBox = Math.max(0, parseFloat(costPerBox) || 0);
  const shipping = Math.max(0, parseFloat(shippingCost) || 0);

  const totalInvestment = (boxes * costBox) + shipping;
  const totalUnits = boxes * unitsPer;
  const costPerPiece = totalUnits > 0 ? (totalInvestment / totalUnits) : 0;

  // Precio de venta sugerido
  const currentProd = products.find(p => p.id === selectedProductId);
  const salePrice = isNewProductMode 
    ? (parseFloat(newProductSalePrice) || 45) 
    : (currentProd?.salePrice || 45);

  const profitPerPiece = Math.max(0, salePrice - costPerPiece);
  const marginPercent = salePrice > 0 ? (profitPerPiece / salePrice) * 100 : 0;
  const totalProjectedRevenue = totalUnits * salePrice;
  const totalProjectedProfit = totalUnits * profitPerPiece;

  // Manejador de foto rápida desde celular
  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImage(file, 800, 0.82);
      setNewProductImages([compressed]);
    } catch (err) {
      console.error('Error al capturar foto:', err);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Registrar compra
  const handleRegisterPurchase = (e) => {
    e.preventDefault();

    let targetProductId = selectedProductId;

    if (isNewProductMode || products.length === 0) {
      if (!newProductName.trim()) {
        alert('Por favor escribe el nombre del nuevo squishy');
        return;
      }

      const newProd = addProductWithStock({
        name: newProductName.trim(),
        category: newProductCategory,
        emoji: '🧸',
        images: newProductImages,
        costPrice: Number(costPerPiece.toFixed(2)),
        salePrice: Number(salePrice),
        initialStock: 0,
        targetLocationId: destinationLocationId,
        boxCost: costBox,
        unitsPerBox: unitsPer
      });
      targetProductId = newProd.id;
    }

    addPurchase({
      supplier: supplier.trim() || 'Mayorista',
      productId: targetProductId,
      boxCount: boxes,
      costPerBox: costBox,
      unitsPerBox: unitsPer,
      shippingCost: shipping,
      notes: `Ingresado desde App Móvil: ${boxes} cajas de ${unitsPer} pzs`,
      targetLocationId: destinationLocationId
    });

    const targetLoc = locations.find(l => l.id === destinationLocationId);
    setSuccessBanner(`¡Excelente! Se añadieron ${totalUnits} piezas a "${targetLoc ? targetLoc.name : 'Inventario'}" listos para vender.`);
    setTimeout(() => setSuccessBanner(null), 6000);

    // Reset fields
    setSupplier('');
    setNewProductName('');
    setNewProductImages([]);
    setIsNewProductMode(false);
  };

  return (
    <div className="px-3 pt-3 pb-28 max-w-lg mx-auto space-y-4">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
            Cadena de Suministro Móvil
          </span>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">
            Ingreso Rápido de Compras
          </h1>
        </div>

        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
          📦
        </div>
      </div>

      {/* Banner de Éxito */}
      {successBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Tarjeta Principal de Captura de Compra */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-4">
        
        {/* 1. Selector Squishy Existente vs Nuevo */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            1. ¿Qué Squishy vas a ingresar?
          </span>

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsNewProductMode(false)}
              disabled={products.length === 0}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all ${
                !isNewProductMode && products.length > 0
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🧸 Existente ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setIsNewProductMode(true)}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all ${
                isNewProductMode || products.length === 0
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ✨ Nuevo Modelo
            </button>
          </div>

          {!isNewProductMode && products.length > 0 ? (
            <div className="space-y-1.5">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 rounded-xl text-xs sm:text-sm font-extrabold text-slate-800 border border-slate-200 outline-none cursor-pointer"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Venta: ${p.salePrice}
                  </option>
                ))}
              </select>
              {currentProd && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
                  <span>Stock actual en punto: <b>{getStock(destinationLocationId, currentProd.id)} pzs</b></span>
                  <span>Costo actual: <b>${currentProd.costPrice}</b></span>
                </div>
              )}
            </div>
          ) : (
            /* Campos para crear squishy al vuelo */
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2.5">
              <input
                type="text"
                placeholder="Nombre del nuevo Squishy (ej. Panda Gigante) *"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="w-full p-2.5 bg-white rounded-xl text-xs sm:text-sm font-bold border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center gap-2">
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="w-1/2 p-2 bg-white rounded-xl text-xs font-bold border border-indigo-200 outline-none"
                >
                  <option value="Animalitos">Animalitos</option>
                  <option value="Postres">Postres / Comida</option>
                  <option value="Kawaii">Kawaii / Personajes</option>
                  <option value="Gigantes">Gigantes / Jumbo</option>
                  <option value="Glow">Brillan en Oscuridad</option>
                </select>

                {/* Botón Foto con Cámara */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-1/2 p-2 bg-white rounded-xl text-xs font-extrabold text-indigo-700 border border-indigo-200 flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>{newProductImages.length > 0 ? 'Foto Lista ✅' : 'Tomar Foto 📸'}</span>
                </button>
              </div>

              {newProductImages.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <img src={newProductImages[0]} alt="Preview" className="w-10 h-10 rounded-lg object-cover border" />
                  <span className="text-[11px] text-indigo-900 font-bold">Foto optimizada y lista para el catálogo</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Cajas y Piezas */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            2. Cantidad de Cajas y Piezas
          </span>

          {/* Stepper de Cajas */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Número de Cajas:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBoxCount(Math.max(1, boxes - 1).toString())}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 font-black text-slate-700 flex items-center justify-center active:scale-90"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={boxCount}
                  onChange={(e) => setBoxCount(e.target.value)}
                  className="w-14 py-1 text-center font-black text-base bg-white rounded-xl border border-slate-200 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setBoxCount((boxes + 1).toString())}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-200 font-black text-slate-700 flex items-center justify-center active:scale-90"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chips Rápidos de Cajas */}
            <div className="flex gap-1.5 pt-1">
              {['1', '2', '3', '5', '10'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBoxCount(num)}
                  className={`flex-1 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    boxCount === num ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  {num} cja{num > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Piezas por Caja */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Piezas que vienen por Caja:</span>
              <input
                type="number"
                value={unitsPerBox}
                onChange={(e) => setUnitsPerBox(e.target.value)}
                className="w-20 py-1 px-2 text-right font-black text-sm bg-white rounded-xl border border-slate-200 outline-none"
              />
            </div>

            {/* Chips de piezas típicas */}
            <div className="flex gap-1.5 pt-1">
              {['50', '100', '120', '150', '200'].map(pzs => (
                <button
                  key={pzs}
                  type="button"
                  onClick={() => setUnitsPerBox(pzs)}
                  className={`flex-1 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    unitsPerBox === pzs ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border'
                  }`}
                >
                  {pzs} pzs
                </button>
              ))}
            </div>
          </div>

          {/* Total de Piezas a Ingresar */}
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900">Total de Piezas a Recibir:</span>
            <span className="text-sm font-black text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
              📦 {totalUnits} piezas
            </span>
          </div>
        </div>

        {/* 3. Costos y Flete */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            3. Costo y Proveedor
          </span>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Costo por Caja:</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input
                  type="number"
                  value={costPerBox}
                  onChange={(e) => setCostPerBox(e.target.value)}
                  className="w-full pl-6 pr-2 py-2 bg-slate-50 rounded-xl text-xs sm:text-sm font-black border border-slate-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Flete / Envío Total:</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input
                  type="number"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-full pl-6 pr-2 py-2 bg-slate-50 rounded-xl text-xs sm:text-sm font-black border border-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Proveedor (ej. Tepito)"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full p-2 bg-slate-50 rounded-xl text-xs font-semibold border border-slate-200 outline-none"
            />

            <select
              value={destinationLocationId}
              onChange={(e) => setDestinationLocationId(e.target.value)}
              className="w-full p-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 outline-none cursor-pointer"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  Destino: {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Tarjeta Inteligente de Utilidad (Calculadora en Vivo) */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulador de Ganancia en Vivo</span>
            </span>
            <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {marginPercent.toFixed(1)}% Margen
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-white/5 p-2.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-slate-400 block font-bold">Costo Unitario Real</span>
              <span className="text-base font-black text-rose-300">
                ${costPerPiece.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/ pza</span>
              </span>
            </div>

            <div className="bg-white/5 p-2.5 rounded-2xl border border-white/10">
              <span className="text-[10px] text-slate-400 block font-bold">Ganancia Limpia</span>
              <span className="text-base font-black text-emerald-400">
                +${profitPerPiece.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/ pza</span>
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Inversión del Lote:</span>
              <span className="font-extrabold text-white">${totalInvestment.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Ganancia Neta Proyectada:</span>
              <span className="font-black text-emerald-400 text-sm">+${totalProjectedProfit.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 5. Botón de Ingreso al Inventario */}
        <button
          type="button"
          onClick={handleRegisterPurchase}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white font-black text-sm shadow-xl shadow-indigo-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Package className="w-5 h-5" />
          <span>Ingresar {totalUnits} Piezas al Inventario</span>
        </button>

      </div>

      {/* Historial Compacto de Compras Anteriores */}
      {purchases.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
            Lotes Registrados Recientemente ({purchases.length})
          </h3>

          <div className="space-y-2">
            {purchases.slice(0, 5).map(pur => (
              <div
                key={pur.id}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-extrabold text-slate-800 block">
                    {pur.productName || 'Squishy'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {pur.supplier} • {pur.boxCount} cajas ({pur.totalUnits} pzs)
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 block">
                    ${pur.totalInvestment?.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-bold">
                    ${pur.calculatedCostPerPiece?.toFixed(2)} / pza
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
