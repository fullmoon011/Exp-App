import React, { useState } from 'react';
import { Eye, EyeOff, Briefcase, Home, Store, ChevronDown, Check, Plus, Smartphone, Download, X } from 'lucide-react';
import { NamesConfig, SettingsConfig, WorkspaceAccount } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  t: (key: string) => string;
  isLocked: boolean;
  onToggleLock: () => void;
  currentMonth: string;
  onChangeMonth: (m: string) => void;
  names: NamesConfig;
  settings: SettingsConfig;
  onSwitchWorkspace: (id: string) => void;
  onAddWorkspace: (name: string, icon: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  t,
  isLocked,
  onToggleLock,
  currentMonth,
  onChangeMonth,
  names,
  settings,
  onSwitchWorkspace,
  onAddWorkspace
}) => {
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [showIosModal, setShowIosModal] = useState(false);

  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosModal(true);
      return;
    }
    await promptInstall();
  };

  const currentWsId = settings.acc || '';
  const currentWs = (names.accs || []).find(a => a.id === currentWsId) || {
    id: '',
    n: names.mn || t('wsm'),
    i: names.mi || 'house'
  };

  const handleAdd = () => {
    if (!newWsName.trim()) return;
    onAddWorkspace(newWsName.trim(), 'briefcase');
    setNewWsName('');
    setShowWorkspaceMenu(false);
  };

  return (
    <header className="relative bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white rounded-2xl p-4 shadow-lg mb-4 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Workspace */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center p-2 shadow-inner border border-white/20">
            <svg viewBox="0 0 40 40" className="w-full h-full fill-white" aria-hidden="true">
              <rect x="7" y="22" width="6" height="12" rx="2" fill="white" />
              <rect x="17" y="15" width="6" height="19" rx="2" fill="white" />
              <rect x="27" y="8" width="6" height="26" rx="2" fill="white" />
              <circle cx="12" cy="10" r="5" fill="#fcd34d" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight flex items-center gap-2">
              {t('app')}
            </h1>
            {/* Workspace trigger */}
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="flex items-center gap-1.5 text-xs text-teal-200 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-lg transition"
            >
              <CategoryIcon name={currentWs.i} className="w-3.5 h-3.5" />
              <span className="font-medium truncate max-w-[120px]">{currentWs.n}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
          </div>
        </div>

        {/* Month Selector & Privacy Eye */}
        <div className="flex items-center gap-2">
          {/* Month input */}
          <div className="flex items-center bg-black/25 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15">
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => e.target.value && onChangeMonth(e.target.value)}
              className="bg-transparent text-white text-xs md:text-sm font-medium focus:outline-none cursor-pointer"
            />
          </div>

          {/* Privacy Eye Button */}
          <button
            onClick={onToggleLock}
            title={isLocked ? t('enp') : t('locked')}
            className={`p-2.5 rounded-xl border transition flex items-center justify-center ${
              isLocked
                ? 'bg-amber-500/20 text-amber-200 border-amber-400/30 hover:bg-amber-500/30'
                : 'bg-white/15 text-white border-white/20 hover:bg-white/25'
            }`}
          >
            {isLocked ? (
              <EyeOff className="w-5 h-5 text-amber-300" />
            ) : (
              <Eye className="w-5 h-5 text-emerald-300" />
            )}
          </button>
        </div>
      </div>

      {/* Workspace Menu Dropdown */}
      {showWorkspaceMenu && (
        <div className="absolute top-full mt-2 inset-x-4 md:inset-x-auto md:start-4 z-40 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 min-w-[260px] animate-in fade-in zoom-in-95 duration-150">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
            {t('wsp')}
          </div>

          <div className="space-y-1 mb-3">
            {/* Main default */}
            <button
              onClick={() => {
                onSwitchWorkspace('');
                setShowWorkspaceMenu(false);
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-sm transition ${
                currentWsId === ''
                  ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-semibold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CategoryIcon name={names.mi || 'house'} className="w-4 h-4 text-teal-600" />
                <span>{names.mn || t('wsm')}</span>
              </div>
              {currentWsId === '' && <Check className="w-4 h-4 text-teal-600" />}
            </button>

            {/* Custom workspaces */}
            {(names.accs || []).map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  onSwitchWorkspace(acc.id);
                  setShowWorkspaceMenu(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-sm transition ${
                  currentWsId === acc.id
                    ? 'bg-teal-50 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-semibold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CategoryIcon name={acc.i || 'briefcase'} className="w-4 h-4 text-teal-600" />
                  <span>{acc.n}</span>
                </div>
                {currentWsId === acc.id && <Check className="w-4 h-4 text-teal-600" />}
              </button>
            ))}
          </div>

          {/* Add new workspace input */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder={t('wsn')}
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1 text-xs py-1.5 px-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
              />
              <button
                onClick={handleAdd}
                className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
