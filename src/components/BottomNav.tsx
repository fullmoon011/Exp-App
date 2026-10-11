import React from 'react';
import {
  Receipt,
  BarChart3,
  PiggyBank,
  Gem,
  ShoppingBasket,
  LayoutGrid,
  Settings
} from 'lucide-react';

export type TabKey = 'expenses' | 'reports' | 'savings' | 'wealth' | 'shopping' | 'more' | 'settings';

interface BottomNavProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  t: (key: string) => string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, t }) => {
  const tabs: { key: TabKey; labelKey: string; icon: React.ReactNode }[] = [
    { key: 'expenses', labelKey: 'ne', icon: <Receipt className="w-5 h-5" /> },
    { key: 'reports', labelKey: 'nr', icon: <BarChart3 className="w-5 h-5" /> },
    { key: 'savings', labelKey: 'ns', icon: <PiggyBank className="w-5 h-5" /> },
    { key: 'wealth', labelKey: 'nw', icon: <Gem className="w-5 h-5" /> },
    { key: 'shopping', labelKey: 'shp', icon: <ShoppingBasket className="w-5 h-5" /> },
    { key: 'more', labelKey: 'mre', icon: <LayoutGrid className="w-5 h-5" /> },
    { key: 'settings', labelKey: 'nt', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 py-1.5 pb-[max(6px,env(safe-area-inset-bottom))] transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChangeTab(tab.key)}
              className={`flex-1 min-w-[56px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-all ${
                isActive
                  ? 'text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/60 scale-102'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                {tab.icon}
              </span>
              <span className="truncate max-w-[62px] text-center">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
