import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Camera, Image as ImageIcon, Trash2, Sparkles, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { compressImage } from '../utils/imageHelper';

export default function ProductModal({ isOpen, onClose, productToEdit = null }) {
  const { addProductWithStock, updateProduct, deleteProduct, locations, activeLocationId, getStock } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

    setIsSaving(true);
    try {
      if (productToEdit) {
        // Modificar existente
        await updateProduct({
          id: productToEdit.id,
          name: name.trim(),
          category: category.trim() || 'General',
          images,
          costPrice: calculatedUnitCost,
          salePrice: price,
          boxCost: entryMode === 'box' ? parseFloat(boxCost) : 0,
          unitsPerBox: entryMode === 'box' ? parseFloat(unitsPerBox) : 0,
          newStock: parseFloat(stock) || 0,
          locationId: targetLocation
        });
      } else {
        // Crear nuevo
        await addProductWithStock({
          name: name.trim(),
          category: category.trim() || 'General',
          images,
          costPrice: calculatedUnitCost,
          salePrice: price,
          initialStock: parseFloat(stock) || 0,
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
