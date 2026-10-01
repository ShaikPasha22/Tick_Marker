import toast from 'react-hot-toast';
import type { BudgetAlert } from '../../types';

/** One line per alert, e.g. "Food budget at 80% · ₹1,600 of ₹2,000" */
export function describeBudgetAlert(alert: BudgetAlert, fmt: (n: number) => string): string {
  const name = alert.scope === 'overall' ? 'Overall budget' : `${alert.name} budget`;
  const used = `${fmt(alert.spent)} of ${fmt(alert.budgeted)}`;
  if (alert.percentage > 100) return `${name} exceeded (${alert.percentage}%) · ${used}`;
  if (alert.percentage === 100) return `${name} fully used · ${used}`;
  return `${name} at ${alert.percentage}% · ${used}`;
}

/** Warn about budgets a just-saved expense pushed past an alert threshold */
export function notifyBudgetAlerts(alerts: BudgetAlert[] | undefined, fmt: (n: number) => string) {
  for (const alert of alerts ?? []) {
    toast(describeBudgetAlert(alert, fmt), {
      icon: alert.percentage >= 100 ? '🚨' : '⚠️',
      duration: 6000,
    });
  }
}
