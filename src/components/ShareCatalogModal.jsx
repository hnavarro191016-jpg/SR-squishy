import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, X, QrCode, MessageCircle, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ShareCatalogModal({ isOpen, onClose }) {
  const { whatsappNumber } = useApp();
  const [copied, setCopied] = useState(false);
  const [catalogUrl, setCatalogUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = `${window.location.protocol}//${window.location.hostname}:${window.location.port || '5173'}`;
      setCatalogUrl(`${origin}/?catalogo=1`);
    }
  }, []);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(catalogUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsAppShare = () => {
    const text = `🧸 *¡Hola! Te comparto nuestro Catálogo Oficial de Squishys:*\n\n` +
      `✨ Checa las fotos reales, modelos disponibles y haz tu pedido directo con stock apartado aquí:\n` +
      `👉 ${catalogUrl}\n\n` +
      `¿Cuál te apartamos hoy? 😊`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(catalogUrl)}&bgcolor=ffffff&color=0f172a`;

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative text-center space-y-4 max-h-[92vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-gradient-to-tr from-purple-500 to-pink-500 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-lg shadow-purple-500/25">
          <Share2 className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-900">Catálogo Digital para Clientes</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparte esta liga para que tus clientes armen su pedido y te lo envíen directo a WhatsApp.
          </p>
        </div>

        {/* Banner de Seguridad y Privacidad */}
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-left text-xs flex items-start gap-2.5 text-emerald-800">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block text-emerald-900">🛡️ Costos y Ganancias 100% Ocultos</span>
            <span className="text-[11px] text-emerald-700 font-medium">
              Tus clientes <strong>solo verán las fotos y precios de venta</strong>. Tu costo por caja, margen de ganancia y Dashboard quedan totalmente protegidos e invisibles para ellos.
            </span>
          </div>
        </div>

        {/* Input de Liga + Botón Copiar */}
        <div className="space-y-1.5 text-left">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Liga Pública del Catálogo:
          </label>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl p-1.5">
            <input
              type="text"
              readOnly
              value={catalogUrl}
              className="flex-1 bg-transparent px-2 text-xs font-mono font-bold text-slate-800 outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Botón Mandar directo por WhatsApp */}
        <button
          onClick={handleSendWhatsAppShare}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Enviar Catálogo por WhatsApp</span>
        </button>

        {/* Código QR para Mostrador o Bazar */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700">
            <QrCode className="w-4 h-4 text-purple-600" />
            <span>Código QR para Clientes en Mostrador</span>
          </div>
          <div className="p-3 bg-white rounded-xl inline-block border border-slate-200 shadow-sm mx-auto">
            <img 
              src={qrImageUrl} 
              alt="Código QR Catálogo Clientes" 
              className="w-36 h-36 rounded-lg mx-auto"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
            Ideal para imprimirlo o tenerlo en tu isla/bazar para que tus clientes escaneen y elijan desde su celular.
          </p>
        </div>

        {/* Botón para Probar como Cliente */}
        <div className="pt-1">
          <button
            onClick={() => {
              window.open(catalogUrl, '_blank');
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir en pestaña nueva para ver cómo lo ve el cliente</span>
          </button>
        </div>

      </div>
    </div>
  );
}
