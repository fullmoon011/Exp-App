import React, { useState } from 'react';
import { KeyRound, X, Check } from 'lucide-react';
import { sha256Hash } from '../utils/storage';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storedPinHash?: string;
  t: (key: string) => string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storedPinHash,
  t
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) return;

    setLoading(true);
    try {
      const hash = await sha256Hash(pin);
      if (hash === storedPinHash) {
        setError(false);
        setPin('');
        onSuccess();
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xs bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-lg">
            <KeyRound className="w-5 h-5" />
            <span>{t('pin')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          {t('enp')}
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError(false);
              }}
              placeholder="••••"
              className="w-full text-center tracking-widest text-2xl font-bold py-3 px-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {error && (
              <p className="text-red-500 text-xs mt-2 text-center font-medium">
                {t('wr')}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-98 disabled:opacity-50 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Check className="w-4 h-4" />
              <span>{t('ok2')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition"
            >
              {t('rst')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
