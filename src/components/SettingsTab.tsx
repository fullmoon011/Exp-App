import React, { useState, useRef } from 'react';
import {
  Wallet,
  Users,
  Palette,
  KeyRound,
  Database,
  Lock,
  Unlock,
  Copy,
  Plus,
  Trash2,
  Undo2,
  Check,
  Languages,
  RotateCcw,
  Sliders,
  DollarSign,
  Download,
  Upload,
  Info
} from 'lucide-react';
import { NamesConfig, SettingsConfig, MonthDoc, WorkspaceAccount } from '../types';
import { LANGUAGES } from '../constants/translations';
import { CategoryIcon } from './CategoryIcon';
import { sha256Hash } from '../utils/storage';

interface SettingsTabProps {
  currentMonth: string;
  doc: MonthDoc;
  names: NamesConfig;
  settings: SettingsConfig;
  isLocked: boolean;
  t: (key: string) => string;
  onUpdateIncome: (memberIdx: number, amount: number) => void;
  onUpdateOtherIncome: (amount: number) => void;
  onToggleCloseMonth: () => void;
  onCopyPrevMonth: () => void;
  onUpdateLimits: (limitConfig: any) => void;
  onUpdateRates: (fx: number, gp: number) => void;
  onUpdateMembers: (newMembers: any[]) => void;
  onUpdateSettings: (newSettings: Partial<SettingsConfig>) => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportJSON: (file: File) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  currentMonth,
  doc,
  names,
  settings,
  isLocked,
  t,
  onUpdateIncome,
  onUpdateOtherIncome,
  onToggleCloseMonth,
  onCopyPrevMonth,
  onUpdateLimits,
  onUpdateRates,
  onUpdateMembers,
  onUpdateSettings,
  onExportJSON,
  onExportCSV,
  onImportJSON
}) => {
  // Rates local state
  const [fxRate, setFxRate] = useState<number>(names.fx || 1500);
  const [gpRate, setGpRate] = useState<number>(names.gp || 0);

  // Limits local state
  const [limPct, setLimPct] = useState<number>(names.lim?.p || 80);
  const [limMode, setLimMode] = useState<'' | 'p' | 'a'>(names.lim?.m || '');
  const [limVal, setLimVal] = useState<number>(names.lim?.v || 0);

  // New PIN local state
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  // Language search
  const [langSearch, setLangSearch] = useState('');

  // Household Code local state
  const [householdInput, setHouseholdInput] = useState('');

  // Avatar choices
  const avatarOptions = ['user', 'user-round', 'smile', 'heart', 'star', 'crown', 'baby'];
  const accentPresets = ['#0f766e', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#475569'];

  const fileInputRef = useRef<HTMLInputElement>(null);

  const members = names.mem || [{ n: 'Person 1', e: 'user' }];

  // Handlers
  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRates(fxRate, gpRate);
  };

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLimits({ p: limPct, m: limMode, v: limVal });
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) return;
    const hash = await sha256Hash(newPin);
    onUpdateSettings({ pin: hash });
    setNewPin('');
    setPinSuccessMsg('PIN set successfully!');
    setTimeout(() => setPinSuccessMsg(''), 3000);
  };

  const handleRemovePin = () => {
    onUpdateSettings({ pin: undefined });
    setPinSuccessMsg('PIN removed!');
    setTimeout(() => setPinSuccessMsg(''), 3000);
  };

  const handleAddMember = () => {
    const newIdx = members.length + 1;
    onUpdateMembers([...members, { n: `${t('p1').slice(0, 4)} ${newIdx}`, e: 'user' }]);
  };

  const handleRenameMember = (idx: number, newName: string) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], n: newName };
    onUpdateMembers(updated);
  };

  const handleSelectAvatar = (idx: number, avatar: string) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], e: avatar };
    onUpdateMembers(updated);
  };

  const handleSoftDeleteMember = (idx: number) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], x: 1 };
    onUpdateMembers(updated);
  };

  const handleRestoreMember = (idx: number) => {
    const updated = [...members];
    const { x, ...rest } = updated[idx];
    updated[idx] = rest;
    onUpdateMembers(updated);
  };

  // Appearance sliders
  const currentUI = settings.ui || {};
  const currentFs = currentUI.fs || 15;
  const currentR = currentUI.r !== undefined ? currentUI.r : 16;
  const currentD = currentUI.d !== undefined ? currentUI.d : 16;
  const currentFf = currentUI.ff || 0;

  const updateUI = (partial: any) => {
    onUpdateSettings({
      ui: { ...currentUI, ...partial }
    });
  };

  // Filter languages
  const filteredLanguages = LANGUAGES.filter((l) => {
    if (!langSearch.trim()) return true;
    const q = langSearch.toLowerCase();
    return (
      l.native.toLowerCase().includes(q) ||
      l.sorani.toLowerCase().includes(q) ||
      l.english.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 pb-12">
      {/* 0. Guide Card */}
      <details className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-700">
        <summary className="font-bold text-xs md:text-sm text-teal-700 dark:text-teal-300 cursor-pointer flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span>{t('gd')}</span>
        </summary>
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
          {t('gdt')}
        </p>
      </details>

      {/* 1. Money, Budget & Limits */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-750 pb-2">
          <Wallet className="w-5 h-5 text-teal-600" />
          <span>{t('sg1')}</span>
        </h3>

        {/* Private Income Inputs */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 mb-2">{t('inc')}</h4>
          {isLocked ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-400 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>{t('locked')}</span>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {members.map((m, idx) =>
                !m.x ? (
                  <div key={idx} className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {t('sal')} {m.n}
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={doc.inc[idx] || ''}
                      onChange={(e) => onUpdateIncome(idx, +e.target.value)}
                      placeholder="0"
                      className="w-36 py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>
                ) : null
              )}
              {/* Other income */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {t('oth')}
                </span>
                <input
                  type="number"
                  min="0"
                  value={doc.oi || ''}
                  onChange={(e) => onUpdateOtherIncome(+e.target.value)}
                  placeholder="0"
                  className="w-36 py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Month Tools */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-750">
          <h4 className="text-xs font-bold text-slate-500 mb-2">{t('mtools')}</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onToggleCloseMonth}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                doc.closed
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{doc.closed ? t('op') : t('cl')}</span>
            </button>

            <button
              onClick={onCopyPrevMonth}
              disabled={Boolean(doc.closed)}
              className="py-1.5 px-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 disabled:opacity-40 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Copy className="w-4 h-4" />
              <span>{t('cpy')}</span>
            </button>
          </div>
        </div>

        {/* Limits & Alerts */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-750">
          <h4 className="text-xs font-bold text-slate-500 mb-2">{t('lim')}</h4>
          <form onSubmit={handleSaveLimits} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">{t('limp')}</label>
              <input
                type="number"
                min="10"
                max="100"
                value={limPct}
                onChange={(e) => setLimPct(+e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">{t('limt')}</label>
              <select
                value={limMode}
                onChange={(e) => setLimMode(e.target.value as any)}
                className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="">{t('lim0')}</option>
                <option value="p">{t('limpc')}</option>
                <option value="a">{t('lima')}</option>
              </select>
            </div>
            <div className="flex gap-1.5 items-end">
              <div className="flex-1">
                <label className="block text-[11px] text-slate-400 mb-1">{t('amt')}</label>
                <input
                  type="number"
                  min="0"
                  value={limVal || ''}
                  onChange={(e) => setLimVal(+e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>
              <button
                type="submit"
                className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition"
              >
                {t('sa')}
              </button>
            </div>
          </form>
        </div>

        {/* Currency & Gold Rates */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-750">
          <h4 className="text-xs font-bold text-slate-500 mb-2">{t('rts')}</h4>
          <form onSubmit={handleSaveRates} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">{t('fx')}</label>
              <input
                type="number"
                min="1000"
                value={fxRate}
                onChange={(e) => setFxRate(+e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">{t('gp')}</label>
              <input
                type="number"
                min="0"
                value={gpRate || ''}
                onChange={(e) => setGpRate(+e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition"
              >
                {t('sa')}
              </button>
            </div>
          </form>
          <p className="text-[11px] text-slate-400 mt-1.5">
            {t('upd')}: $ {names.fxd || '—'} · Gold {names.gpd || '—'}
          </p>
        </div>
      </div>

      {/* 2. Family Members & Workspaces */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-750 pb-2">
          <Users className="w-5 h-5 text-teal-600" />
          <span>{t('sg2')}</span>
        </h3>

        {/* Member list */}
        <div className="space-y-3">
          {members.map((m, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border ${
                m.x
                  ? 'bg-slate-50 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 opacity-60'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-750'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  disabled={Boolean(m.x)}
                  value={m.n}
                  onChange={(e) => handleRenameMember(idx, e.target.value)}
                  className="flex-1 py-1 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                />
                {m.x ? (
                  <button
                    onClick={() => handleRestoreMember(idx)}
                    className="p-1 text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                ) : (
                  members.filter(mem => !mem.x).length > 1 && (
                    <button
                      onClick={() => handleSoftDeleteMember(idx)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>

              {/* Avatar choices */}
              {!m.x && (
                <div className="flex gap-1.5 overflow-x-auto py-1">
                  {avatarOptions.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => handleSelectAvatar(idx, av)}
                      className={`p-1.5 rounded-lg border transition ${
                        m.e === av
                          ? 'bg-teal-50 dark:bg-teal-950 border-teal-500 text-teal-600'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      <CategoryIcon name={av} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={handleAddMember}
            className="py-1.5 px-4 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add')}</span>
          </button>
        </div>

        {/* Household Sync Code */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-750">
          <h4 className="text-xs font-bold text-slate-500 mb-2">{t('hh')}</h4>
          <p className="text-xs text-slate-500 mb-2">{t('hhn')}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={householdInput}
              onChange={(e) => setHouseholdInput(e.target.value)}
              placeholder={t('hhc')}
              className="flex-1 py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
            />
            <button
              onClick={() => onUpdateSettings({ hh: householdInput.trim() })}
              className="py-1.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
            >
              {t('sa')}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Look & Language */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-750 pb-2">
          <Palette className="w-5 h-5 text-teal-600" />
          <span>{t('sg3')}</span>
        </h3>

        {/* Language Picker */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 mb-2">{t('lang')}</h4>
          <input
            type="text"
            value={langSearch}
            onChange={(e) => setLangSearch(e.target.value)}
            placeholder={t('lsrch')}
            className="w-full mb-2.5 py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredLanguages.map((lang, idx) => {
              const originalIndex = LANGUAGES.findIndex(l => l.code === lang.code);
              const isSelected = settings.l === originalIndex;
              return (
                <button
                  key={lang.code}
                  onClick={() => onUpdateSettings({ l: originalIndex })}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-start transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-950/80 border-teal-500 text-teal-700 dark:text-teal-300'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>{lang.native}</span>
                  {isSelected && <Check className="w-4 h-4 text-teal-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme mode */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-750">
          <h4 className="text-xs font-bold text-slate-500 mb-2">{t('theme')}</h4>
          <div className="flex gap-2">
            {(['auto', 'light', 'dark'] as const).map((thMode) => (
              <button
                key={thMode}
                onClick={() => onUpdateSettings({ th: thMode })}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  (settings.th || 'auto') === thMode
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {t(thMode === 'auto' ? 'auto' : thMode === 'light' ? 'lt' : 'dk')}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-750">
          <h4 className="text-xs font-bold text-slate-500 mb-2">{t('ac')}</h4>
          <div className="flex items-center gap-2 flex-wrap">
            {accentPresets.map((color) => (
              <button
                key={color}
                onClick={() => onUpdateSettings({ ac: color })}
                style={{ backgroundColor: color }}
                className={`w-7 h-7 rounded-full border-2 transition ${
                  (settings.ac || '#0f766e') === color ? 'border-white ring-2 ring-teal-500 scale-110' : 'border-transparent'
                }`}
              />
            ))}
            <input
              type="color"
              value={settings.ac || '#0f766e'}
              onChange={(e) => onUpdateSettings({ ac: e.target.value })}
              className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 cursor-pointer p-0.5"
            />
          </div>
        </div>

        {/* Typography & Spacing Sliders */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-750 space-y-3">
          <h4 className="text-xs font-bold text-slate-500 mb-2">{t('ui')}</h4>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>{t('fs')}</span>
              <b>{currentFs}px</b>
            </div>
            <input
              type="range"
              min="13"
              max="19"
              value={currentFs}
              onChange={(e) => updateUI({ fs: +e.target.value })}
              className="w-full accent-teal-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>{t('rd')}</span>
              <b>{currentR}px</b>
            </div>
            <input
              type="range"
              min="0"
              max="28"
              value={currentR}
              onChange={(e) => updateUI({ r: +e.target.value })}
              className="w-full accent-teal-600"
            />
          </div>

          {/* Font Family Choice */}
          <div>
            <span className="block text-xs font-semibold mb-1.5">{t('fnt')}</span>
            <div className="flex gap-2">
              <button
                onClick={() => updateUI({ ff: 0 })}
                className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-sans transition ${
                  currentFf === 0 ? 'bg-teal-50 dark:bg-teal-950/80 border-teal-500 text-teal-700 font-bold' : 'bg-slate-50 dark:bg-slate-900 border-slate-200'
                }`}
              >
                Noto Sans Arabic (Modern)
              </button>
              <button
                onClick={() => updateUI({ ff: 1 })}
                className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-serif transition ${
                  currentFf === 1 ? 'bg-teal-50 dark:bg-teal-950/80 border-teal-500 text-teal-700 font-bold' : 'bg-slate-50 dark:bg-slate-900 border-slate-200'
                }`}
              >
                Noto Naskh Arabic (Classic)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Security, PIN & Backup */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-750 pb-2">
          <KeyRound className="w-5 h-5 text-teal-600" />
          <span>{t('sg4')}</span>
        </h3>

        {/* PIN management */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 mb-1">{t('pin')}</h4>
          <p className="text-xs text-slate-500 mb-2">{t('pinn')}</p>

          {settings.pin ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> PIN active
              </span>
              <button
                onClick={handleRemovePin}
                className="py-1 px-3 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-lg transition"
              >
                {t('prm')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSetPin} className="flex gap-2">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder={t('pin4')}
                className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
              <button
                type="submit"
                disabled={newPin.length < 4}
                className="py-1.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition"
              >
                {t('pset')}
              </button>
            </form>
          )}
          {pinSuccessMsg && (
            <p className="text-xs text-teal-600 mt-1 font-semibold">{pinSuccessMsg}</p>
          )}
        </div>

        {/* Backup & Restore */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-750">
          <h4 className="text-xs font-bold text-slate-500 mb-2">{t('bk')}</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onExportJSON}
              className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>{t('ej')}</span>
            </button>

            <button
              onClick={onExportCSV}
              className="py-2 px-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" />
              <span>{t('ec')}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2 px-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Upload className="w-4 h-4" />
              <span>{t('im')}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              hidden
              onChange={(e) => e.target.files?.[0] && onImportJSON(e.target.files[0])}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
