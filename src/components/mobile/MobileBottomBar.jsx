import React from 'react';
import { 
  ShoppingBag, 
  Store, 
  Package, 
  BarChart3, 
  PlusCircle,
  Tag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MobileBottomBar({ activeTab, setActiveTab }) {
  const { orders } = useApp();

  const activeOrdersCount = (orders || []).filter(o => 
    ['nuevo', 'preparado', 'por_entregar'].includes(o.status)
  ).length;

  const tabs = [
    {
      id: 'pos',
      label: 'Vender',
      icon: Tag,
      activeColor: 'text-pink-600',
      activeBg: 'bg-pink-50',
    },
    {
      id: 'orders',
      label: 'Pedidos',
      icon: ShoppingBag,
      activeColor: 'text-emerald-600',
      activeBg: 'bg-emerald-50',
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
      badgeColor: 'bg-emerald-500'
    },
    {
      id: 'purchases',
      label: 'Compras',
      icon: Package,
      activeColor: 'text-indigo-600',
      activeBg: 'bg-indigo-50',
    },
    {
      id: 'inventory',
      label: 'Stock & Caja',
      icon: Store,
      activeColor: 'text-amber-600',
      activeBg: 'bg-amber-50',
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-2xl pb-safe">
      <div className="grid grid-cols-4 px-1 py-1 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all relative touch-press ${
                isActive 
                  ? `${tab.activeColor} ${tab.activeBg} font-black` 
                  : 'text-slate-400 hover:text-slate-600 font-semibold'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && (
                  <span className={`absolute -top-1.5 -right-3 ${tab.badgeColor} text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs animate-pulse`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight truncate max-w-full">
                {tab.label}
              </span>
              {isActive && (
                <span className={`w-1 h-1 rounded-full ${tab.activeColor.replace('text-', 'bg-')} mt-0.5`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
