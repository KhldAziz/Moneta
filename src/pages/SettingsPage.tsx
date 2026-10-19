import React, { useState } from 'react';
import { UserProfile, Transaction } from '../types';
import { STRINGS } from '../constants/strings';
import { parseRupiahInput } from '../lib/formatters';
import {
  User,
  Calendar,
  Wallet,
  Download,
  AlertTriangle,
  LogOut,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface SettingsPageProps {
  profile: UserProfile;
  transactions: Transaction[];
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  onExportCsv: () => void;
  onDeleteAllData: () => Promise<void>;
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  profile,
  transactions,
  onUpdateProfile,
  onExportCsv,
  onDeleteAllData,
  onLogout,
}) => {
  const [allowance, setAllowance] = useState<number>(profile.monthlyAllowance);
  const [cycleStartDay, setCycleStartDay] = useState<number>(profile.cycleStartDay);
  const [displayName, setDisplayName] = useState<string>(profile.displayName);
  const [isSaved, setIsSaved] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateProfile({
      displayName: displayName.trim() || 'Mahasiswa',
      monthlyAllowance: allowance,
      cycleStartDay,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExecuteDelete = async () => {
    if (confirmInput.trim() !== 'HAPUS') return;
    setIsDeleting(true);
    try {
      await onDeleteAllData();
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {STRINGS.settings.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Atur uang saku, periode siklus bulanan, dan kelola data akun kamu
        </p>
      </div>

      {/* Profil Keuangan Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User size={18} className="text-teal-700" />
          <h3 className="font-bold text-slate-900 text-sm">{STRINGS.settings.profileSection}</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Panggilan
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {STRINGS.settings.monthlyAllowanceLabel}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-500">Rp</span>
              <input
                type="text"
                value={allowance ? new Intl.NumberFormat('id-ID').format(allowance) : ''}
                onChange={(e) => setAllowance(parseRupiahInput(e.target.value))}
                className="w-full pl-11 pr-4 py-2.5 text-lg font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Uang saku bulanan dari orang tua atau hasil kerja.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {STRINGS.settings.cycleStartDayLabel}
            </label>
            <div className="relative">
              <select
                value={cycleStartDay}
                onChange={(e) => setCycleStartDay(parseInt(e.target.value, 10))}
                className="w-full px-4 py-2.5 text-sm font-semibold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Tanggal {d} tiap bulan (Siklus berjalan: Tgl {d} – Tgl {d === 1 ? 31 : d - 1})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Tanggal siklus reset budget bulanan kamu.</p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {isSaved ? (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <Check size={16} /> Perubahan berhasil disimpan!
              </span>
            ) : <span />}

            <button
              type="submit"
              className="py-2.5 px-5 bg-moneta-primary hover:bg-teal-800 text-white rounded-btn text-xs font-bold shadow transition flex items-center gap-1.5 touch-target"
            >
              <Check size={16} />
              <span>{STRINGS.settings.saveProfileButton}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Ekspor CSV Section (PRD F14 & Uji 11) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileSpreadsheet size={18} className="text-teal-700" />
          <h3 className="font-bold text-slate-900 text-sm">{STRINGS.settings.exportSection}</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {STRINGS.settings.exportDesc} Format memuat kolom lengkap:{' '}
          <code className="text-teal-800 bg-teal-50 px-1 py-0.5 rounded font-mono text-[11px]">
            tanggal, tipe, nominal, kategori, merchant, catatan, sumber
          </code>.
        </p>

        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-btn text-xs font-bold transition touch-target"
        >
          <Download size={16} className="text-slate-600" />
          <span>{STRINGS.settings.exportCsvButton} ({transactions.filter(t => !t.deletedAt).length} Transaksi)</span>
        </button>
      </div>

      {/* Danger Zone Section (PRD F14 & Uji 12) */}
      <div className="bg-white rounded-3xl p-6 border border-red-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-red-100 pb-3">
          <AlertTriangle size={18} className="text-red-600" />
          <h3 className="font-bold text-red-900 text-sm">{STRINGS.settings.dangerZoneSection}</h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {STRINGS.settings.dangerDesc}
        </p>

        <button
          type="button"
          onClick={() => {
            setConfirmInput('');
            setShowDeleteModal(true);
          }}
          className="inline-flex items-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-btn text-xs font-bold transition touch-target"
        >
          <AlertTriangle size={16} />
          <span>{STRINGS.settings.deleteAccountButton}</span>
        </button>
      </div>

      {/* Logout Button */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 py-2.5 px-5 text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-100 rounded-xl transition touch-target"
        >
          <LogOut size={16} />
          <span>{STRINGS.settings.logoutButton}</span>
        </button>
      </div>

      {/* Delete Confirmation Modal (PRD F14 & Uji 12: Konfirmasi Mengetik "HAPUS") */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={20} />
                <h3 className="font-bold text-slate-900 text-base">{STRINGS.settings.deleteModalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {STRINGS.settings.deleteModalDesc}
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {STRINGS.settings.deleteConfirmPrompt}
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={STRINGS.settings.deleteConfirmPlaceholder}
                className="w-full px-3.5 py-2.5 text-sm font-mono tracking-widest text-center uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={confirmInput.trim() !== 'HAPUS' || isDeleting}
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 bg-moneta-danger hover:bg-red-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow transition"
              >
                {isDeleting ? 'Menghapus...' : STRINGS.settings.deleteConfirmButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
