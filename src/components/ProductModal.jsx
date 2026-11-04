import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Camera, Image as ImageIcon, Trash2, Sparkles, Upload, Palette, Plus, Minus, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { compressImage } from '../utils/imageHelper';
import { DEFAULT_COLOR_SUGGESTIONS, getColorVisual } from '../utils/colorHelper';

export default function ProductModal({ isOpen, onClose, productToEdit = null }) {
  const { addProductWithStock, updateProduct, deleteProduct, locations, activeLocationId, getStock } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Variantes de Colores y Disponibilidad por Color
  const [colors, setColors] = useState([]); // [{ name: 'Rosa', stock: '5' }]
  const [newColorName, setNewColorName] = useState('');
  const [newColorStock, setNewColorStock] = useState('5');

  const [entryMode, setEntryMode] = useState('box'); // 'unit' o 'box' (por caja)

  // Modo Caja
  const [boxCost, setBoxCost] = useState('');
  const [unitsPerBox, setUnitsPerBox] = useState('');

  // Modo Unitario
  const [manualCost, setManualCost] = useState('');

  // Precio de Venta
  const [salePrice, setSalePrice] = useState('');

  // Stock y Ubicación
  const [stock, setStock] = useState('10');
  const [targetLocation, setTargetLocation] = useState(activeLocationId || 'loc-2');

  const fileInputRef = useRef(null);

  // Inicializar si viene para editar
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setCategory(productToEdit.category || '');
      setImages(productToEdit.images || []);
      setSalePrice(productToEdit.salePrice ? productToEdit.salePrice.toString() : '');
      
      if (Array.isArray(productToEdit.colors) && productToEdit.colors.length > 0) {
        setColors(productToEdit.colors.map(c => ({
          name: c.name || '',
          stock: c.stock !== undefined ? c.stock.toString() : '0'
        })));
      } else {
        setColors([]);
      }

      if (productToEdit.boxCostReference && productToEdit.unitsPerBoxReference) {
        setEntryMode('box');
        setBoxCost(productToEdit.boxCostReference.toString());
        setUnitsPerBox(productToEdit.unitsPerBoxReference.toString());
      } else {
        setEntryMode('unit');
        setManualCost(productToEdit.costPrice ? productToEdit.costPrice.toString() : '');
      }

      const currentStock = getStock(activeLocationId, productToEdit.id);
      setStock(currentStock.toString());
      setTargetLocation(activeLocationId);
    } else {
      // Modo Nuevo
      setName('');
      setCategory('');
      setImages([]);
      setColors([]);
      setNewColorName('');
      setNewColorStock('5');
      setBoxCost('');
      setUnitsPerBox('');
      setManualCost('');
      setSalePrice('');
      setStock('10');
      setTargetLocation(activeLocationId || 'loc-2');
    }
  }, [productToEdit, isOpen, activeLocationId]);

  if (!isOpen) return null;

  // Manejador de subida de múltiples fotos
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessingImages(true);
    try {
      const processed = await Promise.all(
        files.map(file => compressImage(file, 640, 0.72))
      );
      setImages(prev => [...prev, ...processed]);
    } catch (err) {
      console.error('Error al procesar imágenes:', err);
      alert('Hubo un problema al cargar alguna de las fotos. Intenta de nuevo.');
    } finally {
      setIsProcessingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // MANEJO DE COLORES Y VARIANTES
  const handleAddColor = (nameToAdd, stockToAdd = '5') => {
    const trimmed = (nameToAdd || '').trim();
    if (!trimmed) return;

    if (colors.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`El color "${trimmed}" ya fue agregado a la lista.`);
      return;
    }

    const qty = Math.max(0, parseInt(stockToAdd) || 0);
    const updated = [...colors, { name: trimmed, stock: qty.toString() }];
    setColors(updated);
    setNewColorName('');
    setNewColorStock('5');

    // Auto-actualizar el stock total con la suma de colores
    const totalQty = updated.reduce((sum, c) => sum + (parseInt(c.stock) || 0), 0);
    setStock(totalQty.toString());
  };

  const handleRemoveColor = (index) => {
    const updated = colors.filter((_, i) => i !== index);
    setColors(updated);
    if (updated.length > 0) {
      const totalQty = updated.reduce((sum, c) => sum + (parseInt(c.stock) || 0), 0);
      setStock(totalQty.toString());
    }
  };

  const handleUpdateColorStock = (index, deltaOrVal, isAbsolute = false) => {
    const updated = colors.map((c, i) => {
      if (i === index) {
        let newStock = isAbsolute ? (parseInt(deltaOrVal) || 0) : ((parseInt(c.stock) || 0) + deltaOrVal);
        newStock = Math.max(0, newStock);
        return { ...c, stock: newStock.toString() };
      }
      return c;
    });
    setColors(updated);
    const totalQty = updated.reduce((sum, c) => sum + (parseInt(c.stock) || 0), 0);
    setStock(totalQty.toString());
  };

  // Cálculo de costo unitario
  const calculatedUnitCost = entryMode === 'box'
    ? (parseFloat(unitsPerBox) > 0 ? (parseFloat(boxCost) || 0) / parseFloat(unitsPerBox) : 0)
    : (parseFloat(manualCost) || 0);

  const price = parseFloat(salePrice) || 0;
  const profit = price - calculatedUnitCost;
  const marginPercent = price > 0 ? ((profit / price) * 100) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingresa el nombre del squishy');
      return;
    }
    if (!salePrice || parseFloat(salePrice) <= 0) {
      alert('Por favor ingresa el precio de venta');
      return;
    }

    // Filtrar y limpiar colores
    const cleanColors = colors
      .map(c => ({
        name: c.name.trim(),
        stock: Math.max(0, parseInt(c.stock) || 0)
      }))
      .filter(c => c.name.length > 0);

    const effectiveStock = cleanColors.length > 0 
      ? cleanColors.reduce((sum, c) => sum + c.stock, 0)
      : (parseFloat(stock) || 0);

    setIsSaving(true);
    try {
      if (productToEdit) {
        // Modificar existente
        await updateProduct({
          id: productToEdit.id,
          name: name.trim(),
          category: category.trim() || 'General',
          images,
          colors: cleanColors,
          costPrice: calculatedUnitCost,
          salePrice: price,
          boxCost: entryMode === 'box' ? parseFloat(boxCost) : 0,
          unitsPerBox: entryMode === 'box' ? parseFloat(unitsPerBox) : 0,
          newStock: effectiveStock,
          locationId: targetLocation
        });
      } else {
        // Crear nuevo
        await addProductWithStock({
          name: name.trim(),
          category: category.trim() || 'General',
          images,
          colors: cleanColors,
          costPrice: calculatedUnitCost,
          salePrice: price,
          initialStock: effectiveStock,
          targetLocationId: targetLocation,
          boxCost: entryMode === 'box' ? parseFloat(boxCost) : 0,
          unitsPerBox: entryMode === 'box' ? parseFloat(unitsPerBox) : 0
        });
      }
      onClose();
    } catch (err) {
      console.error('Error al guardar el producto:', err);
      alert('Hubo un problema al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!productToEdit) return;
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${productToEdit.name}" y su inventario?`)) {
      deleteProduct(productToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[95vh] overflow-y-auto relative">
        
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center text-xl shadow-md shadow-pink-500/20">
            {productToEdit ? '✏️' : <Camera className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              {productToEdit ? 'Modificar Squishy' : 'Subir Artículo con Fotos'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {productToEdit ? 'Edita fotos, existencias, costo o precio de venta' : 'Fotos reales para tu catálogo y ventas por WhatsApp'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* SECCIÓN DE FOTOS */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-pink-600" />
                <span>Fotos del Squishy ({images.length})</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Galería en vivo</span>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-300 shadow-sm group">
                    <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-pink-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        Portada
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-slate-900/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                      title="Quitar foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImages}
              className="w-full py-3.5 border-2 border-dashed border-pink-300 hover:border-pink-500 bg-white rounded-xl text-pink-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-pink-50/50 transition-all cursor-pointer"
            >
              {isProcessingImages ? (
                <span>Optimizando fotos... ⏳</span>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>{images.length === 0 ? '+ Tomar Foto o Subir Galería (Varias)' : '+ Agregar Más Fotos'}</span>
                </>
              )}
            </button>
          </div>

          {/* Nombre y Categoría */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Nombre del Squishy
            </label>
            <input
              type="text"
              placeholder="Ej. Bola Pelusa Antiestrés, Panda Jumbo..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Categoría
            </label>
            <input
              type="text"
              placeholder="Ej. Pelusas, Antiestrés, Comida, Animalitos..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* SECCIÓN DE COLORES / VARIANTES Y DISPONIBILIDAD */}
          <div className="p-3.5 bg-gradient-to-br from-pink-50/60 to-purple-50/40 rounded-2xl border border-pink-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-pink-500 text-white flex items-center justify-center shadow-xs">
                  <Palette className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block">
                    Colores y Disponibilidad {colors.length > 0 && `(${colors.length})`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Tus clientes podrán elegir el color al comprar
                  </span>
                </div>
              </div>

              {colors.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                  {colors.reduce((sum, c) => sum + (parseInt(c.stock) || 0), 0)} pzs en total
                </span>
              )}
            </div>

            {/* Chips rápidos de 1-click para colores comunes */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Colores comunes (toca para agregar rápido):
              </span>
              <div className="flex flex-wrap gap-1">
                {DEFAULT_COLOR_SUGGESTIONS.map(col => {
                  const alreadyAdded = colors.some(c => c.name.toLowerCase() === col.name.toLowerCase());
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => handleAddColor(col.name, '5')}
                      disabled={alreadyAdded}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        alreadyAdded
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 opacity-50 cursor-not-allowed'
                          : 'bg-white hover:bg-pink-100 text-slate-700 hover:text-pink-700 border border-slate-200 shadow-2xs active:scale-95'
                      }`}
                    >
                      <span>{col.emoji}</span>
                      <span>{col.name}</span>
                      {alreadyAdded && <span className="text-[9px]">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input para color personalizado */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Escribe otro color (ej. Menta, Pastel...)"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddColor(newColorName, newColorStock);
                  }
                }}
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-pink-500"
              />
              <div className="w-20">
                <input
                  type="number"
                  min="0"
                  placeholder="Pzs"
                  value={newColorStock}
                  onChange={(e) => setNewColorStock(e.target.value)}
                  className="w-full px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 text-center outline-none focus:border-pink-500"
                  title="Piezas iniciales"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddColor(newColorName, newColorStock)}
                disabled={!newColorName.trim()}
                className="px-3 py-2 bg-slate-900 hover:bg-pink-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center gap-1 active:scale-95 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            {/* Lista de colores agregados con contador de stock */}
            {colors.length > 0 ? (
              <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
                {colors.map((c, idx) => {
                  const visual = getColorVisual(c.name);
                  const qty = parseInt(c.stock) || 0;
                  return (
                    <div 
                      key={idx}
                      className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{visual.emoji}</span>
                        <div className="min-w-0">
                          <span className="font-extrabold text-xs text-slate-800 block truncate">
                            {c.name}
                          </span>
                          <span className={`text-[10px] font-bold ${qty > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {qty > 0 ? `🟢 ${qty} disponibles` : '🔴 Agotado'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Stepper de cantidad */}
                        <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateColorStock(idx, -1)}
                            className="w-6 h-6 rounded bg-white hover:bg-pink-50 text-slate-600 hover:text-pink-600 flex items-center justify-center font-bold active:scale-90 transition-transform"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={c.stock}
                            onChange={(e) => handleUpdateColorStock(idx, e.target.value, true)}
                            className="w-10 bg-transparent text-center font-black text-xs text-slate-900 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateColorStock(idx, 1)}
                            className="w-6 h-6 rounded bg-white hover:bg-pink-50 text-slate-600 hover:text-pink-600 flex items-center justify-center font-bold active:scale-90 transition-transform"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Botón eliminar color */}
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Quitar este color"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic text-center py-1">
                Sin variantes de color (se venderá como modelo único si no agregas colores).
              </p>
            )}
          </div>

          {/* Modo de Costeo */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                ¿Cómo calcular el costo?
              </span>
              <div className="flex gap-1 bg-slate-200/70 p-0.5 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEntryMode('box')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    entryMode === 'box' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  📦 Costo x Caja
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('unit')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    entryMode === 'unit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  🏷️ Costo x Pieza
                </button>
              </div>
            </div>

            {entryMode === 'box' ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Costo de la Caja ($)</label>
                  <input
                    type="number"
                    value={boxCost}
                    onChange={(e) => setBoxCost(e.target.value)}
                    placeholder="Ej. 1200"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Piezas x Caja</label>
                  <input
                    type="number"
                    value={unitsPerBox}
                    onChange={(e) => setUnitsPerBox(e.target.value)}
                    placeholder="Ej. 100"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Costo Unitario ($)</label>
                <input
                  type="number"
                  step="0.5"
                  value={manualCost}
                  onChange={(e) => setManualCost(e.target.value)}
                  placeholder="Ej. 12.00"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 outline-none"
                />
              </div>
            )}

            <div className="text-center pt-1 text-xs font-semibold text-slate-600">
              Costo Unitario: <span className="text-pink-600 font-extrabold text-sm">${calculatedUnitCost.toFixed(2)} MXN</span>
            </div>
          </div>

          {/* Precio de Venta al Público */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-pink-600 block mb-1">
              Precio de Venta al Cliente ($ MXN)
            </label>
            <input
              type="number"
              step="1"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="Ej. 45"
              className="w-full px-4 py-3 bg-pink-50/50 border-2 border-pink-500 rounded-2xl text-2xl font-black text-slate-900 text-center outline-none"
              required
            />
          </div>

          {/* Resumen de Margen */}
          {price > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between text-xs animate-in fade-in">
              <div>
                <span className="font-bold text-emerald-800 block">Tu Ganancia Neta:</span>
                <span className="text-base font-black text-emerald-600">+${profit.toFixed(2)} MXN</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-800 block">Margen Bruto:</span>
                <span className="text-sm font-black text-emerald-700 bg-white px-2.5 py-1 rounded-xl shadow-sm border border-emerald-200 inline-block">
                  {marginPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Existencias / Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">
                {productToEdit ? 'Existencia Actual (Piezas)' : 'Piezas a Cargar Inicialmente'}
                {colors.length > 0 && (
                  <span className="text-[10px] text-pink-600 font-bold ml-1">
                    (Auto-calculado de colores: {colors.reduce((sum, c) => sum + (parseInt(c.stock) || 0), 0)} pzs)
                  </span>
                )}
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">En el Punto de Venta:</label>
              <select
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isSaving || isProcessingImages}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-sm shadow-lg shadow-pink-500/25 hover:from-pink-600 hover:to-rose-700 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>GUARDANDO Y SUBIENDO A LA NUBE...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>{productToEdit ? 'GUARDAR MODIFICACIONES' : 'GUARDAR ARTÍCULO CON FOTOS'}</span>
                </>
              )}
            </button>

            {/* Botón Eliminar si está editando */}
            {productToEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-2.5 rounded-xl text-red-500 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar este squishy permanentemente</span>
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
}
