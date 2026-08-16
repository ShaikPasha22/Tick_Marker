import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';
import VoiceAssistantModal from '../ui/VoiceAssistantModal';

export default function AppShell() {
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
