import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Save, Settings2, CreditCard, Wallet, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { financeSettingsApi, paymentMethodsApi } from '../../api/finance';
import { useCurrency, useFinanceStore } from '../../store/financeStore';
import FinanceSubNav from '../../components/finance/FinanceSubNav';
import type { PaymentMethod } from '../../types';

export default function FinanceSettingsPage() {
  const { fmt, symbol } = useCurrency();
  const setCurrencySymbol = useFinanceStore((s) => s.setCurrencySymbol);
  const queryClient = useQueryClient();

  const [openingBalance, setOpeningBalance] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [currencySymbol, setCurrencySymbolLocal] = useState('₹');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('');
  const [budgetAlertThresholds, setBudgetAlertThresholds] = useState<string[]>(['75', '90', '100']);

  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodIcon, setNewMethodIcon] = useState('💳');
  const [showAddMethod, setShowAddMethod] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['finance-settings'],
    queryFn: financeSettingsApi.get,
    staleTime: 5 * 60 * 1000,
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: paymentMethodsApi.getAll,
  });

  useEffect(() => {
    if (settings) {
      setOpeningBalance(String(settings.openingBalance));
      setCurrency(settings.currency);
      setCurrencySymbolLocal(settings.currencySymbol);
      setLowBalanceThreshold(String(settings.lowBalanceThreshold));
      setBudgetAlertThresholds(settings.budgetAlertThresholds.map(String));
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: financeSettingsApi.update,
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: ['finance-settings'] });
      queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] });
      setCurrencySymbol(s.currencySymbol);
      toast.success('Settings saved!');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const addMethod = useMutation({
    mutationFn: paymentMethodsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      setNewMethodName('');
      setShowAddMethod(false);
      toast.success('Payment method added!');
    },
  });

  const deleteMethod = useMutation({
    mutationFn: paymentMethodsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-methods'] }),
  });

  const handleSave = () => {
    updateSettings.mutate({
      openingBalance: parseFloat(openingBalance) || 0,
      currency,
      currencySymbol: currencySymbol || '₹',
      lowBalanceThreshold: parseFloat(lowBalanceThreshold) || 0,
      budgetAlertThresholds: budgetAlertThresholds
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0)
        .sort((a, b) => a - b),
      setupCompleted: true,
    } as any);
  };

  return (
    <div className="space-y-5">
      <FinanceSubNav />

      <div className="flex items-center gap-2">
        <Settings2 size={20} className="text-primary-500" />
        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-50">Finance Settings</h2>
      </div>

      {/* Financial settings */}
      <div className="card p-5 space-y-5">
        <h3 className="font-bold text-surface-900 dark:text-surface-50">General</h3>

        {/* Opening balance */}
        <div>
          <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
            Opening Balance
          </label>
          <p className="text-xs text-surface-400 mb-2">
            The balance you had when you started tracking. This is the base for your Available Balance.
          </p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-surface-400">{currencySymbol}</span>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              id="settings-opening-balance"
              className="input pl-9 text-lg font-bold h-12"
              placeholder="e.g. 25000"
            />
          </div>
          <p className="text-xs text-surface-400 mt-1">
            Available Balance = Opening Balance + All Income − All Expenses
          </p>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
            Currency
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-surface-400 mb-1">Currency Code</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                id="settings-currency-code"
                className="input uppercase"
                placeholder="INR"
                maxLength={3}
              />
            </div>
            <div>
              <label className="block text-xs text-surface-400 mb-1">Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbolLocal(e.target.value)}
                id="settings-currency-symbol"
                className="input text-xl font-bold"
                placeholder="₹"
                maxLength={3}
              />
            </div>
          </div>
        </div>

        {/* Low balance alert */}
        <div>
          <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
            Low Balance Alert Threshold
          </label>
          <p className="text-xs text-surface-400 mb-2">
            Get an alert on the dashboard when your Available Balance drops below this amount.
          </p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-surface-400">{currencySymbol}</span>
            <input
              type="number"
              value={lowBalanceThreshold}
              onChange={(e) => setLowBalanceThreshold(e.target.value)}
              id="settings-low-balance"
              className="input pl-9"
              placeholder="e.g. 10000"
            />
          </div>
        </div>

        {/* Budget alert thresholds */}
        <div>
          <label className="block text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1.5">
            Budget Alert Thresholds (%)
          </label>
          <p className="text-xs text-surface-400 mb-2">
            Show alerts when budget usage reaches these percentages.
          </p>
          <div className="flex gap-2 flex-wrap">
            {budgetAlertThresholds.map((t, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  type="number"
                  value={t}
                  onChange={(e) => {
                    const updated = [...budgetAlertThresholds];
                    updated[i] = e.target.value;
                    setBudgetAlertThresholds(updated);
                  }}
                  className="input w-16 text-center py-1.5 text-sm"
                  min={1}
                  max={200}
                />
                <span className="text-xs text-surface-400">%</span>
                {budgetAlertThresholds.length > 1 && (
                  <button
                    onClick={() => setBudgetAlertThresholds((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
            {budgetAlertThresholds.length < 5 && (
              <button
                onClick={() => setBudgetAlertThresholds((prev) => [...prev, ''])}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                <Plus size={11} /> Add
              </button>
            )}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="btn-primary w-full justify-center"
          id="finance-settings-save-btn"
        >
          <Save size={15} />
          {updateSettings.isPending ? 'Saving…' : 'Save Settings'}
        </motion.button>
      </div>

      {/* Payment Methods */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-surface-500" />
            <h3 className="font-bold text-surface-900 dark:text-surface-50">Payment Methods</h3>
          </div>
          <button
            onClick={() => setShowAddMethod(!showAddMethod)}
            className="btn-ghost text-xs"
            id="add-payment-method-btn"
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {showAddMethod && (
          <div className="flex items-center gap-2 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
            <input
              type="text"
              value={newMethodIcon}
              onChange={(e) => setNewMethodIcon(e.target.value)}
              className="input w-12 text-center text-xl"
              placeholder="💳"
              maxLength={2}
            />
            <input
              type="text"
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              className="input flex-1"
              placeholder="Method name"
              id="payment-method-name-input"
            />
            <button
              onClick={() => addMethod.mutate({ name: newMethodName, icon: newMethodIcon })}
              disabled={!newMethodName.trim() || addMethod.isPending}
              className="btn-primary py-1.5 px-3 text-xs"
              id="payment-method-save-btn"
            >
              <Save size={13} />
            </button>
            <button onClick={() => setShowAddMethod(false)} className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="space-y-2">
          {paymentMethods.map((pm) => (
            <div key={pm._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 group">
              <span className="text-xl w-8 text-center">{pm.icon}</span>
              <span className="flex-1 text-sm font-medium text-surface-800 dark:text-surface-200">
                {pm.name}
                {pm.isDefault && (
                  <span className="ml-2 badge bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-[10px]">default</span>
                )}
              </span>
              <button
                onClick={() => {
                  if (confirm(`Remove "${pm.name}"?`)) deleteMethod.mutate(pm._id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-red-500 transition-opacity"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
