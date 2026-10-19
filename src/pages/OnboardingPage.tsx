import React, { useState } from 'react';
import { STRINGS } from '../constants/strings';
import { parseRupiahInput } from '../lib/formatters';
import { ArrowRight, ArrowLeft, Check, Calendar, Wallet } from 'lucide-react';

interface OnboardingPageProps {
  onComplete: (allowance: number, cycleStartDay: number) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [allowance, setAllowance] = useState<number>(1500000);
  const [cycleStartDay, setCycleStartDay] = useState<number>(1);

  const handleFinish = () => {
    onComplete(allowance, cycleStartDay);
  };

  return (
    <div className="min-h-screen bg-moneta-bg flex flex-col justify-center items-center p-4 antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6 animate-in fade-in duration-300">
        
        {/* Progress indicator (Step 1 of 2) */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
            Langkah {step} dari 2
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`w-8 h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-moneta-primary' : 'bg-slate-200'}`} />
            <span className={`w-8 h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-moneta-primary' : 'bg-slate-200'}`} />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{STRINGS.onboarding.title}</h2>
          <p className="text-xs text-slate-500 mt-1">{STRINGS.onboarding.subtitle}</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100/80 flex items-start gap-3">
              <div className="p-2 bg-teal-100 text-teal-800 rounded-xl shrink-0 mt-0.5">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{STRINGS.onboarding.step1Title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{STRINGS.onboarding.step1Desc}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Uang Saku Bulanan (Rupiah)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-lg font-bold text-slate-500">Rp</span>
                <input
                  type="text"
                  value={allowance ? new Intl.NumberFormat('id-ID').format(allowance) : ''}
                  onChange={(e) => setAllowance(parseRupiahInput(e.target.value))}
                  placeholder={STRINGS.onboarding.allowancePlaceholder}
                  className="w-full pl-12 pr-4 py-3 text-2xl font-bold text-slate-900 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Opsional, bisa diubah sewaktu-waktu di Pengaturan.</p>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full py-3.5 px-4 bg-moneta-primary hover:bg-teal-800 text-white rounded-btn font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 touch-target"
            >
              <span>{STRINGS.onboarding.nextButton}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100/80 flex items-start gap-3">
              <div className="p-2 bg-teal-100 text-teal-800 rounded-xl shrink-0 mt-0.5">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{STRINGS.onboarding.step2Title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{STRINGS.onboarding.step2Desc}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Mulai Siklus (1–28)
              </label>
              <select
                value={cycleStartDay}
                onChange={(e) => setCycleStartDay(parseInt(e.target.value, 10))}
                className="w-full px-4 py-3.5 text-base font-bold text-slate-900 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Tanggal {d} tiap bulan (Siklus berjalan: Tgl {d} – Tgl {d === 1 ? 31 : d - 1})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Default tanggal 1 awal bulan.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 border border-slate-300 text-slate-700 rounded-btn font-semibold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-1 touch-target"
              >
                <ArrowLeft size={16} />
                <span>{STRINGS.onboarding.backButton}</span>
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 py-3.5 px-4 bg-moneta-primary hover:bg-teal-800 text-white rounded-btn font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 touch-target"
              >
                <Check size={18} />
                <span>{STRINGS.onboarding.startButton}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
