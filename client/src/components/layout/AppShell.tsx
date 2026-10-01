import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';
import VoiceAssistantModal from '../ui/VoiceAssistantModal';
import { financeSettingsApi } from '../../api/finance';
import { useFinanceStore } from '../../store/financeStore';

export default function AppShell() {
  // Load the signed-in user's saved currency so amounts render correctly after login
  const setCurrencySymbol = useFinanceStore((s) => s.setCurrencySymbol);
  const { data: financeSettings } = useQuery({
    queryKey: ['finance-settings'],
    queryFn: financeSettingsApi.get,
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => {
    if (financeSettings?.currencySymbol) setCurrencySymbol(financeSettings.currencySymbol);
  }, [financeSettings?.currencySymbol, setCurrencySymbol]);

  return (
    <div className="flex h-screen bg-app overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
      
      {/* Global Modals */}
      <VoiceAssistantModal />
    </div>
  );
}
