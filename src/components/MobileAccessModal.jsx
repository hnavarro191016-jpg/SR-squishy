import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, QrCode, Copy, Check, X, Sparkles } from 'lucide-react';

export default function MobileAccessModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [hostUrl, setHostUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Usar la URL actual del navegador
      const url = window.location.origin;
      setHostUrl(url);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(hostUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generador de QR visual mediante SVG (para no depender de librerías externas)
  // Generamos un QR funcional o imagen QR vía API de QR rápida y ligera
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(hostUrl)}&bgcolor=ffffff&color=1e1e2e`;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl text-center space-y-4 relative">
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-gradient-to-tr from-pink-500 to-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-lg shadow-pink-500/25">
          <Smartphone className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-900">Enlazar Punto de Venta en tu Celular</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            ¡Usa tu teléfono como caja registradora táctil en cualquier isla o bazar!
          </p>
        </div>

        {/* Código QR */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
          <img 
            src={qrImageUrl} 
            alt="Código QR para abrir en celular"
            className="w-44 h-44 rounded-xl mx-auto"
            onError={(e) => {
              // Fallback si no hay internet para el QR service
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="text-[11px] font-bold text-slate-500 mt-2 block">
            Apunta la cámara de tu celular aquí
          </span>
        </div>

        {/* Instrucciones 1, 2, 3 */}
        <div className="bg-slate-50 p-3.5 rounded-2xl text-left text-xs space-y-2 border border-slate-200/70">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
            <span className="text-slate-700 font-medium">Asegúrate de que tu celular esté conectado a la <strong>misma red Wi-Fi</strong> o red compartida.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
            <span className="text-slate-700 font-medium">Escanea el código QR o abre esta dirección en Safari / Chrome:</span>
          </div>
          
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              readOnly
              value={hostUrl}
              className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-900 text-white font-extrabold text-sm hover:bg-slate-800 transition-colors"
        >
          ¡Listo, Entendido! 👍
        </button>

      </div>
    </div>
  );
}
