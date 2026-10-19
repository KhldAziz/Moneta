import React from 'react';
import {
  Home,
  Receipt,
  PieChart,
  Settings,
  Plus,
} from 'lucide-react';
import { STRINGS } from '../constants/strings';

export type NavTab = 'home' | 'transactions' | 'budget' | 'settings';

interface LayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  userDisplayName?: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
  userDisplayName,
  children,
}) => {
  const navItems: { tab: NavTab; label: string; icon: React.ElementType }[] = [
    { tab: 'home', label: STRINGS.nav.home, icon: Home },
    { tab: 'transactions', label: STRINGS.nav.transactions, icon: Receipt },
    { tab: 'budget', label: STRINGS.nav.budget, icon: PieChart },
    { tab: 'settings', label: STRINGS.nav.settings, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-moneta-bg text-moneta-text flex flex-col md:flex-row antialiased">
      {/* Desktop Sidebar (>= 768px) with width 240px as per PRD Section 4 */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 bg-white border-r border-slate-200/80 p-5 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-md">
            M
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-lg tracking-tight">Moneta</h1>
            <p className="text-[11px] text-teal-700 font-medium tracking-tight">Keuangan Terkendali</p>
          </div>
        </div>

        {/* Floating Add Button in Desktop Sidebar */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="w-full mb-6 py-3 px-4 bg-moneta-primary hover:bg-teal-800 text-white rounded-btn font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 touch-target"
        >
          <Plus size={20} />
          <span>Tambah Catatan</span>
        </button>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => onSelectTab(item.tab)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition touch-target ${
                  isActive
                    ? 'bg-teal-50 text-moneta-primary shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-moneta-primary' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Mini Profile */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
            {(userDisplayName || 'M')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{userDisplayName || 'Mahasiswa'}</p>
            <p className="text-[10px] text-slate-400">Mode Aktif</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Max width 1120px as per PRD Section 4) */}
      <main className="flex-1 w-full max-w-[1120px] mx-auto pb-24 md:pb-10 pt-4 px-4 sm:px-6 md:px-8 overflow-x-hidden">
        {/* Mobile Header (< 768px) */}
        <header className="flex md:hidden items-center justify-between py-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white font-bold text-base shadow">
              M
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-base tracking-tight">Moneta</span>
              <p className="text-[10px] text-slate-500">{STRINGS.tagline}</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
            {(userDisplayName || 'M')[0].toUpperCase()}
          </div>
        </header>

        {children}
      </main>

      {/* Mobile Bottom Navigation (< 768px) with Floating (+) Action Button in Middle */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-1.5 shadow-lg">
        <div className="flex items-center justify-around relative max-w-md mx-auto">
          {/* Tab 1: Beranda */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className={`flex flex-col items-center justify-center py-1 px-2 touch-target ${
              currentTab === 'home' ? 'text-moneta-primary font-bold' : 'text-slate-400'
            }`}
          >
            <Home size={20} />
            <span className="text-[10px] mt-0.5">{STRINGS.nav.home}</span>
          </button>

          {/* Tab 2: Transaksi */}
          <button
            type="button"
            onClick={() => onSelectTab('transactions')}
            className={`flex flex-col items-center justify-center py-1 px-2 touch-target ${
              currentTab === 'transactions' ? 'text-moneta-primary font-bold' : 'text-slate-400'
            }`}
          >
            <Receipt size={20} />
            <span className="text-[10px] mt-0.5">{STRINGS.nav.transactions}</span>
          </button>

          {/* Floating Action Button (+) */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="w-14 h-14 rounded-full bg-moneta-primary hover:bg-teal-800 text-white flex items-center justify-center shadow-float active:scale-95 transition-transform touch-target"
              title="Tambah Catatan"
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
            <span className="text-[10px] font-semibold text-teal-800 mt-0.5">Tambah</span>
          </div>

          {/* Tab 3: Budget */}
          <button
            type="button"
            onClick={() => onSelectTab('budget')}
            className={`flex flex-col items-center justify-center py-1 px-2 touch-target ${
              currentTab === 'budget' ? 'text-moneta-primary font-bold' : 'text-slate-400'
            }`}
          >
            <PieChart size={20} />
            <span className="text-[10px] mt-0.5">{STRINGS.nav.budget}</span>
          </button>

          {/* Tab 4: Pengaturan */}
          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            className={`flex flex-col items-center justify-center py-1 px-2 touch-target ${
              currentTab === 'settings' ? 'text-moneta-primary font-bold' : 'text-slate-400'
            }`}
          >
            <Settings size={20} />
            <span className="text-[10px] mt-0.5">{STRINGS.nav.settings}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
