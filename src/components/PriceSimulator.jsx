import React, { useState } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Target, 
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function PriceSimulator() {
  const [boxCost, setBoxCost] = useState('1200');
  const [boxPieces, setBoxPieces] = useState('100');
  const [shipping, setShipping] = useState('100');
  const [salePrice, setSalePrice] = useState('45');

  const cost = parseFloat(boxCost) || 0;
  const pieces = Math.max(1, parseFloat(boxPieces) || 1);
  const ship = parseFloat(shipping) || 0;
  const price = parseFloat(salePrice) || 0;

  // Cálculos
  const totalBoxInvestment = cost + ship;
  const unitCost = totalBoxInvestment / pieces;
  const unitProfit = price - unitCost;
  const marginPercent = price > 0 ? (unitProfit / price) * 100 : 0;
  const markupPercent = unitCost > 0 ? (unitProfit / unitCost) * 100 : 0;
  const boxTotalRevenue = price * pieces;
  const boxTotalProfit = unitProfit * pieces;
  const roi = totalBoxInvestment > 0 ? (boxTotalProfit / totalBoxInvestment) * 100 : 0;

  // Sugerencias de Precios según Objetivos de Margen
  const calculatePriceForMargin = (targetMarginPercent) => {
    // Formula: Price = UnitCost / (1 - Margin/100)
    const raw = unitCost / (1 - (targetMarginPercent / 100));
    // Redondear a números atractivos de venta (.00 o .50)
    return Math.ceil(raw / 5) * 5;
  };

  const tiers = [
    { name: 'Volumen Rápido', margin: 50, price: calculatePriceForMargin(50), desc: 'Para liquidar rápido y ventas al mayoreo' },
    { name: 'Punto Dulce Retail', margin: 65, price: calculatePriceForMargin(65), desc: 'El balance perfecto de ventas y margen' },
    { name: 'Alta Ganancia / Isla', margin: 75, price: calculatePriceForMargin(75), desc: 'Para centros comerciales y lugares turísticos' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Encabezado */}
      <div>
        <div className="flex items-center gap-2 text-pink-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Calculator className="w-4 h-4" />
          <span>Estrategia de Precios & Multiplicador de Capital</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Simulador de Márgenes & Fijación de Precios
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Antes de comprar una caja con el proveedor, simula aquí tus números. Diseña tus precios para maximizar la ganancia neta en cada punto de venta.
        </p>
      </div>

      {/* Grid Principal: Parámetros vs Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Parámetros de Entrada (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span>Datos de Compra con Proveedor</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Costo de la Caja ($ MXN)
              </label>
              <input
                type="number"
                value={boxCost}
                onChange={(e) => setBoxCost(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Piezas por Caja
                </label>
                <input
                  type="number"
                  value={boxPieces}
                  onChange={(e) => setBoxPieces(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Flete / Extras ($)
                </label>
                <input
                  type="number"
                  value={shipping}
                  onChange={(e) => setShipping(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Costo Unitario Destacado */}
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Costo Unitario Resultante
              </span>
              <div className="text-2xl font-black text-slate-900 my-0.5">
                ${unitCost.toFixed(2)} MXN
              </div>
              <span className="text-[11px] text-slate-500">Este es tu piso de costo por squishy</span>
            </div>

            <div className="pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-pink-600 block mb-1">
                Precio de Venta al Público a Evaluar ($ MXN)
              </label>
              <input
                type="number"
                step="1"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full px-3.5 py-3 bg-pink-50/50 border-2 border-pink-500 rounded-2xl text-2xl font-black text-pink-600 text-center outline-none"
              />
            </div>
          </div>
        </div>

        {/* Resultados del Negocio (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                🚀 Rendimiento de esta Caja
              </span>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ROI: {roi.toFixed(0)}%
              </span>
            </div>

            {/* Dos Métricas Gigantes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                <span className="text-xs font-medium text-slate-400 block">Margen Bruto de Ganancia</span>
                <div className="text-4xl font-black text-amber-300 my-1">
                  {marginPercent.toFixed(1)}%
                </div>
                <span className="text-[11px] text-slate-400">Markup sobre costo: +{markupPercent.toFixed(0)}%</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                <span className="text-xs font-medium text-slate-400 block">Ganancia Líquida x Caja</span>
                <div className="text-4xl font-black text-emerald-400 my-1">
                  +${boxTotalProfit.toFixed(2)}
                </div>
                <span className="text-[11px] text-slate-400">+${unitProfit.toFixed(2)} netos por squishy</span>
              </div>
            </div>

            {/* Desglose Gráfico */}
            <div className="space-y-3 text-xs border-t border-white/10 pt-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Inversión en la caja:</span>
                <span className="font-bold text-white">${totalBoxInvestment.toFixed(2)} MXN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ventas totales esperadas:</span>
                <span className="font-bold text-white">${boxTotalRevenue.toFixed(2)} MXN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Por cada $1.00 invertido obtienes:</span>
                <span className="font-black text-emerald-400">
                  ${(boxTotalRevenue / Math.max(1, totalBoxInvestment)).toFixed(2)} MXN
                </span>
              </div>
            </div>
          </div>

          {/* Sugerencias de Precios Inteligentes */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-pink-600" />
              <span>Sugerencias de Precios Estratégicos</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tiers.map(tier => (
                <div
                  key={tier.name}
                  onClick={() => setSalePrice(tier.price.toString())}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:border-pink-500 hover:bg-pink-50/40 cursor-pointer transition-all text-center group"
                >
                  <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-pink-600 block">
                    {tier.name}
                  </span>
                  <div className="text-xl font-black text-slate-900 my-0.5">
                    ${tier.price}.00
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 block">
                    ~{tier.margin}% margen
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{tier.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
