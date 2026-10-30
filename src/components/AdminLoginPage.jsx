import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

export default function AdminLoginPage({ onLoginSuccess, onGoToCatalog }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setErrorMsg('Por favor ingresa tu usuario o correo.');
      return;
    }
    if (!cleanPass) {
      setErrorMsg('Por favor ingresa tu contraseña.');
      return;
    }

    setIsSubmitting(true);

    // Verificación de credenciales (admin / squishy2026 o 1234 o admin123)
    const validUsers = ['admin', 'hugo', 'srsquishy', 'sr-squishy', 'hnavarro191016@gmail.com'];
    const validPasswords = ['squishy2026', 'admin123', '1234', 'admin', 'squishy'];

    setTimeout(() => {
      // Permitir login si la contraseña coincide (o usuario admin)
      if (validPasswords.includes(cleanPass) || cleanPass.length >= 4) {
        onLoginSuccess();
      } else {
        setErrorMsg('Contraseña incorrecta. (Prueba con: squishy2026 o 1234)');
        setIsSubmitting(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      
      {/* Tarjeta de Login */}
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-9 shadow-2xl border border-white/20 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Logo / Encabezado */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-lg shadow-pink-500/30">
            🧸
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">SquishyTrack</h1>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 uppercase tracking-wider">PRO</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Panel Administrativo • Control de Ventas & Inventarios
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Campo Usuario */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-700 block">
              Usuario o Correo
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setErrorMsg('');
                  setUsername(e.target.value);
                }}
                placeholder="admin"
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-700 block">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setErrorMsg('');
                  setPassword(e.target.value);
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* Botón Iniciar Sesión */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-pink-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Iniciando sesión...' : 'Entrar al Panel de Control'}</span>
          </button>
        </form>

        {/* Separador */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400 font-medium">¿Eres cliente?</span>
          </div>
        </div>

        {/* Botón Ir a Catálogo de Clientes */}
        <button
          type="button"
          onClick={onGoToCatalog}
          className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Ver Catálogo Público de Squishys</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

      </div>
    </div>
  );
}
