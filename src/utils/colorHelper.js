// Helper de variantes y colores para Squishys
export const DEFAULT_COLOR_SUGGESTIONS = [
  { name: 'Rosa', emoji: '🌸' },
  { name: 'Azul', emoji: '🔵' },
  { name: 'Amarillo', emoji: '🟡' },
  { name: 'Morado', emoji: '🟣' },
  { name: 'Verde', emoji: '🟢' },
  { name: 'Blanco', emoji: '⚪' },
  { name: 'Rojo', emoji: '🔴' },
  { name: 'Naranja', emoji: '🟠' },
  { name: 'Multicolor', emoji: '🌈' },
  { name: 'Chocolate', emoji: '🍫' }
];

export function getColorVisual(name = '') {
  const n = (name || '').toLowerCase().trim();

  if (n.includes('rosa') || n.includes('pink') || n.includes('fucsia')) {
    return {
      emoji: '🌸',
      badge: 'bg-pink-100 text-pink-700 border-pink-300',
      dot: 'bg-pink-500',
      border: 'border-pink-400'
    };
  }
  if (n.includes('azul') || n.includes('blue') || n.includes('celeste') || n.includes('turquesa')) {
    return {
      emoji: '🔵',
      badge: 'bg-sky-100 text-sky-700 border-sky-300',
      dot: 'bg-sky-500',
      border: 'border-sky-400'
    };
  }
  if (n.includes('amarill') || n.includes('yellow') || n.includes('dorad')) {
    return {
      emoji: '🟡',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      dot: 'bg-amber-400',
      border: 'border-amber-400'
    };
  }
  if (n.includes('verd') || n.includes('green') || n.includes('menta')) {
    return {
      emoji: '🟢',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dot: 'bg-emerald-500',
      border: 'border-emerald-400'
    };
  }
  if (n.includes('morad') || n.includes('purple') || n.includes('lila') || n.includes('violet')) {
    return {
      emoji: '🟣',
      badge: 'bg-purple-100 text-purple-700 border-purple-300',
      dot: 'bg-purple-500',
      border: 'border-purple-400'
    };
  }
  if (n.includes('roj') || n.includes('red') || n.includes('vino')) {
    return {
      emoji: '🔴',
      badge: 'bg-rose-100 text-rose-700 border-rose-300',
      dot: 'bg-rose-500',
      border: 'border-rose-400'
    };
  }
  if (n.includes('naranj') || n.includes('orange') || n.includes('durazn')) {
    return {
      emoji: '🟠',
      badge: 'bg-orange-100 text-orange-800 border-orange-300',
      dot: 'bg-orange-500',
      border: 'border-orange-400'
    };
  }
  if (n.includes('blanc') || n.includes('white') || n.includes('crema')) {
    return {
      emoji: '⚪',
      badge: 'bg-slate-100 text-slate-700 border-slate-300',
      dot: 'bg-slate-300',
      border: 'border-slate-300'
    };
  }
  if (n.includes('negr') || n.includes('black') || n.includes('gris')) {
    return {
      emoji: '⚫',
      badge: 'bg-slate-800 text-white border-slate-700',
      dot: 'bg-slate-900',
      border: 'border-slate-800'
    };
  }
  if (n.includes('chocolat') || n.includes('caf') || n.includes('brown')) {
    return {
      emoji: '🍫',
      badge: 'bg-amber-950/10 text-amber-900 border-amber-800/30',
      dot: 'bg-amber-800',
      border: 'border-amber-700'
    };
  }
  if (n.includes('multi') || n.includes('arcoiris') || n.includes('rainbow')) {
    return {
      emoji: '🌈',
      badge: 'bg-gradient-to-r from-pink-100 via-amber-100 to-sky-100 text-purple-800 border-purple-200',
      dot: 'bg-gradient-to-r from-pink-500 to-sky-500',
      border: 'border-purple-400'
    };
  }

  return {
    emoji: '🎨',
    badge: 'bg-pink-50 text-pink-700 border-pink-200',
    dot: 'bg-pink-500',
    border: 'border-pink-300'
  };
}
