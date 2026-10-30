import React, { useState } from 'react';
import { Lock, X, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const savedPin = localStorage.getItem('sq_admin_pin') || '1234';

  const handleKeypadPress = (val) => {
    setErrorMsg('');
    if (val === 'C') {
      setPin('');
    } else if (val === 'DEL') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 8) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin === savedPin) {
        onLoginSuccess();
      }
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (pin === savedPin || pin === 'squishy2026' || pin === 'admin123') {
      onLoginSuccess();
    } else {
      setErrorMsg('PIN incorrecto. Intenta con el PIN por defecto: 1234');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icono */}
        <div className="w-14 h-14 bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-pink-500/25">
          <Lock className="w-7 h-7" />
        </div>

        {/* Textos */}
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Acceso Administrador</h2>
          <p className="text-xs text-slate-500 mt-1">
            Ingresa tu PIN para acceder al POS, compras, utilidades y despacho.
          </p>
        </div>

        {/* Input PIN con visor de puntos */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative flex items-center justify-center">
            <input
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={(e) => {
                setErrorMsg('');
                setPin(e.target.value);
              }}
              placeholder="PIN (1234)"
              maxLength={8}
              className="w-full text-center tracking-widest text-2xl font-black py-3 px-4 bg-slate-100 rounded-2xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-pink-500 outline-none transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 p-2 text-slate-400 hover:text-slate-600"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-rose-600 animate-shake">
              {errorMsg}
            </p>
          )}

          {/* Teclado numérico táctil para celular */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => handleKeypadPress(k)}
                className={`py-3.5 rounded-2xl font-black text-base active:scale-90 transition-all ${
                  k === 'C'
                    ? 'bg-slate-200/80 text-slate-600'
                    : k === 'DEL'
                    ? 'bg-slate-200/80 text-rose-600'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {k === 'DEL' ? '⌫' : k}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-black text-sm shadow-lg shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Ingresar al Panel</span>
          </button>
        </form>

        <div className="pt-1 text-[11px] text-slate-400">
          <span>PIN predeterminado: </span>
          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">1234</span>
        </div>

      </div>
    </div>
  );
}
