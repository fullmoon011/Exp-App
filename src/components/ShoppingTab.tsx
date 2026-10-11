import React, { useState } from 'react';
import { ShoppingBasket, Plus, Trash2, Receipt, Check, X } from 'lucide-react';
import { ShopItem } from '../types';
import { fmt } from '../utils/calculations';

interface ShoppingTabProps {
  items: ShopItem[];
  onAddItem: (name: string, qty: string, price: number) => void;
  onBulkAdd: (names: string[]) => void;
  onToggleCheck: (index: number) => void;
  onDeleteItem: (index: number) => void;
  onClearChecked: () => void;
  onConvertCheckedToExpense: (checkedTotal: number, note: string) => void;
  t: (key: string) => string;
}

export const ShoppingTab: React.FC<ShoppingTabProps> = ({
  items,
  onAddItem,
  onBulkAdd,
  onToggleCheck,
  onDeleteItem,
  onClearChecked,
  onConvertCheckedToExpense,
  t
}) => {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const handleSingleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddItem(name.trim(), qty.trim(), +price || 0);
    setName('');
    setQty('');
    setPrice('');
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    onBulkAdd(lines);
    setBulkText('');
    setShowBulk(false);
  };

  const checkedItems = items.filter(i => i.ck === 1);
  const checkedTotal = checkedItems.reduce((acc, i) => acc + (i.pr || 0), 0);
  const uncheckedTotal = items.filter(i => !i.ck).reduce((acc, i) => acc + (i.pr || 0), 0);

  const handleConvert = () => {
    if (!checkedItems.length) return;
    const notes = checkedItems.map(i => i.n + (i.q ? ` (${i.q})` : '')).join(', ');
    onConvertCheckedToExpense(checkedTotal, notes);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Add Items Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <ShoppingBasket className="w-5 h-5 text-teal-600" />
          <span>{t('shp')}</span>
        </h3>

        {/* Single Item Form */}
        <form onSubmit={handleSingleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('shpa')}
            className="sm:col-span-2 py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="text"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder={t('shpq')}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={t('shpe')}
              className="flex-1 py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              className="py-2 px-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>{t('add')}</span>
            </button>
          </div>
        </form>

        {/* Bulk Add Collapsible */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-750">
          <button
            type="button"
            onClick={() => setShowBulk(!showBulk)}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
          >
            {showBulk ? t('rst') : `+ ${t('shpb')}`}
          </button>

          {showBulk && (
            <form onSubmit={handleBulkSubmit} className="mt-2 space-y-2">
              <textarea
                rows={4}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="نان&#10;شیر&#10;ماست&#10;میوە"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
              <button
                type="submit"
                className="py-1.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                {t('add')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Checklist Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-slate-500">
            {t('shpt')}: <b>{fmt(uncheckedTotal)} IQD</b>
          </div>
          {checkedItems.length > 0 && (
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
              {checkedItems.length} {t('used')} ({fmt(checkedTotal)} IQD)
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">{t('none')}</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs md:text-sm mb-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`py-2.5 px-1 flex items-center justify-between gap-3 transition ${
                  item.ck ? 'opacity-50 line-through' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(item.ck)}
                    onChange={() => onToggleCheck(idx)}
                    className="w-4 h-4 rounded-sm text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold">{item.n}</span>
                    {item.q && <span className="text-xs text-slate-400 ms-2">({item.q})</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.pr > 0 && <span className="font-bold">{fmt(item.pr)} IQD</span>}
                  <button
                    onClick={() => onDeleteItem(idx)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-750 np">
            <button
              onClick={onClearChecked}
              disabled={!checkedItems.length}
              className="py-1.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 disabled:opacity-40 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('shpc')}</span>
            </button>

            {checkedItems.length > 0 && (
              <button
                onClick={handleConvert}
                className="py-1.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>{t('shpx')} ({fmt(checkedTotal)} IQD)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
